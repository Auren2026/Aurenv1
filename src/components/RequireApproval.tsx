import { useAuth } from "@/hooks/use-auth";
import { useCustomerStatus } from "@/hooks/use-customer-status";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

export function RequireApproval({ children }: { children: JSX.Element }) {
  const { user, isLoading } = useAuth();
  const { status, isLoading: statusLoading } = useCustomerStatus();
  const location = useLocation();
  const { t } = useTranslation();

  // Debug logging
  console.log('🔍 RequireApproval:', {
    user: user?.id,
    status,
    isLoading,
    statusLoading,
    location: location.pathname
  });

  if (isLoading || statusLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    console.log('❌ RequireApproval: Usuário não autenticado, redirecionando para /auth');
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (status === "pending") {
    console.log('⏳ RequireApproval: Status pending, mostrando tela de espera');
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-lg font-semibold text-center mb-2">
          {t("approval.pending")}
        </p>
        <p className="text-sm text-muted-foreground text-center">
          Status atual: {status} | User ID: {user.id}
        </p>
      </div>
    );
  }

  if (status === "blocked" || status === "inactive") {
    console.log('🚫 RequireApproval: Usuário bloqueado/inativo');
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-lg font-semibold text-center text-red-600">
          {t("approval.blocked")}
        </p>
      </div>
    );
  }

  if (status !== "approved") {
    console.log('❌ RequireApproval: Status não aprovado:', status);
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  console.log('✅ RequireApproval: Usuário aprovado, renderizando conteúdo');
  return children;
}
