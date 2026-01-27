import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { BackButton } from '../../components/ui/BackButton';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
// import notificationService from '../services/notificationService';
import ordersService from '../services/orderService';

type DeliveryMode = 'delivery' | 'pickup';

export default function CheckoutScreen() {
  const { cartItems, getTotalPrice, clearCart } = useCart();
  const { user, signInAnonymously } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>('delivery');

  // Form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');

  // Pre-fill user data if connected
  useEffect(() => {
    if (user) {
      // Préremplir si l'utilisateur a des informations
      if ((user as any).name) setName((user as any).name);
      if ((user as any).phone) setPhone((user as any).phone);
      if ((user as any).address) setAddress((user as any).address);
      if ((user as any).city) setCity((user as any).city);
    }
  }, [user]);

  const subtotal = getTotalPrice();
  const deliveryFee = deliveryMode === 'delivery' ? 1000 : 0; // 1000 FCFA frais livraison par défaut
  const total = subtotal + deliveryFee;

  const validateForm = () => {
    if (!name.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer votre nom');
      return false;
    }
    if (!phone.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer votre numéro de téléphone');
      return false;
    }
    if (deliveryMode === 'delivery' && !address.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer une adresse de livraison');
      return false;
    }
    return true;
  };

  const handlePlaceOrder = async () => {
    if (!validateForm()) return;

    if (cartItems.length === 0) {
      Alert.alert('Erreur', 'Votre panier est vide');
      return;
    }

    try {
      setLoading(true);

      // Si l'utilisateur n'est pas connecté, essayer de le connecter anonymement
      let userId = user?.id;
      if (!userId) {
        console.log('Utilisateur non connecté, tentative de connexion anonyme...');
        const { error } = await (user as any)?.signInAnonymously ? (user as any).signInAnonymously() : Promise.resolve({ error: null });

        // Note: Nous avons besoin d'accéder à la fonction signInAnonymously du contexte
        // Mais ici nous n'avons que 'user'. Nous devons récupérer la fonction du hook useAuth
      }

      // Re-vérifier l'utilisateur après tentative de connexion
      // C'est compliqué car 'user' est une const du hook.
      // Nous allons modifier l'approche : récupérer signInAnonymously du hook au début



      // Si livraison et utilisateur invité, suggérer la connexion
      if (deliveryMode === 'delivery' && (!user || user.is_anonymous)) {
        // En faire une promesse pour attendre la réponse de l'utilisateur
        const proceed = await new Promise((resolve) => {
          Alert.alert(
            "Compte recommandé",
            "Pour suivre votre livraison en temps réel, connectez-vous !",
            [
              { text: "Continuer en invité", style: "cancel", onPress: () => resolve(true) },
              { text: "Se connecter", onPress: () => { router.push('/login'); resolve(false); } },
              { text: "Créer un compte", onPress: () => { router.push('/register'); resolve(false); } }
            ]
          );
        });

        if (!proceed) {
          setLoading(false);
          return;
        }
      }

      const orderData = {
        user_id: user?.id,
        customer_name: name,
        customer_phone: phone,
        delivery_mode: deliveryMode,
        special_instructions: specialInstructions,
        subtotal,
        delivery_fee: deliveryFee,
        total,
        items: cartItems.map(item => ({
          product_id: String(item.id),
          product_name: item.name,
          product_price: item.price,
          product_image_url: typeof item.image === 'string' ? item.image : undefined,
          quantity: item.quantity,
          unit_price: item.price,
          total_price: item.price * item.quantity
        })),
        ...(deliveryMode === 'delivery' ? { customer_address: address, customer_city: city } : {})
      };

      console.log('Soumission commande:', orderData);

      const { order, error } = await ordersService.createOrder(orderData);

      if (error) {
        throw error;
      }



      // Succès
      const orderIdPreview = order?.id ? String(order.id).slice(0, 8) : '';
      Alert.alert(
        'Commande réussie !',
        `Votre commande #${orderIdPreview} a bien été enregistrée.`,
        [
          {
            text: 'Voir mes commandes',
            onPress: () => {
              clearCart();
              router.replace('/(tabs)/orders');
            }
          }
        ]
      );

    } catch (error) {
      console.error('Erreur commande:', error);
      Alert.alert('Erreur', 'Impossible d\'enregistrer votre commande. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <BackButton style={styles.backButton} />
        <Text style={styles.headerTitle}>Finaliser la commande</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>

          {/* Section Mode de livraison */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mode de récupération</Text>
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[styles.toggleButton, deliveryMode === 'delivery' && styles.toggleButtonActive]}
                onPress={() => setDeliveryMode('delivery')}
              >
                <Text style={[styles.toggleText, deliveryMode === 'delivery' && styles.toggleTextActive]}>
                  Livraison
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleButton, deliveryMode === 'pickup' && styles.toggleButtonActive]}
                onPress={() => setDeliveryMode('pickup')}
              >
                <Text style={[styles.toggleText, deliveryMode === 'pickup' && styles.toggleTextActive]}>
                  À emporter
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Formulaire Client */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Vos Coordonnées</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nom complet *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Ex: John Doe"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Téléphone *</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="Ex: 699 00 00 00"
                placeholderTextColor="#666"
                keyboardType="phone-pad"
              />
            </View>

            {deliveryMode === 'delivery' && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Adresse de livraison *</Text>
                  <TextInput
                    style={styles.input}
                    value={address}
                    onChangeText={setAddress}
                    placeholder="Quartier, point de repère..."
                    placeholderTextColor="#666"
                    multiline
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Ville</Text>
                  <TextInput
                    style={styles.input}
                    value={city}
                    onChangeText={setCity}
                    placeholder="Ex: Douala"
                    placeholderTextColor="#666"
                  />
                </View>
              </>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Instructions spéciales</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={specialInstructions}
                onChangeText={setSpecialInstructions}
                placeholder="Allergies, code porte, etc."
                placeholderTextColor="#666"
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          {/* Résumé */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Résumé</Text>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Sous-total</Text>
              <Text style={styles.summaryValue}>{subtotal.toFixed(0)} FCFA</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Frais de livraison</Text>
              <Text style={styles.summaryValue}>
                {deliveryFee === 0 ? 'Gratuit' : `${deliveryFee} FCFA`}
              </Text>
            </View>

            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total à payer</Text>
              <Text style={styles.totalValue}>{total.toFixed(0)} FCFA</Text>
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Button Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.payButton, loading && styles.disabledButton]}
          onPress={handlePlaceOrder}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.payButtonText}>
              Confirmer la commande - {total.toFixed(0)} FCFA
            </Text>
          )}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    // Styles gérés par le composant
  },
  backButtonText: {
    display: 'none',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ff6b35',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    backgroundColor: '#2d2d2d',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 15,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  toggleButtonActive: {
    backgroundColor: '#444',
  },
  toggleText: {
    color: '#888',
    fontWeight: '600',
  },
  toggleTextActive: {
    color: '#ff6b35',
    fontWeight: 'bold',
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    color: '#ccc',
    marginBottom: 8,
    fontSize: 14,
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    padding: 15,
    color: 'white',
    borderWidth: 1,
    borderColor: '#444',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryLabel: {
    color: '#ccc',
    fontSize: 16,
  },
  summaryValue: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  totalRow: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#444',
  },
  totalLabel: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  totalValue: {
    color: '#ff6b35',
    fontSize: 20,
    fontWeight: 'bold',
  },
  footer: {
    padding: 20,
    backgroundColor: '#2d2d2d',
    borderTopWidth: 1,
    borderTopColor: '#444',
  },
  payButton: {
    backgroundColor: '#ff6b35',
    padding: 18,
    borderRadius: 15,
    alignItems: 'center',
    elevation: 3,
  },
  disabledButton: {
    opacity: 0.7,
  },
  payButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});