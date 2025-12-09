import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { formatPrice } from "@/lib/format-price";

// Componente para controle de quantidade B2B
const QuantityControl = ({ productId, currentQuantity, onQuantityChange }: {
  productId: string;
  currentQuantity: number;
  onQuantityChange: (productId: string, quantity: number) => void;
}) => {
  const [inputValue, setInputValue] = useState(currentQuantity.toString());
  const { t } = useTranslation();

  useEffect(() => {
    setInputValue(currentQuantity.toString());
  }, [currentQuantity]);

  const handleInputChange = (value: string) => {
    // Permitir apenas números
    const numericValue = value.replace(/[^0-9]/g, '');
    setInputValue(numericValue);
  };

  const handleInputBlur = () => {
    const quantity = parseInt(inputValue) || 1;
    const finalQuantity = Math.max(1, Math.min(999, quantity)); // Limite entre 1 e 999
    setInputValue(finalQuantity.toString());
    onQuantityChange(productId, finalQuantity);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleInputBlur();
    }
  };

  const incrementQuantity = () => {
    const newQuantity = Math.min(999, currentQuantity + 1);
    onQuantityChange(productId, newQuantity);
  };

  const decrementQuantity = () => {
    const newQuantity = Math.max(1, currentQuantity - 1);
    onQuantityChange(productId, newQuantity);
  };

  return (
    <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded"
        onClick={decrementQuantity}
        disabled={currentQuantity <= 1}
        aria-label={t("cart.decreaseQuantity")}
      >
        <Minus className="h-4 w-4" />
      </Button>
      
      <Input
        type="text"
        inputMode="numeric"
        value={inputValue}
        onChange={(e) => handleInputChange(e.target.value)}
        onBlur={handleInputBlur}
        onKeyDown={handleInputKeyDown}
        className="w-16 h-8 text-center border-0 bg-background rounded font-semibold"
        min="1"
        max="999"
        aria-label={t("cart.quantity")}
      />
      
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded"
        onClick={incrementQuantity}
        disabled={currentQuantity >= 999}
        aria-label={t("cart.increaseQuantity")}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
};

const Cart = () => {
  const { items, totalAmount, updateQuantity, removeItem } = useCart();
  const navigate = useNavigate();
  const { t } = useTranslation();

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <div className="bg-primary text-primary-foreground py-6 px-4 text-center safe-area-inset-top">
          <h1 className="text-2xl font-bold">{t("cart.title")}</h1>
        </div>
        <main className="flex-1 flex items-center justify-center px-4 py-8 pb-24">
          <div className="w-full max-w-md mx-auto text-center space-y-6">
            <div className="bg-card rounded-lg shadow-sm border border-border p-8 space-y-6">
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-foreground">
                  {t("cart.title")}
                </h2>
                <p className="text-sm text-muted-foreground">{t("cart.empty")}</p>
              </div>
              <Button size="lg" className="w-full" onClick={() => navigate("/")}>
                {t("cart.continueShopping")}
              </Button>
            </div>
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <div className="bg-primary text-primary-foreground py-6 px-4 text-center safe-area-inset-top">
        <h1 className="text-2xl font-bold">{t("cart.title")}</h1>
      </div>

      <main className="flex-1 px-4 py-6 pb-24">
        <div className="space-y-4 mb-32">
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-20 h-20 object-contain rounded bg-muted"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded bg-muted flex items-center justify-center text-muted-foreground text-xs">
                      {t("common.noImage")}
                    </div>
                  )}

                  <div className="flex-1">
                    <h3 className="font-medium line-clamp-2 mb-1">{item.name}</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      {item.sellByBox && item.unitsInBox ? (
                        <>{item.unitsInBox} {t("cart.unitsPerBox")}</>
                      ) : (
                        <>{item.unitsPerBox} {t("cart.unitsPerBox")}</>
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground mb-1">
                      {t("cart.quantity")}: {item.quantity}
                    </p>
                    <p className="font-bold text-price-promo">
                      {formatPrice(item.price)} CHF
                    </p>
                  </div>

                  <div className="flex items-start">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => removeItem(item.productId)}
                      aria-label={t("cart.removeItem", { item: item.name })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="fixed bottom-[60px] left-0 right-0 bg-background border-t border-border p-4 shadow-lg safe-area-inset-bottom">
          <div className="max-w-screen-xl mx-auto">
            <div className="flex items-center justify-between gap-4 mb-4">
              <span className="text-base sm:text-lg font-semibold whitespace-nowrap">{t("cart.total")}:</span>
              <span className="text-lg sm:text-2xl font-bold text-price-promo text-right break-all">
                {formatPrice(totalAmount)} CHF
              </span>
            </div>
            
            <Button
              className="w-full"
              size="lg"
              onClick={() => navigate("/checkout")}
            >
              {t("cart.checkout")}
            </Button>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Cart;
