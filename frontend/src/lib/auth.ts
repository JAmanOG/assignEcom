import axios from "@/lib/axios";
import type { User,UserRole } from "@/types/type";

// Mock authentication - in real app, this would connect to your backend
class AuthService {
  private currentUser: User | null = null;

  // Mock users for demo
  private mockUsers: User[] = [];

  async login(email: string, password: string): Promise<User> {
    console.log("Logging in with email:", email);
    const user: User = await axios.post(`/api/auth/login`, {
      email,
      password,
    }).then(response => {
      const { user, tokens } = response.data;
      if (tokens?.accessToken) {
        localStorage.setItem("accessToken", tokens.accessToken);
        if (tokens.refreshToken) {
          localStorage.setItem("refreshToken", tokens.refreshToken);
        }
      }
      return user;
    });
    console.log("Login successful:", user);
    this.currentUser = user;
    localStorage.setItem('user', JSON.stringify(user));
    return user;
  }

  async register(full_name: string, email: string, password: string, phone: string): Promise<User> {
    const newUser: User = await axios.post(`/api/auth/register`, {
      full_name,
      email,
      password,
      phone,
    }).then(response => {
      const { user, tokens } = response.data;
      if (tokens?.accessToken) {
        localStorage.setItem("accessToken", tokens.accessToken);
        if (tokens.refreshToken) {
          localStorage.setItem("refreshToken", tokens.refreshToken);
        }
      }
      return user;
    }).catch(error => {
      throw new Error(error.response?.data?.message || 'Registration failed');
    });
    this.mockUsers.push(newUser);
    this.currentUser = newUser;
    localStorage.setItem('user', JSON.stringify(newUser));
    return newUser;
  }

  async logout(): Promise<void> {
    await axios.post(`/auth/logout`);
    this.currentUser = null;
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  async getCurrentUser(): Promise<User | null> {
    if (this.currentUser) return this.currentUser;
    const getCurrentUser = await axios.get(`/api/auth/me`)
    .then(r => r.data)
      .catch(_error => {
        this.currentUser = null;
        return null;
      });
    if (!getCurrentUser) return null;
    this.currentUser = getCurrentUser.user;
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