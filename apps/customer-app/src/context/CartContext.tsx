import React, { createContext, useState, useContext } from 'react';

export interface CartItem {
  id: string; // unique item id (productId + serialized options)
  product: {
    id: string;
    name: string;
    price: number; // Storing the adjusted unit price
    imageUrl: string | null;
    description: string | null;
  };
  quantity: number;
  options: {
    size: string;
    milk: string;
    sweetness: string;
    syrup: string;
    extraShot: string;
  };
}

interface CartContextType {
  items: CartItem[];
  addToCart: (
    product: any,
    quantity: number,
    options: { size: string; milk: string; sweetness: string; syrup: string; extraShot: string },
    adjustedPrice: number
  ) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartItemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  const addToCart = (
    product: any,
    quantity: number,
    options: { size: string; milk: string; sweetness: string; syrup: string; extraShot: string },
    adjustedPrice: number
  ) => {
    // Generate unique ID based on product ID and serialized options
    const serializedOptions = `${options.size}-${options.milk}-${options.sweetness}-${options.syrup}-${options.extraShot}`;
    const id = `${product.id}-${serializedOptions}`;

    setItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.id === id);

      if (existingItem) {
        return prevItems.map((item) =>
          item.id === id ? { ...item, quantity: item.quantity + quantity } : item
        );
      }

      return [
        ...prevItems,
        {
          id,
          product: {
            id: product.id,
            name: product.name,
            price: adjustedPrice,
            imageUrl: product.imageUrl,
            description: product.description,
          },
          quantity,
          options,
        },
      ];
    });
  };

  const removeFromCart = (id: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    setItems((prevItems) =>
      prevItems.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const cartTotal = items.reduce((total, item) => total + item.product.price * item.quantity, 0);

  const cartItemCount = items.reduce((count, item) => count + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal,
        cartItemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
