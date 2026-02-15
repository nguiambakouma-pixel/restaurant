import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';

class UploadService {
  /**
   * Sélectionner une image depuis la galerie
   */
  async pickImage(): Promise<ImagePicker.ImagePickerAsset | null> {
    try {
      // Demander la permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        throw new Error('Permission refusée pour accéder à la galerie');
      }

      // Ouvrir la galerie
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return null;
      }

      return result.assets[0];
    } catch (error) {
      console.error('Erreur sélection image:', error);
      throw error;
    }
  }

  /**
   * Uploader une image vers Supabase Storage
   */
  async uploadProductImage(
    imageUri: string,
    productId: string
  ): Promise<{ url: string; path: string }> {
    try {
      // Lire le fichier via fetch pour obtenir un ArrayBuffer direct
      // C'est plus efficace et évite les problèmes de dépendance base64
      const response = await fetch(imageUri);
      const arrayBuffer = await response.arrayBuffer();

      // Générer un nom de fichier unique
      const fileName = `${productId}-${Date.now()}.jpg`;
      const filePath = `products/${fileName}`;

      // Upload vers Supabase Storage
      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(filePath, arrayBuffer, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (error) {
        console.error('Supabase Storage Error:', error);
        throw error;
      }

      // Obtenir l'URL publique
      const { data: publicData } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      return {
        url: publicData.publicUrl,
        path: filePath,
      };
    } catch (error) {
      console.error('Erreur détaillée upload:', error);
      throw error;
    }
  }

  /**
   * Supprimer une ancienne image
   */
  async deleteProductImage(imageUrl: string): Promise<void> {
    try {
      // Extraire le chemin depuis l'URL
      const urlParts = imageUrl.split('/product-images/');
      if (urlParts.length < 2) return;

      const filePath = urlParts[1];

      const { error } = await supabase.storage
        .from('product-images')
        .remove([filePath]);

      if (error) throw error;
    } catch (error) {
      console.error('Erreur suppression image:', error);
      // Ne pas bloquer si la suppression échoue
    }
  }
}

export const uploadService = new UploadService();
export default uploadService;