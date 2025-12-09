import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Heart, Calendar, ShoppingCart, ArrowLeft, Package } from "lucide-react";
import { format } from "date-fns";
import { ptBR, de } from "date-fns/locale";
import { useCart } from "@/hooks/use-cart";
import { toast } from "@/hooks/use-toast";
import { formatPrice } from "@/lib/format-price";

interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  price_per_unit: number;
  subtotal: number;
}

interface Order {
  id: string;
  order_number: string;
  created_at: string;
  total_amount: number;
  currency: string;
  status: string;
  payment_status: string;
  customer_name: string;
  notes: string | null;
  order_items: OrderItem[];
}

const Favorites = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addItem } = useCart();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["favorites-orders", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (
            id,
            product_id,
            product_name,
            quantity,
            price_per_unit,
            subtotal
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Order[];
    },
    enabled: !!user,
  });

  const handleRepeatOrder = async (order: Order) => {
    try {
      let itemsAdded = 0;
      
      for (const item of order.order_items) {
        // Buscar informações atualizadas do produto
        const { data: product, error } = await supabase
          .from("products")
          .select("*")
          .eq("id", item.product_id)
          .single();
        
        if (error || !product) {
          console.error("Erro ao buscar produto:", error);
          continue;
        }

        // Adicionar ao carrinho
        addItem({
          id: product.id,
          productId: product.id,
          name: product.name,
          code: product.code,
          price: product.price_per_unit,
          unitsPerBox: product.units_per_box,
          imageUrl: product.image_url,
        }, item.quantity);
        
        itemsAdded++;
      }

      if (itemsAdded > 0) {
        toast({
          title: t("favorites.orderRepeated"),
          description: t("favorites.itemsAddedToCart", { count: itemsAdded }),
        });
        
        // Redirecionar para o carrinho
        setTimeout(() => {
          navigate("/cart");
        }, 1000);
      } else {
        toast({
          title: t("common.error"),
          description: t("favorites.noProductsAvailable"),
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao repetir pedido:", error);
      toast({
        title: t("common.error"),
        description: t("favorites.errorRepeating"),
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: string; label: string }> = {
      confirmed: { variant: "default", label: t("orders.statusConfirmed") },
      processing: { variant: "secondary", label: t("orders.statusProcessing") },
      completed: { variant: "default", label: t("orders.statusCompleted") },
      cancelled: { variant: "destructive", label: t("orders.statusCancelled") },
    };
    
    const config = statusMap[status] || statusMap.confirmed;
    return <Badge variant={config.variant as any}>{config.label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    const locale = i18n.language === 'de' ? de : ptBR;
    return format(new Date(dateString), "PPP", { locale });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4 py-8 pb-24">
          <Card>
            <CardContent className="p-8 text-center">
              <p className="mb-4">{t("account.loginRequired")}</p>
              <Button onClick={() => navigate("/auth")}>
                {t("account.loginRegister")}
              </Button>
            </CardContent>
          </Card>
        </main>
        <BottomNav />
      </div>
    );
  }

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

      <main className="flex-1 px-4 py-6 pb-24 max-w-4xl mx-auto w-full">
        <Button
          variant="ghost"
          onClick={() => navigate("/account")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t("common.back")}
        </Button>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : orders.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">{t("favorites.noOrders")}</p>
              <Button onClick={() => navigate("/")}>
                {t("cart.continueShopping")}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {t("orders.order")} #{order.order_number}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {formatDate(order.created_at)}
                      </div>
                    </div>
                    {getStatusBadge(order.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Itens do pedido */}
                  <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2 font-medium text-sm mb-2">
                      <Package className="h-4 w-4" />
                      {t("favorites.items")}:
                    </div>
                    {order.order_items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {item.quantity}x {item.product_name}
                        </span>
                        <span className="font-medium">
                          {order.currency} {formatPrice(item.subtotal)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Total e ação */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div>
                      <span className="text-sm text-muted-foreground">{t("orders.total")}:</span>
                      <p className="text-xl font-bold text-primary">
                        {order.currency} {formatPrice(order.total_amount)}
                      </p>
                    </div>
                    <Button 
                      onClick={() => handleRepeatOrder(order)}
                      className="gap-2"
                    >
                      <ShoppingCart className="h-4 w-4" />
                      {t("favorites.repeatOrder")}
                    </Button>
                  </div>

                  {order.notes && (
                    <div className="text-sm bg-muted/50 p-3 rounded-lg">
                      <span className="font-medium">{t("checkout.notes")}:</span>
                      <p className="text-muted-foreground mt-1">{order.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Favorites;
