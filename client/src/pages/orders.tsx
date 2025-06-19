import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/layout/navbar";
import Sidebar from "@/components/layout/sidebar";
import OrderCard from "@/components/orders/order-card";
import NewOrderModal from "@/components/orders/new-order-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Orders() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading } = useAuth();
  const [selectedTenant, setSelectedTenant] = useState<string>("");
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

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

  // Get orders
  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ["/api/tenants", selectedTenant, "orders", statusFilter],
    queryFn: async () => {
      let url = `/api/tenants/${selectedTenant}/orders`;
      if (statusFilter !== "all") {
        url += `?status=${statusFilter}`;
      }
      const response = await fetch(url, { credentials: "include" });
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
    enabled: !!selectedTenant,
  });

  // Update order status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      await apiRequest("PATCH", `/api/orders/${orderId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenants", selectedTenant, "orders"] });
      toast({
        title: "Status atualizado",
        description: "Status do pedido foi atualizado com sucesso.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Não autorizado",
          description: "Você foi desconectado. Redirecionando...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 1000);
        return;
      }
      toast({
        title: "Erro",
        description: "Falha ao atualizar status do pedido.",
        variant: "destructive",
      });
    },
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

  const handleStatusUpdate = (orderId: string, status: string) => {
    updateStatusMutation.mutate({ orderId, status });
  };

  const filteredOrders = orders?.filter((order: any) => {
    if (searchQuery) {
      return (
        order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customerId.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return true;
  }) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar 
        tenants={tenants || []} 
        selectedTenant={selectedTenant} 
        onTenantChange={setSelectedTenant} 
      />
      
      <div className="flex">
        <Sidebar currentSection="orders" />
        
        <div className="flex-1 overflow-auto">
          <div className="px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Gerenciamento de Pedidos</h1>
                <p className="text-gray-600">Gerencie todos os pedidos da sua pizzaria</p>
              </div>
              <Button
                onClick={() => setShowNewOrderModal(true)}
                className="bg-red-600 hover:bg-red-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Pedido
              </Button>
            </div>

            {/* Filters */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="status-filter">Status</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger id="status-filter">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="preparing">Em preparo</SelectItem>
                        <SelectItem value="ready">Pronto</SelectItem>
                        <SelectItem value="delivering">Saiu p/ entrega</SelectItem>
                        <SelectItem value="delivered">Entregue</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="date-filter">Data</Label>
                    <Input
                      id="date-filter"
                      type="date"
                      className="w-full"
                    />
                  </div>
                  <div>
                    <Label htmlFor="search">Buscar</Label>
                    <Input
                      id="search"
                      placeholder="Buscar pedido..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button variant="outline" className="w-full">
                      <Search className="h-4 w-4 mr-2" />
                      Filtrar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Orders List */}
            <div className="space-y-4">
              {ordersLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Carregando pedidos...</p>
                </div>
              ) : filteredOrders.length > 0 ? (
                filteredOrders.map((order: any) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onStatusUpdate={handleStatusUpdate}
                  />
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">Nenhum pedido encontrado</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* New Order Modal */}
      <NewOrderModal
        isOpen={showNewOrderModal}
        onClose={() => setShowNewOrderModal(false)}
        tenantId={selectedTenant}
      />
    </div>
  );
}
