import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Download, Smartphone, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTranslation } from "react-i18next";

const AppBuild = () => {
  const navigate = useNavigate();
  const { isAdmin, isLoading } = useAuth();
  const { t } = useTranslation();

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      navigate("/");
    }
  }, [isAdmin, isLoading, navigate]);

  if (isLoading) return <div>{t("common.loading")}</div>;
  if (!isAdmin) return null;

  const handleDownloadConfig = () => {
    const configContent = `import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.75d1c5687eea4a3a91e14812d357371f',
  appName: 'AUREN',
  webDir: 'dist',
  server: {
    url: 'https://75d1c568-7eea-4a3a-91e1-4812d357371f.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystorePassword: undefined,
      keystoreAlias: undefined,
      keystoreAliasPassword: undefined,
      releaseType: 'APK'
    }
  }
};

export default config;`;

    const blob = new Blob([configContent], { type: "text/typescript" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "capacitor.config.ts";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="bg-primary text-primary-foreground py-4 px-4">
        <div className="container mx-auto flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/admin")}
            className="text-primary-foreground hover:bg-primary-foreground/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">{t("appBuild.title")}</h1>
        </div>
      </div>

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {t("appBuild.requirements")}
          </AlertDescription>
        </Alert>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                {t("appBuild.projectConfig")}
              </CardTitle>
              <CardDescription>
                {t("appBuild.downloadDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleDownloadConfig} className="w-full">
                <Download className="mr-2 h-4 w-4" />
                {t("appBuild.downloadConfig")}
              </Button>
              <p className="text-sm text-muted-foreground mt-4">
                {t("appBuild.configNote")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("appBuild.stepByStep")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold">{t("appBuild.step1Title")}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("appBuild.step1Description")}
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">{t("appBuild.step2Title")}</h3>
                <code className="block bg-muted p-3 rounded text-sm">
                  git clone [seu-repositorio-github]<br/>
                  cd [nome-do-projeto]
                </code>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">{t("appBuild.step3Title")}</h3>
                <code className="block bg-muted p-3 rounded text-sm">
                  npm install
                </code>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">{t("appBuild.step4Title")}</h3>
                <code className="block bg-muted p-3 rounded text-sm">
                  npm install -D @capacitor/cli<br/>
                  npm install @capacitor/core @capacitor/android
                </code>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">{t("appBuild.step5Title")}</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  {t("appBuild.step5Description")}
                </p>
                <code className="block bg-muted p-3 rounded text-sm">
                  npx cap add android<br/>
                  npx cap update android
                </code>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">{t("appBuild.step6Title")}</h3>
                <code className="block bg-muted p-3 rounded text-sm">
                  npm run build<br/>
                  npx cap sync android
                </code>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">{t("appBuild.step7Title")}</h3>
                <code className="block bg-muted p-3 rounded text-sm">
                  npx cap open android
                </code>
                <p className="text-sm text-muted-foreground mt-2">
                  {t("appBuild.step7Description")}
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">{t("appBuild.step8Title")}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("appBuild.step8Description")} <code className="bg-muted px-2 py-1 rounded">android/app/build/outputs/apk/debug/app-debug.apk</code>
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("appBuild.systemRequirements")}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>{t("appBuild.reqNode")}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>{t("appBuild.reqAndroidStudio")}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>{t("appBuild.reqJava")}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>{t("appBuild.reqAndroidSdk")}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>{t("appBuild.reqEnvVars")}</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("appBuild.additionalResources")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <a 
                  href="https://capacitorjs.com/docs/android" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block text-primary hover:underline"
                >
                  → {t("appBuild.linkCapacitor")}
                </a>
                <a 
                  href="https://developer.android.com/studio/install" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block text-primary hover:underline"
                >
                  → {t("appBuild.linkAndroidStudio")}
                </a>
                <a 
                  href="https://developer.android.com/studio/publish/app-signing" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block text-primary hover:underline"
                >
                  → {t("appBuild.linkSignApk")}
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AppBuild;
