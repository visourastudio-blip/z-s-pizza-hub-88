import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, QrCode, Copy, Check, ExternalLink, Clock, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { QRCodeSVG } from 'qrcode.react';

interface PixPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: number;
  onSuccess: (orderId: string) => void;
  onOrderCreated?: (orderId: string, billingId: string) => void;
  defaultName?: string;
  defaultEmail?: string;
  defaultPhone?: string;
  orderData?: {
    items: any[];
    deliveryType: string;
    total: number;
    userId: string;
    change?: number;
  };
}

interface PixData {
  billingId: string;
  url: string;
  orderId?: string;
}

const PixPaymentModal = ({
  open,
  onOpenChange,
  amount,
  onSuccess,
  onOrderCreated,
  defaultName = '',
  defaultEmail = '',
  defaultPhone = '',
  orderData,
}: PixPaymentModalProps) => {
  const [name, setName] = useState(defaultName);
  const [phone, setPhone] = useState(defaultPhone);
  const [email, setEmail] = useState(defaultEmail);
  const [cpf, setCpf] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pixData, setPixData] = useState<PixData | null>(null);
  const [copied, setCopied] = useState(false);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid'>('pending');

  // Auto-check payment status every 5 seconds when QR code is shown
  useEffect(() => {
    if (!pixData?.billingId || paymentStatus === 'paid') return;

    const checkPayment = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('check-pix-payment', {
          body: { billingId: pixData.billingId },
        });

        if (data?.isPaid) {
          setPaymentStatus('paid');
          toast.success('Pagamento confirmado!');
          if (pixData.orderId) {
            onSuccess(pixData.orderId);
          }
          onOpenChange(false);
          resetForm();
        }
      } catch (error) {
        console.error('Error checking payment:', error);
      }
    };

    const interval = setInterval(checkPayment, 5000);
    return () => clearInterval(interval);
  }, [pixData, paymentStatus, onSuccess, onOpenChange]);

  const formatCpf = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  };

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const isFormValid = () => {
    const cpfDigits = cpf.replace(/\D/g, '');
    const phoneDigits = phone.replace(/\D/g, '');
    return (
      name.trim().length >= 3 &&
      phoneDigits.length >= 10 &&
      email.includes('@') &&
      cpfDigits.length === 11
    );
  };

  const handleGenerateQrCode = async () => {
    if (!isFormValid()) {
      toast.error('Preencha todos os campos corretamente');
      return;
    }

    if (!orderData) {
      toast.error('Dados do pedido não encontrados');
      return;
    }

    setIsLoading(true);
    try {
      // First create order with status "aguardando_pagamento"
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: orderData.userId,
          items: orderData.items,
          delivery_type: orderData.deliveryType,
          payment_method: 'pix',
          total: orderData.total,
          change: orderData.change,
          status: 'aguardando_pagamento',
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Then create PIX payment
      const { data, error } = await supabase.functions.invoke('create-pix-payment', {
        body: {
          name,
          phone,
          email,
          cpf,
          amount,
          orderId: order.id,
        },
      });

      if (error) throw error;

      if (data?.success && data?.url) {
        // Update order with billing_id
        await supabase
          .from('orders')
          .update({ billing_id: data.billingId })
          .eq('id', order.id);

        setPixData({
          billingId: data.billingId,
          url: data.url,
          orderId: order.id,
        });
        
        if (onOrderCreated) {
          onOrderCreated(order.id, data.billingId);
        }
        
        toast.success('QR Code gerado! Aguardando pagamento...');
      } else {
        // Delete the order if PIX creation failed
        await supabase.from('orders').delete().eq('id', order.id);
        throw new Error(data?.error || 'Erro ao gerar QR Code');
      }
    } catch (error: any) {
      console.error('Error generating PIX:', error);
      toast.error(error.message || 'Erro ao gerar QR Code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyPix = async () => {
    if (pixData?.url) {
      await navigator.clipboard.writeText(pixData.url);
      setCopied(true);
      toast.success('Link de pagamento copiado!');
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleCheckPayment = async () => {
    if (!pixData?.billingId) return;
    
    setIsCheckingPayment(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-pix-payment', {
        body: { billingId: pixData.billingId },
      });

      if (error) throw error;

      if (data?.isPaid) {
        setPaymentStatus('paid');
        toast.success('Pagamento confirmado!');
        if (pixData.orderId) {
          onSuccess(pixData.orderId);
        }
        onOpenChange(false);
        resetForm();
      } else {
        toast.info('Pagamento ainda não identificado. Aguarde alguns instantes após pagar.');
      }
    } catch (error: any) {
      console.error('Error checking payment:', error);
      toast.error('Erro ao verificar pagamento');
    } finally {
      setIsCheckingPayment(false);
    }
  };

  const resetForm = () => {
    setPixData(null);
    setCpf('');
    setCopied(false);
    setPaymentStatus('pending');
  };

  const handleClose = (open: boolean) => {
    if (!open && pixData && paymentStatus === 'pending') {
      toast.info('Seu pedido está aguardando pagamento. Você pode acompanhá-lo em "Meus Pedidos".');
    }
    if (!open) {
      resetForm();
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-primary" />
            Pagamento via PIX
          </DialogTitle>
        </DialogHeader>

        {!pixData ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Preencha os dados abaixo para gerar o QR Code de pagamento.
            </p>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="pix-name">Nome completo</Label>
                <Input
                  id="pix-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome completo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pix-phone">Telefone</Label>
                <Input
                  id="pix-phone"
                  value={phone}
                  onChange={(e) => setPhone(formatPhone(e.target.value))}
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pix-email">E-mail</Label>
                <Input
                  id="pix-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pix-cpf">CPF</Label>
                <Input
                  id="pix-cpf"
                  value={cpf}
                  onChange={(e) => setCpf(formatCpf(e.target.value))}
                  placeholder="000.000.000-00"
                />
              </div>
            </div>

            <div className="pt-2">
              <p className="text-sm font-medium mb-3">
                Total: <span className="text-primary">R$ {amount.toFixed(2).replace('.', ',')}</span>
              </p>
              <Button
                onClick={handleGenerateQrCode}
                disabled={!isFormValid() || isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Gerando QR Code...
                  </>
                ) : (
                  <>
                    <QrCode className="mr-2 h-4 w-4" />
                    Gerar QR Code
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col items-center space-y-4">
              {pixData.url && (
                <div className="bg-white p-4 rounded-lg">
                  <QRCodeSVG
                    value={pixData.url}
                    size={192}
                    level="H"
                    includeMargin={false}
                  />
                </div>
              )}

              <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-medium">Aguardando pagamento...</span>
              </div>

              <p className="text-center text-sm text-muted-foreground">
                Escaneie o QR Code ou clique no link para pagar. O pedido será confirmado automaticamente.
              </p>

              {pixData.url && (
                <div className="flex flex-col gap-2 w-full">
                  <Button
                    variant="outline"
                    onClick={handleCopyPix}
                    className="w-full"
                  >
                    {copied ? (
                      <>
                        <Check className="mr-2 h-4 w-4 text-green-500" />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 h-4 w-4" />
                        Copiar link de pagamento
                      </>
                    )}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => window.open(pixData.url, '_blank')}
                    className="w-full"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Abrir página de pagamento
                  </Button>
                </div>
              )}
            </div>

            <div className="pt-2 space-y-2">
              <Button 
                onClick={handleCheckPayment} 
                className="w-full"
                disabled={isCheckingPayment}
              >
                {isCheckingPayment ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Verificar pagamento
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setPixData(null)}
                className="w-full"
              >
                Voltar e editar dados
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PixPaymentModal;
