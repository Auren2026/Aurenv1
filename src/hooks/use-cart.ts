import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  code: string;
  price: number;
  unitsPerBox: number;
  quantity: number;
  imageUrl?: string;
  sellByBox?: boolean;
  unitsInBox?: number;
}

interface CartStore {
  items: CartItem[];
  totalItems: number;
  totalAmount: number;
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getItem: (productId: string) => CartItem | undefined;
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      totalItems: 0,
      totalAmount: 0,
      
      addItem: (item, quantity = 1) => {
        set((state) => {
          const existingItem = state.items.find(i => i.productId === item.productId);
          
          let newItems: CartItem[];
          if (existingItem) {
            newItems = state.items.map(i =>
              i.productId === item.productId
                ? { ...i, quantity: i.quantity + quantity }
                : i
            );
          } else {
            // Gerar ID único sem depender de crypto.randomUUID
            const randomId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            newItems = [...state.items, { ...item, quantity, id: randomId }];
          }
          
          const totalItems = newItems.reduce((sum, item) => sum + item.quantity, 0);
          const totalAmount = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
          
          return { items: newItems, totalItems, totalAmount };
        });
      },
      
      removeItem: (productId) => {
        set((state) => {
          const newItems = state.items.filter(i => i.productId !== productId);
          const totalItems = newItems.reduce((sum, item) => sum + item.quantity, 0);
          const totalAmount = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
          
          return { items: newItems, totalItems, totalAmount };
        });
      },
      
      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        
        set((state) => {
          const newItems = state.items.map(i =>
            i.productId === productId ? { ...i, quantity } : i
          );
          
          const totalItems = newItems.reduce((sum, item) => sum + item.quantity, 0);
          const totalAmount = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
          
          return { items: newItems, totalItems, totalAmount };
        });
      },
      
      clearCart: () => {
        set({ items: [], totalItems: 0, totalAmount: 0 });
      },
      
      getItem: (productId) => {
        return get().items.find(i => i.productId === productId);
      },
    }),
    {
      name: 'cart-storage',
    }
  )
);
