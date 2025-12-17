export interface Pizza {
  id: string;
  name: string;
  description: string;
  image: string;
  prices: {
    pequena: number;
    media: number;
    grande: number;
    gigante: number;
  };
  category: 'tradicional' | 'especial' | 'doce';
}

export interface Bebida {
  id: string;
  name: string;
  description: string;
  image: string;
  price: number;
  size: string;
}

export interface Sobremesa {
  id: string;
  name: string;
  description: string;
  image: string;
  price: number;
}

export interface Borda {
  id: string;
  name: string;
  price: number;
}

export interface Adicional {
  id: string;
  name: string;
  price: number;
}

export type PizzaSize = 'pequena' | 'media' | 'grande' | 'gigante';

export interface CartPizza {
  id: string;
  pizza: Pizza;
  secondPizza?: Pizza;
  size: PizzaSize;
  borda?: Borda;
  adicionais: Adicional[];
  observacoes: string;
  quantity: number;
}

export interface CartBebida {
  id: string;
  bebida: Bebida;
  quantity: number;
}

export interface CartSobremesa {
  id: string;
  sobremesa: Sobremesa;
  quantity: number;
}

export type CartItem = CartPizza | CartBebida | CartSobremesa;

export interface Order {
  id: string;
  items: CartItem[];
  customer: Customer;
  deliveryType: 'delivery' | 'retirada';
  paymentMethod: 'pix' | 'credito' | 'debito' | 'dinheiro';
  change?: number;
  status: OrderStatus;
  total: number;
  createdAt: Date;
  estimatedDelivery?: Date;
}

export type OrderStatus = 
  | 'aguardando_pagamento'
  | 'recebido' 
  | 'em_preparo' 
  | 'pronto_retirada' 
  | 'saiu_entrega' 
  | 'entregue';

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: Address;
}

export interface Address {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  cep: string;
}

export interface Review {
  id: string;
  customerName: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

export type UserRole = 'customer' | 'employee';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}
