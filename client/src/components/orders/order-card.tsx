import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Printer, MessageCircle } from "lucide-react";

interface OrderCardProps {
  order: any;
  onStatusUpdate: (orderId: string, status: string) => void;
}

export default function OrderCard({ order, onStatusUpdate }: OrderCardProps) {
  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: { label: "Pendente", className: "status-pending" },
      preparing: { label: "Em preparo", className: "status-preparing" },
      ready: { label: "Pronto", className: "status-ready" },
      delivering: { label: "Saiu p/ entrega", className: "status-delivering" },
      delivered: { label: "Entregue", className: "status-delivered" },
      cancelled: { label: "Cancelado", className: "status-cancelled" },
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || { 
      label: status, 
      className: "status-pending" 
    };
    
    return (
      <Badge className={`status-badge ${statusInfo.className}`}>
        {statusInfo.label}
      </Badge>
    );
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

  const getCustomerInfo = () => {
    // In a real implementation, you'd fetch customer data by ID
    return {
      name: `Cliente #${order.customerId.slice(-6)}`,
      phone: "(11) 99999-9999",
    };
  };

  const getDeliveryAddress = () => {
    if (order.deliveryAddress) {
      return {
        street: order.deliveryAddress.street || "Endereço não informado",
        neighborhood: order.deliveryAddress.neighborhood || "",
        city: order.deliveryAddress.city || "",
      };
    }
    return {
      street: "Endereço não informado",
      neighborhood: "",
      city: "",
    };
  };

  const customerInfo = getCustomerInfo();
  const deliveryAddress = getDeliveryAddress();

  return (
    <Card className="bg-white">
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-4 mb-3">
              <h3 className="text-lg font-semibold text-gray-900">{order.orderNumber}</h3>
              {getStatusBadge(order.status)}
              <span className="text-sm text-gray-500">{formatTime(order.createdAt)}</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Cliente</p>
                <p className="text-sm text-gray-600">{customerInfo.name}</p>
                <p className="text-sm text-gray-600">{customerInfo.phone}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Endereço</p>
                <p className="text-sm text-gray-600">{deliveryAddress.street}</p>
                {deliveryAddress.neighborhood && deliveryAddress.city && (
                  <p className="text-sm text-gray-600">
                    {deliveryAddress.neighborhood}, {deliveryAddress.city}
                  </p>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Pagamento</p>
                <p className="text-sm text-gray-600 capitalize">{order.paymentMethod}</p>
                <p className="text-sm font-semibold text-gray-900">
                  Total: {formatCurrency(order.total)}
                </p>
              </div>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Itens do Pedido</p>
              <ul className="text-sm text-gray-600 space-y-1">
                {order.items && Array.isArray(order.items) ? (
                  order.items.map((item: any, index: number) => (
                    <li key={index}>
                      • {item.quantity}x {item.name} {item.size ? `(${item.size})` : ''} - {formatCurrency(item.price)}
                    </li>
                  ))
                ) : (
                  <li>• Itens não disponíveis</li>
                )}
                {parseFloat(order.deliveryFee) > 0 && (
                  <li>• Taxa de entrega - {formatCurrency(order.deliveryFee)}</li>
                )}
              </ul>
            </div>
          </div>
          
          <div className="mt-4 lg:mt-0 lg:ml-6 flex flex-col space-y-2">
            <Select
              value={order.status}
              onValueChange={(value) => onStatusUpdate(order.id, value)}
            >
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="preparing">Em preparo</SelectItem>
                <SelectItem value="ready">Pronto</SelectItem>
                <SelectItem value="delivering">Saiu p/ entrega</SelectItem>
                <SelectItem value="delivered">Entregue</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" size="sm" className="text-blue-600 hover:text-blue-800">
              <Printer className="h-4 w-4 mr-1" />
              Imprimir
            </Button>
            
            <Button variant="outline" size="sm" className="text-green-600 hover:text-green-800">
              <MessageCircle className="h-4 w-4 mr-1" />
              WhatsApp
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
