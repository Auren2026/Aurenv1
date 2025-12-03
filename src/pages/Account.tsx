import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, Mail, Phone, MapPin, Building2, FileText, ShoppingBag, LogOut, Loader2, Shield, LucideIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { ReactNode } from "react";

interface CustomerProfile {
  full_name: string | null;
  phone: string | null;
  address: string | null;
  nif: string | null;
  community: string | null;
  status: string;
}

interface ProfileFieldProps {
  icon: LucideIcon;
  label: string;
  value: string | null | undefined;
  fallbackText: string;
}

const ProfileField = ({ icon: Icon, label, value, fallbackText }: ProfileFieldProps) => {
  return (
    <div className="flex items-start gap-3">
      <Icon className="h-5 w-5 text-muted-foreground mt-0.5" aria-hidden="true" />
      <div className="flex-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-medium">{value || fallbackText}</p>
      </div>
    </div>
  );
};

interface AccountLayoutProps {
  children: ReactNode;
  title: string;
}

const AccountLayout = ({ children, title }: AccountLayoutProps) => (
  <div className="min-h-screen bg-background flex flex-col">
    <Header />
    <div className="bg-primary text-primary-foreground py-6 px-4 text-center safe-area-inset-top">
      <h1 className="text-2xl font-bold">{title}</h1>
    </div>
    {children}
    <BottomNav />
  </div>
);

const STATUS_BADGE_MAP: Record<string, { variant: string; className?: string; labelKey: string }> = {
  approved: { variant: "default", className: "bg-green-500 hover:bg-green-600", labelKey: "account.statusApproved" },
  pending: { variant: "secondary", labelKey: "account.statusPending" },
  inactive: { variant: "outline", labelKey: "account.statusInactive" },
  blocked: { variant: "destructive", labelKey: "account.statusBlocked" },
};

const Account = () => {
  const { t } = useTranslation();
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["customer-profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from("customer_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      
      if (error) throw error;
      return data as CustomerProfile;
    },
    enabled: !!user,
  });

  const { data: ordersCount } = useQuery({
    queryKey: ["orders-count", user?.id],
    queryFn: async () => {
      if (!user) return 0;
      
      const { count, error } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
      
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user,
  });

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const getStatusBadge = (status: string) => {
    const config = STATUS_BADGE_MAP[status] || STATUS_BADGE_MAP.pending;
    return (
      <Badge variant={config.variant as any} className={config.className}>
        {t(config.labelKey)}
      </Badge>
    );
  };

  if (!user) {
    return (
      <AccountLayout title={t("account.title")}>
        <main className="flex-1 flex items-center justify-center px-4 py-8 pb-24">
          <div className="w-full max-w-md mx-auto text-center space-y-6">
            <Card>
              <CardContent className="p-8 space-y-6">
                <div className="space-y-2">
                  <h2 className="text-lg font-semibold text-foreground">
                    {t("account.title")}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {t("account.loginRequired")}
                  </p>
                </div>
                <Button 
                  size="lg" 
                  className="w-full"
                  onClick={() => navigate("/auth")}
                >
                  {t("account.loginRegister")}
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </AccountLayout>
    );
  }

  if (isLoading) {
    return (
      <AccountLayout title={t("account.title")}>
        <main className="flex-1 flex items-center justify-center px-4 py-8 pb-24" role="status" aria-live="polite">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="sr-only">{t("common.loading")}</span>
          </div>
        </main>
      </AccountLayout>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <div className="bg-primary text-primary-foreground py-6 px-4 text-center safe-area-inset-top">
        <h1 className="text-2xl font-bold">{t("account.title")}</h1>
      </div>

      <main className="flex-1 px-4 py-6 pb-24 max-w-2xl mx-auto w-full">
        <div className="space-y-4">
          {/* Card de Informações do Usuário */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {t("account.profile")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ProfileField 
                icon={User} 
                label={t("account.name")} 
                value={profile?.full_name}
                fallbackText={t("common.notInformed")}
              />
              <Separator />
              
              <ProfileField 
                icon={Mail} 
                label={t("account.email")} 
                value={user.email}
                fallbackText={t("common.notInformed")}
              />
              <Separator />
              
              <ProfileField 
                icon={Phone} 
                label={t("account.phone")} 
                value={profile?.phone}
                fallbackText={t("common.notInformed")}
              />
              <Separator />
              
              <ProfileField 
                icon={MapPin} 
                label={t("account.address")} 
                value={profile?.address}
                fallbackText={t("common.notInformed")}
              />
              <Separator />
              
              <ProfileField 
                icon={FileText} 
                label={t("account.nif")} 
                value={profile?.nif}
                fallbackText={t("common.notInformed")}
              />

              {profile?.community && (
                <>
                  <Separator />
                  <ProfileField 
                    icon={Building2} 
                    label={t("account.business")} 
                    value={profile.community}
                    fallbackText={t("common.notInformed")}
                  />
                </>
              )}

              <Separator />

              {/* Status */}
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-muted-foreground mt-0.5" aria-hidden="true" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">{t("account.accountStatus")}</p>
                  <div className="mt-1">{getStatusBadge(profile?.status || "pending")}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card de Estatísticas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5" />
                {t("account.myOrders")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground">{t("account.totalOrders")}</p>
                <p className="text-2xl font-bold text-primary">{ordersCount || 0}</p>
              </div>
              {ordersCount && ordersCount > 0 && (
                <Button 
                  variant="outline" 
                  className="w-full mt-4"
                  onClick={() => navigate("/orders")}
                >
                  {t("account.viewOrders")}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Se for admin */}
          {isAdmin && (
            <Card className="border-primary">
              <CardContent className="p-4">
                <Button 
                  variant="default" 
                  className="w-full"
                  onClick={() => navigate("/admin")}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  {t("account.adminPanel")}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Botão de Sair */}
          <Button 
            variant="destructive" 
            className="w-full"
            onClick={handleSignOut}
            aria-label={t("account.signOut")}
          >
            <LogOut className="h-4 w-4 mr-2" aria-hidden="true" />
            {t("account.signOut")}
          </Button>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Account;
