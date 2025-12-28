"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { api } from "@/lib/api";

interface CartVariant {
  id: string;
  sku: string | null;
  priceHt: string;
  product: {
    id: string;
    name: string;
    slug: string;
    featuredImage: string | null;
  };
}

interface CartItem {
  id: string;
  variant: CartVariant;
  quantity: number;
  dateAdded: Date;
}

interface Cart {
  id: string | null;
  status: "active" | "converted" | "abandoned" | "empty";
  items: CartItem[];
  itemCount: number;
  totalHt: string;
  dateCreated: Date | null;
  dateUpdated: Date | null;
}

interface CartContextValue {
  cart: Cart | null;
  isLoading: boolean;
  error: string | null;
  addItem: (variantId: string, quantity?: number) => Promise<void>;
  updateItem: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refresh: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCart = useCallback(async () => {
    try {
      setError(null);
      const { data, error: fetchError } = await api.cart.get();

      if (fetchError) {
        throw new Error("Erreur lors du chargement du panier");
      }

      if (data) {
        setCart(data as Cart);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addItem = async (variantId: string, quantity = 1) => {
    setIsLoading(true);
    try {
      setError(null);
      const { error: addError } = await api.cart.items.post({
        variantId,
        quantity,
      });

      if (addError) {
        throw new Error("Erreur lors de l'ajout au panier");
      }

      await fetchCart();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateItem = async (itemId: string, quantity: number) => {
    setIsLoading(true);
    try {
      setError(null);
      const { error: updateError } = await api.cart.items({ id: itemId }).patch(
        { quantity }
      );

      if (updateError) {
        throw new Error("Erreur lors de la mise à jour du panier");
      }

      await fetchCart();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const removeItem = async (itemId: string) => {
    setIsLoading(true);
    try {
      setError(null);
      const { error: deleteError } = await api.cart.items({ id: itemId }).delete();

      if (deleteError) {
        throw new Error("Erreur lors de la suppression de l'article");
      }

      await fetchCart();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const clearCart = async () => {
    setIsLoading(true);
    try {
      setError(null);
      const { error: clearError } = await api.cart.delete();

      if (clearError) {
        throw new Error("Erreur lors du vidage du panier");
      }

      await fetchCart();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        isLoading,
        error,
        addItem,
        updateItem,
        removeItem,
        clearCart,
        refresh: fetchCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
