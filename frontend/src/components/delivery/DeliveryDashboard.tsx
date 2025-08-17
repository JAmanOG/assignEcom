import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { 
  MapPin, 
  Phone, 
  CheckCircle,
  Navigation
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DeliveryOrder {
  id: string;
  customerName: string;
  customerPhone: string;
  address: string;
  items: number;
  amount: string;
  status: 'assigned' | 'out_for_delivery' | 'delivered';
  deliveryNotes?: string;
}

export function DeliveryDashboard() {
  const { toast } = useToast();
  const [deliveryNotesDialog, setDeliveryNotesDialog] = useState<string | null>(null);
  const [deliveryNotes, setDeliveryNotes] = useState('');
  
  const [orders, setOrders] = useState<DeliveryOrder[]>([
    {
      id: 'ORD-001',
      customerName: 'Sarah Johnson',
      customerPhone: '+1 (555) 123-4567',
      address: '123 Oak Street, Downtown, City 12345',
      items: 4,
      amount: '$45.99',
      status: 'assigned'
    },
    {
      id: 'ORD-002',
      customerName: 'Mike Chen',
      customerPhone: '+1 (555) 987-6543',
      address: '456 Pine Avenue, Riverside, City 12346',
      items: 2,
      amount: '$28.50',
      status: 'out_for_delivery'
    },
    {
      id: 'ORD-003',
      customerName: 'Emma Davis',
      customerPhone: '+1 (555) 456-7890',
      address: '789 Maple Drive, Hillside, City 12347',
      items: 6,
      amount: '$67.25',
      status: 'assigned'
    }
  ]);

  const updateOrderStatus = (orderId: string, newStatus: DeliveryOrder['status'], notes?: string) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId 
        ? { ...order, status: newStatus, ...(notes && { deliveryNotes: notes }) }
        : order
    ));
    
    const statusMessages = {
      assigned: 'Order assigned',
      out_for_delivery: 'Order is out for delivery',
      delivered: 'Order delivered successfully'
    };
    
    toast({
      title: "Status Updated",
      description: statusMessages[newStatus],
    });
  };

  const handleMarkDelivered = (orderId: string) => {
    setDeliveryNotesDialog(orderId);
    setDeliveryNotes('');
  };

  const confirmDelivery = () => {
    if (deliveryNotesDialog) {
      updateOrderStatus(deliveryNotesDialog, 'delivered', deliveryNotes);
      setDeliveryNotesDialog(null);
      setDeliveryNotes('');
    }
  };

  const getStatusBadge = (status: DeliveryOrder['status']) => {
    const configs = {
      assigned: { className: 'status-pending', label: 'Assigned' },
      out_for_delivery: { className: 'status-shipped', label: 'Out for Delivery' },
      delivered: { className: 'status-delivered', label: 'Delivered' }
    };
    
    const config = configs[status];
    return (
      <Badge className={`${config.className} border`}>
        {config.label}
      </Badge>
    );
  };

  const getActionButton = (order: DeliveryOrder) => {
    switch (order.status) {
      case 'assigned':
        return (
          <Button 
            size="sm" 
            onClick={() => updateOrderStatus(order.id, 'out_for_delivery')}
            className="w-full"
          >
            <Navigation className="w-4 h-4 mr-2" />
            Mark Out for Delivery
          </Button>
        );
      case 'out_for_delivery':
        return (
          <Button 
            size="sm" 
            onClick={() => handleMarkDelivered(order.id)}
            className="w-full"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Mark as Delivered
          </Button>
        );
      case 'delivered':
        return (
          <Badge className="w-full justify-center status-delivered border">
            <CheckCircle className="w-4 h-4 mr-2" />
            Completed
          </Badge>
        );
    }
  };

  const activeOrders = orders.filter(order => order.status !== 'delivered');

  return (
    <div className="container mx-auto px-4 py-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold mb-2">Delivery Dashboard</h1>
        <p className="text-muted-foreground">
          View assigned deliveries and update delivery status
        </p>
      </div>

      {/* Assigned Deliveries */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Assigned Deliveries</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          {activeOrders.map((order) => (
            <Card key={order.id} className="hover-lift">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{order.id}</CardTitle>
                  {getStatusBadge(order.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Customer Details */}
                <div>
                  <h3 className="font-semibold mb-1">{order.customerName}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Phone className="w-4 h-4" />
                    {order.customerPhone}
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground" />
                    <span>{order.address}</span>
                  </div>
                </div>

                {/* Order Details */}
                <div className="flex items-center justify-between text-sm bg-muted/50 rounded-lg p-3">
                  <div>
                    <div className="text-muted-foreground">Items</div>
                    <div className="font-medium">{order.items}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-muted-foreground">Amount</div>
                    <div className="font-semibold">{order.amount}</div>
                  </div>
                </div>

                {/* Delivery Notes (if completed) */}
                {order.deliveryNotes && (
                  <div className="p-3 bg-success/10 rounded-lg">
                    <div className="text-sm">
                      <div className="font-medium text-success mb-1">Delivery Notes:</div>
                      <div>{order.deliveryNotes}</div>
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <div className="pt-2">
                  {getActionButton(order)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {activeOrders.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-success" />
              <h3 className="font-semibold mb-2">All deliveries completed!</h3>
              <p className="text-muted-foreground">Check back later for new delivery assignments.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Delivery Notes Dialog */}
      <Dialog open={!!deliveryNotesDialog} onOpenChange={() => setDeliveryNotesDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as Delivered</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Add optional notes about the delivery completion:
            </p>
            <Textarea
              placeholder="Delivery notes (optional)..."
              value={deliveryNotes}
              onChange={(e) => setDeliveryNotes(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeliveryNotesDialog(null)}>
              Cancel
            </Button>
            <Button onClick={confirmDelivery}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Confirm Delivery
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
