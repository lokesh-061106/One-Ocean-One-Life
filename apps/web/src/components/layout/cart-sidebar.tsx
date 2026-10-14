"use client";

import Link from "next/link";
import { X, Minus, Plus, ShoppingCart, Trash2, Package, ShoppingBag } from "lucide-react";
import { useCart, type CartItem } from "@/components/cart-context";
import { Button } from "@/components/ui/button";

interface CartSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function CartSidebar({ open, onClose }: CartSidebarProps) {
  const { items, removeItem, updateQuantity, totalItems, totalPrice } = useCart();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-ocean-border/60 bg-white">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ocean-blue/10">
              <ShoppingCart className="h-4.5 w-4.5 text-ocean-blue" />
            </div>
            <div>
              <h2 className="text-base font-bold text-ocean-navy">Your Cart</h2>
              <p className="text-xs text-ocean-muted">{totalItems} {totalItems === 1 ? "item" : "items"}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-ocean-light transition-colors"
          >
            <X className="h-4 w-4 text-ocean-navy" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-ocean-light mb-5">
                <ShoppingBag className="h-10 w-10 text-ocean-muted" />
              </div>
              <p className="text-base font-semibold text-ocean-navy mb-1">Your cart is empty</p>
              <p className="text-sm text-ocean-muted mb-5 max-w-[240px]">
                Browse products and add items to your cart.
              </p>
              <Button variant="outline" onClick={onClose} className="rounded-full px-6">
                Continue Shopping
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <CartItemRow
                  key={item.productId}
                  item={item}
                  onRemove={removeItem}
                  onUpdateQuantity={updateQuantity}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-ocean-border/60 bg-white px-5 py-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-ocean-muted">Subtotal</span>
              <span className="text-lg font-bold text-ocean-navy">₹{totalPrice.toFixed(2)}</span>
            </div>
            <p className="text-xs text-ocean-muted">Taxes and shipping calculated at checkout</p>
            <Link href="/marketplace/checkout" className="block">
              <Button className="w-full rounded-full h-11 text-sm font-semibold" size="lg">
                Proceed to Checkout
              </Button>
            </Link>
            <Link href="/marketplace/cart" className="block">
              <Button variant="ghost" className="w-full text-sm text-ocean-blue hover:text-ocean-blue hover:bg-ocean-light/50 rounded-full" size="sm">
                View Full Cart
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function CartItemRow({
  item,
  onRemove,
  onUpdateQuantity,
}: {
  item: CartItem;
  onRemove: (id: string) => void;
  onUpdateQuantity: (id: string, qty: number) => void;
}) {
  return (
    <div className="flex gap-3 p-3 rounded-xl bg-ocean-foam/60 border border-ocean-border/30 hover:border-ocean-border/60 transition-colors">
      {/* Image */}
      <div className="h-[72px] w-[72px] flex-shrink-0 overflow-hidden rounded-lg bg-white border border-ocean-border/30">
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-ocean-light">
            <Package className="h-7 w-7 text-ocean-muted/50" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div>
          <a href={`/marketplace/${item.productSlug || item.productId}`} className="text-sm font-semibold text-ocean-navy leading-snug line-clamp-2 hover:text-ocean-blue transition-colors">
            {item.name}
          </a>
          <p className="mt-0.5 text-xs text-ocean-muted truncate">{item.vendorName}</p>
        </div>

        <div className="flex items-center justify-between mt-2">
          {/* Quantity controls */}
          <div className="inline-flex items-center rounded-lg border border-ocean-border/60 bg-white">
            <button
              className="flex h-7 w-7 items-center justify-center rounded-l-lg hover:bg-ocean-light transition-colors disabled:opacity-30"
              onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
              disabled={item.quantity <= 1}
            >
              <Minus className="h-3 w-3 text-ocean-navy" />
            </button>
            <span className="flex h-7 min-w-[28px] items-center justify-center border-x border-ocean-border/60 text-xs font-bold text-ocean-navy">
              {item.quantity}
            </span>
            <button
              className="flex h-7 w-7 items-center justify-center rounded-r-lg hover:bg-ocean-light transition-colors disabled:opacity-30"
              onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
              disabled={item.quantity >= item.stock}
            >
              <Plus className="h-3 w-3 text-ocean-navy" />
            </button>
          </div>

          {/* Price */}
          <span className="text-sm font-bold text-ocean-green">
            ₹{(item.price * item.quantity).toFixed(2)}
          </span>
        </div>
      </div>

      {/* Remove */}
      <button
        onClick={() => onRemove(item.productId)}
        className="self-start rounded-md p-1.5 text-ocean-muted/50 hover:bg-red-50 hover:text-ocean-coral transition-colors"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
