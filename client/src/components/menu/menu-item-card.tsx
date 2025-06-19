import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2 } from "lucide-react";

interface MenuItemCardProps {
  item: any;
  onEdit: () => void;
  onDelete: () => void;
}

export default function MenuItemCard({ item, onEdit, onDelete }: MenuItemCardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getPriceDisplay = () => {
    const prices = item.prices;
    if (!prices) return "Preço não definido";
    
    const priceEntries = Object.entries(prices);
    if (priceEntries.length === 1) {
      return formatCurrency(priceEntries[0][1] as number);
    }
    
    return priceEntries
      .map(([size, price]) => `${size}: ${formatCurrency(price as number)}`)
      .join(" | ");
  };

  return (
    <Card className="p-3 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 flex-1">
          {item.imageUrl && (
            <img 
              src={item.imageUrl} 
              alt={item.name}
              className="w-12 h-12 rounded-lg object-cover"
              onError={(e) => {
                // Fallback to a placeholder if image fails to load
                e.currentTarget.style.display = 'none';
              }}
            />
          )}
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <p className="font-medium text-gray-900">{item.name}</p>
              {!item.isAvailable && (
                <Badge variant="secondary" className="text-xs">
                  Indisponível
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-600">{getPriceDisplay()}</p>
            {item.description && (
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                {item.description}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="text-red-600 hover:text-red-800 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
