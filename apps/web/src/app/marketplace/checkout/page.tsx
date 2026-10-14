"use client";

import { useState } from "react";
import { useHydrated } from "@/hooks/use-hydrated";
import { useRouter } from "next/navigation";
import { Package, CreditCard, Truck, CheckCircle, ArrowLeft, ShieldCheck } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "@/components/cart-context";
import { useAuth } from "@/components/auth-context";
import { useProfile } from "@/components/profile-context";

function CheckoutSkeleton() {
  return (
    <div className="min-h-screen bg-ocean-foam">
      <Header />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center gap-4 mb-8">
          <div className="h-8 w-16 bg-ocean-light rounded animate-pulse" />
          <div className="h-9 w-48 bg-ocean-light rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-64 bg-ocean-light rounded-lg animate-pulse" />
          </div>
          <div>
            <div className="h-48 bg-ocean-light rounded-lg animate-pulse" />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const { profile } = useProfile();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const mounted = useHydrated();
  const [form, setForm] = useState(() => ({
    address: profile?.address || "",
    city: profile?.city || "",
    state: profile?.state || "Tamil Nadu",
    pincode: profile?.pincode || "",
    phone: profile?.phone || user?.phone || "",
    notes: "",
  }));

  if (!mounted) return <CheckoutSkeleton />;

  if (items.length === 0 && !success) {
    return (
      <div className="min-h-screen bg-ocean-foam">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-16 text-center">
          <Package className="h-16 w-16 text-ocean-muted mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-ocean-navy mb-2">No items to checkout</h1>
          <p className="text-ocean-text-secondary mb-6">Add some products to your cart first.</p>
          <Button onClick={() => router.push("/marketplace")}>Browse Products</Button>
        </main>
        <Footer />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-ocean-foam">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-16 text-center">
          <CheckCircle className="h-20 w-20 text-ocean-green mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-ocean-navy mb-3">Order Placed Successfully!</h1>
          <p className="text-ocean-text-secondary mb-8 max-w-md mx-auto">
            Your order has been placed. The vendor will confirm your order shortly. You will receive updates on your registered phone.
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => router.push("/marketplace")}>Continue Shopping</Button>
            <Button variant="outline" onClick={() => router.push("/")}>Back to Home</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!form.address || !form.city || !form.pincode || !form.phone) {
      alert("Please fill in all required fields.");
      return;
    }
    setLoading(true);
    try {
      const vendorGroups: Record<string, { product: string; quantity: number }[]> = {};
      items.forEach((item) => {
        if (!vendorGroups[item.vendorId]) vendorGroups[item.vendorId] = [];
        vendorGroups[item.vendorId].push({ product: item.productId, quantity: item.quantity });
      });

      const shippingAddress = `${form.address}, ${form.city}, ${form.state} - ${form.pincode}`;

      for (const [vendorId, orderItems] of Object.entries(vendorGroups)) {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}/marketplace/orders/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("o3l_access_token") || ""}`,
          },
          body: JSON.stringify({
            vendor: vendorId,
            items: orderItems,
            shipping_address: shippingAddress,
            shipping_phone: form.phone,
            notes: form.notes,
          }),
        });
      }

      clearCart();
      setSuccess(true);
    } catch (err) {
      alert("Failed to place order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ocean-foam">
      <Header />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={() => router.back()} size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-ocean-navy">Checkout</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Truck className="h-5 w-5 text-ocean-blue" />
                    <h2 className="text-lg font-bold text-ocean-navy">Shipping Address</h2>
                  </div>
                  <a href="/profile" className="text-xs text-ocean-blue hover:underline">
                    Edit in Profile
                  </a>
                </div>
                {profile && !profile.address && (
                  <div className="mb-4 rounded-lg bg-ocean-light/50 border border-ocean-border/30 p-3 text-xs text-ocean-text-secondary">
                    Tip: Save your address in your <a href="/profile" className="text-ocean-blue font-medium hover:underline">profile</a> to auto-fill checkout next time.
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <Label htmlFor="address">Address *</Label>
                    <Textarea
                      id="address"
                      placeholder="Street address, village, landmark..."
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">City / District *</Label>
                    <Input
                      id="city"
                      placeholder="e.g. Chennai"
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={form.state}
                      disabled
                      className="mt-1 bg-gray-50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="pincode">Pincode *</Label>
                    <Input
                      id="pincode"
                      placeholder="e.g. 600001"
                      value={form.pincode}
                      onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone *</Label>
                    <Input
                      id="phone"
                      placeholder="+91 98765 43210"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="notes">Order Notes (optional)</Label>
                    <Textarea
                      id="notes"
                      placeholder="Any special instructions..."
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <CreditCard className="h-5 w-5 text-ocean-blue" />
                  <h2 className="text-lg font-bold text-ocean-navy">Payment</h2>
                </div>
                <div className="bg-ocean-light rounded-lg p-4 text-sm text-ocean-text-secondary">
                  <p>Payment will be collected on delivery or via Razorpay/Stripe after order confirmation.</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="sticky top-24">
              <CardContent className="p-6 space-y-4">
                <h2 className="text-lg font-bold text-ocean-navy">Order Summary</h2>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.productId} className="flex gap-3 text-sm">
                      <div className="w-12 h-12 rounded bg-ocean-foam flex-shrink-0 overflow-hidden">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-4 w-4 text-ocean-muted" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-ocean-navy truncate">{item.name}</p>
                        <p className="text-ocean-text-secondary">Qty: {item.quantity}</p>
                      </div>
                      <span className="font-medium">₹{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-ocean-text-secondary">Subtotal</span>
                    <span>₹{totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ocean-text-secondary">Shipping</span>
                    <span className="text-ocean-green">Free</span>
                  </div>
                  <div className="flex justify-between text-base font-bold border-t pt-2">
                    <span className="text-ocean-navy">Total</span>
                    <span className="text-ocean-green">₹{totalPrice.toFixed(2)}</span>
                  </div>
                </div>
                <Button
                  className="w-full bg-ocean-green hover:bg-ocean-green/90"
                  size="lg"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? "Placing Order..." : "Place Order"}
                </Button>
                <div className="flex items-center gap-1 justify-center text-xs text-ocean-text-secondary">
                  <ShieldCheck className="h-3 w-3" />
                  <span>Secure checkout</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
