import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "@/components/icons/lucide";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { redirect, useNavigation, useSubmit } from "react-router";
import { z } from "zod";

import {
  Button,
  Container,
  InputField,
  Section,
  Separator,
  SelectField,
} from "@/components/ui";
import {
  useCulqi,
  type CulqiChargeError,
  type CulqiInstance,
} from "@/hooks/use-culqui";
import { calculateTotal, getCart } from "@/lib/cart";
import { type CartItem } from "@/models/cart.model";
import type { CategoryVariant } from "@/models/category.model";
import { getCurrentUser } from "@/services/auth.service";
import { deleteRemoteCart } from "@/services/cart.service";
import { createOrder } from "@/services/order.service";
import { commitSession, getSession } from "@/session.server";

import type { Route } from "./+types";
import { logger } from "@/utils/logger";

const countryOptions = [
  { value: "AR", label: "Argentina" },
  { value: "BO", label: "Bolivia" },
  { value: "BR", label: "Brasil" },
  { value: "CL", label: "Chile" },
  { value: "CO", label: "Colombia" },
  { value: "CR", label: "Costa Rica" },
  { value: "CU", label: "Cuba" },
  { value: "DO", label: "República Dominicana" },
  { value: "EC", label: "Ecuador" },
  { value: "SV", label: "El Salvador" },
  { value: "GT", label: "Guatemala" },
  { value: "HT", label: "Haití" },
  { value: "HN", label: "Honduras" },
  { value: "MX", label: "México" },
  { value: "NI", label: "Nicaragua" },
  { value: "PA", label: "Panamá" },
  { value: "PY", label: "Paraguay" },
  { value: "PE", label: "Perú" },
  { value: "PR", label: "Puerto Rico" },
  { value: "UY", label: "Uruguay" },
  { value: "VE", label: "Venezuela" },
];

export const CheckoutFormSchema = z.object({
  email: z.string().email("Correo electrónico inválido"),
  firstName: z.string().min(1, "El nombre es requerido"),
  lastName: z.string().min(1, "El apellido es requerido"),
  company: z.string().optional(),
  address: z.string().min(1, "La dirección es requerida"),
  city: z.string().min(1, "La ciudad es requerida"),
  country: z.string().min(1, "El país es requerido"),
  region: z.string().min(1, "La provincia/estado es requerido"),
  zip: z.string().min(1, "El código postal es requerido"),
  phone: z.string().min(1, "El teléfono es requerido"),
});

type CheckoutForm = z.infer<typeof CheckoutFormSchema>;

