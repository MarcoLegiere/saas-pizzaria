import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/layout/navbar";
import Sidebar from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Save, CreditCard, Banknote, Smartphone } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Settings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
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

  // Get current tenant data
  const { data: currentTenant } = useQuery({
    queryKey: ["/api/tenants", selectedTenant],
    queryFn: async () => {
      const tenant = tenants?.find(t => t.id === selectedTenant);
      return tenant;
    },
    enabled: !!selectedTenant && !!tenants,
  });

  // Form states
  const [tenantInfo, setTenantInfo] = useState({
    name: "",
    phone: "",
    address: "",
  });

  const [deliverySettings, setDeliverySettings] = useState({
    deliveryFee: "",
    avgDeliveryTime: "",
    deliveryRadius: "",
    minOrderValue: "",
  });

  const [operatingHours, setOperatingHours] = useState({
    openTime: "",
    closeTime: "",
    operatingDays: [] as string[],
  });

  const [paymentMethods, setPaymentMethods] = useState({
    cash: false,
    credit: false,
    debit: false,
    pix: false,
    picpay: false,
  });

  // Update form states when tenant data is loaded
  useEffect(() => {
    if (currentTenant) {
      setTenantInfo({
        name: currentTenant.name || "",
        phone: currentTenant.phone || "",
        address: currentTenant.address || "",
      });

      setDeliverySettings({
        deliveryFee: currentTenant.deliveryFee || "",
        avgDeliveryTime: currentTenant.avgDeliveryTime?.toString() || "",
        deliveryRadius: currentTenant.deliveryRadius?.toString() || "",
        minOrderValue: currentTenant.minOrderValue || "",
      });

      setOperatingHours({
        openTime: currentTenant.openTime || "",
        closeTime: currentTenant.closeTime || "",
        operatingDays: currentTenant.operatingDays || [],
      });

      const methods = currentTenant.paymentMethods || [];
      setPaymentMethods({
        cash: methods.includes('cash'),
        credit: methods.includes('credit'),
        debit: methods.includes('debit'),
        pix: methods.includes('pix'),
        picpay: methods.includes('picpay'),
      });
    }
  }, [currentTenant]);

  // Update tenant mutation
  const updateTenantMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("PUT", `/api/tenants/${selectedTenant}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenants"] });
      toast({
        title: "Configurações salvas",
        description: "As configurações foram atualizadas com sucesso.",
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
        description: "Falha ao salvar configurações.",
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

  const handleTenantInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateTenantMutation.mutate(tenantInfo);
  };

  const handleDeliverySettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateTenantMutation.mutate({
      deliveryFee: parseFloat(deliverySettings.deliveryFee),
      avgDeliveryTime: parseInt(deliverySettings.avgDeliveryTime),
      deliveryRadius: parseInt(deliverySettings.deliveryRadius),
      minOrderValue: parseFloat(deliverySettings.minOrderValue),
    });
  };

  const handleOperatingHoursSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateTenantMutation.mutate({
      openTime: operatingHours.openTime,
      closeTime: operatingHours.closeTime,
      operatingDays: operatingHours.operatingDays,
    });
  };

  const handlePaymentMethodsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const activeMethods = Object.entries(paymentMethods)
      .filter(([_, enabled]) => enabled)
      .map(([method, _]) => method);
    
    updateTenantMutation.mutate({
      paymentMethods: activeMethods,
    });
  };

  const handleDayToggle = (day: string) => {
    setOperatingHours(prev => ({
      ...prev,
      operatingDays: prev.operatingDays.includes(day)
        ? prev.operatingDays.filter(d => d !== day)
        : [...prev.operatingDays, day]
    }));
  };

  const days = [
    { key: 'monday', label: 'Segunda-feira' },
    { key: 'tuesday', label: 'Terça-feira' },
    { key: 'wednesday', label: 'Quarta-feira' },
    { key: 'thursday', label: 'Quinta-feira' },
    { key: 'friday', label: 'Sexta-feira' },
    { key: 'saturday', label: 'Sábado' },
    { key: 'sunday', label: 'Domingo' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar 
        tenants={tenants || []} 
        selectedTenant={selectedTenant} 
        onTenantChange={setSelectedTenant} 
      />
      
      <div className="flex">
        <Sidebar currentSection="settings" />
        
        <div className="flex-1 overflow-auto">
          <div className="px-4 sm:px-6 lg:px-8 py-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
              <p className="text-gray-600">Gerencie as configurações da sua pizzaria</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pizzaria Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Informações da Pizzaria</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleTenantInfoSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="name">Nome da Pizzaria</Label>
                      <Input
                        id="name"
                        value={tenantInfo.name}
                        onChange={(e) => setTenantInfo(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Telefone</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={tenantInfo.phone}
                        onChange={(e) => setTenantInfo(prev => ({ ...prev, phone: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="address">Endereço</Label>
                      <Textarea
                        id="address"
                        rows={3}
                        value={tenantInfo.address}
                        onChange={(e) => setTenantInfo(prev => ({ ...prev, address: e.target.value }))}
                      />
                    </div>
                    <Button type="submit" className="bg-red-600 hover:bg-red-700">
                      <Save className="h-4 w-4 mr-2" />
                      Salvar Alterações
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Delivery Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Configurações de Entrega</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleDeliverySettingsSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="deliveryFee">Taxa de Entrega Padrão (R$)</Label>
                      <Input
                        id="deliveryFee"
                        type="number"
                        step="0.01"
                        value={deliverySettings.deliveryFee}
                        onChange={(e) => setDeliverySettings(prev => ({ ...prev, deliveryFee: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="avgDeliveryTime">Tempo Médio de Entrega (min)</Label>
                      <Input
                        id="avgDeliveryTime"
                        type="number"
                        value={deliverySettings.avgDeliveryTime}
                        onChange={(e) => setDeliverySettings(prev => ({ ...prev, avgDeliveryTime: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="deliveryRadius">Raio de Entrega (km)</Label>
                      <Input
                        id="deliveryRadius"
                        type="number"
                        value={deliverySettings.deliveryRadius}
                        onChange={(e) => setDeliverySettings(prev => ({ ...prev, deliveryRadius: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="minOrderValue">Valor Mínimo para Entrega (R$)</Label>
                      <Input
                        id="minOrderValue"
                        type="number"
                        step="0.01"
                        value={deliverySettings.minOrderValue}
                        onChange={(e) => setDeliverySettings(prev => ({ ...prev, minOrderValue: e.target.value }))}
                      />
                    </div>
                    <Button type="submit" className="bg-red-600 hover:bg-red-700">
                      <Save className="h-4 w-4 mr-2" />
                      Salvar Configurações
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Hours of Operation */}
              <Card>
                <CardHeader>
                  <CardTitle>Horário de Funcionamento</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleOperatingHoursSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="openTime">Abertura</Label>
                        <Input
                          id="openTime"
                          type="time"
                          value={operatingHours.openTime}
                          onChange={(e) => setOperatingHours(prev => ({ ...prev, openTime: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="closeTime">Fechamento</Label>
                        <Input
                          id="closeTime"
                          type="time"
                          value={operatingHours.closeTime}
                          onChange={(e) => setOperatingHours(prev => ({ ...prev, closeTime: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">
                        Dias de Funcionamento
                      </Label>
                      <div className="space-y-2">
                        {days.map(day => (
                          <div key={day.key} className="flex items-center space-x-2">
                            <Checkbox
                              id={day.key}
                              checked={operatingHours.operatingDays.includes(day.key)}
                              onCheckedChange={() => handleDayToggle(day.key)}
                            />
                            <Label htmlFor={day.key} className="text-sm">
                              {day.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                    <Button type="submit" className="bg-red-600 hover:bg-red-700">
                      <Save className="h-4 w-4 mr-2" />
                      Salvar Horários
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Payment Methods */}
              <Card>
                <CardHeader>
                  <CardTitle>Métodos de Pagamento</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePaymentMethodsSubmit} className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          id="cash"
                          checked={paymentMethods.cash}
                          onCheckedChange={(checked) => 
                            setPaymentMethods(prev => ({ ...prev, cash: !!checked }))
                          }
                        />
                        <Banknote className="h-5 w-5 text-green-600" />
                        <Label htmlFor="cash">Dinheiro</Label>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          id="credit"
                          checked={paymentMethods.credit}
                          onCheckedChange={(checked) => 
                            setPaymentMethods(prev => ({ ...prev, credit: !!checked }))
                          }
                        />
                        <CreditCard className="h-5 w-5 text-blue-600" />
                        <Label htmlFor="credit">Cartão de Crédito</Label>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          id="debit"
                          checked={paymentMethods.debit}
                          onCheckedChange={(checked) => 
                            setPaymentMethods(prev => ({ ...prev, debit: !!checked }))
                          }
                        />
                        <CreditCard className="h-5 w-5 text-purple-600" />
                        <Label htmlFor="debit">Cartão de Débito</Label>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          id="pix"
                          checked={paymentMethods.pix}
                          onCheckedChange={(checked) => 
                            setPaymentMethods(prev => ({ ...prev, pix: !!checked }))
                          }
                        />
                        <div className="w-5 h-5 bg-green-600 rounded flex items-center justify-center">
                          <span className="text-white text-xs font-bold">P</span>
                        </div>
                        <Label htmlFor="pix">PIX</Label>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          id="picpay"
                          checked={paymentMethods.picpay}
                          onCheckedChange={(checked) => 
                            setPaymentMethods(prev => ({ ...prev, picpay: !!checked }))
                          }
                        />
                        <Smartphone className="h-5 w-5 text-blue-600" />
                        <Label htmlFor="picpay">PicPay</Label>
                      </div>
                    </div>
                    <Button type="submit" className="bg-red-600 hover:bg-red-700">
                      <Save className="h-4 w-4 mr-2" />
                      Salvar Métodos
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
