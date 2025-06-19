import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Minus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

const orderSchema = z.object({
  customerId: z.string().min(1, "Cliente é obrigatório"),
  paymentMethod: z.string().min(1, "Método de pagamento é obrigatório"),
  deliveryAddress: z.object({
    street: z.string().min(1, "Endereço é obrigatório"),
    neighborhood: z.string().min(1, "Bairro é obrigatório"),
    city: z.string().min(1, "Cidade é obrigatória"),
    zipCode: z.string().optional(),
  }),
  notes: z.string().optional(),
});

interface NewOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
}

interface OrderItem {
  menuItemId: string;
  name: string;
  size?: string;
  quantity: number;
  price: number;
}

export default function NewOrderModal({ isOpen, onClose, tenantId }: NewOrderModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);

  const form = useForm({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      customerId: "",
      paymentMethod: "",
      deliveryAddress: {
        street: "",
        neighborhood: "",
        city: "",
        zipCode: "",
      },
      notes: "",
    },
  });

  // Get customers
  const { data: customers } = useQuery({
    queryKey: ["/api/tenants", tenantId, "customers"],
    enabled: !!tenantId && isOpen,
  });

  // Get menu items
  const { data: menuItems } = useQuery({
    queryKey: ["/api/tenants", tenantId, "menu", "items"],
    enabled: !!tenantId && isOpen,
  });

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      await apiRequest("POST", `/api/tenants/${tenantId}/orders`, orderData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenants", tenantId, "orders"] });
      toast({
        title: "Pedido criado",
        description: "O pedido foi criado com sucesso.",
      });
      onClose();
      form.reset();
      setOrderItems([]);
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
        description: "Falha ao criar pedido.",
        variant: "destructive",
      });
    },
  });

  const addItemToOrder = (menuItem: any, size?: string) => {
    const price = size ? menuItem.prices[size] : Object.values(menuItem.prices)[0] as number;
    const itemKey = `${menuItem.id}-${size || 'default'}`;
    
    const existingItem = orderItems.find(item => 
      item.menuItemId === menuItem.id && item.size === size
    );

    if (existingItem) {
      setOrderItems(prev => prev.map(item =>
        item.menuItemId === menuItem.id && item.size === size
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setOrderItems(prev => [...prev, {
        menuItemId: menuItem.id,
        name: menuItem.name,
        size,
        quantity: 1,
        price,
      }]);
    }
  };

  const removeItemFromOrder = (index: number) => {
    setOrderItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateItemQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      removeItemFromOrder(index);
      return;
    }
    
    setOrderItems(prev => prev.map((item, i) =>
      i === index ? { ...item, quantity } : item
    ));
  };

  const calculateSubtotal = () => {
    return orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const deliveryFee = 5.00; // This should come from tenant settings
    return subtotal + deliveryFee;
  };

  const onSubmit = (data: any) => {
    if (orderItems.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos um item ao pedido.",
        variant: "destructive",
      });
      return;
    }

    const orderData = {
      customerId: data.customerId,
      items: orderItems,
      subtotal: calculateSubtotal(),
      deliveryFee: 5.00,
      total: calculateTotal(),
      paymentMethod: data.paymentMethod,
      deliveryAddress: data.deliveryAddress,
      notes: data.notes,
    };

    createOrderMutation.mutate(orderData);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Pedido</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Order Form */}
          <div>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="customerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cliente</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um cliente" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {customers?.map((customer: any) => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {customer.name} - {customer.phone}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="deliveryAddress.street"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Endereço</FormLabel>
                      <FormControl>
                        <Input placeholder="Rua, número" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="deliveryAddress.neighborhood"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bairro</FormLabel>
                        <FormControl>
                          <Input placeholder="Bairro" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="deliveryAddress.city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cidade</FormLabel>
                        <FormControl>
                          <Input placeholder="Cidade" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Método de Pagamento</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o pagamento" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="cash">Dinheiro</SelectItem>
                          <SelectItem value="credit">Cartão de Crédito</SelectItem>
                          <SelectItem value="debit">Cartão de Débito</SelectItem>
                          <SelectItem value="pix">PIX</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Observações do pedido..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={onClose}>
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-red-600 hover:bg-red-700"
                    disabled={createOrderMutation.isPending}
                  >
                    {createOrderMutation.isPending ? "Criando..." : "Criar Pedido"}
                  </Button>
                </div>
              </form>
            </Form>
          </div>

          {/* Menu Items & Order Summary */}
          <div className="space-y-4">
            {/* Menu Items */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Cardápio</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {menuItems?.map((item: any) => (
                  <Card key={item.id} className="p-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium">{item.name}</h4>
                        <p className="text-sm text-gray-600">{item.description}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {Object.entries(item.prices).map(([size, price]) => (
                            <Button
                              key={size}
                              variant="outline"
                              size="sm"
                              onClick={() => addItemToOrder(item, size)}
                              className="text-xs"
                            >
                              {size}: {formatCurrency(price as number)}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Order Summary */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Resumo do Pedido</h3>
              <Card>
                <CardContent className="p-4">
                  {orderItems.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">
                      Nenhum item adicionado
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {orderItems.map((item, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <div className="flex-1">
                            <span className="font-medium">{item.name}</span>
                            {item.size && <span className="text-sm text-gray-600"> ({item.size})</span>}
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateItemQuantity(index, item.quantity - 1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateItemQuantity(index, item.quantity + 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                            <span className="w-20 text-right">
                              {formatCurrency(item.price * item.quantity)}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItemFromOrder(index)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      
                      <div className="border-t pt-3 space-y-2">
                        <div className="flex justify-between">
                          <span>Subtotal:</span>
                          <span>{formatCurrency(calculateSubtotal())}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Taxa de entrega:</span>
                          <span>{formatCurrency(5.00)}</span>
                        </div>
                        <div className="flex justify-between font-semibold text-lg border-t pt-2">
                          <span>Total:</span>
                          <span>{formatCurrency(calculateTotal())}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
