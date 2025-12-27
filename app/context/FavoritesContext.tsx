import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface FavoriteProduct {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  addedAt: string;
}

interface FavoritesContextType {
  favorites: FavoriteProduct[];
  loading: boolean;
  isFavorite: (productId: string) => boolean;
  toggleFavorite: (product: FavoriteProduct) => Promise<void>;
  clearFavorites: () => Promise<void>;
  getFavoritesCount: () => number;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

const FAVORITES_STORAGE_KEY = '@bistro_favorites';

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    loadFavorites();
  }, [user]);

  // Charger les favoris (local ou Supabase selon l'auth)
  const loadFavorites = async () => {
    try {
      setLoading(true);

      if (user) {
        // Utilisateur connecté : charger depuis Supabase
        const { data, error } = await supabase
          .from('favorites')
          .select(`
            id,
            created_at,
            products:product_id (
              id,
              name,
              price,
              image_url
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Erreur Supabase favoris:', error);
          // En cas d'erreur, charger les favoris locaux
          await loadLocalFavorites();
          return;
        }

        const formattedFavorites = data?.map((fav: any) => ({
          id: fav.products?.id || '',
          name: fav.products?.name || '',
          price: fav.products?.price || 0,
          image_url: fav.products?.image_url || null,
          addedAt: fav.created_at,
        })).filter(f => f.id) || [];

        setFavorites(formattedFavorites);
      } else {
        // Non connecté : charger depuis AsyncStorage
        await loadLocalFavorites();
      }
    } catch (error) {
      console.error('Erreur chargement favoris:', error);
      await loadLocalFavorites();
    } finally {
      setLoading(false);
    }
  };

  const loadLocalFavorites = async () => {
    try {
      const stored = await AsyncStorage.getItem(FAVORITES_STORAGE_KEY);
      if (stored) {
        setFavorites(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Erreur chargement local:', error);
    }
  };

  // Sauvegarder localement
  const saveFavoritesLocally = async (newFavorites: FavoriteProduct[]) => {
    try {
      await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(newFavorites));
    } catch (error) {
      console.error('Erreur sauvegarde locale:', error);
    }
  };

  // Vérifier si un produit est favori
  const isFavorite = (productId: string): boolean => {
    return favorites.some(fav => fav.id === productId);
  };

  // Ajouter/retirer des favoris
  const toggleFavorite = async (product: FavoriteProduct) => {
    // OBLIGATOIRE : Vérifier la connexion
    if (!user) {
      throw new Error('CONNEXION_REQUISE');
    }

    try {
      const isAlreadyFavorite = isFavorite(product.id);

      // Utilisateur connecté : gérer dans Supabase
      if (isAlreadyFavorite) {
        // Supprimer
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', product.id);

        if (error) throw error;

        setFavorites(prev => prev.filter(fav => fav.id !== product.id));
      } else {
        // Ajouter
        const { error } = await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            product_id: product.id,
          });

        if (error) throw error;

        const newFavorite = {
          ...product,
          addedAt: new Date().toISOString(),
        };
        setFavorites(prev => [newFavorite, ...prev]);
      }
    } catch (error) {
      console.error('Erreur toggle favori:', error);
      throw error;
    }
  };

  // Vider tous les favoris
  const clearFavorites = async () => {
    try {
      if (user) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        await AsyncStorage.removeItem(FAVORITES_STORAGE_KEY);
      }

      setFavorites([]);
    } catch (error) {
      console.error('Erreur clear favoris:', error);
      throw error;
    }
  };

  // Obtenir le nombre de favoris
  const getFavoritesCount = (): number => {
    return favorites.length;
  };

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        loading,
        isFavorite,
        toggleFavorite,
        clearFavorites,
        getFavoritesCount,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}

export default FavoritesContext;