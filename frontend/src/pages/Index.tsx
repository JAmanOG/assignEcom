import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Store, ArrowRight } from 'lucide-react';

// Legacy index page - users are automatically redirected based on their role
const Index = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-6 hero-gradient rounded-2xl flex items-center justify-center">
            <Store className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold mb-4">FreshMarket</h1>
          <p className="text-muted-foreground mb-6">
            Role-based e-commerce platform with dedicated interfaces for admins, customers, and delivery personnel.
          </p>
          <Button asChild className="w-full">
            <a href="/login">
              Get Started
              <ArrowRight className="w-4 h-4 ml-2" />
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;
