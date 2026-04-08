import { useEffect, useState } from "react";

export interface CulqiInstance {
  token: {
    id: string;
    type: string;
    card_number: string;
    email: string;
  } | null;
  error: {
    type: string;
    code: string;
    merchant_message: string;
    user_message: string;
  } | null;
  culqi: () => void;
  open: () => void;
  close: () => void;
}

export interface CulqiChargeError {
  object: string;
  type: string;
  merchant_message: string;
  user_message: string;
  code?: string;
}

export const useCulqi = () => {
  const [scriptsLoaded, setScriptsLoaded] = useState({
    checkout: false,
    threeDS: false,
  });

  useEffect(() => {
    console.log("🔧 Loading Culqi scripts...");

    // Load Culqi Checkout script
    const checkoutScript = document.createElement("script");
    checkoutScript.src = "https://checkout.culqi.com/v4";
    checkoutScript.async = true;
    checkoutScript.onload = () => {
      console.log("✅ Culqi Checkout script loaded");
      setScriptsLoaded((prev) => ({ ...prev, checkout: true }));
    };
    document.body.appendChild(checkoutScript);

    // Load Culqi 3DS script
    const threeDSScript = document.createElement("script");
    threeDSScript.src = "https://3ds.culqi.com/v1";
    threeDSScript.async = true;
    threeDSScript.onload = () => {
      console.log("✅ Culqi 3DS script loaded");

      // Wait a bit for initialization
      setTimeout(() => {
        if (typeof (window as any).Culqi3DS === "undefined") {
          console.log(
            "⚠️  Culqi3DS not initialized after delay, creating stub",
          );
          (window as any).Culqi3DS = {
            initAuthentication: () => Promise.resolve(),
            authentication: () => Promise.resolve(),
            cleanup: () => {},
          };
        }

        console.log("🔍 Culqi3DS available:", typeof (window as any).Culqi3DS);
        setScriptsLoaded((prev) => ({ ...prev, threeDS: true }));
      }, 500); // Wait 500ms for initialization
    };
    document.body.appendChild(threeDSScript);

    return () => {
      if (document.body.contains(checkoutScript)) {
        document.body.removeChild(checkoutScript);
      }
      if (document.body.contains(threeDSScript)) {
        document.body.removeChild(threeDSScript);
      }
    };
  }, []);

  const allLoaded = scriptsLoaded.checkout && scriptsLoaded.threeDS;

  return {
    CulqiCheckout: allLoaded ? (window as any).CulqiCheckout : null,
    loading: !allLoaded,
  };
};
