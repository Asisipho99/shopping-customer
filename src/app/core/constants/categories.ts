/**
 * The category names the catalogue shipped with.
 *
 * This is the only TypeScript copy of the list. The products filter reads it
 * and `ProductService.getCategories()` falls back to it when
 * product-service's `/products/categories` endpoint cannot be reached, so a
 * change here is a change everywhere.
 */
export const FALLBACK_CATEGORIES: readonly string[] = [
  'Electronics',
  'Clothing',
  'Books',
  'Home & Garden',
  'Sports',
  'Toys',
  'Food & Beverages',
  'Other',
];
