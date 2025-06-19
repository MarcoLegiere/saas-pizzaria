import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CalendarDays, Phone, Mail, MapPin, ShoppingBag, DollarSign } from "lucide-react";

interface CustomerHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: any;
}

export default function CustomerHistoryModal({ isOpen, onClose, customer }: CustomerHistoryModalProps) {
  // Get customer orders (in a real app, this would be an API call)
  const { data: customerOrders } = useQuery({
    queryKey: ["/api/customers", customer?.id, "orders"],
    queryFn: async () => {
      // Since we don't have a specific endpoint for customer orders,
      // we'll return empty array for now
      return [];
    },
    enabled: !!customer?.id && isOpen,
  });

  if (!customer) return null;

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
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: { label: "Pendente", variant: "secondary" as const },
      preparing: { label: "Em preparo", variant: "default" as const },
      ready: { label: "Pronto", variant: "outline" as const },
      delivering: { label: "Saiu p/ entrega", variant: "outline" as const },
      delivered: { label: "Entregue", variant: "default" as const },
      cancelled: { label: "Cancelado", variant: "destructive" as const },
    };
    const statusInfo = statusMap[status as keyof typeof statusMap] || { 
      label: status, 
      variant: "secondary" as const 
    };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const getPrimaryAddress = () => {
    if (customer.addresses && customer.addresses.length > 0) {
      return customer.addresses[0];
    }
    return null;
  };

  const primaryAddress = getPrimaryAddress();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Histórico do Cliente</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle>Informações do Cliente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-red-100 text-red-700 text-lg">
                    {getInitials(customer.name)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900">{customer.name}</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{customer.phone}</span>
                      </div>
                      
                      {customer.email && (
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">{customer.email}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-2">
                        <CalendarDays className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          Cliente desde {formatDate(customer.createdAt)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <ShoppingBag className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {customer.totalOrders} pedidos realizados
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          Total gasto: {formatCurrency(customer.totalSpent)}
                        </span>
                      </div>
                      
                      {primaryAddress && (
                        <div className="flex items-start space-x-2">
                          <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                          <div className="text-sm text-gray-600">
                            <div>{primaryAddress.street}</div>
                            <div>{primaryAddress.neighborhood}, {primaryAddress.city}</div>
                            {primaryAddress.zipCode && <div>CEP: {primaryAddress.zipCode}</div>}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order History */}
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Pedidos</CardTitle>
            </CardHeader>
            <CardContent>
              {customerOrders && customerOrders.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pedido</TableHead>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Itens</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customerOrders.map((order: any) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.orderNumber}</TableCell>
                        <TableCell>{formatDateTime(order.createdAt)}</TableCell>
                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {order.items?.map((item: any, index: number) => (
                              <div key={index}>
                                {item.quantity}x {item.name}
                              </div>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>{formatCurrency(order.total)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhum pedido encontrado</p>
                  <p className="text-sm text-gray-400">
                    Este cliente ainda não realizou pedidos
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Addresses */}
          {customer.addresses && customer.addresses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Endereços Cadastrados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {customer.addresses.map((address: any, index: number) => (
                    <div key={index} className="p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <MapPin className="h-4 w-4 text-gray-400 mt-1" />
                        <div className="text-sm">
                          <div className="font-medium">{address.street}</div>
                          <div className="text-gray-600">
                            {address.neighborhood}, {address.city}
                          </div>
                          {address.zipCode && (
                            <div className="text-gray-600">CEP: {address.zipCode}</div>
                          )}
                          {address.reference && (
                            <div className="text-gray-500">Ref: {address.reference}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
