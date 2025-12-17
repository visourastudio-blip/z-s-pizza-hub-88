import { Badge } from '@/components/ui/badge';
import { OrderStatus } from '@/types';
import { Clock, ChefHat, Package, Truck, CheckCircle, CreditCard } from 'lucide-react';

interface OrderStatusBadgeProps {
  status: OrderStatus;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig: Record<OrderStatus, { label: string; icon: any; className: string }> = {
  aguardando_pagamento: {
    label: 'Aguardando Pagamento',
    icon: CreditCard,
    className: 'bg-amber-500/20 text-amber-600 border-amber-500/30',
  },
  recebido: {
    label: 'Pedido Recebido',
    icon: Clock,
    className: 'bg-info/20 text-info border-info/30',
  },
  em_preparo: {
    label: 'Em Preparo',
    icon: ChefHat,
    className: 'bg-secondary/20 text-secondary border-secondary/30',
  },
  pronto_retirada: {
    label: 'Pronto para Retirada',
    icon: Package,
    className: 'bg-success/20 text-success border-success/30',
  },
  saiu_entrega: {
    label: 'Saiu para Entrega',
    icon: Truck,
    className: 'bg-primary/20 text-primary border-primary/30',
  },
  entregue: {
    label: 'Entregue',
    icon: CheckCircle,
    className: 'bg-success/20 text-success border-success/30',
  },
};

export function OrderStatusBadge({ status, size = 'md' }: OrderStatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };

  return (
    <Badge className={`${config.className} ${sizeClasses[size]} border font-medium`}>
      <Icon className="h-3 w-3 mr-1.5" />
      {config.label}
    </Badge>
  );
}
