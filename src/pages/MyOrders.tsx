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
import { Loader2, ShoppingBag, Calendar, CreditCard, Package, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { ptBR, de } from "date-fns/locale";

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
}

const MyOrders = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["my-orders", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Order[];
    },
    enabled: !!user,
  });

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
        <h1 className="text-2xl font-bold">{t("account.myOrders")}</h1>
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
              <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">{t("orders.noOrders")}</p>
              <Button onClick={() => navigate("/")}>
                {t("cart.continueShopping")}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
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
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{t("orders.total")}:</span>
                    </div>
                    <span className="text-lg font-bold text-primary">
                      {order.currency} {order.total_amount.toFixed(2)}
                    </span>
                  </div>

                  {order.notes && (
                    <div className="flex items-start gap-2 text-sm bg-muted/50 p-3 rounded-lg">
                      <Package className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <span className="font-medium">{t("checkout.notes")}:</span>
                        <p className="text-muted-foreground">{order.notes}</p>
                      </div>
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

export default MyOrders;
