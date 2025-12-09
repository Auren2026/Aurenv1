import { Card, CardContent } from "@/components/ui/card";

interface CategoryCardProps {
  name: string;
  iconEmoji?: string;
  onClick: () => void;
}

export const CategoryCard = ({ name, iconEmoji = "🛒", onClick }: CategoryCardProps) => {
  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-shadow border-primary/20 h-full"
      onClick={onClick}
    >
      <CardContent className="p-3 sm:p-4 flex flex-col items-center justify-center min-h-[130px] sm:min-h-[140px]">
        <div className="w-12 h-12 sm:w-16 sm:h-16 mb-2 sm:mb-3 bg-gradient-to-br from-primary/10 to-primary/20 rounded-full flex items-center justify-center">
          <span className="text-3xl sm:text-4xl" role="img" aria-label={name}>{iconEmoji}</span>
        </div>
        <h3 className="text-xs sm:text-sm font-medium text-center leading-tight break-words w-full px-1">
          {name}
        </h3>
      </CardContent>
    </Card>
  );
};
