import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Minus } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { memo, useState, useRef, useEffect } from "react";
import { formatPrice } from "@/lib/format-price";

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
  sellByBox?: boolean;
  unitsInBox?: number;
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
  currency = 'CHF',
  sellByBox = false,
  unitsInBox = 0
}: ProductCardProps) => {
  const { addItem } = useCart();
  const { t } = useTranslation();
  const [quantity, setQuantity] = useState(1);
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState('1');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Calcular o preço considerando venda por caixa
  const displayPrice = sellByBox && unitsInBox > 0 ? price * unitsInBox : price;
  const displayOldPrice = sellByBox && unitsInBox > 0 && oldPrice ? oldPrice * unitsInBox : oldPrice;

  const handleAddToCart = () => {
    addItem({
      id,
      productId: id,
      name,
      code,
      price: displayPrice,
      unitsPerBox,
      imageUrl,
      sellByBox,
      unitsInBox
    }, quantity);
    toast.success(t('products.addedToCart'));
    setQuantity(1);
  };

  const incrementQuantity = () => {
    setQuantity(prev => prev + 1);
    setInputValue(String(quantity + 1));
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
      setInputValue(String(quantity - 1));
    }
  };

  const handleQuantityClick = () => {
    setIsEditing(true);
    setInputValue(String(quantity));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    if (value === '' || value === '0') {
      setInputValue('1');
    } else {
      setInputValue(value);
    }
  };

  const handleInputBlur = () => {
    const numValue = parseInt(inputValue) || 1;
    const finalValue = numValue < 1 ? 1 : numValue;
    setQuantity(finalValue);
    setInputValue(String(finalValue));
    setIsEditing(false);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleInputBlur();
    }
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

      <CardContent className="p-3 sm:p-4">
        <div className="aspect-square bg-muted rounded-lg mb-2 sm:mb-3 overflow-hidden relative">
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt={name}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
              {t('common.noImage')}
            </div>
          )}
        </div>

        <div className="space-y-1.5 sm:space-y-2">
          <div className="flex items-baseline gap-1.5 sm:gap-2">
            <span className={`font-bold text-sm sm:text-base ${oldPrice ? 'text-price-promo' : 'text-price-normal'}`}>
              {sellByBox && unitsInBox > 0 ? (
                <>Cx: {formatPrice(displayPrice)} {currency}</>
              ) : (
                <>St: {formatPrice(displayPrice)} {currency}</>
              )}
            </span>
            {displayOldPrice && (
              <span className="text-muted-foreground text-xs line-through">
                {formatPrice(displayOldPrice)}
              </span>
            )}
          </div>

          <p className="text-[10px] sm:text-xs text-muted-foreground">
            {sellByBox && unitsInBox > 0 ? (
              <>{unitsInBox} {t('products.unitsPerBox')}</>
            ) : (
              <>{unitsPerBox} {t('products.unitsPerBox')}</>
            )}
          </p>

          <p className="text-xs sm:text-sm line-clamp-2 min-h-[2rem] sm:min-h-[2.5rem]">
            {name}
          </p>

          {/* Quantity Selector */}
          <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-2 pt-1 sm:pt-2">
            <div className="flex items-center border rounded-lg overflow-hidden">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 sm:h-8 sm:w-8 rounded-none touch-manipulation"
                onClick={decrementQuantity}
                disabled={quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              {isEditing ? (
                <input
                  ref={inputRef}
                  type="text"
                  inputMode="numeric"
                  value={inputValue}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  onKeyDown={handleInputKeyDown}
                  className="flex-1 sm:min-w-[40px] min-w-[40px] h-9 sm:h-8 px-3 sm:px-2 text-sm font-medium text-center border-x bg-transparent focus:outline-none focus:bg-muted/50"
                  style={{ margin: 0, padding: '0.5rem 0.75rem', lineHeight: '2.25rem' }}
                />
              ) : (
                <div 
                  onClick={handleQuantityClick}
                  className="flex items-center justify-center flex-1 sm:min-w-[40px] min-w-[40px] h-9 sm:h-8 px-3 sm:px-2 text-sm font-medium border-x cursor-pointer hover:bg-muted/50 active:bg-muted transition-colors"
                >
                  {quantity}
                </div>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 sm:h-8 sm:w-8 rounded-none touch-manipulation"
                onClick={incrementQuantity}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <Button
              className="w-full sm:flex-1 h-9 sm:h-8 text-xs sm:text-sm touch-manipulation active:scale-95 transition-transform"
              onClick={handleAddToCart}
            >
              <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
              <span className="hidden sm:inline">{t('products.addToCart')}</span>
              <span className="sm:hidden">{t('cart.checkout')}</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

ProductCard.displayName = "ProductCard";
