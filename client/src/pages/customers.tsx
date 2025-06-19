import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/layout/navbar";
import Sidebar from "@/components/layout/sidebar";
import CustomerHistoryModal from "@/components/customers/customer-history-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, Search, Eye, Edit, Trash } from "lucide-react";

export default function Customers() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [selectedTenant, setSelectedTenant] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

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

  // Get customers
  const { data: customers, isLoading: customersLoading } = useQuery({
    queryKey: ["/api/tenants", selectedTenant, "customers", searchQuery],
    queryFn: async () => {
      let url = `/api/tenants/${selectedTenant}/customers`;
      if (searchQuery) {
        url += `?search=${encodeURIComponent(searchQuery)}`;
      }
      const response = await fetch(url, { credentials: "include" });
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

  const handleViewHistory = (customer: any) => {
    setSelectedCustomer(customer);
    setShowHistoryModal(true);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const formatCurrency = (value: string | number) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(numValue);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      month: 'short',
      year: 'numeric',
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
        <Sidebar currentSection="customers" />
        
        <div className="flex-1 overflow-auto">
          <div className="px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Gerenciamento de Clientes</h1>
                <p className="text-gray-600">Visualize e gerencie seus clientes</p>
              </div>
              <Button className="bg-red-600 hover:bg-red-700">
                <Plus className="h-4 w-4 mr-2" />
                Novo Cliente
              </Button>
            </div>

            {/* Search */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Buscar por nome, telefone ou email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Button variant="outline">
                    <Search className="h-4 w-4 mr-2" />
                    Buscar
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Customers Table */}
            <Card>
              <CardContent>
                {customersLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Carregando clientes...</p>
                  </div>
                ) : customers && customers.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Contato</TableHead>
                        <TableHead>Endereço</TableHead>
                        <TableHead>Pedidos</TableHead>
                        <TableHead>Total Gasto</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customers.map((customer: any) => (
                        <TableRow key={customer.id} className="hover:bg-gray-50">
                          <TableCell>
                            <div className="flex items-center">
                              <Avatar className="h-10 w-10">
                                <AvatarFallback className="bg-red-100 text-red-700">
                                  {getInitials(customer.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                                <div className="text-sm text-gray-500">
                                  Cliente desde {formatDate(customer.createdAt)}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">
                            <div>{customer.phone}</div>
                            {customer.email && <div>{customer.email}</div>}
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {customer.addresses && customer.addresses.length > 0 ? (
                              <div>
                                <div>{customer.addresses[0].street}</div>
                                <div>{customer.addresses[0].neighborhood}, {customer.addresses[0].city}</div>
                              </div>
                            ) : (
                              <span className="text-gray-400">Sem endereço</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">
                            <span className="font-medium">{customer.totalOrders}</span> pedidos
                          </TableCell>
                          <TableCell className="text-sm font-medium text-gray-900">
                            {formatCurrency(customer.totalSpent)}
                          </TableCell>
                          <TableCell className="text-sm font-medium">
                            <div className="flex space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewHistory(customer)}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-indigo-600 hover:text-indigo-800"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Nenhum cliente encontrado</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Customer History Modal */}
      <CustomerHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        customer={selectedCustomer}
      />
    </div>
  );
}
