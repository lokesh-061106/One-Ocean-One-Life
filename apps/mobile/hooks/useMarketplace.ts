import { useState, useEffect, useCallback } from 'react';
import { api } from '@/services/api';
import { ENDPOINTS } from '@/constants/api';
import { useMarketplaceStore } from '@/stores/marketplaceStore';

export function useProducts() {
  const { products, setProducts, filters, isLoading, setLoading } = useMarketplaceStore();
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchProducts = useCallback(async (reset = false) => {
    if (isLoading) return;
    setLoading(true);
    setError(null);

    try {
      const flatParams: Record<string, string> = {};
      flatParams.page = String(reset ? 1 : page);
      flatParams.page_size = '20';
      if (filters.category) flatParams.category = filters.category;
      if (filters.search) flatParams.search = filters.search;
      if (filters.minPrice) flatParams.min_price = String(filters.minPrice);
      if (filters.maxPrice) flatParams.max_price = String(filters.maxPrice);
      if (filters.sortBy) flatParams.ordering = filters.sortBy;

      const response = (await api.get(ENDPOINTS.MARKETPLACE.PRODUCTS, flatParams)) as any;
      const items = response.results || response;

      if (reset) {
        setProducts(items);
        setPage(1);
      } else {
        setProducts([...products, ...items]);
      }
      setHasMore(!!response.next);
    } catch (err: any) {
      setError(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    fetchProducts(true);
  }, [filters.category, filters.search, filters.sortBy]);

  return { products, error, isLoading, hasMore, loadMore: () => { setPage(p => p + 1); fetchProducts(false); }, refresh: () => fetchProducts(true) };
}

export function useCategories() {
  const { categories, setCategories } = useMarketplaceStore();

  useEffect(() => {
    if (categories.length > 0) return;
    api.get(ENDPOINTS.MARKETPLACE.CATEGORIES)
      .then((res: any) => setCategories(res.results || res || []))
      .catch(() => {});
  }, []);

  return categories || [];
}

export function useProductDetail(id: string | null) {
  const { selectedProduct, setSelectedProduct } = useMarketplaceStore();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) {
      setSelectedProduct(null);
      return;
    }
    setLoading(true);
    api.get(`${ENDPOINTS.MARKETPLACE.PRODUCTS}${id}/`)
      .then((res) => setSelectedProduct(res as any))
      .catch(() => setSelectedProduct(null))
      .finally(() => setLoading(false));
  }, [id]);

  return { product: selectedProduct, loading };
}

export function useVendorProfile(id: string | null) {
  const [vendor, setVendor] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.get(`${ENDPOINTS.MARKETPLACE.VENDORS}${id}/`)
      .then(setVendor)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  return { vendor, loading };
}

export function useMyOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchOrders = useCallback(() => {
    setLoading(true);
    api.get(ENDPOINTS.MARKETPLACE.ORDERS)
      .then((res: any) => setOrders(res.results || res))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchOrders(); }, []);

  return { orders, loading, refresh: fetchOrders };
}

export function useCreateOrder() {
  const [loading, setLoading] = useState(false);
  const { clearCart } = useMarketplaceStore();

  const createOrder = async (data: {
    payment_method: string;
    shipping_address: string;
    shipping_phone: string;
    notes?: string;
    items: { product: string; quantity: number }[];
  }) => {
    setLoading(true);
    try {
      const result = await api.post(ENDPOINTS.MARKETPLACE.ORDERS, data);
      clearCart();
      return result;
    } finally {
      setLoading(false);
    }
  };

  return { createOrder, loading };
}
