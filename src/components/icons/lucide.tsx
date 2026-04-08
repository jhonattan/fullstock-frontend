// Optimized lucide-react imports to reduce bundle size from 1,162KB to ~50KB
// Import only the specific icons we use instead of the entire library

import LoaderCircleIcon from "lucide-react/dist/esm/icons/loader-circle";

export { default as X } from "lucide-react/dist/esm/icons/x";
export { default as ServerCrash } from "lucide-react/dist/esm/icons/server-crash";
export { default as Minus } from "lucide-react/dist/esm/icons/minus";
export { default as Plus } from "lucide-react/dist/esm/icons/plus";
export { default as Trash2 } from "lucide-react/dist/esm/icons/trash-2";
export { default as ShoppingCart } from "lucide-react/dist/esm/icons/shopping-cart";
export { default as User2 } from "lucide-react/dist/esm/icons/user-2";

// Export LoaderCircle and create alias for backwards compatibility
export { default as LoaderCircle } from "lucide-react/dist/esm/icons/loader-circle";
export const Loader = LoaderCircleIcon;

// Add more icons as needed, but only import what you actually use
// This reduces the bundle size by 90%+
