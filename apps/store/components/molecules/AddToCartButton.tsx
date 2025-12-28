"use client";

import { useState } from "react";
import { useCart } from "@/providers/CartProvider";
import Button from "@/components/atoms/Button";
import QuantitySelector from "@/components/atoms/QuantitySelector";

interface AddToCartButtonProps {
  variantId: string;
  disabled?: boolean;
}

export default function AddToCartButton({
  variantId,
  disabled = false,
}: AddToCartButtonProps) {
  const { addItem, isLoading } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const handleAddToCart = async () => {
    try {
      await addItem(variantId, quantity);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch {
      // Error handled by CartProvider
    }
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <QuantitySelector
        value={quantity}
        onChange={setQuantity}
        min={1}
        max={99}
        disabled={disabled}
      />
      <Button
        onClick={handleAddToCart}
        disabled={disabled || isLoading}
        loading={isLoading}
        className="flex-1 sm:flex-none"
        size="lg"
      >
        {added ? "Ajouté !" : disabled ? "Rupture de stock" : "Ajouter au panier"}
      </Button>
    </div>
  );
}
