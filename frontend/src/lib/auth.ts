import axios from "@/lib/axios";
import type { User,UserRole } from "@/types/type";

// Mock authentication - in real app, this would connect to your backend
class AuthService {
  private currentUser: User | null = null;

  // Mock users for demo
  private mockUsers: User[] = [
    {
      id: '1',
      email: 'admin@store.com',
      full_name: 'Store Admin',
      role: 'ADMIN',
      status: 'active',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    },
    {
      id: '2',
      email: 'customer@example.com', 
      full_name: 'John Customer',
      role: 'CUSTOMER',
      status: 'active',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    },
    {
      id: '3',
      email: 'delivery@store.com',
      full_name: 'Mike Delivery',
      role: 'DELIVERY',
      status: 'active',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    }
  ];

  async login(email: string, password: string): Promise<User> {
    // Simple mock authentication
    // const user = this.mockUsers.find(u => u.email === email);
    // if (!user || password !== 'password') {
    //   throw new Error('Invalid credentials');
    // }

    const user: User = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
      email,
      password,
    }).then(response => response.data.user).catch(error => {
      throw new Error(error.response?.data?.message || 'Login failed');
    });
    
    this.currentUser = user;
    localStorage.setItem('user', JSON.stringify(user));
    return user;
  }

  async register(full_name: string, email: string, password: string, phone: string): Promise<User> {
    // Simple mock registration
    // const newUser: User = {
    //   id: (this.mockUsers.length + 1).toString(),
    //   email,
    //   full_name: full_name,
    //   role: 'customer', // Default role for new users
    // };
    const newUser: User = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/register`, {
      full_name,
      email,
      password,
      phone,
    }).then(response => response.data.user).catch(error => {
      throw new Error(error.response?.data?.message || 'Registration failed');
    });
    

    this.mockUsers.push(newUser);
    this.currentUser = newUser;
    localStorage.setItem('user', JSON.stringify(newUser));
    return newUser;
  }

  async logout(): Promise<void> {
    const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/logout`);
    if (response.status !== 200) {
      throw new Error('Logout failed');
    }

    this.currentUser = null;
    localStorage.removeItem('user');
  }

  async getCurrentUser(): Promise<User | null> {
    if (this.currentUser) return this.currentUser;
    
    // const stored = localStorage.getItem('user');
    // if (stored) {
    //   this.currentUser = JSON.parse(stored);
    //   return this.currentUser;
    // }
    const getCurrentUser = await axios.get(`${import.meta.env.VITE_API_URL}/api/auth/me`).then(response => response.data).catch(error => {
      throw new Error(error.response?.data?.message || 'Failed to fetch current user');
    });
    

    if (!getCurrentUser) {
      this.currentUser = null;
      return null;
    }
    this.currentUser = await getCurrentUser.user;

    localStorage.setItem('user', JSON.stringify(this.currentUser));
    return this.currentUser;
  }

  async isAuthenticated(): Promise<boolean> {
    return (await this.getCurrentUser()) !== null;
  }

  async hasRole(role: UserRole): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user?.role === role;
  }
}

export const authService = new AuthService();