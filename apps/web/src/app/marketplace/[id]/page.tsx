"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ShoppingCart, Store, Star, Package, Phone, Minus, Plus, Check, X, ZoomIn } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchCms } from "@/lib/api-helpers";
import { type ApiProduct, resolveCategoryName, resolveVillageName } from "@/lib/marketplace-types";
import { useCart } from "@/components/cart-context";
import { LocationDisplay } from "@/components/location-display";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<ApiProduct | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [addedToCart, setAddedToCart] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);
  const { addItem } = useCart();

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await fetchCms<ApiProduct>(`/marketplace/products/${params.id}/`);
      setProduct(data);
      setLoading(false);
    }
    load();
  }, [params.id]);

  const closeImage = useCallback(() => setImageOpen(false), []);

  useEffect(() => {
    if (!imageOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") closeImage(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [imageOpen, closeImage]);

  if (loading) {
    return (
      <div className="min-h-screen bg-ocean-foam">
        <Header />
        <main className="max-w-7xl mx-auto px-4 py-16 text-center">
          <div className="animate-pulse">Loading...</div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-ocean-foam">
        <Header />
        <main className="max-w-7xl mx-auto px-4 py-16 text-center">
          <Package className="h-16 w-16 text-ocean-muted mx-auto mb-4" />
          <p className="text-lg text-ocean-text-secondary mb-4">Product not found</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </main>
        <Footer />
      </div>
    );
  }

  const price = product.discount_price || product.price;
  const hasDiscount = product.discount_price && product.discount_price < product.price;
  const vendor = typeof product.vendor === "object" ? product.vendor : null;

  return (
    <div className="min-h-screen bg-ocean-foam">
      <Header />
      <main>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              {product.image ? (
                <button
                  onClick={() => setImageOpen(true)}
                  className="relative w-full h-96 rounded-lg shadow-lg overflow-hidden group cursor-zoom-in"
                >
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full p-3 shadow-lg">
                      <ZoomIn className="h-6 w-6 text-ocean-navy" />
                    </div>
                  </div>
                </button>
              ) : (
                <div className="bg-gradient-to-br from-ocean-blue/10 to-ocean-green/10 h-96 rounded-lg flex items-center justify-center">
                  <Package className="h-24 w-24 text-ocean-blue/30" />
                </div>
              )}
            </div>

            <div>
              {product.category && (
                <Badge className="mb-3 bg-ocean-blue/10 text-ocean-blue">{resolveCategoryName(product.category, product.category_name)}</Badge>
              )}
              <h1 className="text-3xl font-bold text-ocean-navy mb-4">{product.name}</h1>

              <div className="flex items-center gap-2 mb-4">
                <Store className="h-4 w-4 text-ocean-text-secondary" />
                <span className="text-ocean-text-secondary">Sold by</span>
                {vendor && (
                  <Link href={`/marketplace/vendor/${vendor.id}`} className="text-ocean-blue font-semibold hover:underline">
                    {vendor.shop_name}
                  </Link>
                )}
                {vendor?.is_verified && <Badge className="bg-ocean-green/10 text-ocean-green text-xs">✓ Verified</Badge>}
              </div>

              <Card className="mb-6">
                <CardContent className="p-6">
                  <div className="flex items-baseline gap-3 mb-2">
                    <span className="text-4xl font-bold text-ocean-green">₹{price}</span>
                    {hasDiscount && (
                      <>
                        <span className="text-lg text-ocean-muted line-through">₹{product.price}</span>
                        <Badge className="bg-ocean-coral/10 text-ocean-coral">
                          {Math.round(((Number(product.price) - Number(price)) / Number(product.price)) * 100)}% OFF
                        </Badge>
                      </>
                    )}
                  </div>
                  {product.contribution_discount_percent > 0 && (
                    <div className="bg-ocean-sand/50 rounded-lg p-3 mt-3">
                      <p className="text-sm text-ocean-navy font-medium">
                        🏆 Verified contributors get {product.contribution_discount_percent}% OFF
                      </p>
                      <p className="text-xs text-ocean-text-secondary mt-1">Min. score: {product.min_contribution_score}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="grid grid-cols-3 gap-4 mb-6">
                {product.rating > 0 && (
                  <div className="text-center p-3 bg-white rounded-lg">
                    <div className="flex items-center justify-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-bold text-ocean-navy">{product.rating.toFixed(1)}</span>
                    </div>
                    <p className="text-xs text-ocean-text-secondary mt-1">Rating</p>
                  </div>
                )}
                <div className="text-center p-3 bg-white rounded-lg">
                  <span className="font-bold text-ocean-navy">{product.units_sold}</span>
                  <p className="text-xs text-ocean-text-secondary mt-1">Sold</p>
                </div>
                <div className="text-center p-3 bg-white rounded-lg">
                  <span className={`font-bold ${product.stock > 0 ? "text-ocean-green" : "text-ocean-coral"}`}>
                    {product.stock > 0 ? product.stock : "Out"}
                  </span>
                  <p className="text-xs text-ocean-text-secondary mt-1">{product.stock > 0 ? "In Stock" : "Sold Out"}</p>
                </div>
              </div>

              <div className="mb-6">
                <h2 className="text-lg font-semibold text-ocean-navy mb-2">Description</h2>
                <p className="text-ocean-text-secondary leading-relaxed">{product.description}</p>
              </div>

              {vendor && (
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-ocean-navy mb-2">Vendor</h2>
                  <Card>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-ocean-navy">{vendor.shop_name}</h3>
                      {vendor.village && (
                        <LocationDisplay
                          name={resolveVillageName(vendor.village, vendor.village_name)}
                          lat={vendor.latitude}
                          lng={vendor.longitude}
                          size="sm"
                          className="mt-1"
                        />
                      )}
                      {vendor.phone && (
                        <div className="flex items-center gap-1 text-sm text-ocean-text-secondary mt-1">
                          <Phone className="h-3 w-3" />{vendor.phone}
                        </div>
                      )}
                      <p className="text-sm text-ocean-text-secondary mt-2">{vendor.description?.slice(0, 120)}...</p>
                      <div className="flex gap-4 mt-3 text-sm text-ocean-text-secondary">
                        <span>★ {vendor.rating?.toFixed(1)}</span>
                        <span>{vendor.total_sales} sales</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {product.stock > 0 && (
                <div className="flex items-center gap-4">
                  <div className="flex items-center border rounded-lg">
                    <button className="px-3 py-2 hover:bg-gray-50" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="px-4 py-2 font-semibold">{quantity}</span>
                    <button className="px-3 py-2 hover:bg-gray-50" onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}>
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <Button
                    size="lg"
                    className={`flex-1 ${addedToCart ? "bg-ocean-green hover:bg-ocean-green/90" : "bg-ocean-blue hover:bg-ocean-blue/90"}`}
                    onClick={() => {
                      const vendorObj = typeof product.vendor === "object" ? product.vendor : null;
                      addItem({
                        productId: product.id,
                        productSlug: product.slug || product.id,
                        name: product.name,
                        price: Number(price),
                        image: product.image,
                        vendorId: vendorObj?.id || "",
                        vendorName: vendorObj?.shop_name || "",
                        stock: product.stock,
                      }, quantity);
                      setAddedToCart(true);
                      setTimeout(() => setAddedToCart(false), 2000);
                    }}
                    disabled={addedToCart}
                  >
                    {addedToCart ? (
                      <>
                        <Check className="h-5 w-5 mr-2" />
                        Added to Cart
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="h-5 w-5 mr-2" />
                        Add to Cart - ₹{(price * quantity).toFixed(2)}
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />

      {imageOpen && product?.image && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in"
          onClick={closeImage}
        >
          <button
            className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors"
            onClick={closeImage}
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src={product.image}
            alt={product.name}
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

function Link({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <a href={href} className={className}>
      {children}
    </a>
  );
}