export async function action({ request }: Route.ActionArgs) {
  logger.info("Payment processing started");

  const formData = await request.formData();
  const shippingDetails = JSON.parse(
    formData.get("shippingDetailsJson") as string,
  ) as CheckoutForm;
  const cartItems = JSON.parse(
    formData.get("cartItemsJson") as string,
  ) as CartItem[];
  const token = formData.get("token") as string;

  logger.debug(
    {
      culqiKeyExists: !!process.env.CULQI_PRIVATE_KEY,
      keyPrefix: process.env.CULQI_PRIVATE_KEY?.substring(0, 10),
    },
    "CULQI credentials check",
  );

  const total = Math.round(calculateTotal(cartItems) * 100);

  const body = {
    amount: total,
    currency_code: "PEN",
    email: shippingDetails.email,
    source_id: token,
    capture: true,
  };

  logger.info({ body }, "Calling Culqi API");

  try {
    const response = await fetch("https://api.culqi.com/v2/charges", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${process.env.CULQI_PRIVATE_KEY}`,
      },
      body: JSON.stringify(body),
    });

    logger.info(
      {
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
      },
      "Culqi response received",
    );

    const responseText = await response.text();
    logger.debug({ responseText }, "Culqi raw response");

    if (!response.ok) {
      let errorData: CulqiChargeError;
      try {
        errorData = JSON.parse(responseText) as CulqiChargeError;
      } catch {
        errorData = {
          object: "error",
          type: "api_error",
          merchant_message: responseText,
          user_message: "Error al procesar el pago",
          charge_id: "",
          code: "",
          decline_code: "",
        };
      }

      logger.error(
        {
          status: response.status,
          type: errorData.type,
          code: errorData.code,
          merchantMessage: errorData.merchant_message,
          userMessage: errorData.user_message,
          fullError: errorData,
        },
        "Culqi API error",
      );

      return { error: errorData.user_message || "Error processing payment" };
    }

    const chargeData = JSON.parse(responseText);
    logger.info({ chargeId: chargeData.id }, "Charge successful");

    const items = cartItems.map((item) => ({
      productId: item.product.id,
      categoryVariantId: item.categoryVariantId,
      quantity: item.quantity,
      title: item.product.title,
      variantInfo: item.categoryVariant
        ? getVariantInfoText(item.categoryVariant)
        : null,
      price: item.finalPrice,
      imgSrc: item.product.imgSrc,
    }));

    const { id: orderId } = await createOrder(
      items,
      // @ts-expect-error Arreglar el tipo de shippingDetails
      shippingDetails,
      chargeData.id,
    );

    await deleteRemoteCart(request);
    const session = await getSession(request.headers.get("Cookie"));
    session.unset("sessionCartId");

    logger.info({ orderId }, "Order created, redirecting");

    return redirect(`/order-confirmation/${orderId}`, {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    });
  } catch (error) {
    logger.error({ error }, "Exception during payment processing");
    return { error: "Error inesperado al procesar el pago" };
  }
}

function getVariantInfoText(categoryVariant: CategoryVariant): string {
  if (categoryVariant.id === 1) return `Talla: ${categoryVariant.label}`;
  if (categoryVariant.id === 3) return `Tamaño: ${categoryVariant.label}`;
  return `Opción: ${categoryVariant.label}`;
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  const sessionCartId = session.get("sessionCartId");
  const userId = session.get("userId");

  const [user, cart] = await Promise.all([
    getCurrentUser(request),
    getCart(userId, sessionCartId),
  ]);

  if (!cart) {
    return redirect("/");
  }

  const total = cart ? calculateTotal(cart.items) : 0;

  return user ? { user, cart, total } : { cart, total };
}

export default function Checkout({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { user, cart, total } = loaderData;
  const navigation = useNavigation();
  const submit = useSubmit();
  const loading = navigation.state === "submitting";
  const paymentError = actionData?.error;

  const [culqui, setCulqui] = useState<CulqiInstance | null>(null);
  const { CulqiCheckout, loading: culqiLoading } = useCulqi();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    getValues,
  } = useForm<CheckoutForm>({
    resolver: zodResolver(CheckoutFormSchema),
    defaultValues: {
      email: user?.email,
      firstName: "",
      lastName: "",
      company: "",
      address: "",
      city: "",
      country: "",
      region: "",
      zip: "",
      phone: "",
    },
    mode: "onTouched",
  });

  useEffect(() => {
    // Wait for BOTH scripts to load
    if (!CulqiCheckout || culqiLoading) {
      console.log("⏳ Waiting for Culqi scripts...");
      return;
    }

    console.log("✅ Both Culqi scripts ready, initializing...");

    const config = {
      settings: {
        currency: "PEN",
        amount: Math.round(total * 100),
      },
      client: {
        email: user?.email || "test@example.com",
      },
      options: {
        paymentMethods: {
          tarjeta: true,
          yape: false,
        },
      },
      appearance: {},
    };

    const culqiInstance = new CulqiCheckout(
      import.meta.env.VITE_CULQI_PUBLIC_KEY as string,
      config,
    );

    culqiInstance.culqi = function () {
      console.log("\n🔔 CLIENT: Culqi callback triggered (user clicked Pay)");

      if (culqiInstance.token) {
        console.log("✅ CLIENT: Token received:", culqiInstance.token.id);

        const token = culqiInstance.token.id;
        culqiInstance.close();

        const formData = getValues();
        console.log("📤 CLIENT: Submitting to server...");

        submit(
          {
            shippingDetailsJson: JSON.stringify(formData),
            cartItemsJson: JSON.stringify(cart.items),
            token,
          },
          { method: "POST" },
        );
      } else if (culqiInstance.error) {
        console.error("❌ CLIENT: Culqi error:", culqiInstance.error);
        const culqiError = culqiInstance.error as unknown as CulqiChargeError;
        alert(
          `Error: ${
            culqiError.user_message ||
            culqiError.merchant_message ||
            "Error al procesar el pago"
          }`,
        );
      }
    };

    setCulqui(culqiInstance);

    return () => {
      if (culqiInstance) {
        culqiInstance.close();
      }
    };
  }, [total, user, submit, getValues, cart.items, CulqiCheckout, culqiLoading]);

  async function onSubmit() {
    console.log("🎯 CLIENT: Opening Culqi modal...");
    if (culqui) {
      culqui.open();
    }
  }

  return (
    <Section className="bg-muted">
      <Container>
        <div className="flex flex-col gap-12 max-w-2xl mx-auto lg:flex-row lg:max-w-none">
          <div className="flex-grow">
            <h2 className="text-lg font-medium mb-4">Resumen de la orden</h2>
            <div className="border border-border rounded-xl bg-background flex flex-col">
              {cart?.items?.map(
                ({ product, quantity, finalPrice, categoryVariant }) => (
                  <div
                    key={`${product.id}-${categoryVariant?.id}`}
                    className="flex gap-6 p-6 border-b border-border"
                  >
                    <div className="w-20 rounded-xl bg-muted">
                      <img
                        src={product.imgSrc}
                        alt={product.title}
                        className="w-full aspect-square object-contain"
                      />
                    </div>
                    <div className="flex flex-col justify-between flex-grow">
                      <div className="flex items-center">
                        <h3 className="text-sm leading-5">{product.title}</h3>
                        {categoryVariant && (
                          <p className="text-sm leading-5">
                            ({categoryVariant.label})
                          </p>
                        )}
                      </div>
                      <div className="flex text-sm font-medium gap-4 items-center self-end">
                        <p>{quantity}</p>
                        <X className="w-4 h-4" />
                        <p>S/{finalPrice.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                ),
              )}
              <div className="flex justify-between p-6 text-base font-medium">
                <p>Total</p>
                <p>S/{total.toFixed(2)}</p>
              </div>
            </div>
          </div>
          <form
            className="flex-grow lg:max-w-4xl lg:order-first"
            onSubmit={handleSubmit(onSubmit)}
          >
            <fieldset>
              <legend className="text-xl font-medium mb-6">
                Información de contacto
              </legend>
              <InputField
                label="Correo electrónico"
                type="email"
                autoComplete="email"
                defaultValue={user?.email}
                readOnly={Boolean(user)}
                error={errors.email?.message}
                {...register("email")}
              />
            </fieldset>
            <Separator className="my-6" />
            <fieldset>
              <legend className="text-xl font-medium mb-6">
                Información de envío
              </legend>
              <div className="flex flex-col gap-6">
                <InputField
                  label="Nombre"
                  autoComplete="given-name"
                  error={errors.firstName?.message}
                  {...register("firstName")}
                />
                <InputField
                  label="Apellido"
                  autoComplete="family-name"
                  error={errors.lastName?.message}
                  {...register("lastName")}
                />
                <InputField
                  label="Compañia"
                  autoComplete="organization"
                  error={errors.company?.message}
                  {...register("company")}
                />
                <InputField
                  label="Dirección"
                  autoComplete="street-address"
                  error={errors.address?.message}
                  {...register("address")}
                />
                <InputField
                  label="Ciudad"
                  autoComplete="address-level2"
                  error={errors.city?.message}
                  {...register("city")}
                />
                <SelectField
                  label="País"
                  options={countryOptions}
                  placeholder="Seleccionar país"
                  error={errors.country?.message}
                  {...register("country")}
                />
                <InputField
                  label="Provincia/Estado"
                  autoComplete="address-level1"
                  error={errors.region?.message}
                  {...register("region")}
                />
                <InputField
                  label="Código Postal"
                  autoComplete="postal-code"
                  error={errors.zip?.message}
                  {...register("zip")}
                />
                <InputField
                  label="Teléfono"
                  autoComplete="tel"
                  error={errors.phone?.message}
                  {...register("phone")}
                />
              </div>
            </fieldset>
            <Button
              size="xl"
              className="w-full mt-6"
              disabled={!isValid || culqiLoading || loading}
            >
              {culqiLoading
                ? "Cargando..."
                : loading
                ? "Procesando..."
                : "Confirmar Orden"}
            </Button>
            {paymentError && (
              <p className="text-red-500 mt-4 text-center">{paymentError}</p>
            )}
          </form>
        </div>
      </Container>
    </Section>
  );
}
