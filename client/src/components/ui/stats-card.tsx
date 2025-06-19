import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

export default function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  iconColor = "text-blue-600",
  iconBg = "bg-blue-100",
  trend 
}: StatsCardProps) {
  return (
    <Card className="bg-white">
      <CardContent className="p-6">
        <div className="flex items-center">
          <div className={cn("p-2 rounded-lg", iconBg)}>
            <Icon className={cn("h-6 w-6", iconColor)} />
          </div>
          <div className="ml-4 flex-1">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <div className="flex items-center">
              <p className="text-2xl font-semibold text-gray-900">{value}</p>
              {trend && (
                <span className={cn(
                  "ml-2 text-sm font-medium",
                  trend.isPositive ? "text-green-600" : "text-red-600"
                )}>
                  {trend.isPositive ? "+" : ""}{trend.value}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
