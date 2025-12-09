import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { useOrderEmail } from "@/hooks/use-order-email";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useCustomerStatus } from "@/hooks/use-customer-status";
import { formatPrice } from "@/lib/format-price";

interface LocationState {
  orderId?: string;
}



export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { items, totalAmount, clearCart } = useCart();
  const { sendOrderEmails, isLoading } = useOrderEmail();
  const { t } = useTranslation();

  const NO_PAYMENT = true;

  const { status, isLoading: statusLoading, isApproved } = useCustomerStatus();

  const [orderId, setOrderId] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [guestName, setGuestName] = useState<string>("");
  const [guestEmail, setGuestEmail] = useState<string>("");
  const [guestSubmitted, setGuestSubmitted] = useState(false);
  const [orderInitialized, setOrderInitialized] = useState(false);
  const [notes, setNotes] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [customerAddress, setCustomerAddress] = useState<string>("");
  const [profileLoaded, setProfileLoaded] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user || !isApproved || profileLoaded) return;
      try {
        const { data, error } = await supabase
          .from('customer_profiles')
          .select('full_name, phone, address, nif')
          .eq('user_id', user.id)
          .maybeSingle();
        if (!error && data) {
          const profile = data as { full_name?: string; phone?: string; address?: string; nif?: string };
          if (!customerPhone) setCustomerPhone(profile.phone || '');
          if (!customerAddress) setCustomerAddress(profile.address || '');
          if (!guestName) setGuestName(profile.full_name || '');
        }
      } catch (e) {
        if (import.meta.env.DEV) {
          console.warn('Falha ao carregar perfil do cliente', e);
        }
      } finally {
        setProfileLoaded(true);
      }
    };
    loadProfile();
  }, [user, isApproved, profileLoaded, customerPhone, customerAddress, guestName]);

  const state = location.state as LocationState;

  useEffect(() => {
    if (items.length === 0 && !state?.orderId) {
      navigate("/cart");
      return;
    }

    if (!user && !guestSubmitted && !state?.orderId) {
      return;
    }

    if (orderInitialized || NO_PAYMENT) {
      return;
    }

    const initializeCheckout = async () => {
      try {
        let order_id = state?.orderId;

        if (!order_id) {
          const customer_name = user
            ? user.user_metadata?.name || user.email || t("checkout.defaultCustomer")
            : guestName || t("checkout.defaultCustomer");

          const customer_email = user ? user.email || "" : guestEmail || "";

          const insertPayload: any = {
            user_id: user ? user.id : null,
            customer_name,
            customer_email,
            order_number: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            total_amount: totalAmount,
            status: "pending",
            payment_status: "pending",
            currency: "CHF",
          };

          const { data: createdOrder, error: createError } = await supabase
            .from("orders")
            .insert(insertPayload)
            .select("id")
            .single();
          if (createError || !createdOrder) throw createError || new Error('Falha ao criar ordem');
          const createdOrderTyped = createdOrder as { id: string };
          order_id = createdOrderTyped.id;
        }

        setOrderId(order_id);

       
        setOrderInitialized(true);
      } catch (err: any) {
        if (import.meta.env.DEV) {
          console.error("Erro ao inicializar checkout:", err);
        }
        setError(err.message || t("checkout.errorInitializing"));
        setPaymentStatus("error");
      }
    };

    initializeCheckout();
  }, [user, items.length, state?.orderId, navigate, totalAmount, guestSubmitted, orderInitialized]);

  const createOrderAndSend = async () => {
    try {
      setPaymentStatus("processing");
      setError(null);
      
      if (!isApproved) {
        setError(t("checkout.onlyApprovedCustomers"));
        setPaymentStatus('error');
        return;
      }
     
      const customer_name = guestName || user.user_metadata?.name || user.email || t("checkout.defaultCustomer");
      const customer_email = user.email || '';

      const insertPayload: any = {
        user_id: user.id,
        customer_name,
        customer_email,
        customer_phone: customerPhone || null,
        customer_address: customerAddress || null,
        order_number: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        total_amount: totalAmount,
        status: 'confirmed',
        payment_status: 'not_applicable',
        currency: 'CHF',
        notes: notes || null,
      };

      const { data: createdOrder, error: createError } = await supabase
        .from("orders")
        .insert(insertPayload)
        .select("id, order_number, customer_name, customer_email, total_amount, currency")
        .single();
      if (createError || !createdOrder) throw createError || new Error('Falha ao criar ordem');
      const createdOrderTyped = createdOrder as { id: string; order_number: string; customer_name: string; customer_email: string; total_amount: number; currency: string };
      const order_id = createdOrderTyped.id;

      const orderItems = items.map((item) => ({
        order_id: order_id,
        product_id: item.productId,
        product_name: item.name,
        product_code: item.code || '',
        quantity: item.quantity,
        price_per_unit: item.price,
        units_per_box: item.unitsPerBox || 1,
        subtotal: item.price * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);
      
      if (itemsError) throw itemsError;

      // Tentar enviar email, mas não bloquear o pedido se falhar
      try {
        await sendOrderEmails({
          orderId: order_id,
          customerName: createdOrderTyped.customer_name,
          customerEmail: createdOrderTyped.customer_email,
          totalAmount: createdOrderTyped.total_amount,
          currency: createdOrderTyped.currency,
          orderNumber: createdOrderTyped.order_number,
          items: items.map((item) => ({ name: item.name, quantity: item.quantity, price: item.price })),
          customerPhone: insertPayload.customer_phone,
          customerAddress: insertPayload.customer_address,
          notes: insertPayload.notes,
        });
      } catch (emailError: any) {
        console.error('⚠️ Erro ao enviar email:', emailError);
        console.error('⚠️ Detalhes do erro:', emailError?.message || emailError);
        // Não bloqueia o pedido se email falhar
      }
      
      setPaymentStatus("success");

      setTimeout(() => {
        clearCart();
        window.location.href = "/";
      }, 4000);
    } catch (err: any) {
      if (import.meta.env.DEV) {
        console.error("Erro ao criar encomenda:", err);
      }
      setError(err.message || t("checkout.errorCreatingOrder"));
      setPaymentStatus("error");
    }
  };

  if (statusLoading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center" role="status" aria-live="polite">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground mt-4">{t("checkout.verifyingStatus")}</p>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-muted-foreground mb-4">{t("checkout.loginRequired")}</p>
          <Button onClick={() => navigate("/auth")}>{t("checkout.goToLogin")}</Button>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (!isApproved) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <Header />
        <div className="container mx-auto px-4 py-20">
          <Card>
            <CardContent className="text-center">
              <h3 className="text-lg font-semibold mb-2">{t("checkout.awaitingApproval")}</h3>
              <p className="text-muted-foreground mb-4">{t("checkout.awaitingApprovalDescription")}</p>
              <div className="flex justify-center gap-2">
                <Button onClick={() => navigate('/')}>{t("checkout.backToHome")}</Button>
                <Button variant="outline" onClick={() => navigate('/account')}>{t("checkout.viewAccount")}</Button>
              </div>
            </CardContent>
          </Card>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (items.length === 0 && paymentStatus !== "success") {
    return (
      <div className="min-h-screen bg-background pb-20">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-muted-foreground mb-4">{t("checkout.emptyCart")}</p>
          <Button onClick={() => navigate("/cart")}>{t("checkout.backToCart")}</Button>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (!user && !guestSubmitted) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <Header />
        <div className="container mx-auto px-4 py-10">
          <Card>
            <CardHeader>
              <CardTitle>{t("checkout.guestCheckout")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-muted-foreground">{t("checkout.guestDescription")}</p>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm mb-1">{t("checkout.name")}</label>
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="w-full border rounded px-3 py-2"
                    placeholder={t("checkout.namePlaceholder")}
                  />
                </div>

                <div>
                  <label className="block text-sm mb-1">{t("auth.email")}</label>
                  <input
                    type="email"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    className="w-full border rounded px-3 py-2"
                    placeholder={t("checkout.emailPlaceholder")}
                  />
                </div>

                <div className="flex gap-2 mt-4">
                  <Button
                    className="flex-1"
                    onClick={() => {
                      if (!guestEmail || !guestName) {
                        setError(t("checkout.fillNameEmail"));
                        setPaymentStatus('error');
                        return;
                      }
                      setError(null);
                      setGuestSubmitted(true);
                    }}
                  >
                    {t("checkout.continueAsGuest")}
                  </Button>

                  <Button variant="ghost" onClick={() => navigate('/auth')}>
                    {t("checkout.doLogin")}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />

      <div className="bg-primary text-primary-foreground py-4 px-4 text-center">
        <h1 className="text-xl font-semibold">{t("checkout.title")}</h1>
      </div>

      <main className="container mx-auto px-4 py-6">
        {paymentStatus === "success" ? (
          <Card className="border-green-500 shadow-lg">
            <CardContent className="pt-10 pb-10">
              <div className="flex flex-col items-center gap-6 text-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping" />
                  <CheckCircle className="h-20 w-20 text-green-500 relative" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold text-green-600">
                    {t("checkout.thankYou")}
                  </h2>
                  <p className="text-xl text-muted-foreground">
                    {t("checkout.orderSuccess")}
                  </p>
                </div>
                <div className="bg-muted/50 p-6 rounded-lg w-full max-w-md space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {t("checkout.orderConfirmed")}
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    {t("checkout.emailSent")}
                  </p>
                </div>
                <div className="flex items-center gap-2 pt-4">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">
                    {t("checkout.redirecting")}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : paymentStatus === "error" ? (
          <Card className="border-red-500">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error || t("checkout.paymentError")}</AlertDescription>
                </Alert>
                <Button onClick={() => navigate("/cart")} className="w-full">
                  {t("checkout.backToCart")}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : NO_PAYMENT ? (
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm mb-1">{t("checkout.notes")}</label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full border rounded px-3 py-2"
                        placeholder={t("checkout.notesPlaceholder")}
                        rows={4}
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="block text-sm mb-1">{t("checkout.name")}</label>
                        <input
                          type="text"
                          value={guestName}
                          onChange={(e) => setGuestName(e.target.value)}
                          className="w-full border rounded px-3 py-2"
                          placeholder={t("checkout.customerNamePlaceholder")}
                          disabled={!profileLoaded}
                        />
                      </div>
                      <div>
                        <label className="block text-sm mb-1">{t("checkout.contact")}</label>
                        <input
                          type="text"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          className="w-full border rounded px-3 py-2"
                          placeholder={t("checkout.contactPlaceholder")}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm mb-1">{t("checkout.address")}</label>
                        <input
                          type="text"
                          value={customerAddress}
                          onChange={(e) => setCustomerAddress(e.target.value)}
                          className="w-full border rounded px-3 py-2"
                          placeholder={t("checkout.addressPlaceholder")}
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button className="flex-1" onClick={createOrderAndSend} disabled={isLoading}>
                        {isLoading ? t("checkout.processing") : t("checkout.confirmOrder")}
                      </Button>
                      <Button variant="outline" onClick={() => navigate('/cart')}>{t("checkout.back")}</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div>
              <Card>
                <CardHeader>
                  <CardTitle>{t("checkout.orderSummary")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>
                        {item.name} x{item.quantity}
                        {item.sellByBox && item.unitsInBox && (
                          <span className="text-muted-foreground ml-1">({item.unitsInBox} un/cx)</span>
                        )}
                      </span>
                      <span>{formatPrice(item.price * item.quantity)} CHF</span>
                    </div>
                  ))}
                  <div className="border-t pt-4">
                    <div className="flex justify-between font-bold">
                      <span>{t("checkout.total")}:</span>
                      <span>{formatPrice(totalAmount)} CHF</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">{t("checkout.processingOrder")}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
