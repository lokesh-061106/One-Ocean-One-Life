"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, ShoppingCart, Store, Star, Package } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchCmsList } from "@/lib/api-helpers";
import { type ApiProduct, type ApiProductCategory, resolveVendorName, resolveCategoryName } from "@/lib/marketplace-types";

export default function MarketplacePage() {
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [categories, setCategories] = useState<ApiProductCategory[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    async function load() {
      const [prods, cats] = await Promise.all([
        fetchCmsList<ApiProduct>("/marketplace/products/"),
        fetchCmsList<ApiProductCategory>("/marketplace/categories/"),
      ]);
      setProducts(prods);
      setCategories(cats);
    }
    load();
  }, []);

  const filtered = products
    .filter((p) => {
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.description?.toLowerCase().includes(searchQuery.toLowerCase());
      let matchCat = true;
      if (selectedCategory !== "all") {
        const catId = typeof p.category === "string" ? p.category : p.category?.id;
        matchCat = catId === selectedCategory;
      }
      return matchSearch && matchCat;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "price_asc": return (a.discount_price || a.price) - (b.discount_price || b.price);
        case "price_desc": return (b.discount_price || b.price) - (a.discount_price || a.price);
        case "rating": return b.rating - a.rating;
        case "popular": return b.units_sold - a.units_sold;
        default: return 0;
      }
    });

  return (
    <div className="min-h-screen bg-ocean-foam">
      <Header />
      <main>
        <section className="bg-gradient-to-r from-ocean-deep to-ocean-blue py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <Badge variant="secondary" className="mb-4 bg-white/20 text-white border-white/30">Community Marketplace</Badge>
            <h1 className="text-4xl font-bold text-white mb-4">Marketplace</h1>
            <p className="text-lg text-ocean-sand max-w-2xl mx-auto">Ocean-friendly products for coastal communities. Support local vendors and verified contributors.</p>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ocean-muted" />
              <Input
                placeholder="Search products..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              className="px-4 py-2 rounded-md border border-gray-200 bg-white text-sm"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Newest</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Top Rated</option>
              <option value="popular">Most Popular</option>
            </select>
          </div>

          <div className="flex flex-wrap gap-2 mb-8">
            <Button variant={selectedCategory === "all" ? "default" : "outline"} size="sm" onClick={() => setSelectedCategory("all")}>
              All
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.icon} {cat.name}
                <Badge variant="secondary" className="ml-2 bg-white/20">{cat.product_count}</Badge>
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((product) => (
              <Link key={product.id} href={`/marketplace/${product.slug || product.id}`}>
                <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group h-full">
                  {product.image ? (
                    <img src={product.image} alt={product.name} className="w-full h-48 object-cover" />
                  ) : (
                    <div className="bg-gradient-to-br from-ocean-blue/10 to-ocean-green/10 h-48 flex items-center justify-center">
                      <Package className="h-12 w-12 text-ocean-blue/30" />
                    </div>
                  )}
                  <CardContent className="p-4 flex flex-col flex-1">
                    {product.category && (
                      <Badge className="self-start mb-2 bg-ocean-blue/10 text-ocean-blue">{resolveCategoryName(product.category, product.category_name)}</Badge>
                    )}
                    <h3 className="font-semibold text-ocean-navy mb-1 group-hover:text-ocean-blue transition-colors line-clamp-2">{product.name}</h3>
                    <p className="text-sm text-ocean-text-secondary mb-3 line-clamp-2 flex-1">{product.description?.slice(0, 80)}...</p>
                    <div className="flex items-center gap-1 text-sm text-ocean-text-secondary mb-2">
                      <Store className="h-3 w-3" />
                      <span className="truncate">{resolveVendorName(product.vendor, product.vendor_name)}</span>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-ocean-border">
                      <div>
                        <span className="text-lg font-bold text-ocean-green">₹{product.discount_price || product.price}</span>
                        {product.discount_price && product.discount_price < product.price && (
                          <span className="text-sm text-ocean-muted line-through ml-2">₹{product.price}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {product.rating > 0 && (
                          <span className="flex items-center gap-1 text-sm text-ocean-text-secondary">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />{product.rating.toFixed(1)}
                          </span>
                        )}
                        <span className="text-xs text-ocean-muted">{product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}</span>
                      </div>
                    </div>
                    {product.contribution_discount_percent > 0 && (
                      <div className="mt-2 text-xs text-ocean-coral bg-ocean-coral/10 px-2 py-1 rounded">
                        🏆 {product.contribution_discount_percent}% OFF for verified contributors
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-16">
              <Package className="h-16 w-16 text-ocean-muted mx-auto mb-4" />
              <p className="text-lg text-ocean-text-secondary">No products found</p>
              <Button variant="outline" className="mt-4" onClick={() => { setSearchQuery(""); setSelectedCategory("all"); }}>
                Clear filters
              </Button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
