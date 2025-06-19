import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  BarChart3, 
  ClipboardList, 
  Users, 
  Utensils, 
  Settings, 
  TrendingUp 
} from "lucide-react";

interface SidebarProps {
  currentSection: string;
}

export default function Sidebar({ currentSection }: SidebarProps) {
  const [location] = useLocation();

  const navItems = [
    {
      key: "overview",
      label: "Visão Geral",
      icon: TrendingUp,
      href: "/",
      badge: null,
    },
    {
      key: "orders",
      label: "Pedidos",
      icon: ClipboardList,
      href: "/orders",
      badge: null, // Could be dynamic based on pending orders
    },
    {
      key: "menu",
      label: "Cardápio",
      icon: Utensils,
      href: "/menu",
      badge: null,
    },
    {
      key: "customers",
      label: "Clientes",
      icon: Users,
      href: "/customers",
      badge: null,
    },
    {
      key: "reports",
      label: "Relatórios",
      icon: BarChart3,
      href: "/reports",
      badge: null,
    },
    {
      key: "settings",
      label: "Configurações",
      icon: Settings,
      href: "/settings",
      badge: null,
    },
  ];

  return (
    <div className="hidden md:flex md:w-64 md:flex-col">
      <div className="flex flex-col flex-grow pt-5 bg-white overflow-y-auto border-r border-gray-200">
        <div className="flex flex-col flex-grow">
          <nav className="flex-1 px-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentSection === item.key;
              
              return (
                <Link key={item.key} href={item.href}>
                  <a
                    className={cn(
                      "nav-item group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                      isActive
                        ? "text-red-600 bg-red-50"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    <Icon 
                      className={cn(
                        "mr-3 h-5 w-5",
                        isActive ? "text-red-500" : "text-gray-400"
                      )} 
                    />
                    {item.label}
                    {item.badge && (
                      <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-1">
                        {item.badge}
                      </span>
                    )}
                  </a>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}
