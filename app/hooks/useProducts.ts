import { useEffect, useState } from 'react';
import { Category, Product, supabase } from '../lib/supabase';

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Charger les catégories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .order('display_order');

      if (categoriesError) throw categoriesError;
      
      // Charger les produits
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('is_available', true)
        .order('name');

      if (productsError) throw productsError;

      setCategories(categoriesData || []);
      setProducts(productsData || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error('Erreur chargement données:', err);
    } finally {
      setLoading(false);
    }
  };

  const getProductsByCategory = (categorySlug: string) => {
    const category = categories.find(c => c.slug === categorySlug);
    if (!category) return [];
    
    return products.filter(p => p.category_id === category.id);
  };

  const refreshProducts = () => {
    loadData();
  };

  return {
    products,
    categories,
    loading,
    error,
    getProductsByCategory,
    refreshProducts,
  };
};

export default useProducts;