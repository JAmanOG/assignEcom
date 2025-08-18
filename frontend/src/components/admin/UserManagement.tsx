import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, User, Users, ShoppingCart, Truck } from 'lucide-react';
import { useQuery } from "@tanstack/react-query";
import axios from "@/lib/axios";

interface User {
  id: string;
  full_name: string;
  email: string;
  role: 'ADMIN' | 'CUSTOMER' | 'DELIVERY';
  is_active: boolean;
  phone?: string;
  createdAt: string;
  lastLogin: string;
  ordersCount?: number;
  deliveriesCount?: number;
}

const roleColors = {
  ADMIN: 'default',
  CUSTOMER: 'secondary',
  DELIVERY: 'default'
} as const;

const statusColors = {
  active: 'default',
  inactive: 'secondary',
  suspended: 'destructive'
} as const;

export function UserManagement() {
  // const [users, setUsers] = useState<User[]>(mockUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const { data: userData } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await axios.get('/api/auth/users');
      console.log("Fetched users:", res.data.users);
      return res.data.users;
    },
    initialData: [],
    refetchOnWindowFocus: false // Disable refetching on window focus
  });

  const filteredUsers = userData.filter(user => {
    const matchesSearch = user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    const matchesStatus = selectedStatus === 'all' || (user.is_active ? "active" === selectedStatus : "inactive" === selectedStatus);
    return matchesSearch && matchesRole && matchesStatus;
  });


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getUserStats = () => {
    const total = userData.length;
    const customers = userData.filter(u => u.role === 'CUSTOMER').length;
    const delivery = userData.filter(u => u.role === 'DELIVERY').length;
    const active = userData.filter(u => (u.is_active ? "active" : "inactive") === 'active').length;
    const inactive = userData.filter(u => (u.is_active ? "active" : "inactive") === 'inactive').length;
    
    return { total, customers, delivery, active, inactive };
  };

  const stats = getUserStats();

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <User className="w-4 h-4" />;
      case 'CUSTOMER':
        return <ShoppingCart className="w-4 h-4" />;
      case 'DELIVERY':
        return <Truck className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
        <p className="text-muted-foreground">Manage user accounts and permissions</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.customers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivery Personnel</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.delivery}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>
            View and manage all registered users across different roles
          </CardDescription>
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="customer">Customer</SelectItem>
                <SelectItem value="delivery">Delivery</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Activity</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-medium">{user.full_name}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                    <TableCell>
                    <div className="flex items-center space-x-2">
                      {getRoleIcon(user.role)}
                      <Badge
                      variant={roleColors[user.role.toLowerCase() as keyof typeof roleColors]}
                      className="capitalize"
                      >
                      {user.role.toLowerCase()}
                      </Badge>
                    </div>
                    </TableCell>
                    <TableCell>
                    <Badge
                      variant={user.is_active ? statusColors.active : statusColors.inactive}
                      className="capitalize"
                    >
                      {user.is_active ? 'active' : 'inactive'}
                    </Badge>
                    </TableCell>
                    <TableCell>
                    {user.role === 'CUSTOMER' && (
                      <div className="text-sm">
                      {(user as any).orders ? (user as any).orders.length : (user as any).ordersCount || 0} orders
                      </div>
                    )}
                    {user.role === 'DELIVERY' && user.deliveriesCount !== undefined && (
                      <div className="text-sm">{user.deliveriesCount} deliveries</div>
                    )}
                    {user.role === 'ADMIN' && <div className="text-sm">Admin access</div>}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                    {formatDate((user as any).createdAt || (user as any).created_at)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                    {formatDate((user as any).lastLogin || (user as any).updated_at || (user as any).created_at)}
                    </TableCell>
                    <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedUser(user)}
                      >
                        View Details
                      </Button>
                      </DialogTrigger>
                      <DialogContent>
                      <DialogHeader>
                        <DialogTitle>User Details</DialogTitle>
                        <DialogDescription>
                        Complete information for {user.full_name}
                        </DialogDescription>
                      </DialogHeader>
                      {selectedUser && (
                        <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                          <h4 className="font-medium">Personal Information</h4>
                          <div className="mt-2 space-y-2 text-sm">
                            <div>
                            <span className="text-muted-foreground">Name:</span>
                            <div>{selectedUser.full_name}</div>
                            </div>
                            <div>
                            <span className="text-muted-foreground">Email:</span>
                            <div>{selectedUser.email}</div>
                            </div>
                            {selectedUser.phone && (
                            <div>
                              <span className="text-muted-foreground">Phone:</span>
                              <div>{selectedUser.phone}</div>
                            </div>
                            )}
                            <div>
                            <span className="text-muted-foreground">User ID:</span>
                            <div>{selectedUser.id}</div>
                            </div>
                          </div>
                          </div>
                          <div>
                          <h4 className="font-medium">Account Status</h4>
                          <div className="mt-2 space-y-2 text-sm">
                            <div className="flex items-center">
                            <span className="text-muted-foreground">Role:</span>
                            <Badge
                              variant={roleColors[selectedUser.role as keyof typeof roleColors]}
                              className="ml-2 capitalize"
                            >
                              {selectedUser.role}
                            </Badge>
                            </div>
                            <div className="flex items-center">
                            <span className="text-muted-foreground">Status:</span>
                            <Badge
                              variant={selectedUser.is_active ? statusColors.active : statusColors.inactive}
                              className="ml-2 capitalize"
                            >
                              {selectedUser.is_active ? 'active' : 'inactive'}
                            </Badge>
                            </div>
                            <div>
                            <span className="text-muted-foreground">Joined:</span>
                            <div>
                              {formatDateTime(
                              (selectedUser as any).createdAt || (selectedUser as any).created_at
                              )}
                            </div>
                            </div>
                            <div>
                            <span className="text-muted-foreground">Last Update:</span>
                            <div>
                              {formatDateTime(
                              (selectedUser as any).lastLogin ||
                                (selectedUser as any).updated_at ||
                                (selectedUser as any).created_at
                              )}
                            </div>
                            </div>
                          </div>
                          </div>
                        </div>
                            
                            {/* Activity Section */}
                            <div>
                              <h4 className="font-medium">Activity Summary</h4>
                              <div className="mt-2 text-sm">
                                {selectedUser.role === 'CUSTOMER' && (
                                  <div>Total Orders: {selectedUser.ordersCount || 0}</div>
                                )}
                                {selectedUser.role === 'DELIVERY' && (
                                  <div>Total Deliveries: {selectedUser.deliveriesCount || 0}</div>
                                )}
                                {selectedUser.role === 'ADMIN' && (
                                  <div>Administrative access granted</div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}