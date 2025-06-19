import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/layout/navbar";
import Sidebar from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BarChart3, TrendingUp } from "lucide-react";

export default function Reports() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [selectedTenant, setSelectedTenant] = useState<string>("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

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

  // Set default date range (last 30 days)
  useEffect(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    setEndDate(today.toISOString().split('T')[0]);
    setStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
  }, []);

  // Get analytics stats
  const { data: stats } = useQuery({
    queryKey: ["/api/tenants", selectedTenant, "analytics", "stats", startDate, endDate],
    queryFn: async () => {
      let url = `/api/tenants/${selectedTenant}/analytics/stats`;
      if (startDate && endDate) {
        url += `?startDate=${startDate}&endDate=${endDate}`;
      }
      const response = await fetch(url, { credentials: "include" });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
    enabled: !!selectedTenant && !!startDate && !!endDate,
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

  const formatCurrency = (value: string | number) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(numValue);
  };

  const popularItems = [
    { name: "Pizza Margherita", sales: 147 },
    { name: "Pizza Calabresa", sales: 132 },
    { name: "Pizza Portuguesa", sales: 98 },
    { name: "Coca-Cola 2L", sales: 89 },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar 
        tenants={tenants || []} 
        selectedTenant={selectedTenant} 
        onTenantChange={setSelectedTenant} 
      />
      
      <div className="flex">
        <Sidebar currentSection="reports" />
        
        <div className="flex-1 overflow-auto">
          <div className="px-4 sm:px-6 lg:px-8 py-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Relatórios e Análises</h1>
              <p className="text-gray-600">Insights sobre o desempenho da sua pizzaria</p>
            </div>

            {/* Date Range Filter */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                  <div>
                    <Label htmlFor="start-date">Data Início</Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="end-date">Data Fim</Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                  <Button className="bg-red-600 hover:bg-red-700">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Gerar Relatório
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Sales Chart Placeholder */}
              <Card>
                <CardHeader>
                  <CardTitle>Vendas no Período</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <BarChart3 className="h-16 w-16 mx-auto mb-4" />
                      <p className="font-medium">Gráfico de Vendas</p>
                      <p className="text-sm">(Integração com biblioteca de gráficos)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Popular Items */}
              <Card>
                <CardHeader>
                  <CardTitle>Itens Mais Vendidos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {popularItems.map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          <span className="text-sm font-medium text-gray-900">{item.name}</span>
                        </div>
                        <span className="text-sm text-gray-600">{item.sales} vendas</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Resumo do Período</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total de Pedidos:</span>
                      <span className="font-semibold">{stats?.totalOrders || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Receita Total:</span>
                      <span className="font-semibold">{formatCurrency(stats?.totalRevenue || "0")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ticket Médio:</span>
                      <span className="font-semibold">{formatCurrency(stats?.averageOrderValue || "0")}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tempo Médio Entrega:</span>
                      <span className="font-semibold">{Math.round(stats?.averageDeliveryTime || 0)} min</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Taxa de Cancelamento:</span>
                      <span className="font-semibold">2.1%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Satisfação:</span>
                      <span className="font-semibold">4.8/5</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Crescimento</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Vs. Período Anterior:</span>
                      <div className="flex items-center text-green-600">
                        <TrendingUp className="h-4 w-4 mr-1" />
                        <span className="font-semibold">+12.5%</span>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Novos Clientes:</span>
                      <span className="font-semibold">47</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Clientes Recorrentes:</span>
                      <span className="font-semibold">78%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
