import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View, Dimensions } from 'react-native';
import { useCart } from '../context/CartContext';

const { width } = Dimensions.get('window');

export default function TabOneScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const { addToCart, getTotalItems } = useCart();
  const [currentIndex, setCurrentIndex] = useState(0);

  // Images du carousel
  const heroImages = [
    require('../../assets/images/hero.jpeg'),
    require('../../assets/images/burger.jpeg'),
    require('../../assets/images/salade.jpeg'),
    require('../../assets/images/dessert.jpeg'),
  ];

  const heroTexts = [
    { title: 'Bienvenue', subtitle: 'Découvrez nos plats préparés avec passion' },
    { title: 'Nos Burgers', subtitle: 'Fraîcheur et saveurs authentiques' },
    { title: 'Salades Fraîches', subtitle: 'Ingrédients sélectionnés avec soin' },
    { title: 'Desserts Maison', subtitle: 'Le plaisir sucré en fin de repas' },
  ];

  useEffect(() => {
    // Animation d'entrée
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

    // Auto-défilement du carousel (ralenti à 6 secondes)
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % heroImages.length);
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  const popularItems = [
    {
      id: 1,
      name: 'Burger Signature',
      desc: 'Pain artisanal, bœuf angus, légumes frais',
      price: 3500,
      image: require('../../assets/images/burger.jpeg')
    },
    {
      id: 2,
      name: 'Salade César',
      desc: 'Salade croquante, parmesan, croûtons',
      price: 2500,
      image: require('../../assets/images/salade.jpeg')
    },
    {
      id: 3,
      name: 'Tiramisu',
      desc: 'Mascarpone, café, cacao',
      price: 1800,
      image: require('../../assets/images/dessert.jpeg')
    }
  ];

  const handleAddToCart = (item: any) => {
    addToCart({
      id: item.id,
      name: item.name,
      price: item.price,
      image: item.image
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🍽️ Bistro Moderne</Text>
        <Text style={styles.headerSubtitle}>Saveurs authentiques</Text>
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

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero Carousel dynamique */}
        <Animated.View 
          style={[
            styles.heroContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={styles.hero}>
            <Image 
              source={heroImages[currentIndex]} 
              style={styles.heroImage}
            />
            <View style={styles.heroOverlay}>
              <Text style={styles.heroTitle}>{heroTexts[currentIndex].title}</Text>
              <Text style={styles.heroText}>{heroTexts[currentIndex].subtitle}</Text>
              <TouchableOpacity 
                style={styles.heroButton}
                onPress={() => router.push('/explore')}
                activeOpacity={0.8}
              >
                <Text style={styles.heroButtonText}>Voir le Menu</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Indicateurs du carousel */}
          <View style={styles.carouselIndicators}>
            {heroImages.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.indicator,
                  { opacity: currentIndex === index ? 1 : 0.4 }
                ]}
              />
            ))}
          </View>
        </Animated.View>

        {/* Categories avec animations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nos Spécialités</Text>
          <View style={styles.categoryGrid}>
            {[
              { emoji: '🥗', text: 'Entrées' },
              { emoji: '🍖', text: 'Plats' },
              { emoji: '🍰', text: 'Desserts' },
              { emoji: '🍷', text: 'Boissons' }
            ].map((category, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.categoryCard,
                  {
                    opacity: fadeAnim,
                    transform: [{
                      translateY: Animated.add(slideAnim, new Animated.Value(index * 10))
                    }]
                  }
                ]}
              >
                <TouchableOpacity 
                  style={styles.categoryCardInner}
                  onPress={() => router.push('/explore')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                  <Text style={styles.categoryText}>{category.text}</Text>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* Plats populaires avec boutons + */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Plats Populaires</Text>
          
          {popularItems.map((item, index) => (
            <Animated.View
              key={item.id}
              style={[
                styles.foodCard,
                {
                  opacity: fadeAnim,
                  transform: [{ 
                    translateY: Animated.add(slideAnim, new Animated.Value(index * 5)) 
                  }]
                }
              ]}
            >
              <Image 
                source={item.image} 
                style={styles.foodImage}
              />
              <View style={styles.foodInfo}>
                <Text style={styles.foodName}>{item.name}</Text>
                <Text style={styles.foodDesc}>{item.desc}</Text>
                <Text style={styles.foodPrice}>{item.price.toFixed(0)} FCFA</Text>
              </View>
              <View style={styles.foodAction}>
                <TouchableOpacity 
                  style={styles.addButton}
                  onPress={() => handleAddToCart(item)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.addButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          ))}
        </View>

        {/* Bouton vers le menu complet */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.fullMenuButton}
            onPress={() => router.push('/explore')}
            activeOpacity={0.8}
          >
            <Text style={styles.fullMenuButtonText}>🍽️ Voir tout le menu</Text>
          </TouchableOpacity>
        </View>
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
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    position: 'relative',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
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
    top: 15,
    right: 20,
    backgroundColor: '#ff6b35',
    borderRadius: 15,
    minWidth: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#ff6b35',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  cartBadgeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  heroContainer: {
    margin: 20,
  },
  hero: {
    position: 'relative',
    height: 220,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  heroText: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    marginBottom: 20,
    opacity: 0.9,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  heroButton: {
    backgroundColor: '#ff6b35',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 30,
    elevation: 4,
    shadowColor: '#ff6b35',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  heroButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  carouselIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 15,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff6b35',
    marginHorizontal: 4,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 15,
    textAlign: 'center',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '48%',
    marginBottom: 15,
  },
  categoryCardInner: {
    backgroundColor: '#2d2d2d',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  categoryEmoji: {
    fontSize: 35,
    marginBottom: 10,
  },
  categoryText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  foodCard: {
    backgroundColor: '#2d2d2d',
    flexDirection: 'row',
    borderRadius: 15,
    marginBottom: 15,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  foodImage: {
    width: 90,
    height: 90,
    resizeMode: 'cover',
  },
  foodInfo: {
    flex: 1,
    padding: 15,
    justifyContent: 'center',
  },
  foodName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  foodDesc: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 8,
    lineHeight: 18,
  },
  foodPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ff6b35',
  },
  foodAction: {
    justifyContent: 'center',
    paddingHorizontal: 15,
  },
  addButton: {
    backgroundColor: '#ff6b35',
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#ff6b35',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  addButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  fullMenuButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#ff6b35',
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 10,
  },
  fullMenuButtonText: {
    color: '#ff6b35',
    fontSize: 18,
    fontWeight: 'bold',
  },
});