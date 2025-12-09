import { useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { ProductCard } from "@/components/products/ProductCard";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTranslation } from "react-i18next";
import { useEffect, useRef, useState } from "react";

const CategoryProducts = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  const productRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const [activeTab, setActiveTab] = useState<string | undefined>(undefined);

  const { data: category, isLoading: categoryLoading, error: categoryError } = useQuery({
    queryKey: ["category", categoryId],
    enabled: !!categoryId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id,name")
        .eq("id", categoryId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  interface SubcategoryRow { id: string; name: string; display_order: number }
  interface ProductRow {
    id: string; name: string; code: string; image_url: string | null; price_per_unit: number | null;
    old_price: number | null; units_per_box: number | null; is_new: boolean | null; expiry_date: string | null;
    currency: string | null; subcategory_id: string; sell_by_box: boolean | null; units_in_box: number | null;
  }

  const { data: subcategories, isLoading: subcategoriesLoading, error: subcategoriesError } = useQuery<SubcategoryRow[]>({
    queryKey: ["subcategories", categoryId],
    enabled: !!categoryId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subcategories")
        .select("id,name,display_order")
        .eq("category_id", categoryId)
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: products, isLoading: productsLoading, error: productsError } = useQuery<ProductRow[]>({
    queryKey: ["products", categoryId],
    enabled: !!categoryId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(`
          id,name,code,image_url,price_per_unit,old_price,units_per_box,is_new,expiry_date,currency,subcategory_id,
          sell_by_box,units_in_box,subcategories!inner(category_id)
        `)
        .eq("subcategories.category_id", categoryId)
        .eq("is_active", true);
      if (error) throw error;
      return data || [];
    },
  });

  useEffect(() => {
    if (subcategories && subcategories.length > 0 && !activeTab) {
      setActiveTab("all"); // Definir "all" como padrão para mostrar todos os produtos
    }
  }, [subcategories, activeTab]);

  useEffect(() => {
    const productId = searchParams.get('product');
    if (productId && products) {
      const product = products.find(p => p.id === productId);
      if (product && product.subcategory_id) {
        setActiveTab(product.subcategory_id);
        
        setTimeout(() => {
          productRefs.current[productId]?.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
        }, 200);
      }
    }
  }, [searchParams, products]);

  if (categoryLoading || subcategoriesLoading || productsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <BottomNav />
      </div>
    );
  }

  if (categoryError || subcategoriesError || productsError) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <Header />
        <div className="container mx-auto px-4 py-10">
          <Alert variant="destructive">
            <AlertDescription>
              {t("category.errorLoading")}
            </AlertDescription>
          </Alert>
        </div>
        <BottomNav />
      </div>
    );
  }

  const getProductsBySubcategory = (subcategoryId: string) => (
    (products || []).filter(p => p.subcategory_id === subcategoryId)
  );

  const getAllProducts = () => products || [];

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      
      <div className="bg-primary text-primary-foreground py-4 px-4 text-center">
        <h1 className="text-xl font-semibold">{category?.name || t("admin.products")}</h1>
      </div>

      <main className="container mx-auto">
        {subcategories && subcategories.length > 0 && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="sticky top-16 z-40 bg-background border-b border-border overflow-x-auto no-scrollbar">
              <TabsList className="w-full justify-start rounded-none h-auto p-0 bg-transparent">
                {/* Aba "Todos os Produtos" */}
                <TabsTrigger
                  value="all"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 whitespace-nowrap font-semibold"
                >
                  {t("category.allProducts")}
                </TabsTrigger>
                {/* Abas das subcategorias */}
                {subcategories.map((subcategory) => (
                  <TabsTrigger
                    key={subcategory.id}
                    value={subcategory.id}
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 whitespace-nowrap"
                  >
                    {subcategory.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {/* Conteúdo da aba "Todos os Produtos" */}
            <TabsContent value="all" className="mt-0">
              <div className="grid grid-cols-2 gap-4 p-4">
                {getAllProducts().length === 0 && (
                  <p className="col-span-2 text-sm text-muted-foreground">{t("category.noProducts")}</p>
                )}
                {getAllProducts().map((product) => (
                  <div 
                    key={product.id}
                    ref={(el) => {
                      if (el) productRefs.current[product.id] = el;
                    }}
                  >
                    <ProductCard
                      id={product.id}
                      name={product.name}
                      code={product.code}
                      imageUrl={product.image_url || undefined}
                      price={Number(product.price_per_unit ?? 0) / 100}
                      oldPrice={product.old_price ? Number(product.old_price) / 100 : undefined}
                      unitsPerBox={product.units_per_box}
                      isNew={product.is_new || false}
                      expiryDate={product.expiry_date || undefined}
                      currency={product.currency || 'CHF'}
                      sellByBox={product.sell_by_box || false}
                      unitsInBox={product.units_in_box || 0}
                    />
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Conteúdo das abas das subcategorias */}
            {subcategories.map((subcategory) => (
              <TabsContent key={subcategory.id} value={subcategory.id} className="mt-0">
                <div className="grid grid-cols-2 gap-4 p-4">
                  {getProductsBySubcategory(subcategory.id).length === 0 && (
                    <p className="col-span-2 text-sm text-muted-foreground">{t("category.noProducts")}</p>
                  )}
                  {getProductsBySubcategory(subcategory.id).map((product) => (
                    <div 
                      key={product.id}
                      ref={(el) => {
                        if (el) productRefs.current[product.id] = el;
                      }}
                    >
                      <ProductCard
                        id={product.id}
                        name={product.name}
                        code={product.code}
                        imageUrl={product.image_url || undefined}
                        price={Number(product.price_per_unit ?? 0) / 100}
                        oldPrice={product.old_price ? Number(product.old_price) / 100 : undefined}
                        unitsPerBox={product.units_per_box}
                        isNew={product.is_new || false}
                        expiryDate={product.expiry_date || undefined}
                        currency={product.currency || 'CHF'}
                        sellByBox={product.sell_by_box || false}
                        unitsInBox={product.units_in_box || 0}
                      />
                    </div>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </main>
      
      <BottomNav />
    </div>
  );
};

export default CategoryProducts;
