import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Lock, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

interface StatusMessageProps {
  status: 'pending' | 'inactive' | 'blocked';
}

export const StatusMessage = ({ status }: StatusMessageProps) => {
  const { t } = useTranslation();

  const messages = {
    pending: {
      title: t("statusMessage.pendingTitle"),
      description: t("statusMessage.pendingDescription"),
      icon: AlertCircle,
      variant: "default" as const
    },
    inactive: {
      title: t("statusMessage.inactiveTitle"),
      description: t("statusMessage.inactiveDescription"),
      icon: XCircle,
      variant: "destructive" as const
    },
    blocked: {
      title: t("statusMessage.blockedTitle"),
      description: t("statusMessage.blockedDescription"),
      icon: Lock,
      variant: "destructive" as const
    }
  };

  const message = messages[status];
  const Icon = message.icon;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/50">
      <Alert variant={message.variant} className="max-w-md">
        <Icon className="h-4 w-4" />
        <AlertTitle>{message.title}</AlertTitle>
        <AlertDescription>{message.description}</AlertDescription>
      </Alert>
    </div>
  );
};
