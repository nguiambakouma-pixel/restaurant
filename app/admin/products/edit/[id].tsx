import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../../../lib/supabase';
import { uploadService } from '../../../services/uploadService';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  category_id: string;
  is_available: boolean;
  preparation_time: number | null;
  is_vegetarian: boolean;
  is_vegan: boolean;
  is_spicy: boolean;
}

// Image par défaut - Importée ici pour éviter les problèmes de chemin
const DEFAULT_IMAGE = require('../../../../assets/images/hero.jpeg');

export default function EditProductScreen() {
  const { id } = useLocalSearchParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newImageUri, setNewImageUri] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    preparation_time: '',
    is_available: true,
    is_vegetarian: false,
    is_vegan: false,
    is_spicy: false,
  });

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      setProduct(data);
      setFormData({
        name: data.name,
        description: data.description || '',
        price: data.price.toString(),
        preparation_time: data.preparation_time?.toString() || '',
        is_available: data.is_available,
        is_vegetarian: data.is_vegetarian,
        is_vegan: data.is_vegan,
        is_spicy: data.is_spicy,
      });
    } catch (error) {
      console.error('Erreur chargement produit:', error);
      Alert.alert('Erreur', 'Impossible de charger le produit');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handlePickImage = async () => {
    try {
      setUploading(true);
      const image = await uploadService.pickImage();

      if (image) {
        setNewImageUri(image.uri);
      }
    } catch (error) {
      console.error('Erreur sélection image:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner l\'image');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.price) {
      Alert.alert('Erreur', 'Le nom et le prix sont obligatoires');
      return;
    }

    try {
      setSaving(true);

      let imageUrl = product?.image_url;

      // Upload de la nouvelle image si sélectionnée
      if (newImageUri) {
        const uploadResult = await uploadService.uploadProductImage(newImageUri, id as string);
        imageUrl = uploadResult.url;
      }

      const updateData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        preparation_time: formData.preparation_time ? parseInt(formData.preparation_time) : null,
        is_available: formData.is_available,
        is_vegetarian: formData.is_vegetarian,
        is_vegan: formData.is_vegan,
        is_spicy: formData.is_spicy,
        image_url: imageUrl,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      Alert.alert('Succès', 'Produit mis à jour', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Modifier produit</Text>
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Modifier produit</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Image du produit */}
        <View style={styles.imageSection}>
          <Image
            source={
              newImageUri
                ? { uri: newImageUri }
                : product?.image_url
                  ? { uri: product.image_url }
                  : DEFAULT_IMAGE
            }
            style={styles.productImage}
          />
          <TouchableOpacity
            style={styles.changeImageButton}
            onPress={handlePickImage}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                <Text style={styles.changeImageIcon}>📷</Text>
                <Text style={styles.changeImageText}>
                  {newImageUri ? 'Changer l\'image' : 'Ajouter une image'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Formulaire */}
        <View style={styles.form}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Nom du produit *</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholder="Nom du produit"
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              placeholder="Description du produit"
              placeholderTextColor="#666"
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.formRow}>
            <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
              <Text style={styles.label}>Prix (FCFA) *</Text>
              <TextInput
                style={styles.input}
                value={formData.price}
                onChangeText={(text) => setFormData({ ...formData, price: text })}
                placeholder="0"
                placeholderTextColor="#666"
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.label}>Temps (min)</Text>
              <TextInput
                style={styles.input}
                value={formData.preparation_time}
                onChangeText={(text) =>
                  setFormData({ ...formData, preparation_time: text })
                }
                placeholder="0"
                placeholderTextColor="#666"
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Options avec switches */}
          <View style={styles.optionsSection}>
            <Text style={styles.sectionTitle}>Options</Text>

            <View style={styles.switchRow}>
              <View style={styles.switchInfo}>
                <Text style={styles.switchLabel}>Disponible</Text>
                <Text style={styles.switchDesc}>Le produit est en stock</Text>
              </View>
              <Switch
                value={formData.is_available}
                onValueChange={(value) =>
                  setFormData({ ...formData, is_available: value })
                }
                trackColor={{ false: '#767577', true: '#ff6b35' }}
                thumbColor={formData.is_available ? '#fff' : '#f4f3f4'}
              />
            </View>

            <View style={styles.switchRow}>
              <View style={styles.switchInfo}>
                <Text style={styles.switchLabel}>🌱 Végétarien</Text>
                <Text style={styles.switchDesc}>Sans viande</Text>
              </View>
              <Switch
                value={formData.is_vegetarian}
                onValueChange={(value) =>
                  setFormData({ ...formData, is_vegetarian: value })
                }
                trackColor={{ false: '#767577', true: '#4CAF50' }}
                thumbColor={formData.is_vegetarian ? '#fff' : '#f4f3f4'}
              />
            </View>

            <View style={styles.switchRow}>
              <View style={styles.switchInfo}>
                <Text style={styles.switchLabel}>🌿 Vegan</Text>
                <Text style={styles.switchDesc}>Sans produits animaux</Text>
              </View>
              <Switch
                value={formData.is_vegan}
                onValueChange={(value) => setFormData({ ...formData, is_vegan: value })}
                trackColor={{ false: '#767577', true: '#8BC34A' }}
                thumbColor={formData.is_vegan ? '#fff' : '#f4f3f4'}
              />
            </View>

            <View style={styles.switchRow}>
              <View style={styles.switchInfo}>
                <Text style={styles.switchLabel}>🌶️ Épicé</Text>
                <Text style={styles.switchDesc}>Contient du piment</Text>
              </View>
              <Switch
                value={formData.is_spicy}
                onValueChange={(value) => setFormData({ ...formData, is_spicy: value })}
                trackColor={{ false: '#767577', true: '#FF5722' }}
                thumbColor={formData.is_spicy ? '#fff' : '#f4f3f4'}
              />
            </View>
          </View>

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Boutons fixes en bas */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Text style={styles.cancelButtonText}>Annuler</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.saveButtonText}>💾 Sauvegarder</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
  content: {
    flex: 1,
  },
  imageSection: {
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: 250,
    resizeMode: 'cover',
    backgroundColor: '#2d2d2d',
  },
  changeImageButton: {
    position: 'absolute',
    bottom: 15,
    right: 15,
    backgroundColor: 'rgba(255, 107, 53, 0.95)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  changeImageIcon: {
    fontSize: 18,
  },
  changeImageText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  form: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 8,
    fontWeight: '600',
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
    height: 100,
    textAlignVertical: 'top',
  },
  formRow: {
    flexDirection: 'row',
  },
  optionsSection: {
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 15,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2d2d2d',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  switchInfo: {
    flex: 1,
  },
  switchLabel: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
    marginBottom: 3,
  },
  switchDesc: {
    fontSize: 13,
    color: '#999',
  },
  footer: {
    backgroundColor: '#2d2d2d',
    paddingHorizontal: 20,
    paddingVertical: 15,
    flexDirection: 'row',
    gap: 10,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#444',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButton: {
    flex: 2,
    backgroundColor: '#ff6b35',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
