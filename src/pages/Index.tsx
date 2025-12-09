import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { WelcomeBanner } from "@/components/home/WelcomeBanner";
import { BannerCarousel } from "@/components/home/BannerCarousel";
import { CategoryCard } from "@/components/home/CategoryCard";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { useCustomerStatus } from "@/hooks/use-customer-status";
import { StatusMessage } from "@/components/customer/StatusMessage";

const Index = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { status, isLoading: statusLoading } = useCustomerStatus();

  const { data: categories, isLoading, error: categoriesError } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  if (user && !statusLoading && status && status !== 'approved') {
    return <StatusMessage status={status as 'pending' | 'inactive' | 'blocked'} />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <WelcomeBanner />
      <BannerCarousel />
      
      <main className="flex-1 px-4 py-6 pb-20">
        <h2 className="text-2xl font-bold mb-6">{t("home.categories")}</h2>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-20" role="status" aria-live="polite">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="sr-only">{t("common.loading")}</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {categories?.map((category) => (
              <CategoryCard
                key={category.id}
                name={category.name}
                iconEmoji={category.icon_emoji}
                onClick={() => navigate(`/category/${category.id}`)}
              />
            ))}
          </div>
        )}
      </main>
      
      <BottomNav />
    </div>
  );
};

export default Index;
