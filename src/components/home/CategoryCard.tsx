import { Card, CardContent } from "@/components/ui/card";
import { ShoppingBasket } from "lucide-react";

interface CategoryCardProps {
  name: string;
  onClick: () => void;
}

export const CategoryCard = ({ name, onClick }: CategoryCardProps) => {
  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-shadow border-primary/20"
      onClick={onClick}
    >
      <CardContent className="p-4 flex flex-col items-center justify-center min-h-[140px]">
        <div className="w-16 h-16 mb-3 bg-gradient-to-br from-primary/10 to-primary/20 rounded-full flex items-center justify-center">
          <ShoppingBasket className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-sm font-medium text-center leading-tight">
          {name}
        </h3>
      </CardContent>
    </Card>
  );
};
