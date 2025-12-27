import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import AddReviewModal from '../../../components/AddReviewModal';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useFavorites } from '../../context/FavoritesContext';
import { supabase } from '../../lib/supabase';

const { width, height } = Dimensions.get('window');

interface Product {
  id: string;
  category_id: string;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  preparation_time: number | null;
  is_available: boolean;
  is_vegetarian: boolean;
  is_vegan: boolean;
  is_spicy: boolean;
  allergens: string[] | null;
  ingredients: string[] | null;
  calories: number | null;
  rating_avg: number;
  rating_count: number;
  created_at: string;
  updated_at: string;
}

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

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [activeTab, setActiveTab] = useState<'ingredients' | 'reviews'>('ingredients');
  const [showReviewModal, setShowReviewModal] = useState(false);
  
  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadProductDetails();
  }, [id]);

  useEffect(() => {
    if (product) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }
  }, [product]);

  const loadProductDetails = async () => {
    try {
      setLoading(true);

      // Charger le produit
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
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

      // Charger les avis
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select(`
          *,
          profiles:user_id (
            full_name
          )
        `)
        .eq('product_id', id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (reviewsData) setReviews(reviewsData);

    } catch (error: any) {
      console.error('Erreur chargement produit:', error);
      Alert.alert('Erreur', 'Impossible de charger les détails du produit');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;

    for (let i = 0; i < quantity; i++) {
      addToCart({
        id: parseInt(product.id),
        name: product.name,
        price: product.price,
        image: product.image_url 
          ? { uri: product.image_url }
          : require('../../../assets/images/hero.jpeg'),
      });
    }
    
    Alert.alert(
      'Ajouté au panier !',
      `${quantity} x ${product.name} ajouté${quantity > 1 ? 's' : ''} au panier`,
      [
        { text: 'Continuer', style: 'cancel' },
        { text: 'Voir le panier', onPress: () => router.push('/cart') }
      ]
    );
  };

  const handleToggleFavorite = async () => {
    if (!product) return;

    // Vérifier si l'utilisateur est connecté
    if (!user) {
      Alert.alert(
        'Connexion requise',
        'Vous devez être connecté pour ajouter des plats en favoris',
        [
          { text: 'Annuler', style: 'cancel' },
          { 
            text: 'Se connecter', 
            onPress: () => router.push('/login')
          }
        ]
      );
      return;
    }

    try {
      await toggleFavorite({
        id: product.id,
        name: product.name,
        price: product.price,
        image_url: product.image_url,
        addedAt: new Date().toISOString(),
      });
    } catch (error: any) {
      if (error.message === 'CONNEXION_REQUISE') {
        Alert.alert(
          'Connexion requise',
          'Vous devez être connecté pour ajouter des plats en favoris',
          [
            { text: 'Annuler', style: 'cancel' },
            { 
              text: 'Se connecter', 
              onPress: () => router.push('/login')
            }
          ]
        );
      } else {
        Alert.alert('Erreur', 'Impossible de modifier les favoris');
      }
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Text key={i} style={styles.star}>
          {i <= Math.floor(rating) ? '⭐' : i - rating < 1 ? '⭐' : '☆'}
        </Text>
      );
    }
    return stars;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ff6b35" />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorEmoji}>😕</Text>
          <Text style={styles.errorText}>Produit introuvable</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Text style={styles.backButtonText}>Retour au menu</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header flottant */}
      <Animated.View style={[styles.header, {
        opacity: scrollY.interpolate({
          inputRange: [0, 200],
          outputRange: [0, 1],
          extrapolate: 'clamp',
        }),
      }]}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Text style={styles.headerButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{product.name}</Text>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleToggleFavorite}
          activeOpacity={0.8}
        >
          <Text style={styles.headerButtonText}>
            {isFavorite(id as string) ? '❤️' : '♡'}
          </Text>
        </TouchableOpacity>
      </Animated.View>

      <Animated.ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Image hero */}
        <View style={styles.imageContainer}>
          <Image 
            source={
              product.image_url 
                ? { uri: product.image_url }
                : require('../../../assets/images/hero.jpeg')
            }
            style={styles.heroImage}
            defaultSource={require('../../../assets/images/hero.jpeg')}
          />
          
          {/* Boutons overlay sur l'image */}
          <View style={styles.imageOverlay}>
            <TouchableOpacity
              style={styles.backButtonOverlay}
              onPress={() => router.back()}
              activeOpacity={0.8}
            >
              <Text style={styles.backButtonOverlayText}>←</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.favoriteButton}
              onPress={handleToggleFavorite}
              activeOpacity={0.8}
            >
              <Text style={styles.favoriteButtonText}>
                {isFavorite(id as string) ? '❤️' : '♡'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Badges */}
          <View style={styles.badgeContainer}>
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
        </View>

        {/* Contenu principal */}
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {/* En-tête produit */}
          <View style={styles.productHeader}>
            <View style={styles.titleSection}>
              <Text style={styles.category}>
                {category?.emoji} {category?.name || 'Produit'}
              </Text>
              <Text style={styles.productName}>{product.name}</Text>
              
              {/* Note et avis */}
              {product.rating_count > 0 && (
                <View style={styles.ratingContainer}>
                  <View style={styles.stars}>
                    {renderStars(product.rating_avg)}
                  </View>
                  <Text style={styles.ratingText}>
                    {product.rating_avg.toFixed(1)} ({product.rating_count} avis)
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.priceSection}>
              <Text style={styles.price}>{product.price.toFixed(0)}</Text>
              <Text style={styles.currency}>FCFA</Text>
            </View>
          </View>

          {/* Infos rapides */}
          <View style={styles.quickInfo}>
            {product.preparation_time && (
              <View style={styles.infoCard}>
                <Text style={styles.infoIcon}>⏱️</Text>
                <Text style={styles.infoLabel}>Préparation</Text>
                <Text style={styles.infoValue}>{product.preparation_time} min</Text>
              </View>
            )}
            
            {product.calories && (
              <View style={styles.infoCard}>
                <Text style={styles.infoIcon}>🔥</Text>
                <Text style={styles.infoLabel}>Calories</Text>
                <Text style={styles.infoValue}>{product.calories} kcal</Text>
              </View>
            )}
            
            {product.rating_count > 0 && (
              <View style={styles.infoCard}>
                <Text style={styles.infoIcon}>👨‍🍳</Text>
                <Text style={styles.infoLabel}>Note</Text>
                <Text style={styles.infoValue}>{product.rating_avg.toFixed(1)}/5</Text>
              </View>
            )}
          </View>

          {/* Description */}
          {product.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text 
                style={styles.description}
                numberOfLines={showFullDescription ? undefined : 4}
              >
                {product.description}
              </Text>
              {product.description.length > 150 && (
                <TouchableOpacity
                  onPress={() => setShowFullDescription(!showFullDescription)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.readMore}>
                    {showFullDescription ? 'Voir moins' : 'Lire plus'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Tabs: Ingrédients / Avis */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'ingredients' && styles.activeTab]}
              onPress={() => setActiveTab('ingredients')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, activeTab === 'ingredients' && styles.activeTabText]}>
                Ingrédients
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.tab, activeTab === 'reviews' && styles.activeTab]}
              onPress={() => setActiveTab('reviews')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, activeTab === 'reviews' && styles.activeTabText]}>
                Avis ({product.rating_count})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Contenu des tabs */}
          {activeTab === 'ingredients' ? (
            <View style={styles.section}>
              {product.ingredients && product.ingredients.length > 0 ? (
                <View style={styles.ingredientsList}>
                  {product.ingredients.map((ingredient, index) => (
                    <View key={index} style={styles.ingredientItem}>
                      <Text style={styles.ingredientBullet}>•</Text>
                      <Text style={styles.ingredientText}>{ingredient}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.noDataText}>Aucun ingrédient spécifié</Text>
              )}

              {/* Allergènes */}
              {product.allergens && product.allergens.length > 0 && (
                <View style={styles.allergensSection}>
                  <Text style={styles.allergensTitle}>⚠️ Allergènes</Text>
                  <View style={styles.allergensList}>
                    {product.allergens.map((allergen, index) => (
                      <View key={index} style={styles.allergenTag}>
                        <Text style={styles.allergenText}>{allergen}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.section}>
              {reviews.length > 0 ? (
                <>
                  {reviews.map((review) => (
                    <View key={review.id} style={styles.reviewCard}>
                      <View style={styles.reviewHeader}>
                        <View>
                          <Text style={styles.reviewUser}>
                            {review.profiles?.full_name || 'Utilisateur anonyme'}
                          </Text>
                          <Text style={styles.reviewDate}>
                            {formatDate(review.created_at)}
                          </Text>
                        </View>
                        <View style={styles.reviewStars}>
                          {renderStars(review.rating)}
                        </View>
                      </View>
                      {review.comment && (
                        <Text style={styles.reviewComment}>{review.comment}</Text>
                      )}
                    </View>
                  ))}
                </>
              ) : (
                <View style={styles.noReviewsContainer}>
                  <Text style={styles.noReviewsEmoji}>💭</Text>
                  <Text style={styles.noReviewsText}>
                    Aucun avis pour le moment
                  </Text>
                  <Text style={styles.noReviewsSubtext}>
                    Soyez le premier à donner votre avis !
                  </Text>
                </View>
              )}
              
              <TouchableOpacity
                style={styles.addReviewButton}
                onPress={() => setShowReviewModal(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.addReviewButtonText}>+ Ajouter un avis</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={{ height: 120 }} />
        </Animated.View>
      </Animated.ScrollView>

      {/* Footer avec quantité et bouton */}
      <View style={styles.footer}>
        <View style={styles.quantitySection}>
          <Text style={styles.quantityLabel}>Quantité</Text>
          <View style={styles.quantityControls}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => setQuantity(Math.max(1, quantity - 1))}
              activeOpacity={0.7}
            >
              <Text style={styles.quantityButtonText}>-</Text>
            </TouchableOpacity>
            
            <Text style={styles.quantityValue}>{quantity}</Text>
            
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => setQuantity(quantity + 1)}
              activeOpacity={0.7}
            >
              <Text style={styles.quantityButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.addToCartButton, !product.is_available && styles.disabledButton]}
          onPress={handleAddToCart}
          disabled={!product.is_available}
          activeOpacity={0.8}
        >
          <Text style={styles.addToCartButtonText}>
            {product.is_available 
              ? `Ajouter - ${(product.price * quantity).toFixed(0)} FCFA`
              : 'Indisponible'
            }
          </Text>
        </TouchableOpacity>
      </View>

      {/* Modal d'ajout d'avis */}
      {product && (
        <AddReviewModal
          visible={showReviewModal}
          productId={product.id}
          productName={product.name}
          onClose={() => setShowReviewModal(false)}
          onReviewAdded={loadProductDetails}
        />
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorEmoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  errorText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#ff6b35',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#2d2d2d',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 100,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: '#444',
  },
  headerButtonText: {
    fontSize: 24,
    color: '#ff6b35',
    fontWeight: 'bold',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginHorizontal: 10,
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    position: 'relative',
    height: height * 0.4,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  backButtonOverlay: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonOverlayText: {
    fontSize: 28,
    color: 'white',
    fontWeight: 'bold',
  },
  favoriteButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteButtonText: {
    fontSize: 28,
    color: 'white',
  },
  badgeContainer: {
    position: 'absolute',
    bottom: 15,
    left: 15,
    flexDirection: 'row',
    gap: 10,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
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
    fontSize: 13,
    fontWeight: '600',
  },
  content: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    marginTop: -25,
    paddingTop: 25,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  titleSection: {
    flex: 1,
    marginRight: 15,
  },
  category: {
    fontSize: 14,
    color: '#ff6b35',
    marginBottom: 5,
    fontWeight: '600',
  },
  productName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
    lineHeight: 32,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stars: {
    flexDirection: 'row',
  },
  star: {
    fontSize: 14,
  },
  ratingText: {
    color: '#ccc',
    fontSize: 14,
  },
  priceSection: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ff6b35',
  },
  currency: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 2,
  },
  quickInfo: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 25,
    gap: 10,
  },
  infoCard: {
    flex: 1,
    backgroundColor: '#2d2d2d',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  infoIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  infoLabel: {
    color: '#999',
    fontSize: 12,
    marginBottom: 4,
  },
  infoValue: {
    color: 'white',
    fontSize: 15,
    fontWeight: 'bold',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 15,
  },
  description: {
    color: '#ccc',
    fontSize: 15,
    lineHeight: 24,
  },
  readMore: {
    color: '#ff6b35',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#2d2d2d',
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#ff6b35',
  },
  tabText: {
    color: '#999',
    fontSize: 15,
    fontWeight: '600',
  },
  activeTabText: {
    color: 'white',
  },
  ingredientsList: {
    gap: 10,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  ingredientBullet: {
    color: '#ff6b35',
    fontSize: 18,
    marginRight: 10,
    marginTop: 2,
  },
  ingredientText: {
    color: '#ccc',
    fontSize: 15,
    lineHeight: 22,
    flex: 1,
  },
  noDataText: {
    color: '#666',
    fontSize: 15,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
  allergensSection: {
    marginTop: 25,
    padding: 15,
    backgroundColor: '#2d2d2d',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#444',
  },
  allergensTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  allergensList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  allergenTag: {
    backgroundColor: '#444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  allergenText: {
    color: '#ff6b35',
    fontSize: 13,
    fontWeight: '600',
  },
  reviewCard: {
    backgroundColor: '#2d2d2d',
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  reviewUser: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 3,
  },
  reviewDate: {
    color: '#999',
    fontSize: 13,
  },
  reviewStars: {
    flexDirection: 'row',
  },
  reviewComment: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 20,
  },
  noReviewsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noReviewsEmoji: {
    fontSize: 60,
    marginBottom: 15,
  },
  noReviewsText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  noReviewsSubtext: {
    color: '#999',
    fontSize: 14,
  },
  addReviewButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#ff6b35',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  addReviewButtonText: {
    color: '#ff6b35',
    fontSize: 15,
    fontWeight: 'bold',
  },
  footer: {
    backgroundColor: '#2d2d2d',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  quantitySection: {
    alignItems: 'center',
  },
  quantityLabel: {
    color: '#999',
    fontSize: 12,
    marginBottom: 8,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    padding: 5,
  },
  quantityButton: {
    width: 35,
    height: 35,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ff6b35',
    borderRadius: 8,
  },
  quantityButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  quantityValue: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 20,
  },
  addToCartButton: {
    flex: 1,
    backgroundColor: '#ff6b35',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#ff6b35',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  disabledButton: {
    backgroundColor: '#666',
    opacity: 0.6,
  },
  addToCartButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});