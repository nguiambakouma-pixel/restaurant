import { useEffect, useState } from 'react';
import { Product, supabase } from '../lib/supabase';

interface Review {
  id: string;
  user_id: string;
  product_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  profiles: {
    full_name: string | null;
  } | null;
}

interface Category {
  name: string;
  emoji: string | null;
}

export const useProductDetail = (productId: string | string[]) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (productId) {
      loadProductDetails();
    }
  }, [productId]);

  const loadProductDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // Charger le produit
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (productError) throw productError;
      setProduct(productData);

      // Charger la catégorie
      if (productData.category_id) {
        const { data: categoryData } = await supabase
          .from('categories')
          .select('name, emoji')
          .eq('id', productData.category_id)
          .single();
        
        if (categoryData) setCategory(categoryData);
      }

      // Charger les avis avec les profils
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select(`
          *,
          profiles:user_id (
            full_name
          )
        `)
        .eq('product_id', productId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (reviewsData) setReviews(reviewsData);

    } catch (err: any) {
      console.error('Erreur chargement produit:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const refreshProduct = () => {
    loadProductDetails();
  };

  return {
    product,
    category,
    reviews,
    loading,
    error,
    refreshProduct,
  };
};

export default useProductDetail;