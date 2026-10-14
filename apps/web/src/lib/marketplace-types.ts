export interface ApiProductCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  product_count: number;
}

export interface ApiVendor {
  id: string;
  shop_name: string;
  description: string;
  village: { id: string; name: string } | string;
  village_name?: string;
  phone: string;
  is_verified: boolean;
  rating: number;
  total_sales: number;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
}

export interface ApiProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  discount_price: number | null;
  contribution_discount_percent: number;
  min_contribution_score: number;
  image: string | null;
  stock: number;
  is_active: boolean;
  is_featured: boolean;
  units_sold: number;
  rating: number;
  vendor: ApiVendor | string;
  vendor_name?: string;
  category: ApiProductCategory | string;
  category_name?: string;
  created_at: string;
}

export interface ApiOrder {
  id: string;
  order_number: string;
  status: string;
  payment_method: string;
  subtotal: number;
  discount: number;
  total: number;
  items_count: number;
  shipping_address: string;
  shipping_phone: string;
  notes: string;
  created_at: string;
  items: { id: string; product: string; product_name: string; quantity: number; unit_price: number; discount_applied: number }[];
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function resolveVendorName(vendor: ApiVendor | string, preResolved?: string): string {
  if (preResolved) return preResolved;
  if (typeof vendor === "string") {
    return UUID_RE.test(vendor) ? "" : vendor;
  }
  return vendor?.shop_name || "";
}

export function resolveCategoryName(category: ApiProductCategory | string, preResolved?: string): string {
  if (preResolved) return preResolved;
  if (typeof category === "string") {
    return UUID_RE.test(category) ? "" : category;
  }
  return category?.name || "";
}

export function resolveVillageName(village: any, preResolved?: string): string {
  if (preResolved) return preResolved;
  if (!village) return "";
  if (typeof village === "string") {
    return UUID_RE.test(village) ? "" : village;
  }
  return village.name || "";
}
