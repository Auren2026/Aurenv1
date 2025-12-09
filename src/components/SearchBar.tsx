import { useState, useMemo } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/format-price";

export const SearchBar = () => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { data: allProducts = [], isLoading } = useQuery({
    queryKey: ["products-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, subcategories(category_id, categories(id))")
        .eq("is_active", true)
        .limit(100);

      if (error) throw error;
      return data || [];
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase();
    return allProducts.filter((product: any) =>
      product.name.toLowerCase().includes(query) ||
      product.code.toLowerCase().includes(query) ||
      (product.description && product.description.toLowerCase().includes(query))
    ).slice(0, 15); // Aumentado para mostrar mais resultados
  }, [searchQuery, allProducts]);

  const handleSelectProduct = (productId: string, subcategoryId: string, categoryId?: string) => {
    setOpen(false);
    setSearchQuery("");
    if (categoryId) {
      navigate(`/category/${categoryId}?subcategory=${subcategoryId}&product=${productId}`);
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="text-primary-foreground hover:bg-primary-foreground/10"
        onClick={() => setOpen(true)}
      >
        <Search className="h-5 w-5" />
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder={t("header.searchPlaceholder")}
          value={searchQuery}
          onValueChange={setSearchQuery}
          autoFocus
        />
        <CommandList>
          {isLoading ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              {t("common.loading")}...
            </div>
          ) : searchQuery.trim() && filteredProducts.length === 0 ? (
            <CommandEmpty>{t("search.noResults")}</CommandEmpty>
          ) : (
            <>
              {filteredProducts && filteredProducts.length > 0 && (
                <CommandGroup heading={t("products.title")}>
                  {filteredProducts.map((product) => (
                    <CommandItem
                      key={product.id}
                      onSelect={() => {
                        const categoryId = product.subcategories?.categories?.id;
                        handleSelectProduct(product.id, product.subcategory_id, categoryId);
                      }}
                      className="flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        {product.image_url && (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="h-10 w-10 rounded object-cover"
                          />
                        )}
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground">{product.code}</p>
                        </div>
                      </div>
                      <span className="font-bold text-primary">
                        {product.currency} {formatPrice(product.price_per_unit / 100)}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {!searchQuery.trim() && !isLoading && allProducts.length > 0 && (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  {t("search.startTyping")}
                </div>
              )}
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
};
