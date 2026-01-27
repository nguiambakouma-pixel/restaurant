import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../../lib/supabase';

interface Product {
  id: string;
  category_id: string;
  name: string;
  price: number;
  image_url: string | null;
  is_available: boolean;
  is_vegetarian: boolean;
  is_vegan: boolean;
  is_spicy: boolean;
  rating_avg: number;
  rating_count: number;
}

interface Category {
  id: string;
  name: string;
  emoji: string | null;
}

export default function ProductsScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
      setCategories(categoriesData || []);

      // Charger les produits
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .order('name');

      if (productsError) throw productsError;
      setProducts(productsData || []);
    } catch (error) {
      console.error('Erreur chargement produits:', error);
      Alert.alert('Erreur', 'Impossible de charger les produits');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const toggleAvailability = async (productId: string, currentValue: boolean) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_available: !currentValue })
        .eq('id', productId);

      if (error) throw error;

      // Mettre à jour localement
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, is_available: !currentValue } : p))
      );
    } catch (error) {
      console.error('Erreur toggle disponibilité:', error);
      Alert.alert('Erreur', 'Impossible de modifier la disponibilité');
    }
  };

  const handleDeleteProduct = (productId: string, productName: string) => {
    Alert.alert(
      'Supprimer le produit',
      `Voulez-vous vraiment supprimer "${productName}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', productId);

              if (error) throw error;

              Alert.alert('Succès', 'Produit supprimé');
              loadData();
            } catch (error) {
              console.error('Erreur suppression produit:', error);
              Alert.alert('Erreur', 'Impossible de supprimer le produit');
            }
          },
        },
      ]
    );
  };

  const filteredProducts = selectedCategory
    ? products.filter((p) => p.category_id === selectedCategory)
    : products;

  /* Helper avec memoization implicite via le rendu */
  const getCategoryProductCount = (categoryId: string) => {
    return products.filter((p) => p.category_id === categoryId).length;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Produits</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ff6b35" />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Produits</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/admin/products/add')}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Filtres catégories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryFilters}
        contentContainerStyle={styles.categoryFiltersContent}
      >
        <TouchableOpacity
          style={[styles.categoryChip, !selectedCategory && styles.categoryChipActive]}
          onPress={() => setSelectedCategory('')}
        >
          <Text
            style={[
              styles.categoryChipText,
              !selectedCategory && styles.categoryChipTextActive,
            ]}
          >
            Tout ({products.length})
          </Text>
        </TouchableOpacity>

        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryChip,
              selectedCategory === category.id && styles.categoryChipActive,
            ]}
            onPress={() => setSelectedCategory(category.id)}
          >
            <Text style={styles.categoryEmoji}>{category.emoji || '🍴'}</Text>
            <Text
              style={[
                styles.categoryChipText,
                selectedCategory === category.id && styles.categoryChipTextActive,
              ]}
            >
              {category.name} ({getCategoryProductCount(category.id)})
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Liste des produits */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#ff6b35" />
        }
      >
        {filteredProducts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>📦</Text>
            <Text style={styles.emptyTitle}>Aucun produit</Text>
            <Text style={styles.emptyText}>
              {selectedCategory
                ? 'Aucun produit dans cette catégorie'
                : 'Commencez par ajouter des produits'}
            </Text>
          </View>
        ) : (
          filteredProducts.map((product) => {
            const category = categories.find((c) => c.id === product.category_id);
            return (
              <View key={product.id} style={styles.productCard}>
                <Image
                  source={
                    product.image_url
                      ? { uri: product.image_url }
                      : require('../../../assets/images/hero.jpeg')
                  }
                  style={styles.productImage}
                  defaultSource={require('../../../assets/images/hero.jpeg')}
                />

                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{product.name}</Text>
                  <Text style={styles.productCategory}>
                    {category?.emoji} {category?.name}
                  </Text>
                  <Text style={styles.productPrice}>{product.price.toFixed(0)} FCFA</Text>

                  {/* Badges */}
                  <View style={styles.badges}>
                    {product.is_vegetarian && (
                      <View style={[styles.badge, styles.badgeVegetarian]}>
                        <Text style={styles.badgeText}>🌱 Végétarien</Text>
                      </View>
                    )}
                    {product.is_vegan && (
                      <View style={[styles.badge, styles.badgeVegan]}>
                        <Text style={styles.badgeText}>🌿 Vegan</Text>
                      </View>
                    )}
                    {product.is_spicy && (
                      <View style={[styles.badge, styles.badgeSpicy]}>
                        <Text style={styles.badgeText}>🌶️ Épicé</Text>
                      </View>
                    )}
                  </View>

                  {/* Rating */}
                  {product.rating_count > 0 && (
                    <Text style={styles.productRating}>
                      ⭐ {product.rating_avg.toFixed(1)} ({product.rating_count} avis)
                    </Text>
                  )}

                  {/* Switch disponibilité */}
                  <View style={styles.availabilityRow}>
                    <Text style={styles.availabilityLabel}>Disponible</Text>
                    <Switch
                      value={product.is_available}
                      onValueChange={() => toggleAvailability(product.id, product.is_available)}
                      trackColor={{ false: '#767577', true: '#ff6b35' }}
                      thumbColor="white"
                    />
                  </View>

                  {/* Actions */}
                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => router.push(`/admin/products/edit/${product.id}`)}
                    >
                      <Text style={styles.editButtonText}>✏️ Modifier</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteProduct(product.id, product.name)}
                    >
                      <Text style={styles.deleteButtonText}>🗑️ Supprimer</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    backgroundColor: '#2d2d2d',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: '#444',
  },
  backButtonText: {
    fontSize: 24,
    color: '#ff6b35',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ff6b35',
    flex: 1,
    textAlign: 'center',
  },
  addButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: '#ff6b35',
  },
  addButtonText: {
    fontSize: 28,
    color: 'white',
    fontWeight: 'bold',
  },
  headerSpacer: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#ccc',
    marginTop: 10,
  },
  categoryFilters: {
    maxHeight: 70,
    backgroundColor: '#2d2d2d',
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  categoryFiltersContent: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    gap: 10,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#444',
    gap: 5,
  },
  categoryChipActive: {
    backgroundColor: '#ff6b35',
    borderColor: '#ff6b35',
  },
  categoryEmoji: {
    fontSize: 16,
  },
  categoryChipText: {
    color: '#ccc',
    fontSize: 14,
    fontWeight: '600',
  },
  categoryChipTextActive: {
    color: 'white',
  },
  content: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    minHeight: 400,
  },
  emptyEmoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  productCard: {
    backgroundColor: '#2d2d2d',
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 15,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  productImage: {
    width: 100,
    height: 100,
    resizeMode: 'cover',
  },
  productInfo: {
    flex: 1,
    padding: 15,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  productCategory: {
    fontSize: 14,
    color: '#999',
    marginBottom: 5,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ff6b35',
    marginBottom: 10,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginBottom: 10,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgeVegetarian: {
    backgroundColor: '#4CAF50',
  },
  badgeVegan: {
    backgroundColor: '#8BC34A',
  },
  badgeSpicy: {
    backgroundColor: '#FF5722',
  },
  badgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },
  productRating: {
    fontSize: 12,
    color: '#ccc',
    marginBottom: 10,
  },
  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  availabilityLabel: {
    fontSize: 14,
    color: '#ccc',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  editButton: {
    flex: 1,
    backgroundColor: '#2196F3',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButtonText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#F44336',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
  },
});