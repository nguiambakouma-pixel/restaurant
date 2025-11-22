import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useCart } from '../context/CartContext';

export default function CartScreen() {
  const { cartItems, updateQuantity, removeFromCart, getTotalPrice, clearCart, cartVersion } = useCart();
  const [forceRender, setForceRender] = useState(0);

  // Force le re-render quand cartVersion change
  useEffect(() => {
    console.log('CartScreen: cartVersion a change =', cartVersion);
    setForceRender(prev => prev + 1);
  }, [cartVersion, cartItems.length]);

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      Alert.alert('Panier vide', 'Ajoutez des articles avant de commander !');
      return;
    }
    
    // Redirige vers l'ecran de checkout
    router.push('/checkout');
  };

  const handleClearCart = () => {
    Alert.alert(
      'Vider le panier ?', 
      'Etes-vous sur de vouloir supprimer tous les articles ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Oui, vider', 
          onPress: () => {
            clearCart();
            setForceRender(prev => prev + 1);
          }, 
          style: 'destructive' 
        }
      ]
    );
  };

  // Vue panier vide
  if (cartItems.length === 0) {
    return (
      <View style={styles.container} key={`empty-v${cartVersion}-r${forceRender}`}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mon Panier</Text>
          <Text style={styles.headerSubtitle}>Vos plats selectionnes</Text>
        </View>
        
        <View style={styles.emptyCart}>
          <Text style={styles.emptyEmoji}>🛒</Text>
          <Text style={styles.emptyTitle}>Votre panier est vide</Text>
          <Text style={styles.emptyText}>Parcourez notre menu pour ajouter des plats delicieux !</Text>
          
          <TouchableOpacity 
            style={styles.goToMenuButton}
            onPress={() => router.replace('/explore')}
            activeOpacity={0.8}
          >
            <Text style={styles.goToMenuButtonText}>Voir le Menu</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Vue panier avec articles
  return (
    <View style={styles.container} key={`filled-v${cartVersion}-r${forceRender}`}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mon Panier</Text>
        <Text style={styles.headerSubtitle}>{cartItems.length} article(s)</Text>
      </View>

      <ScrollView style={styles.cartList}>
        {cartItems.map(item => (
          <View key={item.id} style={styles.cartItem}>
            <Image source={item.image} style={styles.itemImage} />
            
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemPrice}>{item.price.toFixed(0)} FCFA / unite</Text>
              
              <View style={styles.quantityControls}>
                <TouchableOpacity 
                  style={styles.quantityButton}
                  onPress={() => {
                    updateQuantity(item.id, item.quantity - 1);
                    setForceRender(prev => prev + 1);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.quantityButtonText}>-</Text>
                </TouchableOpacity>
                
                <Text style={styles.quantityText}>{item.quantity}</Text>
                
                <TouchableOpacity 
                  style={styles.quantityButton}
                  onPress={() => {
                    updateQuantity(item.id, item.quantity + 1);
                    setForceRender(prev => prev + 1);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.quantityButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.itemActions}>
              <Text style={styles.itemTotal}>
                {(item.price * item.quantity).toFixed(2)} euros
              </Text>
              <TouchableOpacity 
                style={styles.removeButton}
                onPress={() => {
                  removeFromCart(item.id);
                  setForceRender(prev => prev + 1);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.removeButtonText}>🗑️</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.totalSection}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalPrice}>{getTotalPrice().toFixed(2)} euros</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.checkoutButton}
          onPress={handleCheckout}
          activeOpacity={0.8}
        >
          <Text style={styles.checkoutButtonText}>
            Commander maintenant - {getTotalPrice().toFixed(2)} euros
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.clearButton}
          onPress={handleClearCart}
          activeOpacity={0.8}
        >
          <Text style={styles.clearButtonText}>Vider le panier</Text>
        </TouchableOpacity>
      </View>
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
  emptyCart: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
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
    color: '#ccc',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  goToMenuButton: {
    backgroundColor: '#ff6b35',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    elevation: 3,
    shadowColor: '#ff6b35',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  goToMenuButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cartList: {
    flex: 1,
    padding: 20,
  },
  cartItem: {
    backgroundColor: '#2d2d2d',
    flexDirection: 'row',
    borderRadius: 12,
    marginBottom: 15,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  itemImage: {
    width: 80,
    height: 80,
    resizeMode: 'cover',
  },
  itemInfo: {
    flex: 1,
    padding: 15,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  itemPrice: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 10,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    backgroundColor: '#ff6b35',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#ff6b35',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  quantityButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  quantityText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: 15,
  },
  itemActions: {
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff6b35',
    marginBottom: 10,
  },
  removeButton: {
    padding: 5,
  },
  removeButtonText: {
    fontSize: 20,
  },
  footer: {
    backgroundColor: '#2d2d2d',
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  totalLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  totalPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ff6b35',
  },
  checkoutButton: {
    backgroundColor: '#ff6b35',
    paddingVertical: 18,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 10,
    elevation: 4,
    shadowColor: '#ff6b35',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  checkoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  clearButton: {
    alignItems: 'center',
    paddingVertical: 15,
    backgroundColor: '#444',
    borderRadius: 10,
    marginTop: 5,
  },
  clearButtonText: {
    color: '#ff6b35',
    fontSize: 14,
    fontWeight: '600',
  },
});