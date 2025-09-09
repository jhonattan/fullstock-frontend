import type { CartWithItems } from "./cart.model";
import type { CategoryWithVariantsInfo } from "./category.model";
import type { Product } from "./product.model";
import type { Nullable } from "./utils.model";

export interface SystemPromptConfig {
  categories: CategoryWithVariantsInfo[];
  products: Product[];
  userCart?: Nullable<CartWithItems>;
}
