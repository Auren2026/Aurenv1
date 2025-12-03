import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export default function Auth() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [nif, setNif] = useState("");
  const [community, setCommunity] = useState("");

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/");
      }
    };
    checkUser();
  }, [navigate]);

  // Preferência para alemão na tela de login
  useEffect(() => {
    if (i18n.language !== "de") {
      i18n.changeLanguage("de");
    }
  }, [i18n]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            name: name,
          }
        }
      });

      if (authError) throw authError;

      // Verificar se o usuário foi realmente criado
      if (authData.user && authData.user.id) {
        // Tentar criar o perfil do cliente
        const { error: profileError } = await supabase
          .from('customer_profiles')
          .insert({
            user_id: authData.user.id,
            full_name: name,
            phone,
            address,
            nif: nif || null,
            community,
            status: 'pending'
          });

        if (profileError) {
          console.error('❌ Erro ao criar perfil:', profileError);
          throw new Error(`Erro ao criar perfil: ${profileError.message}`);
        }
      } else {
        throw new Error('Usuário não foi criado corretamente');
      }

      toast.success(t("auth.accountCreated"));
      setEmail("");
      setPassword("");
      setName("");
      setPhone("");
      setAddress("");
      setNif("");
      setCommunity("");
    } catch (error: any) {
      console.error('❌ Erro no cadastro:', error);
      toast.error(error.message || t("auth.errorCreatingAccount"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast.success(t("auth.loginSuccess"));
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || t("auth.errorLogin"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">{t("header.appName")}</CardTitle>
          <CardDescription className="text-center">
            {t("auth.signIn")} / {t("auth.signUp")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">{t("auth.signIn")}</TabsTrigger>
              <TabsTrigger value="signup">{t("auth.signUp")}</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">{t("auth.email")}</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder={t("auth.emailPlaceholder")}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">{t("auth.password")}</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? `${t("common.loading")}...` : t("auth.signIn")}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">{t("auth.fullName")}</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder={t("auth.fullNamePlaceholder")}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">{t("auth.email")}</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder={t("auth.emailPlaceholder")}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-phone">{t("auth.phone")}</Label>
                  <Input
                    id="signup-phone"
                    type="tel"
                    placeholder={t("auth.phonePlaceholder")}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-address">{t("auth.address")}</Label>
                  <Input
                    id="signup-address"
                    type="text"
                    placeholder={t("auth.addressPlaceholder")}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-nif">{t("auth.nif")} ({t("common.optional")})</Label>
                  <Input
                    id="signup-nif"
                    type="text"
                    placeholder={t("auth.nifPlaceholder")}
                    value={nif}
                    onChange={(e) => setNif(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-community">{t("auth.business")}</Label>
                  <Input
                    id="signup-community"
                    type="text"
                    placeholder={t("auth.businessPlaceholder")}
                    value={community}
                    onChange={(e) => setCommunity(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">{t("auth.password")}</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? `${t("common.loading")}...` : t("auth.signUp")}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
