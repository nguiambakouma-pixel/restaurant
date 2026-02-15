import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Animated,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import LoadingScreen from '../../components/ui/LoadingScreen';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { supabase } from '../lib/supabase';

const { width, height } = Dimensions.get('window');

// Images du diaporama - Vous pourrez les modifier manuellement ici
const SLIDER_IMAGES = [
  require('../../assets/images/Shawarma.jpeg'),
  require('../../assets/images/noodle.jpeg'),
  require('../../assets/images/poulet_frites.jpeg'),
  require('../../assets/images/poulet_marinade.jpeg'),
];

interface Product {
  id: string;
  category_id: string;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  is_available: boolean;
  rating_avg: number;
  rating_count: number;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  emoji: string | null;
}

export default function HomeScreen() {
  const { t } = useTranslation();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [plats, setPlats] = useState<Product[]>([]);
  const [boissons, setBoissons] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { addToCart, getTotalItems } = useCart();
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Auto-scroll du diaporama
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDER_IMAGES.length);
    }, 4000); // Change toutes les 4 secondes

    return () => clearInterval(interval);
  }, []);

  // Animation de fade lors du changement de slide
  useEffect(() => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0.7,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentSlide]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Charger tous les produits disponibles
      const { data: productsData } = await supabase
        .from('products')
        .select('*, categories(name, slug)')
        .eq('is_available', true)
        .order('rating_avg', { ascending: false });

      if (productsData) {
        // Séparer plats et boissons
        const platsData = productsData.filter(
          (p: any) => p.categories?.slug !== 'boissons'
        );
        const boissonsData = productsData.filter(
          (p: any) => p.categories?.slug === 'boissons'
        );

        setPlats(platsData.slice(0, 6)); // Top 6 plats
        setBoissons(boissonsData.slice(0, 4)); // Top 4 boissons
      }
    } catch (error) {
      console.error('Erreur chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProductPress = (productId: string) => {
    router.push(`/product/${productId}`);
  };

  const handleAddToCart = (product: Product) => {
    addToCart({
      id: parseInt(product.id),
      name: product.name,
      price: product.price,
      image: product.image_url
        ? { uri: product.image_url }
        : require('../../assets/images/hero.jpeg'),
    });
  };

  if (loading) {
    return <LoadingScreen />;
  }

  const userName = user?.user_metadata?.full_name?.split(' ')[0] || 'Gourmet';

  return (
    <View style={styles.container}>
      {/* Header avec badge panier */}
      <View style={styles.topBar}>
        <View>
          <Image
            source={require('../../assets/images/logo_delice.jpg')}
            style={styles.logo}
          />
          <Text style={styles.welcomeText}>{t('home.welcome')}</Text>
          <Text style={styles.userName}>{userName}</Text>
        </View>
        {getTotalItems() > 0 && (
          <TouchableOpacity
            style={styles.cartButton}
            onPress={() => router.push('/cart')}
          >
            <Text style={styles.cartIcon}>🛒</Text>
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{getTotalItems()}</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* DIAPORAMA ÉLÉGANT */}
        <View style={styles.sliderSection}>
          <Animated.View style={[styles.sliderContainer, { opacity: fadeAnim }]}>
            <Image source={SLIDER_IMAGES[currentSlide]} style={styles.sliderImage} />
            <View style={styles.sliderOverlay}>
              <View style={styles.sliderContent}>
                <Text style={styles.sliderSubtitle}>{t('home.features.specialties')}</Text>
                <Text style={styles.sliderTitle}>{t('home.features.fineCuisine')}</Text>
                <Text style={styles.sliderDescription}>
                  {t('home.features.chefPassion')}
                </Text>
                <TouchableOpacity
                  style={styles.sliderButton}
                  onPress={() => router.push('/explore')}
                >
                  <Text style={styles.sliderButtonText}>{t('home.features.discoverMenu')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>

          {/* Indicateurs de slide */}
          <View style={styles.indicators}>
            {SLIDER_IMAGES.map((_, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.indicator,
                  currentSlide === index && styles.indicatorActive,
                ]}
                onPress={() => setCurrentSlide(index)}
              />
            ))}
          </View>
        </View>

        {/* SECTION MENU DU JOUR */}
        <View style={styles.menuSection}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionSubtitle}>{t('home.sections.selection')}</Text>
              <Text style={styles.sectionTitle}>{t('home.sections.dailyMenu')}</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/explore')}>
              <Text style={styles.seeAllLink}>{t('common.seeAll')} →</Text>
            </TouchableOpacity>
          </View>

          {/* Grille de plats */}
          <View style={styles.dishesGrid}>
            {plats.map((plat) => (
              <TouchableOpacity
                key={plat.id}
                style={styles.dishCard}
                onPress={() => handleProductPress(plat.id)}
                activeOpacity={0.9}
              >
                <Image
                  source={
                    plat.image_url
                      ? { uri: plat.image_url }
                      : require('../../assets/images/hero.jpeg')
                  }
                  style={styles.dishImage}
                  defaultSource={require('../../assets/images/hero.jpeg')}
                />
                <View style={styles.dishInfo}>
                  <Text style={styles.dishName} numberOfLines={1}>
                    {plat.name}
                  </Text>
                  <Text style={styles.dishDescription} numberOfLines={2}>
                    {plat.description || 'Plat savoureux préparé avec soin'}
                  </Text>
                  <View style={styles.dishFooter}>
                    <View>
                      <Text style={styles.dishPrice}>{plat.price.toFixed(0)} FCFA</Text>
                      {plat.rating_count > 0 && (
                        <View style={styles.ratingRow}>
                          <Text style={styles.starIcon}>⭐</Text>
                          <Text style={styles.ratingText}>
                            {plat.rating_avg.toFixed(1)} ({plat.rating_count})
                          </Text>
                        </View>
                      )}
                    </View>
                    <TouchableOpacity
                      style={styles.addToCartBtn}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleAddToCart(plat);
                      }}
                    >
                      <Text style={styles.addToCartText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* SECTION BOISSONS */}
        {boissons.length > 0 && (
          <View style={styles.drinksSection}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionSubtitle}>{t('home.sections.accompany')}</Text>
                <Text style={styles.sectionTitle}>{t('home.sections.drinks')}</Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/explore')}>
                <Text style={styles.seeAllLink}>{t('common.seeAll')} →</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.drinksScroll}
            >
              {boissons.map((boisson) => (
                <TouchableOpacity
                  key={boisson.id}
                  style={styles.drinkCard}
                  onPress={() => handleProductPress(boisson.id)}
                >
                  <Image
                    source={
                      boisson.image_url
                        ? { uri: boisson.image_url }
                        : require('../../assets/images/hero.jpeg')
                    }
                    style={styles.drinkImage}
                    defaultSource={require('../../assets/images/hero.jpeg')}
                  />
                  <Text style={styles.drinkName} numberOfLines={1}>
                    {boisson.name}
                  </Text>
                  <View style={styles.drinkPriceRow}>
                    <Text style={styles.drinkPrice}>{boisson.price.toFixed(0)} FCFA</Text>
                    <TouchableOpacity
                      style={styles.drinkAddBtn}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleAddToCart(boisson);
                      }}
                    >
                      <Text style={styles.drinkAddText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* CTA FINAL */}
        <View style={styles.ctaSection}>
          <View style={styles.ctaCard}>
            <Text style={styles.ctaIcon}>🍽️</Text>
            <Text style={styles.ctaTitle}>{t('home.cta.wantMore')}</Text>
            <Text style={styles.ctaText}>
              {t('home.cta.fullMenuDesc')}
            </Text>
            <TouchableOpacity
              style={styles.ctaButton}
              onPress={() => router.push('/explore')}
            >
              <Text style={styles.ctaButtonText}>{t('home.cta.exploreFull')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
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
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: '#1a1a1a',
  },
  welcomeText: {
    fontSize: 14,
    color: '#999',
    marginBottom: 2,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  cartButton: {
    position: 'relative',
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2d2d2d',
    borderRadius: 25,
  },
  cartIcon: {
    fontSize: 24,
  },
  cartBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: '#ff6b35',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  cartBadgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
  sliderSection: {
    marginBottom: 30,
  },
  sliderContainer: {
    height: height * 0.5,
    position: 'relative',
  },
  sliderImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  sliderOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sliderContent: {
    padding: 30,
  },
  sliderSubtitle: {
    fontSize: 14,
    color: '#ff6b35',
    marginBottom: 8,
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  sliderTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 10,
  },
  sliderDescription: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 25,
    lineHeight: 24,
  },
  sliderButton: {
    backgroundColor: '#ff6b35',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
    alignSelf: 'flex-start',
    elevation: 8,
    shadowColor: '#ff6b35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  sliderButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#444',
  },
  indicatorActive: {
    width: 24,
    backgroundColor: '#ff6b35',
  },
  menuSection: {
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#ff6b35',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 5,
  },
  sectionTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: 'white',
  },
  seeAllLink: {
    fontSize: 14,
    color: '#ff6b35',
    fontWeight: '600',
  },
  dishesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  dishCard: {
    width: (width - 50) / 2,
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2d2d2d',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  dishImage: {
    width: '100%',
    height: 140,
    resizeMode: 'cover',
  },
  dishInfo: {
    padding: 12,
  },
  dishName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  dishDescription: {
    fontSize: 12,
    color: '#999',
    lineHeight: 16,
    marginBottom: 10,
  },
  dishFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  dishPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ff6b35',
    marginBottom: 3,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  starIcon: {
    fontSize: 10,
  },
  ratingText: {
    fontSize: 11,
    color: '#999',
  },
  addToCartBtn: {
    backgroundColor: '#ff6b35',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#ff6b35',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
  },
  addToCartText: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: -2,
  },
  drinksSection: {
    marginBottom: 40,
  },
  drinksScroll: {
    paddingLeft: 20,
    paddingRight: 10,
  },
  drinkCard: {
    width: 140,
    backgroundColor: '#1a1a1a',
    borderRadius: 15,
    marginRight: 15,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2d2d2d',
  },
  drinkImage: {
    width: '100%',
    height: 140,
    resizeMode: 'cover',
  },
  drinkName: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    padding: 12,
    paddingBottom: 8,
  },
  drinkPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  drinkPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff6b35',
  },
  drinkAddBtn: {
    backgroundColor: '#ff6b35',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  drinkAddText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: -2,
  },
  ctaSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  ctaCard: {
    backgroundColor: '#ff6b35',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
  },
  ctaIcon: {
    fontSize: 50,
    marginBottom: 15,
  },
  ctaTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
    textAlign: 'center',
  },
  ctaText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  ctaButton: {
    backgroundColor: 'white',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
  },
  ctaButtonText: {
    color: '#ff6b35',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logo: {
    width: 60,
    height: 60,
    resizeMode: 'contain',
    marginBottom: 5,
    borderRadius: 30,
  },
});