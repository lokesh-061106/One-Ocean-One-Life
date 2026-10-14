import { Product, Vendor, Order, ProductCategory, PaginatedResponse } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export interface ProductFilters {
  category?: string;
  vendor?: string;
  search?: string;
  min_price?: number;
  max_price?: number;
}

export async function getProductCategories(): Promise<ProductCategory[]> {
  const res = await fetch(`${API_BASE}/marketplace/categories/`);
  if (!res.ok) throw new Error('Failed to fetch categories');
  return res.json();
}

export async function getProducts(
  filters?: ProductFilters
): Promise<PaginatedResponse<Product>> {
  const params = new URLSearchParams();
  if (filters?.category) params.set('category', filters.category);
  if (filters?.vendor) params.set('vendor', filters.vendor);
  if (filters?.search) params.set('search', filters.search);
  if (filters?.min_price) params.set('min_price', String(filters.min_price));
  if (filters?.max_price) params.set('max_price', String(filters.max_price));

  const res = await fetch(`${API_BASE}/marketplace/products/?${params}`);
  if (!res.ok) throw new Error('Failed to fetch products');
  return res.json();
}

export async function getProductDetail(id: string): Promise<Product> {
  const res = await fetch(`${API_BASE}/marketplace/products/${id}/`);
  if (!res.ok) throw new Error('Failed to fetch product');
  return res.json();
}

export async function getVendorDetail(id: string): Promise<Vendor> {
  const res = await fetch(`${API_BASE}/marketplace/vendors/${id}/`);
  if (!res.ok) throw new Error('Failed to fetch vendor');
  return res.json();
}

export async function createOrder(data: {
  vendor: string;
  items: { product: string; quantity: number }[];
  shipping_address: string;
}): Promise<Order> {
  const res = await fetch(`${API_BASE}/marketplace/orders/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create order');
  return res.json();
}

export async function getMyOrders(): Promise<PaginatedResponse<Order>> {
  const res = await fetch(`${API_BASE}/marketplace/orders/my/`);
  if (!res.ok) throw new Error('Failed to fetch orders');
  return res.json();
}
