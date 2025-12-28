"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useCart } from "./CartProvider";

interface Customer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  emailVerified: boolean;
  marketingOptin: boolean;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  marketingOptin?: boolean;
}

interface LoginData {
  email: string;
  password: string;
}

interface AuthContextValue {
  customer: Customer | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { refresh: refreshCart } = useCart();

  const fetchCustomer = useCallback(async () => {
    try {
      setError(null);
      const { data, error: fetchError } = await api.customer.auth.me.get();

      if (fetchError || !data) {
        setCustomer(null);
        return;
      }

      setCustomer(data.customer as Customer);
    } catch {
      setCustomer(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomer();
  }, [fetchCustomer]);

  const login = async (data: LoginData) => {
    setIsLoading(true);
    try {
      setError(null);
      const { data: response, error: loginError } =
        await api.customer.auth.login.post(data);

      if (loginError) {
        const errorMessage =
          "message" in loginError ? String(loginError.message) : "Erreur de connexion";
        setError(errorMessage);
        throw new Error(errorMessage);
      }

      if (response?.customer) {
        setCustomer({
          ...response.customer,
          phone: null,
          emailVerified: false,
          marketingOptin: false,
        });

        // Merge anonymous cart with customer cart
        try {
          await api.cart.merge.post({});
          await refreshCart();
        } catch {
          // Silent fail - cart merge is optional
        }

        router.push("/compte");
      }
    } catch (err) {
      if (err instanceof Error && !error) {
        setError(err.message);
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    setIsLoading(true);
    try {
      setError(null);
      const { data: response, error: registerError } =
        await api.customer.auth.register.post(data);

      if (registerError) {
        const errorMessage =
          "message" in registerError
            ? String(registerError.message)
            : "Erreur lors de l'inscription";
        setError(errorMessage);
        throw new Error(errorMessage);
      }

      if (response?.customer) {
        setCustomer(response.customer as Customer);

        // Merge anonymous cart with customer cart
        try {
          await api.cart.merge.post({});
          await refreshCart();
        } catch {
          // Silent fail - cart merge is optional
        }

        router.push("/compte");
      }
    } catch (err) {
      if (err instanceof Error && !error) {
        setError(err.message);
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      setError(null);
      await api.customer.auth.logout.post({});
      setCustomer(null);
      await refreshCart();
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la déconnexion");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        customer,
        isLoading,
        isAuthenticated: !!customer,
        error,
        login,
        register,
        logout,
        refresh: fetchCustomer,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
