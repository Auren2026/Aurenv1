import { Gift, ShoppingCart, User, Heart } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useCart } from "@/hooks/use-cart";
import { useTranslation } from "react-i18next";

export const BottomNav = () => {
  const { totalItems } = useCart();
  const { t } = useTranslation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border safe-area-inset-bottom">
      <div className="w-full max-w-screen-xl mx-auto">
        <div className="grid grid-cols-4">
          <NavLink
            to="/"
            className="flex flex-col items-center justify-center py-3 text-muted-foreground hover:text-primary transition-colors min-h-[60px]"
            activeClassName="text-primary"
          >
            <Gift className="h-6 w-6 mb-1" />
            <span className="text-xs font-medium">{t("bottomNav.home")}</span>
          </NavLink>

          <NavLink
            to="/cart"
            className="flex flex-col items-center justify-center py-3 text-muted-foreground hover:text-primary transition-colors relative min-h-[60px]"
            activeClassName="text-primary"
          >
            <ShoppingCart className="h-6 w-6 mb-1" />
            {totalItems > 0 && (
              <span className="absolute top-2 right-[calc(50%-10px)] bg-primary text-primary-foreground text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center font-semibold px-1">
                {totalItems > 99 ? '99+' : totalItems}
              </span>
            )}
            <span className="text-xs font-medium">{t("bottomNav.cart")}</span>
          </NavLink>

          <NavLink
            to="/favorites"
            className="flex flex-col items-center justify-center py-3 text-muted-foreground hover:text-primary transition-colors min-h-[60px]"
            activeClassName="text-primary"
          >
            <Heart className="h-6 w-6 mb-1" />
            <span className="text-xs font-medium">{t("bottomNav.favorites")}</span>
          </NavLink>

          <NavLink
            to="/account"
            className="flex flex-col items-center justify-center py-3 text-muted-foreground hover:text-primary transition-colors min-h-[60px]"
            activeClassName="text-primary"
          >
            <User className="h-6 w-6 mb-1" />
            <span className="text-xs font-medium">{t("bottomNav.account")}</span>
          </NavLink>
        </div>
      </div>
    </nav>
  );
};
