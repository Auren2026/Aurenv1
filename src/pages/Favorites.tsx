import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Heart, ArrowLeft, ShoppingCart } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { toast } from "@/hooks/use-toast";
import { formatPrice } from "@/lib/format-price";
import { useFavorites } from "@/hooks/use-favorites";
import { ProductCard } from "@/components/products/ProductCard";


const Favorites = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { favorites, removeFavorite } = useFavorites();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <div className="bg-primary text-primary-foreground py-6 px-4 text-center safe-area-inset-top">
        <div className="flex items-center justify-center gap-2">
          <Heart className="h-6 w-6" fill="currentColor" />
          <h1 className="text-2xl font-bold">{t("favorites.title")}</h1>
        </div>
        <p className="text-sm mt-2 text-primary-foreground/90">
          {t("favorites.subtitle")}
        </p>
      </div>

      <main className="flex-1 px-4 py-6 pb-24 max-w-7xl mx-auto w-full">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t("common.back")}
        </Button>

        {favorites.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">{t("favorites.noFavorites")}</p>
              <Button onClick={() => navigate("/")}>
                {t("cart.continueShopping")}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {favorites.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                code={product.code}
                price={product.price}
                imageUrl={product.imageUrl}
                unitsPerBox={product.unitsPerBox}
                sellByBox={product.sellByBox}
                unitsInBox={product.unitsInBox}
              />
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Favorites;
