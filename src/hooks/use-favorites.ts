import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FavoriteProduct {
  id: string;
  name: string;
  code: string;
  price: number;
  imageUrl: string;
  unitsPerBox: number;
  sellByBox?: boolean;
  unitsInBox?: number;
}

interface FavoritesStore {
  favorites: FavoriteProduct[];
  addFavorite: (product: FavoriteProduct) => void;
  removeFavorite: (productId: string) => void;
  isFavorite: (productId: string) => boolean;
  toggleFavorite: (product: FavoriteProduct) => void;
}

export const useFavorites = create<FavoritesStore>()(
  persist(
    (set, get) => ({
      favorites: [],
      
      addFavorite: (product) => {
        set((state) => {
          // Verifica se já existe
          if (state.favorites.some((fav) => fav.id === product.id)) {
            return state;
          }
          return { favorites: [...state.favorites, product] };
        });
      },
      
      removeFavorite: (productId) => {
        set((state) => ({
          favorites: state.favorites.filter((fav) => fav.id !== productId),
        }));
      },
      
      isFavorite: (productId) => {
        return get().favorites.some((fav) => fav.id === productId);
      },
      
      toggleFavorite: (product) => {
        const { isFavorite, addFavorite, removeFavorite } = get();
        if (isFavorite(product.id)) {
          removeFavorite(product.id);
        } else {
          addFavorite(product);
        }
      },
    }),
    {
      name: 'auren-favorites-storage',
    }
  )
);
