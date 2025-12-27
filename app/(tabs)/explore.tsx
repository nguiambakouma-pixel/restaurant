import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useCart } from '../context/CartContext';
import { supabase } from '../lib/supabase';

interface Product {
  id: string;
  category_id: string;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  is_available: boolean;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  emoji: string | null;
  display_order: number;
}

export default function MenuScreen() {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchText, setSearchText] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart, getTotalItems, getTotalPrice } = useCart();

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

      // Sélectionner la première catégorie par défaut
      if (categoriesData && categoriesData.length > 0 && !selectedCategory) {
        setSelectedCategory(categoriesData[0].id);
      }

      // Charger tous les produits
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('is_available', true)
        .order('name');

      if (productsError) throw productsError;
      setProducts(productsData || []);

    } catch (error) {
      console.error('Erreur chargement données:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (item: Product) => {
    addToCart({
      id: parseInt(item.id),
      name: item.name,
      price: item.price,
      image: item.image_url 
        ? { uri: item.image_url }
        : require('../../assets/images/hero.jpeg'),
    });
  };

  const handleProductPress = (productId: string) => {
    router.push(`../product/${productId}`);
  };

  // Filtrer les produits
  const filteredItems = products.filter(item => {
    const matchesCategory = !selectedCategory || item.category_id === selectedCategory;
    const matchesSearch = !searchText || 
      item.name.toLowerCase().includes(searchText.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchText.toLowerCase());
    
    return matchesCategory && matchesSearch;
  });

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Notre Menu</Text>
          <Text style={styles.headerSubtitle}>Chargement...</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ff6b35" />
          <Text style={styles.loadingText}>Chargement du menu...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notre Menu</Text>
        <Text style={styles.headerSubtitle}>Tous nos plats préparés avec amour</Text>
        {getTotalItems() > 0 && (
          <TouchableOpacity 
            style={styles.cartBadge}
            onPress={() => router.push('/cart')}
            activeOpacity={0.8}
          >
            <Text style={styles.cartBadgeText}>{getTotalItems()}</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un plat..."
          placeholderTextColor="#999"
          value={searchText}
          onChangeText={setSearchText}
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => setSearchText('')}>
            <Text style={styles.clearSearch}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryTabs}>
        <TouchableOpacity
          style={[
            styles.categoryTab,
            !selectedCategory && styles.activeTab
          ]}
          onPress={() => setSelectedCategory('')}
          activeOpacity={0.8}
        >
          <Text style={styles.categoryEmoji}>🍽️</Text>
          <Text style={[
            styles.categoryName,
            !selectedCategory && styles.activeCategoryName
          ]}>
            Tout
          </Text>
        </TouchableOpacity>

        {categories.map(category => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryTab,
              selectedCategory === category.id && styles.activeTab
            ]}
            onPress={() => setSelectedCategory(category.id)}
            activeOpacity={0.8}
          >
            <Text style={styles.categoryEmoji}>{category.emoji || '🍴'}</Text>
            <Text style={[
              styles.categoryName,
              selectedCategory === category.id && styles.activeCategoryName
            ]}>
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.menuList} showsVerticalScrollIndicator={false}>
        {filteredItems.map(item => (
          <TouchableOpacity 
            key={item.id} 
            style={styles.menuItem}
            onPress={() => handleProductPress(item.id)}
            activeOpacity={0.9}
          >
            <Image 
              source={
                item.image_url 
                  ? { uri: item.image_url }
                  : require('../../assets/images/hero.jpeg')
              }
              style={styles.itemImage}
              defaultSource={require('../../assets/images/hero.jpeg')}
            />
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemDesc} numberOfLines={2}>
                {item.description || 'Délicieux plat préparé avec soin'}
              </Text>
              <View style={styles.itemFooter}>
                <Text style={styles.itemPrice}>{item.price.toFixed(0)} FCFA</Text>
                <TouchableOpacity 
                  style={styles.addButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleAddToCart(item);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.addButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        ))}
        
        {filteredItems.length === 0 && (
          <View style={styles.noResults}>
            <Text style={styles.noResultsEmoji}>😕</Text>
            <Text style={styles.noResultsText}>Aucun plat trouvé</Text>
            <Text style={styles.noResultsSubtext}>
              {searchText 
                ? 'Essayez avec un autre terme de recherche'
                : 'Aucun plat disponible dans cette catégorie'
              }
            </Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {getTotalItems() > 0 && (
        <TouchableOpacity 
          style={styles.floatingCartButton}
          onPress={() => router.push('/cart')}
          activeOpacity={0.8}
        >
          <Text style={styles.floatingCartText}>
            🛒 Voir Panier ({getTotalItems()}) - {getTotalPrice().toFixed(0)} FCFA
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#ccc',
    marginTop: 10,
    fontSize: 16,
  },
  header: {
    backgroundColor: '#2d2d2d',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    position: 'relative',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ff6b35',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#ccc',
  },
  cartBadge: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: '#ff6b35',
    borderRadius: 15,
    minWidth: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#ff6b35',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  cartBadgeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2d2d2d',
    margin: 20,
    borderRadius: 12,
    paddingHorizontal: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: 'white',
    paddingVertical: 12,
    fontSize: 16,
  },
  clearSearch: {
    color: '#999',
    fontSize: 20,
    padding: 5,
  },
  categoryTabs: {
    maxHeight: 80,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  categoryTab: {
    backgroundColor: '#2d2d2d',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginHorizontal: 5,
    alignItems: 'center',
    minWidth: 85,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  activeTab: {
    backgroundColor: '#ff6b35',
    elevation: 5,
    shadowColor: '#ff6b35',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
  },
  categoryEmoji: {
    fontSize: 22,
    marginBottom: 4,
  },
  categoryName: {
    color: '#ccc',
    fontSize: 12,
    fontWeight: '600',
  },
  activeCategoryName: {
    color: 'white',
    fontWeight: 'bold',
  },
  menuList: {
    flex: 1,
    padding: 20,
  },
  menuItem: {
    backgroundColor: '#2d2d2d',
    flexDirection: 'row',
    borderRadius: 15,
    marginBottom: 15,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  itemImage: {
    width: 110,
    height: 110,
    resizeMode: 'cover',
  },
  itemInfo: {
    flex: 1,
    padding: 15,
    justifyContent: 'space-between',
  },
  itemName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  itemDesc: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 10,
    lineHeight: 18,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ff6b35',
  },
  addButton: {
    backgroundColor: '#ff6b35',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#ff6b35',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  addButtonText: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
  },
  noResults: {
    alignItems: 'center',
    padding: 40,
  },
  noResultsEmoji: {
    fontSize: 60,
    marginBottom: 15,
  },
  noResultsText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  noResultsSubtext: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
  },
  floatingCartButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#ff6b35',
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#ff6b35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  floatingCartText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});