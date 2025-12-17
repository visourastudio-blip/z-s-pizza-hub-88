import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { OrderProvider } from "@/contexts/OrderContext";
import { ReviewProvider } from "@/contexts/ReviewContext";
import { Layout } from "@/components/Layout";
import Index from "./pages/Index";
import Cardapio from "./pages/Cardapio";
import Carrinho from "./pages/Carrinho";
import Login from "./pages/Login";
import Checkout from "./pages/Checkout";
import PedidoStatus from "./pages/PedidoStatus";
import MeusPedidos from "./pages/MeusPedidos";
import Avaliacoes from "./pages/Avaliacoes";
import Sobre from "./pages/Sobre";
import Perfil from "./pages/Perfil";
import Funcionario from "./pages/Funcionario";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CartProvider>
        <OrderProvider>
          <ReviewProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter basename={import.meta.env.BASE_URL}>
                <Routes>
                  <Route element={<Layout />}>
                    <Route path="/" element={<Index />} />
                    <Route path="/cardapio" element={<Cardapio />} />
                    <Route path="/carrinho" element={<Carrinho />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/pedido/:id" element={<PedidoStatus />} />
                    <Route path="/meus-pedidos" element={<MeusPedidos />} />
                    <Route path="/avaliacoes" element={<Avaliacoes />} />
                    <Route path="/sobre" element={<Sobre />} />
                    <Route path="/perfil" element={<Perfil />} />
                  </Route>
                  <Route path="/funcionario" element={<Funcionario />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </ReviewProvider>
        </OrderProvider>
      </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
