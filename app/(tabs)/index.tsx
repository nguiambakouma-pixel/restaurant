import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { supabase } from '../lib/supabase';

const { width } = Dimensions.get('window');

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  category_id: string;
  rating_avg: number;
  rating_count: number;
}

interface Category {
  id: string;
  name: string;
  emoji: string | null;
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const { addToCart, getTotalItems } = useCart();
  const { user } = useAuth();

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Hero Carousel State
  const [currentIndex, setCurrentIndex] = useState(0);
  const heroImages = [
    require('../../assets/images/hero.jpeg'),
    require('../../assets/images/burger.jpeg'),
    require('../../assets/images/salade.jpeg'),
    require('../../assets/images/dessert.jpeg'),
  ];

  const heroTexts = [
    { title: 'Bienvenue', subtitle: 'L\'excellence culinaire à votre portée' },
    { title: 'Nos Burgers', subtitle: 'Des créations uniques et savoureuses' },
    { title: 'Végétal', subtitle: 'Fraîcheur et équilibre dans l\'assiette' },
    { title: 'Douceurs', subtitle: 'Pour finir sur une note parfaite' },
  ];

  useEffect(() => {
    loadInitialData();
    startAnimation();

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % heroImages.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const startAnimation = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const loadInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchCategories(), fetchProducts()]);
    } catch (error) {
      console.error('Erreur chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('display_order');
    if (data) setCategories(data);
  };

  const fetchProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('is_available', true)
      .order('name');
    if (data) setProducts(data);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  };

  const getFilteredProducts = () => {
    if (selectedCategory === 'all') return products;
    return products.filter(p => p.category_id === selectedCategory);
  };

  const handleProductPress = (productId: string) => {
    router.push(`../product/${productId}`);
  };

  const handleAddToCart = (item: Product) => {
    addToCart({
      id: parseInt(item.id),
      name: item.name,
      price: item.price,
      image: item.image_url ? { uri: item.image_url } : require('../../assets/images/hero.jpeg'),
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header Flottant */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View>
          <Text style={styles.headerTitle}>
            Salut <Text style={{ color: '#fff' }}>{(user?.user_metadata?.full_name || 'Gourmet').split(' ')[0]}</Text> 👋
          </Text>
          <Text style={styles.headerSubtitle}>Qu'est-ce qui vous ferait plaisir ?</Text>
        </View>
        {getTotalItems() > 0 && (
          <TouchableOpacity
            style={styles.cartBtn}
            onPress={() => router.push('/cart')}
          >
            <Text style={styles.cartCount}>{getTotalItems()}</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#ff6b35" />}
      >
        {/* Hero Section */}
        <Animated.View style={[styles.heroContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Image source={heroImages[currentIndex]} style={styles.heroImage} />
          <View style={styles.heroOverlay}>
            <View style={styles.heroContent}>
              <Animated.Text style={styles.heroTitle}>{heroTexts[currentIndex].title}</Animated.Text>
              <Text style={styles.heroSubtitle}>{heroTexts[currentIndex].subtitle}</Text>
              <TouchableOpacity style={styles.exploreBtn} onPress={() => router.push('/explore')}>
                <Text style={styles.exploreBtnText}>Explorer le menu ✨</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.indicators}>
            {heroImages.map((_, idx) => (
              <View
                key={idx}
                style={[styles.dot, currentIndex === idx && styles.activeDot]}
              />
            ))}
          </View>
        </Animated.View>

        {/* Categories Horizontal Menu */}
        <View style={styles.categorySection}>
          <Text style={styles.sectionTitle}>Découvrir</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryList}
          >
            <TouchableOpacity
              style={[
                styles.categoryChip,
                selectedCategory === 'all' && styles.activeCategoryChip
              ]}
              onPress={() => setSelectedCategory('all')}
            >
              <Text style={[styles.categoryText, selectedCategory === 'all' && styles.activeCategoryText]}>
                Tout
              </Text>
            </TouchableOpacity>

            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryChip,
                  selectedCategory === cat.id && styles.activeCategoryChip
                ]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                <Text style={[styles.categoryText, selectedCategory === cat.id && styles.activeCategoryText]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Nos Spécialités (Grid) */}
        <View style={styles.specialtiesSection}>
          <Text style={styles.sectionTitle}>Nos Spécialités</Text>

          {loading ? (
            <ActivityIndicator size="large" color="#ff6b35" style={{ marginTop: 20 }} />
          ) : (
            <View style={styles.grid}>
              {getFilteredProducts().map((item, index) => (
                <Animated.View
                  key={item.id}
                  style={[
                    styles.cardContainer,
                    {
                      opacity: fadeAnim,
                      transform: [{ translateY: Animated.add(slideAnim, new Animated.Value(index * 10)) }]
                    }
                  ]}
                >
                  <TouchableOpacity
                    style={styles.card}
                    onPress={() => handleProductPress(item.id)}
                    activeOpacity={0.9}
                  >
                    <View style={styles.imageWrapper}>
                      <Image
                        source={item.image_url ? { uri: item.image_url } : require('../../assets/images/hero.jpeg')}
                        style={styles.cardImage}
                      />
                      <View style={styles.priceTag}>
                        <Text style={styles.priceText}>{item.price} FCFA</Text>
                      </View>
                    </View>

                    <View style={styles.cardContent}>
                      <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
                      <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>

                      <View style={styles.cardFooter}>
                        {item.rating_count > 0 ? (
                          <View style={styles.rating}>
                            <Text style={styles.star}>⭐</Text>
                            <Text style={styles.ratingVal}>{item.rating_avg.toFixed(1)}</Text>
                          </View>
                        ) : <View />}

                        <TouchableOpacity style={styles.addBtn} onPress={() => handleAddToCart(item)}>
                          <Text style={styles.addBtnText}>+</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
          )}

          {!loading && getFilteredProducts().length === 0 && (
            <Text style={styles.emptyText}>Aucun plat trouvé dans cette catégorie.</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: 'rgba(18, 18, 18, 0.95)',
    zIndex: 10,
  },
  headerTitle: {
    color: '#ff6b35',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    color: '#888',
    fontSize: 13,
    fontWeight: '500',
  },
  cartBtn: {
    backgroundColor: '#ff6b35',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#ff6b35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  cartCount: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },

  // Hero
  heroContainer: {
    height: 280,
    margin: 20,
    marginBottom: 30,
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)', // Darken image slightly
    justifyContent: 'flex-end',
    padding: 25,
  },
  heroContent: {
    marginBottom: 20,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  heroSubtitle: {
    color: '#eee',
    fontSize: 16,
    marginBottom: 20,
    opacity: 0.9,
  },
  exploreBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 30,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    backdropFilter: 'blur(10px)', // For web, native uses View
  },
  exploreBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  indicators: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  activeDot: {
    backgroundColor: '#ff6b35',
    width: 24,
  },

  // Categories
  categorySection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 20,
    marginBottom: 15,
  },
  categoryList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#252525',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: '#333',
    gap: 8,
  },
  activeCategoryChip: {
    backgroundColor: '#ff6b35',
    borderColor: '#ff6b35',
    transform: [{ scale: 1.05 }],
  },
  categoryEmoji: {
    fontSize: 18,
  },
  categoryText: {
    color: '#888',
    fontWeight: '600',
    fontSize: 14,
  },
  activeCategoryText: {
    color: '#fff',
  },

  // Grid
  specialtiesSection: {
    paddingHorizontal: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  cardContainer: {
    width: (width - 55) / 2, // 2 columns with spacing
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#252525',
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  imageWrapper: {
    height: 140,
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  priceTag: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 12,
    backdropFilter: 'blur(5px)',
  },
  priceText: {
    color: '#ff6b35',
    fontWeight: 'bold',
    fontSize: 13,
  },
  cardContent: {
    padding: 12,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardDesc: {
    color: '#888',
    fontSize: 12,
    marginBottom: 12,
    height: 32,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  star: {
    fontSize: 12,
  },
  ratingVal: {
    color: '#ccc',
    fontSize: 12,
    fontWeight: '600',
  },
  addBtn: {
    backgroundColor: '#ff6b35',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtnText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: -2,
  },
  emptyText: {
    color: '#888',
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
  },
});