import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, ChefHat, Package, Truck, CheckCircle, RefreshCw, LogOut, Power } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OrderStatusBadge } from '@/components/OrderStatusBadge';
import { useOrders } from '@/contexts/OrderContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRestaurantStatus } from '@/hooks/useRestaurantStatus';
import { OrderStatus } from '@/types';
import { sizeLabels } from '@/data/menuData';
import { toast } from 'sonner';
import pizzariaLogo from '@/assets/pizzaria-logo.png';
const statusOptions: { value: OrderStatus; label: string }[] = [
  { value: 'recebido', label: 'Pedido Recebido' },
  { value: 'em_preparo', label: 'Em Preparo' },
  { value: 'pronto_retirada', label: 'Pronto para Retirada' },
  { value: 'saiu_entrega', label: 'Saiu para Entrega' },
  { value: 'entregue', label: 'Entregue' },
];

const Funcionario = () => {
  const navigate = useNavigate();
  const { getAllOrders, updateOrderStatus } = useOrders();
  const { user, isEmployee, logout } = useAuth();
  const { isOpen, toggleStatus } = useRestaurantStatus();
  const [refreshKey, setRefreshKey] = useState(0);
  const orders = getAllOrders();

  const activeOrders = orders.filter(o => 
    !['entregue', 'pronto_retirada'].includes(o.status) || 
    (o.status === 'pronto_retirada' && o.deliveryType === 'retirada')
  ).filter(o => o.status !== 'entregue');

  const completedOrders = orders.filter(o => 
    o.status === 'entregue' || 
    (o.status === 'pronto_retirada' && o.deliveryType === 'retirada')
  );

  const handleStatusChange = (orderId: string, status: OrderStatus) => {
    updateOrderStatus(orderId, status);
    toast.success('Status atualizado!');
    setRefreshKey(prev => prev + 1);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    toast.success('Atualizado!');
  };

  const handleToggleRestaurant = async () => {
    const success = await toggleStatus();
    if (success) {
      toast.success(isOpen ? 'Restaurante fechado!' : 'Restaurante aberto!');
    } else {
      toast.error('Erro ao alterar status');
    }
  };
  // Check if user is employee
  if (!isEmployee) {
    navigate('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={pizzariaLogo} alt="Pizzaria do Zé" className="h-10 w-10 rounded-lg" />
              <div>
                <h1 className="font-bold text-lg">Painel do Funcionário</h1>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={isOpen ? 'destructive' : 'default'}
                onClick={handleToggleRestaurant}
                className="gap-2"
              >
                <Power className="h-4 w-4" />
                {isOpen ? 'Fechar Restaurante' : 'Abrir Restaurante'}
              </Button>
              <Button variant="outline" size="icon" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <Clock className="h-6 w-6 text-info mx-auto mb-2" />
              <p className="text-2xl font-bold">
                {orders.filter(o => o.status === 'recebido').length}
              </p>
              <p className="text-xs text-muted-foreground">Recebidos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <ChefHat className="h-6 w-6 text-secondary mx-auto mb-2" />
              <p className="text-2xl font-bold">
                {orders.filter(o => o.status === 'em_preparo').length}
              </p>
              <p className="text-xs text-muted-foreground">Em Preparo</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Truck className="h-6 w-6 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold">
                {orders.filter(o => o.status === 'saiu_entrega').length}
              </p>
              <p className="text-xs text-muted-foreground">Em Entrega</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <CheckCircle className="h-6 w-6 text-success mx-auto mb-2" />
              <p className="text-2xl font-bold">{completedOrders.length}</p>
              <p className="text-xs text-muted-foreground">Finalizados</p>
            </CardContent>
          </Card>
        </div>

        {/* Orders Tabs */}
        <Tabs defaultValue="active">
          <TabsList className="mb-6">
            <TabsTrigger value="active">
              Pedidos Ativos
              {activeOrders.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activeOrders.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="completed">Finalizados</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            {activeOrders.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum pedido ativo no momento</p>
                </CardContent>
              </Card>
            ) : (
              activeOrders.map((order) => (
                <Card key={order.id} className="overflow-hidden">
                  <CardHeader className="bg-muted/50 py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <CardTitle className="text-lg">#{order.id}</CardTitle>
                        <Badge variant="outline">
                          {order.deliveryType === 'delivery' ? '🚚 Delivery' : '🏪 Retirada'}
                        </Badge>
                      </div>
                      <OrderStatusBadge status={order.status} />
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Order Info */}
                      <div>
                        <h4 className="font-medium mb-2">Cliente</h4>
                        <p className="text-sm">{order.customer.name}</p>
                        <p className="text-sm text-muted-foreground">{order.customer.phone}</p>
                        {order.deliveryType === 'delivery' && order.customer.address && (
                          <p className="text-sm text-muted-foreground mt-2">
                            📍 {order.customer.address.street}, {order.customer.address.number}
                            {order.customer.address.complement && ` - ${order.customer.address.complement}`}
                            <br />
                            {order.customer.address.neighborhood}
                          </p>
                        )}

                        <h4 className="font-medium mt-4 mb-2">Pagamento</h4>
                        <p className="text-sm capitalize">
                          {order.paymentMethod === 'pix' && '📱 Pix'}
                          {order.paymentMethod === 'credito' && '💳 Crédito'}
                          {order.paymentMethod === 'debito' && '💳 Débito'}
                          {order.paymentMethod === 'dinheiro' && `💵 Dinheiro (Troco: R$ ${order.change})`}
                        </p>
                      </div>

                      {/* Items */}
                      <div>
                        <h4 className="font-medium mb-2">Itens</h4>
                        <div className="space-y-1 text-sm">
                          {order.items.map((item) => (
                            <p key={item.id}>
                              {item.quantity}x{' '}
                              {'pizza' in item && (
                                <>
                                  {item.pizza.name}
                                  {item.secondPizza && ` + ${item.secondPizza.name}`}
                                  {' '}({sizeLabels[item.size]})
                                  {item.borda && ` - Borda: ${item.borda.name}`}
                                </>
                              )}
                              {'bebida' in item && `${item.bebida.name} ${item.bebida.size}`}
                              {'sobremesa' in item && item.sobremesa.name}
                            </p>
                          ))}
                        </div>
                        <p className="font-semibold text-primary mt-3">
                          Total: R$ {order.total.toFixed(2).replace('.', ',')}
                        </p>
                      </div>
                    </div>

                    {/* Status Update */}
                    <div className="mt-4 pt-4 border-t flex items-center justify-between gap-4">
                      <p className="text-sm text-muted-foreground">
                        {order.createdAt.toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                      <Select
                        value={order.status}
                        onValueChange={(v) => handleStatusChange(order.id, v as OrderStatus)}
                      >
                        <SelectTrigger className="w-[200px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions
                            .filter(opt => {
                              if (order.deliveryType === 'retirada') {
                                return !['saiu_entrega', 'entregue'].includes(opt.value);
                              }
                              return opt.value !== 'pronto_retirada';
                            })
                            .map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {completedOrders.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum pedido finalizado ainda</p>
                </CardContent>
              </Card>
            ) : (
              completedOrders.map((order) => (
                <Card key={order.id} className="opacity-75">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">#{order.id}</p>
                        <p className="text-sm text-muted-foreground">
                          {order.customer.name} • R$ {order.total.toFixed(2).replace('.', ',')}
                        </p>
                      </div>
                      <div className="text-right">
                        <OrderStatusBadge status={order.status} size="sm" />
                        <p className="text-xs text-muted-foreground mt-1">
                          {order.createdAt.toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Funcionario;
