import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { memo } from "react";

interface ProductCardProps {
  id: string;
  name: string;
  code: string;
  imageUrl?: string;
  price: number;
  oldPrice?: number;
  unitsPerBox: number;
  isNew?: boolean;
  expiryDate?: string;
  currency?: string;
}

export const ProductCard = memo(({
  id,
  name,
  code,
  imageUrl,
  price,
  oldPrice,
  unitsPerBox,
  isNew,
  expiryDate,
  currency = 'CHF'
}: ProductCardProps) => {
  const { addItem } = useCart();
  const { t } = useTranslation();

  const handleAddToCart = () => {
    addItem({
      id,
      productId: id,
      name,
      code,
      price,
      unitsPerBox,
      imageUrl
    });
    toast.success(t('products.addedToCart'));
  };

  const formatExpiryBadge = (date: string) => {
    const [year, month] = date.split('-');
    return `MHD: ${month}/${year.slice(2)}`;
  };

  return (
    <Card className="relative overflow-hidden">
      {isNew && (
        <div className="absolute top-0 left-0 z-10">
          <div className="bg-success text-success-foreground px-8 py-1 transform -rotate-45 -translate-x-6 translate-y-2 shadow-md">
            <span className="text-xs font-bold">{t('products.new').toUpperCase()}</span>
          </div>
        </div>
      )}
      
      {expiryDate && (
        <div className="absolute top-0 right-0 z-10">
          <div className="bg-primary text-primary-foreground px-6 py-1 transform rotate-45 translate-x-6 translate-y-2 shadow-md">
            <span className="text-xs font-bold">{formatExpiryBadge(expiryDate)}</span>
          </div>
        </div>
      )}

      <CardContent className="p-4">
        <div className="aspect-square bg-muted rounded-lg mb-3 overflow-hidden relative">
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt={name}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              {t('common.noImage')}
            </div>
          )}
          
          <Button
            size="icon"
            className="absolute bottom-2 right-2 rounded-full shadow-lg h-10 w-10"
            onClick={handleAddToCart}
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>

        <div className="space-y-1">
          <div className="flex items-baseline gap-2">
            <span className={`font-bold ${oldPrice ? 'text-price-promo text-lg' : 'text-price-normal'}`}>
              St: {price.toFixed(2)} {currency}
            </span>
            {oldPrice && (
              <span className="text-muted-foreground text-sm line-through">
                {oldPrice.toFixed(2)}
              </span>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            {unitsPerBox} {t('products.unitsPerBox')}
          </p>

          <p className="text-sm line-clamp-2 min-h-[2.5rem]">
            {name}
          </p>
        </div>
      </CardContent>
    </Card>
  );
});

ProductCard.displayName = "ProductCard";
