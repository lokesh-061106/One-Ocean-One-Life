"use client";

import { useHydrated } from "@/hooks/use-hydrated";
import Link from "next/link";
import { Minus, Plus, Trash2, ShoppingCart, Package, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCart, type CartItem } from "@/components/cart-context";

function CartSkeleton() {
  return (
    <div className="min-h-screen bg-ocean-foam">
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div className="h-9 w-48 bg-ocean-light rounded animate-pulse" />
          <div className="h-9 w-40 bg-ocean-light rounded animate-pulse" />
        </div>
        <div className="space-y-4">
          <div className="h-24 bg-ocean-light rounded-lg animate-pulse" />
          <div className="h-24 bg-ocean-light rounded-lg animate-pulse" />
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function CartPage() {
  const router = useRouter();
  const { items, removeItem, updateQuantity, clearCart, totalItems, totalPrice } = useCart();
  const mounted = useHydrated();

  if (!mounted) return <CartSkeleton />;

  return (
    <div className="min-h-screen bg-ocean-foam">
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-ocean-navy">Shopping Cart</h1>
            <p className="text-ocean-text-secondary mt-1">{totalItems} {totalItems === 1 ? "item" : "items"} in your cart</p>
          </div>
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Continue Shopping
          </Button>
        </div>

        {items.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <ShoppingCart className="h-20 w-20 text-ocean-muted mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-ocean-navy mb-3">Your cart is empty</h2>
              <p className="text-ocean-text-secondary mb-6 max-w-md mx-auto">
                Browse our marketplace to find ocean-friendly products from local coastal communities.
              </p>
              <Button onClick={() => router.push("/marketplace")}>
                Browse Products
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <CartItemCard key={item.productId} item={item} onRemove={removeItem} onUpdateQuantity={updateQuantity} />
              ))}
              <Button variant="ghost" className="text-ocean-coral" onClick={clearCart}>
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Cart
              </Button>
            </div>

            <div>
              <Card className="sticky top-24">
                <CardContent className="p-6 space-y-4">
                  <h2 className="text-lg font-bold text-ocean-navy">Order Summary</h2>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-ocean-text-secondary">Subtotal ({totalItems} items)</span>
                      <span className="font-medium">₹{totalPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-ocean-text-secondary">Shipping</span>
                      <span className="text-ocean-green font-medium">Free</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between text-base font-bold">
                      <span className="text-ocean-navy">Total</span>
                      <span className="text-ocean-green">₹{totalPrice.toFixed(2)}</span>
                    </div>
                  </div>
                  <Link href="/marketplace/checkout" className="block">
                    <Button className="w-full bg-ocean-blue hover:bg-ocean-blue/90" size="lg">
                      Proceed to Checkout
                    </Button>
                  </Link>
                  <p className="text-xs text-ocean-text-secondary text-center">
                    Secure checkout powered by Razorpay & Stripe
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

function CartItemCard({
  item,
  onRemove,
  onUpdateQuantity,
}: {
  item: CartItem;
  onRemove: (id: string) => void;
  onUpdateQuantity: (id: string, qty: number) => void;
}) {
  return (
    <Card>
      <CardContent className="p-4 flex gap-4">
        <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-ocean-foam">
          {item.image ? (
            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="h-8 w-8 text-ocean-muted" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <a href={`/marketplace/${item.productSlug || item.productId}`} className="font-semibold text-ocean-navy hover:text-ocean-blue transition-colors">{item.name}</a>
              <p className="text-sm text-ocean-text-secondary">{item.vendorName}</p>
            </div>
            <button
              onClick={() => onRemove(item.productId)}
              className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="h-4 w-4 text-ocean-coral" />
            </button>
          </div>
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center border rounded-lg">
              <button
                className="px-3 py-1.5 hover:bg-ocean-light transition-colors"
                onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="px-4 py-1.5 font-semibold text-sm">{item.quantity}</span>
              <button
                className="px-3 py-1.5 hover:bg-ocean-light transition-colors"
                onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
                disabled={item.quantity >= item.stock}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <span className="text-lg font-bold text-ocean-green">
              ₹{(item.price * item.quantity).toFixed(2)}
            </span>
          </div>
          {item.quantity >= item.stock && (
            <Badge className="mt-2 bg-ocean-warning/10 text-ocean-warning text-xs">Max stock reached</Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
