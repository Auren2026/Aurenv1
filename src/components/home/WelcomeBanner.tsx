import { useTranslation } from "react-i18next";
import aurenLogo from "@/assets/logoAuren.png";

export const WelcomeBanner = () => {
  const { t } = useTranslation();
  
  return (
    <>
      <div className="bg-primary text-primary-foreground py-5 px-4">
        <div className="container mx-auto flex items-center justify-center gap-3">
          <img 
            src={aurenLogo} 
            alt="AUREN Logo" 
            className="h-10 w-30 object-contain"
          />
        </div>
      </div>
      <div className="h-0.5 bg-white"></div>
    </>
  );
};
