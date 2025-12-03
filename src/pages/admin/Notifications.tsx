import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Send, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export default function AdminNotifications() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [userId, setUserId] = useState("");
  const [sending, setSending] = useState(false);

  const { data: tokensCount } = useQuery({
    queryKey: ["push-tokens-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("push_tokens")
        .select("*", { count: "exact", head: true });
      
      if (error) throw error;
      return count || 0;
    },
  });

  const sendNotification = async (broadcast: boolean) => {
    if (!title || !body) {
      toast({
        title: t("notifications.errorTitle"),
        description: t("notifications.titleBodyRequired"),
        variant: "destructive",
      });
      return;
    }

    if (!broadcast && !userId) {
      toast({
        title: t("notifications.errorTitle"),
        description: t("notifications.userIdRequired"),
        variant: "destructive",
      });
      return;
    }

    setSending(true);

    try {
      const { data, error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          title,
          body,
          userId: broadcast ? undefined : userId,
          broadcast,
          data: {
            timestamp: new Date().toISOString(),
          },
        },
      });

      if (error) throw error;

      toast({
        title: t("notifications.success"),
        description: t("notifications.notificationSent", { count: data.sent }),
      });

      setTitle("");
      setBody("");
      setUserId("");
    } catch (error: any) {
      console.error('Error sending notification:', error);
      toast({
        title: t("notifications.errorSending"),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/50 pb-6">
      <header className="bg-primary text-primary-foreground p-4 sticky top-0 z-50 safe-area-inset-top">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/admin")}
              className="text-primary-foreground hover:bg-primary-foreground/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">{t("notifications.pushNotifications")}</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-6 max-w-2xl">
        <Card className="mb-4">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t("notifications.devicesRegistered")}</p>
                <p className="text-2xl font-bold">{tokensCount ?? "..."}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("notifications.sendNotification")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">{t("notifications.titleRequired")}</Label>
              <Input
                id="title"
                placeholder={t("notifications.titlePlaceholder")}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="body">{t("notifications.messageRequired")}</Label>
              <Textarea
                id="body"
                placeholder={t("notifications.messagePlaceholder")}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="userId">{t("notifications.userId")}</Label>
              <Input
                id="userId"
                placeholder={t("notifications.userIdPlaceholder")}
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                {t("notifications.leaveEmptyBroadcast")}
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => sendNotification(false)}
                disabled={sending || !userId}
                className="flex-1"
              >
                <Send className="h-4 w-4 mr-2" />
                {t("notifications.sendIndividual")}
              </Button>

              <Button
                onClick={() => sendNotification(true)}
                disabled={sending}
                variant="secondary"
                className="flex-1"
              >
                <Users className="h-4 w-4 mr-2" />
                {t("notifications.sendToAll")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
