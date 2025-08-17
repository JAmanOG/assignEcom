import { useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { authService } from '@/lib/auth';
import { 
  Truck, 
  Package, 
  Menu,
  LogOut,
  Bell
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DeliveryLayoutProps {
  children: ReactNode;
}

export function DeliveryLayout({ children }: DeliveryLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const user = authService.getCurrentUser();

  const handleLogout = async () => {
    await authService.logout();
    toast({
      title: "Logged out",
      description: "Safe travels!",
    });
    navigate('/login');
  };

  // Mock pending deliveries count
  const pendingCount = 1;

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-card border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 hero-gradient rounded-lg flex items-center justify-center">
                <Truck className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="font-bold text-lg">Delivery Hub</span>
                <div className="text-xs text-muted-foreground">Welcome, {user?.name}</div>
              </div>
            </div>

            {/* Stats */}
            <div className="hidden md:flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full">
                <Package className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">{pendingCount} pending</span>
              </div>
              <Button variant="ghost" size="sm">
                <Bell className="w-4 h-4" />
              </Button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleLogout} className="hidden md:flex">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <Menu className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t bg-card py-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 px-3 py-2">
                  <Package className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">{pendingCount} pending deliveries</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleLogout}
                  className="w-full justify-start text-destructive"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main>
        {children}
      </main>
    </div>
  );
}