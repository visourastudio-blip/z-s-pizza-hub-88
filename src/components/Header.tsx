import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, User, Menu, X, LogOut, ClipboardList, Star, UtensilsCrossed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import pizzariaLogo from '@/assets/pizzaria-logo.png';

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const { getItemCount } = useCart();
  const { user, isAuthenticated, logout, isEmployee } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const itemCount = getItemCount();

  const navLinks = [
    { to: '/', label: 'Início' },
    { to: '/cardapio', label: 'Cardápio' },
    { to: '/avaliacoes', label: 'Avaliações' },
    { to: '/sobre', label: 'Sobre' },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 transition-transform hover:scale-105">
          <img src={pizzariaLogo} alt="Pizzaria do Zé" className="h-12 w-12 rounded-lg" />
          <div className="hidden sm:block">
            <h1 className="text-lg font-bold leading-tight">
              <span className="text-foreground">Pizzaria</span>{' '}
              <span className="text-primary">do Zé</span>
            </h1>
            <p className="text-[10px] text-muted-foreground">Pizza de verdade</p>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive(link.to)
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Cart */}
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={() => navigate('/carrinho')}
          >
            <ShoppingCart className="h-5 w-5" />
            {itemCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-primary text-xs animate-scale-in">
                {itemCount}
              </Badge>
            )}
          </Button>

          {/* User Menu */}
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user?.user_metadata?.name || user?.email?.split('@')[0]}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                {isEmployee ? (
                  <>
                    <DropdownMenuItem onClick={() => navigate('/funcionario')}>
                      <ClipboardList className="mr-2 h-4 w-4" />
                      Painel de Controle
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/cardapio')}>
                      <UtensilsCrossed className="mr-2 h-4 w-4" />
                      Cardápio
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/avaliacoes')}>
                      <Star className="mr-2 h-4 w-4" />
                      Avaliações
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem onClick={() => navigate('/meus-pedidos')}>
                      <ClipboardList className="mr-2 h-4 w-4" />
                      Meus Pedidos
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/perfil')}>
                      <User className="mr-2 h-4 w-4" />
                      Meu Perfil
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/avaliacoes')}>
                      <Star className="mr-2 h-4 w-4" />
                      Avaliações
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/login')}
              className="hidden sm:flex"
            >
              Entrar
            </Button>
          )}

          {/* Mobile Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[350px]">
              <nav className="flex flex-col gap-4 mt-8">
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setIsOpen(false)}
                    className={`px-4 py-3 rounded-lg text-lg font-medium transition-all ${
                      isActive(link.to)
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
                {!isAuthenticated && (
                  <Button
                    onClick={() => {
                      setIsOpen(false);
                      navigate('/login');
                    }}
                    className="mt-4"
                  >
                    Entrar / Cadastrar
                  </Button>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
