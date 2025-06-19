import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/layout/navbar";
import Sidebar from "@/components/layout/sidebar";
import StatsCard from "@/components/ui/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, DollarSign, Clock, Users } from "lucide-react";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [selectedTenant, setSelectedTenant] = useState<string>("");

  // Get user's tenants
  const { data: tenants } = useQuery({
    queryKey: ["/api/tenants"],
    enabled: isAuthenticated && !isLoading,
  });

  // Set first tenant as default
  useEffect(() => {
    if (tenants && tenants.length > 0 && !selectedTenant) {
      setSelectedTenant(tenants[0].id);
    }
  }, [tenants, selectedTenant]);

  // Get recent orders
  const { data: recentOrders } = useQuery({
    queryKey: ["/api/tenants", selectedTenant, "orders"],
    queryFn: async () => {
      const response = await fetch(`/api/tenants/${selectedTenant}/orders?limit=5`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
    enabled: !!selectedTenant,
  });

  // Get analytics stats
  const { data: stats } = useQuery({
    queryKey: ["/api/tenants", selectedTenant, "analytics", "stats"],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const response = await fetch(`/api/tenants/${selectedTenant}/analytics/stats?startDate=${today.toISOString()}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
    enabled: !!selectedTenant,
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Não autorizado",
        description: "Você precisa fazer login para acessar esta página.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 1000);
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: { label: "Pendente", variant: "secondary" as const },
      preparing: { label: "Em preparo", variant: "default" as const },
      ready: { label: "Pronto", variant: "outline" as const },
      delivering: { label: "Saiu p/ entrega", variant: "outline" as const },
      delivered: { label: "Entregue", variant: "default" as const },
      cancelled: { label: "Cancelado", variant: "destructive" as const },
    };
    const statusInfo = statusMap[status as keyof typeof statusMap] || { label: status, variant: "secondary" as const };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const formatCurrency = (value: string | number) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(numValue);
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar 
        tenants={tenants || []} 
        selectedTenant={selectedTenant} 
        onTenantChange={setSelectedTenant} 
      />
      
      <div className="flex">
        <Sidebar currentSection="overview" />
        
        <div className="flex-1 overflow-auto">
          <div className="px-4 sm:px-6 lg:px-8 py-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Visão Geral</h1>
              <p className="text-gray-600">
                Dashboard {tenants?.find(t => t.id === selectedTenant)?.name || ""}
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatsCard
                title="Pedidos Hoje"
                value={stats?.totalOrders?.toString() || "0"}
                icon={ShoppingCart}
                iconColor="text-green-600"
                iconBg="bg-green-100"
              />
              <StatsCard
                title="Receita Hoje"
                value={formatCurrency(stats?.totalRevenue || "0")}
                icon={DollarSign}
                iconColor="text-blue-600"
                iconBg="bg-blue-100"
              />
              <StatsCard
                title="Tempo Médio"
                value={`${Math.round(stats?.averageDeliveryTime || 0)}min`}
                icon={Clock}
                iconColor="text-yellow-600"
                iconBg="bg-yellow-100"
              />
              <StatsCard
                title="Ticket Médio"
                value={formatCurrency(stats?.averageOrderValue || "0")}
                icon={Users}
                iconColor="text-purple-600"
                iconBg="bg-purple-100"
              />
            </div>

            {/* Recent Orders */}
            <Card>
              <CardHeader>
                <CardTitle>Pedidos Recentes</CardTitle>
              </CardHeader>
              <CardContent>
                {recentOrders && recentOrders.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Pedido</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Horário</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentOrders.map((order: any) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">{order.orderNumber}</TableCell>
                          <TableCell>Cliente #{order.customerId.slice(-6)}</TableCell>
                          <TableCell>{getStatusBadge(order.status)}</TableCell>
                          <TableCell>{formatCurrency(order.total)}</TableCell>
                          <TableCell>{formatTime(order.createdAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Nenhum pedido encontrado</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
