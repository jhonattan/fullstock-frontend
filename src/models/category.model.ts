import type {
  Category as PrismaCategory,
  CategoryVariant as PrismaCategoryVariant,
  CategorySlug,
} from "@/../generated/prisma/client";
import type { Nullable } from "./utils.model";

export const VALID_SLUGS = ["polos", "stickers", "tazas"] as const;

export type Category = PrismaCategory;

export type CategoryVariant = Omit<PrismaCategoryVariant, "priceModifier"> & {
  priceModifier: number;
};

export type CategoryWithVariantsInfo = {
  id: number;
  title: string;
  slug: CategorySlug;
  hasVariants: boolean;
  description: Nullable<string>;
  createdAt: Date;
  updatedAt: Date;
  categoryVariants: {
    id: number;
    value: string;
    label: string;
    priceModifier: number;
    sortOrder: number;
  }[];
};

export type CategoryWithVariantsTransformed = {
  id: number;
  title: string;
  slug: CategorySlug;
  hasVariants: boolean;
  description: Nullable<string>;
  createdAt: Date;
  updatedAt: Date;
  categoryVariants: {
    id: number;
    value: string;
    label: string;
    priceModifier: number;
    categoryId: number;
    sortOrder: number;
    createdAt: Date;
    updatedAt: Date;
  }[];
};

export function isValidCategorySlug(
  categorySlug: unknown
): categorySlug is Category["slug"] {
  return (
    typeof categorySlug === "string" &&
    VALID_SLUGS.includes(categorySlug as Category["slug"])
  );
}
