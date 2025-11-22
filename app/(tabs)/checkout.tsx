import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useCart } from '../context/CartContext';
import { useUser } from '../context/UserContext';

export default function CheckoutScreen() {
  const { cartItems, getTotalPrice, clearCart } = useCart();
  const { userInfo, updateUserInfo } = useUser();
  
  const [name, setName] = useState(userInfo.name);
  const [phone, setPhone] = useState(userInfo.phone);
  const [address, setAddress] = useState(userInfo.address);
  const [city, setCity] = useState(userInfo.city);
  const [deliveryMode, setDeliveryMode] = useState<'delivery' | 'pickup'>(userInfo.deliveryMode);
  const [notes, setNotes] = useState('');

  const validateForm = () => {
    if (!name.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer votre nom');
      return false;
    }
    if (!phone.trim() || phone.length < 8) {
      Alert.alert('Erreur', 'Veuillez entrer un numero de telephone valide');
      return false;
    }
    if (deliveryMode === 'delivery' && (!address.trim() || !city.trim())) {
      Alert.alert('Erreur', 'Veuillez entrer votre adresse complete');
      return false;
    }
    return true;
  };

  const handleConfirmOrder = () => {
    if (!validateForm()) return;

    // Sauvegarder les infos utilisateur
    updateUserInfo({ name, phone, address, city, deliveryMode });

    const total = getTotalPrice();
    const deliveryFee = deliveryMode === 'delivery' ? 1500 : 0;
    const finalTotal = total + deliveryFee;

    const orderSummary = `
COMMANDE CONFIRMEE !

${deliveryMode === 'delivery' ? '📦 LIVRAISON' : '🏪 RETRAIT'}

Nom: ${name}
Tel: ${phone}
${deliveryMode === 'delivery' ? `Adresse: ${address}, ${city}` : 'Retrait au restaurant'}

Articles: ${cartItems.length}
Sous-total: ${total.toFixed(0)} FCFA
${deliveryMode === 'delivery' ? `Livraison: ${deliveryFee.toFixed(0)} FCFA` : ''}
TOTAL: ${finalTotal.toFixed(0)} FCFA

${deliveryMode === 'delivery' ? 'Livraison estimee: 30-40 min' : 'Pret dans: 20-30 min'}

Merci pour votre commande !
    `.trim();

    Alert.alert(
      'Commande envoyee !',
      orderSummary,
      [
        {
          text: 'Super !',
          onPress: () => {
            clearCart();
            router.push('/');
          }
        }
      ]
    );
  };

  if (cartItems.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Finaliser la commande</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Votre panier est vide</Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.push('/explore')}
          >
            <Text style={styles.backButtonText}>Retour au menu</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const deliveryFee = deliveryMode === 'delivery' ? 1500 : 0;
  const finalTotal = getTotalPrice() + deliveryFee;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Finaliser la commande</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Mode de recuperation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mode de recuperation</Text>
          <View style={styles.modeContainer}>
            <TouchableOpacity
              style={[styles.modeButton, deliveryMode === 'delivery' && styles.modeButtonActive]}
              onPress={() => setDeliveryMode('delivery')}
              activeOpacity={0.8}
            >
              <Text style={styles.modeEmoji}>🚚</Text>
              <Text style={[styles.modeText, deliveryMode === 'delivery' && styles.modeTextActive]}>
                Livraison
              </Text>
                                <Text style={styles.modeFee}>+1500 FCFA</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modeButton, deliveryMode === 'pickup' && styles.modeButtonActive]}
              onPress={() => setDeliveryMode('pickup')}
              activeOpacity={0.8}
            >
              <Text style={styles.modeEmoji}>🏪</Text>
              <Text style={[styles.modeText, deliveryMode === 'pickup' && styles.modeTextActive]}>
                Retrait
              </Text>
              <Text style={styles.modeFee}>Gratuit</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Informations personnelles */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vos informations</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nom complet *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Jean Dupont"
              placeholderTextColor="#666"
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Telephone *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 06 12 34 56 78"
              placeholderTextColor="#666"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {/* Adresse (si livraison) */}
        {deliveryMode === 'delivery' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Adresse de livraison</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Adresse *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: 123 Rue de la Paix"
                placeholderTextColor="#666"
                value={address}
                onChangeText={setAddress}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Ville *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Paris"
                placeholderTextColor="#666"
                value={city}
                onChangeText={setCity}
              />
            </View>
          </View>
        )}

        {/* Notes (optionnel) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Instructions speciales (optionnel)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Ex: Sans oignons, sonnez 2 fois..."
            placeholderTextColor="#666"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Resume de la commande */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resume de la commande</Text>
          <View style={styles.summaryCard}>
            {cartItems.map(item => (
              <View key={item.id} style={styles.summaryItem}>
                <Text style={styles.summaryItemName}>
                  {item.quantity}x {item.name}
                </Text>
                <Text style={styles.summaryItemPrice}>
                  {(item.price * item.quantity).toFixed(0)} FCFA
                </Text>
              </View>
            ))}
            
            <View style={styles.summaryDivider} />
            
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Sous-total</Text>
              <Text style={styles.summaryValue}>{getTotalPrice().toFixed(0)} FCFA</Text>
            </View>
            
            {deliveryMode === 'delivery' && (
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Frais de livraison</Text>
                <Text style={styles.summaryValue}>{deliveryFee.toFixed(0)} FCFA</Text>
              </View>
            )}
            
            <View style={[styles.summaryItem, styles.summaryTotal]}>
              <Text style={styles.summaryTotalLabel}>TOTAL</Text>
              <Text style={styles.summaryTotalValue}>{finalTotal.toFixed(0)} FCFA</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bouton fixe en bas */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={handleConfirmOrder}
          activeOpacity={0.8}
        >
          <Text style={styles.confirmButtonText}>
            Confirmer la commande - {finalTotal.toFixed(0)} FCFA
          </Text>
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
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 15,
  },
  modeContainer: {
    flexDirection: 'row',
    gap: 15,
  },
  modeButton: {
    flex: 1,
    backgroundColor: '#2d2d2d',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  modeButtonActive: {
    borderColor: '#ff6b35',
    backgroundColor: '#ff6b3520',
  },
  modeEmoji: {
    fontSize: 30,
    marginBottom: 8,
  },
  modeText: {
    color: '#ccc',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  modeTextActive: {
    color: 'white',
  },
  modeFee: {
    color: '#999',
    fontSize: 12,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#2d2d2d',
    color: 'white',
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#444',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  summaryCard: {
    backgroundColor: '#2d2d2d',
    padding: 15,
    borderRadius: 12,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  summaryItemName: {
    color: '#ccc',
    fontSize: 14,
    flex: 1,
  },
  summaryItemPrice: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#444',
    marginVertical: 10,
  },
  summaryLabel: {
    color: '#ccc',
    fontSize: 14,
  },
  summaryValue: {
    color: 'white',
    fontSize: 14,
  },
  summaryTotal: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 2,
    borderTopColor: '#ff6b35',
  },
  summaryTotalLabel: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  summaryTotalValue: {
    color: '#ff6b35',
    fontSize: 20,
    fontWeight: 'bold',
  },
  footer: {
    backgroundColor: '#2d2d2d',
    padding: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  confirmButton: {
    backgroundColor: '#ff6b35',
    paddingVertical: 18,
    borderRadius: 15,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#ff6b35',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    color: '#ccc',
    fontSize: 18,
    marginBottom: 20,
  },
});