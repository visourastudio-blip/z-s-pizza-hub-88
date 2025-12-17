import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Truck, Store, CreditCard, Banknote, QrCode, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useOrders } from '@/contexts/OrderContext';
import { toast } from 'sonner';
import { Address } from '@/types';
import PixPaymentModal from '@/components/PixPaymentModal';

const DELIVERY_FEE = 8;

const Checkout = () => {
  const navigate = useNavigate();
  const { items, getTotal, clearCart } = useCart();
  const { user, profile, updateAddress } = useAuth();
  const { createOrder } = useOrders();

  const [deliveryType, setDeliveryType] = useState<'delivery' | 'retirada'>('delivery');
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credito' | 'debito' | 'dinheiro'>('pix');
  const [changeAmount, setChangeAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPixModal, setShowPixModal] = useState(false);

  const [address, setAddress] = useState<Address>({
    street: profile?.street || '',
    number: profile?.number || '',
    complement: profile?.complement || '',
    neighborhood: profile?.neighborhood || '',
    city: profile?.city || 'Sorocaba',
    cep: profile?.cep || '',
  });

  const subtotal = getTotal();
  const deliveryFee = deliveryType === 'delivery' ? DELIVERY_FEE : 0;
  const total = subtotal + deliveryFee;

  const handleAddressChange = (field: keyof Address, value: string) => {
    setAddress(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !profile) {
      toast.error('Erro ao identificar cliente. Faça login novamente.');
      return;
    }

    if (deliveryType === 'delivery') {
      if (!address.street || !address.number || !address.neighborhood || !address.cep) {
        toast.error('Preencha todos os campos do endereço');
        return;
      }
    }

    if (paymentMethod === 'dinheiro' && !changeAmount) {
      toast.error('Informe o valor para troco');
      return;
    }

    // If payment is PIX, open the modal - order will be created there
    if (paymentMethod === 'pix') {
      if (deliveryType === 'delivery') {
        await updateAddress(address);
      }
      setShowPixModal(true);
      return;
    }

    // For other payment methods, create order directly
    await processOrder();
  };

  const processOrder = async () => {
    if (!user || !profile) {
      toast.error('Erro ao identificar cliente');
      return;
    }

    setIsProcessing(true);

    if (deliveryType === 'delivery') {
      await updateAddress(address);
    }

    const order = await createOrder({
      items,
      customer: {
        id: user.id,
        name: profile.name,
        email: profile.email,
        phone: profile.phone || '',
        address: deliveryType === 'delivery' ? address : undefined,
      },
      deliveryType,
      paymentMethod,
      change: paymentMethod === 'dinheiro' ? parseFloat(changeAmount) : undefined,
      total,
    });

    if (order) {
      clearCart();
      toast.success('Pedido realizado com sucesso!');
      navigate(`/pedido/${order.id}`);
    } else {
      toast.error('Erro ao criar pedido');
    }
    setIsProcessing(false);
  };

  const handlePixSuccess = (orderId: string) => {
    clearCart();
    toast.success('Pagamento confirmado! Pedido enviado.');
    navigate(`/pedido/${orderId}`);
  };

  const handlePixOrderCreated = (orderId: string, billingId: string) => {
    console.log('Order created with PIX:', orderId, billingId);
  };

  // Prepare order data for PIX modal
  const pixOrderData = user ? {
    items: items.map(item => ({
      ...item,
      // Serialize item data
    })),
    deliveryType,
    total,
    userId: user.id,
    change: paymentMethod === 'dinheiro' ? parseFloat(changeAmount) : undefined,
  } : undefined;

  if (items.length === 0) {
    navigate('/carrinho');
    return null;
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate('/carrinho')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Finalizar Pedido</h1>
            <p className="text-sm text-muted-foreground">
              Preencha os dados para concluir
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* Delivery Type */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Truck className="h-5 w-5 text-primary" />
                    Tipo de Entrega
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup
                    value={deliveryType}
                    onValueChange={(v) => setDeliveryType(v as 'delivery' | 'retirada')}
                    className="grid grid-cols-2 gap-4"
                  >
                    <Card
                      className={`p-4 cursor-pointer transition-all ${
                        deliveryType === 'delivery'
                          ? 'border-primary bg-primary/5'
                          : 'hover:border-primary/50'
                      }`}
                      onClick={() => setDeliveryType('delivery')}
                    >
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value="delivery" id="delivery" />
                        <div>
                          <Label htmlFor="delivery" className="cursor-pointer font-medium flex items-center gap-2">
                            <Truck className="h-4 w-4" />
                            Delivery
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Taxa: R$ {DELIVERY_FEE.toFixed(2).replace('.', ',')}
                          </p>
                        </div>
                      </div>
                    </Card>

                    <Card
                      className={`p-4 cursor-pointer transition-all ${
                        deliveryType === 'retirada'
                          ? 'border-primary bg-primary/5'
                          : 'hover:border-primary/50'
                      }`}
                      onClick={() => setDeliveryType('retirada')}
                    >
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value="retirada" id="retirada" />
                        <div>
                          <Label htmlFor="retirada" className="cursor-pointer font-medium flex items-center gap-2">
                            <Store className="h-4 w-4" />
                            Retirar na loja
                          </Label>
                          <p className="text-xs text-success">Sem taxa</p>
                        </div>
                      </div>
                    </Card>
                  </RadioGroup>
                </CardContent>
              </Card>

              {/* Address */}
              {deliveryType === 'delivery' && (
                <Card className="animate-fade-in">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      Endereço de Entrega
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="cep">CEP</Label>
                        <Input
                          id="cep"
                          placeholder="00000-000"
                          value={address.cep}
                          onChange={(e) => handleAddressChange('cep', e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="city">Cidade</Label>
                        <Input
                          id="city"
                          value={address.city}
                          onChange={(e) => handleAddressChange('city', e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-3 gap-4">
                      <div className="sm:col-span-2 space-y-2">
                        <Label htmlFor="street">Rua</Label>
                        <Input
                          id="street"
                          placeholder="Nome da rua"
                          value={address.street}
                          onChange={(e) => handleAddressChange('street', e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="number">Número</Label>
                        <Input
                          id="number"
                          placeholder="123"
                          value={address.number}
                          onChange={(e) => handleAddressChange('number', e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="neighborhood">Bairro</Label>
                        <Input
                          id="neighborhood"
                          placeholder="Nome do bairro"
                          value={address.neighborhood}
                          onChange={(e) => handleAddressChange('neighborhood', e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="complement">Complemento</Label>
                        <Input
                          id="complement"
                          placeholder="Apto, bloco, etc."
                          value={address.complement}
                          onChange={(e) => handleAddressChange('complement', e.target.value)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Payment */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    Forma de Pagamento
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <RadioGroup
                    value={paymentMethod}
                    onValueChange={(v) => setPaymentMethod(v as any)}
                    className="grid sm:grid-cols-2 gap-4"
                  >
                    {[
                      { id: 'pix', label: 'Pix', icon: QrCode, desc: 'Pagamento instantâneo' },
                      { id: 'credito', label: 'Cartão de Crédito', icon: CreditCard, desc: 'Na maquininha' },
                      { id: 'debito', label: 'Cartão de Débito', icon: Wallet, desc: 'Na maquininha' },
                      { id: 'dinheiro', label: 'Dinheiro', icon: Banknote, desc: 'Informe o troco' },
                    ].map((method) => (
                      <Card
                        key={method.id}
                        className={`p-4 cursor-pointer transition-all ${
                          paymentMethod === method.id
                            ? 'border-primary bg-primary/5'
                            : 'hover:border-primary/50'
                        }`}
                        onClick={() => setPaymentMethod(method.id as any)}
                      >
                        <div className="flex items-center gap-3">
                          <RadioGroupItem value={method.id} id={method.id} />
                          <div>
                            <Label htmlFor={method.id} className="cursor-pointer font-medium flex items-center gap-2">
                              <method.icon className="h-4 w-4" />
                              {method.label}
                            </Label>
                            <p className="text-xs text-muted-foreground">{method.desc}</p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </RadioGroup>

                  {paymentMethod === 'dinheiro' && (
                    <div className="space-y-2 animate-fade-in">
                      <Label htmlFor="change">Troco para quanto?</Label>
                      <Input
                        id="change"
                        type="number"
                        placeholder="Ex: 100"
                        value={changeAmount}
                        onChange={(e) => setChangeAmount(e.target.value)}
                        required
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardContent className="p-6 space-y-4">
                  <h3 className="font-semibold text-lg">Resumo do pedido</h3>
                  
                  <div className="space-y-2 text-sm max-h-48 overflow-y-auto">
                    {items.map((item) => (
                      <div key={item.id} className="flex justify-between">
                        <span className="text-muted-foreground">
                          {item.quantity}x{' '}
                          {'pizza' in item && item.pizza.name}
                          {'bebida' in item && item.bebida.name}
                          {'sobremesa' in item && item.sobremesa.name}
                        </span>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>R$ {subtotal.toFixed(2).replace('.', ',')}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Taxa de entrega</span>
                      <span className={deliveryFee === 0 ? 'text-success' : ''}>
                        {deliveryFee === 0 ? 'Grátis' : `R$ ${deliveryFee.toFixed(2).replace('.', ',')}`}
                      </span>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span className="text-primary">R$ {total.toFixed(2).replace('.', ',')}</span>
                  </div>

                  <Button type="submit" className="w-full" size="lg" disabled={isProcessing}>
                    {isProcessing ? 'Processando...' : 'Confirmar Pedido'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>

        <PixPaymentModal
          open={showPixModal}
          onOpenChange={setShowPixModal}
          amount={total}
          onSuccess={handlePixSuccess}
          onOrderCreated={handlePixOrderCreated}
          defaultName={profile?.name}
          defaultEmail={profile?.email}
          defaultPhone={profile?.phone || ''}
          orderData={pixOrderData}
        />
      </div>
    </div>
  );
};

export default Checkout;
