// app/(tabs)/checkout.tsx
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import loyaltyService, { LOYALTY_LEVELS } from '../services/loyaltyService';
import ordersService from '../services/orderService';

type DeliveryMode = 'delivery' | 'pickup';

export default function CheckoutScreen() {
  const { cartItems, getTotalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();

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
      Alert.alert(t('checkout.alerts.errorTitle'), t('checkout.alerts.missingName'));
      return false;
    }
    if (!phone.trim()) {
      Alert.alert(t('checkout.alerts.errorTitle'), t('checkout.alerts.missingPhone'));
      return false;
    }
    if (deliveryMode === 'delivery' && !address.trim()) {
      Alert.alert(t('checkout.alerts.errorTitle'), t('checkout.alerts.missingAddress'));
      return false;
    }
    return true;
  };

  const handlePlaceOrder = async () => {
    if (!validateForm()) return;

    if (cartItems.length === 0) {
      Alert.alert(t('checkout.alerts.errorTitle'), t('checkout.alerts.emptyCart'));
      return;
    }

    try {
      setLoading(true);

      // Si livraison et utilisateur invité, suggérer la connexion
      if (deliveryMode === 'delivery' && (!user || user.is_anonymous)) {
        const proceed = await new Promise((resolve) => {
          Alert.alert(
            t('checkout.alerts.guestTitle'),
            t('checkout.alerts.guestText'),
            [
              { text: t('checkout.alerts.guestContinue'), style: "cancel", onPress: () => resolve(true) },
              { text: t('checkout.alerts.guestLogin'), onPress: () => { router.push('/login'); resolve(false); } },
              { text: t('checkout.alerts.guestRegister'), onPress: () => { router.push('/register'); resolve(false); } }
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

      const { order, error } = await ordersService.createOrder(orderData as any);

      if (error) {
        throw error;
      }

      // 🌟 NOUVEAU: Attribution des points de fidélité
      let loyaltyMessage = '';
      if (user && order) {
        try {
          const loyaltyResult = await loyaltyService.addPointsFromOrder(
            user.id,
            order.id,
            total
          );

          if (loyaltyResult.success) {
            loyaltyMessage = `\n\n🎁 +${loyaltyResult.pointsEarned} points de fidélité !`;

            if (loyaltyResult.newLevel) {
              const newLevelData = LOYALTY_LEVELS[loyaltyResult.newLevel];
              loyaltyMessage += `\n${newLevelData.emoji} Félicitations ! Vous êtes maintenant niveau ${newLevelData.name} !`;
            }
          }
        } catch (loyaltyError) {
          console.error('Erreur attribution points:', loyaltyError);
        }
      }

      // Succès
      const orderIdPreview = order?.id ? String(order.id).slice(0, 8) : '';
      Alert.alert(
        t('checkout.alerts.successTitle'),
        t('checkout.alerts.successText', { id: orderIdPreview }) + loyaltyMessage,
        [
          {
            text: t('checkout.alerts.viewOrders'),
            onPress: () => {
              clearCart();
              router.replace('/(tabs)/orders');
            }
          }
        ]
      );

    } catch (error) {
      console.error('Erreur commande:', error);
      Alert.alert(t('checkout.alerts.errorTitle'), t('checkout.alerts.submitError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <BackButton style={styles.backButton} />
        <Text style={styles.headerTitle}>{t('checkout.title')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>

          {/* Section Mode de livraison */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('checkout.deliveryMode.title')}</Text>
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[styles.toggleButton, deliveryMode === 'delivery' && styles.toggleButtonActive]}
                onPress={() => setDeliveryMode('delivery')}
              >
                <Text style={[styles.toggleText, deliveryMode === 'delivery' && styles.toggleTextActive]}>
                  {t('checkout.deliveryMode.delivery')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleButton, deliveryMode === 'pickup' && styles.toggleButtonActive]}
                onPress={() => setDeliveryMode('pickup')}
              >
                <Text style={[styles.toggleText, deliveryMode === 'pickup' && styles.toggleTextActive]}>
                  {t('checkout.deliveryMode.pickup')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Formulaire Client */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('checkout.form.title')}</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('checkout.form.name')} *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder={t('checkout.form.placeholders.name')}
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('checkout.form.phone')} *</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder={t('checkout.form.placeholders.phone')}
                placeholderTextColor="#666"
                keyboardType="phone-pad"
              />
            </View>

            {deliveryMode === 'delivery' && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>{t('checkout.form.address')} *</Text>
                  <TextInput
                    style={styles.input}
                    value={address}
                    onChangeText={setAddress}
                    placeholder={t('checkout.form.placeholders.address')}
                    placeholderTextColor="#666"
                    multiline
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>{t('checkout.form.city')}</Text>
                  <TextInput
                    style={styles.input}
                    value={city}
                    onChangeText={setCity}
                    placeholder={t('checkout.form.placeholders.city')}
                    placeholderTextColor="#666"
                  />
                </View>
              </>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('checkout.form.instructions')}</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={specialInstructions}
                onChangeText={setSpecialInstructions}
                placeholder={t('checkout.form.placeholders.instructions')}
                placeholderTextColor="#666"
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          {/* Résumé */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('checkout.summary.title')}</Text>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{t('checkout.summary.subtotal')}</Text>
              <Text style={styles.summaryValue}>{subtotal.toFixed(0)} FCFA</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{t('checkout.summary.deliveryFee')}</Text>
              <Text style={styles.summaryValue}>
                {deliveryFee === 0 ? t('checkout.summary.free') : `${deliveryFee} FCFA`}
              </Text>
            </View>

            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>{t('checkout.summary.total')}</Text>
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
              {t('checkout.submit')} - {total.toFixed(0)} FCFA
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