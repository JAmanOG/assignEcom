import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { authService } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Store } from 'lucide-react';
import { loginSchema } from '@/lib/validation/authSchemas';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate input using the schema
      const parsedData = loginSchema.parse({ email, password });
      const user = await authService.login(parsedData.email, parsedData.password);
      console.log('User logged in:', user);

      toast({
        title: "Welcome back!",
        description: `Logged in as ${user.full_name}`,
      });

      // Redirect based on role
      switch (user.role) {
        case 'ADMIN':
          navigate('/admin');
          break;
        case 'CUSTOMER':
          navigate('/shop');
          break;
        case 'DELIVERY':
          navigate('/delivery');
          break;
        default:
          navigate('/');
      }
    } catch (error) {
      toast({
        title: "Login failed",
        description: "Invalid email or password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const quickLogin = (email: string) => {
    setEmail(email);
    setPassword('password');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md animate-fade-in">
        <Card className="shadow-large border-0">
          <CardHeader className="text-center pb-2">
            <div className="w-12 h-12 mx-auto mb-4 hero-gradient rounded-xl flex items-center justify-center">
              <Store className="w-6 h-6 text-white" />
            </div>
            <CardTitle className="text-2xl font-semibold">Welcome Back</CardTitle>
            <CardDescription>
              Sign in to your account to continue
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full h-11" 
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Sign In
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Demo Accounts</span>
              </div>
            </div>

            <div className="grid gap-2">
              <Button
                variant="outline"
                onClick={() => quickLogin('admin@store.com')}
                className="w-full justify-start"
              >
                <div className="text-left">
                  <div className="font-medium">Admin Account</div>
                  <div className="text-xs text-muted-foreground">admin@store.com</div>
                </div>
              </Button>
              <Button
                variant="outline" 
                onClick={() => quickLogin('customer@example.com')}
                className="w-full justify-start"
              >
                <div className="text-left">
                  <div className="font-medium">Customer Account</div>
                  <div className="text-xs text-muted-foreground">customer@example.com</div>
                </div>
              </Button>
              <Button
                variant="outline"
                onClick={() => quickLogin('delivery@store.com')}
                className="w-full justify-start"
              >
                <div className="text-left">
                  <div className="font-medium">Delivery Account</div>
                  <div className="text-xs text-muted-foreground">delivery@store.com</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}