import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../app/context/AuthContext';
import { supabase } from '../app/lib/supabase';

interface AddReviewModalProps {
  visible: boolean;
  productId: string;
  productName: string;
  onClose: () => void;
  onReviewAdded: () => void;
}

export default function AddReviewModal({
  visible,
  productId,
  productName,
  onClose,
  onReviewAdded,
}: AddReviewModalProps) {
  const { user } = useAuth();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert(
        'Connexion requise',
        'Vous devez être connecté pour laisser un avis',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Se connecter', onPress: onClose },
        ]
      );
      return;
    }

    if (comment.trim().length < 10) {
      Alert.alert('Erreur', 'Votre commentaire doit contenir au moins 10 caractères');
      return;
    }

    try {
      setSubmitting(true);

      // Vérifier si l'utilisateur a déjà noté ce produit
      const { data: existingReview } = await supabase
        .from('reviews')
        .select('id')
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .single();

      if (existingReview) {
        Alert.alert(
          'Avis existant',
          'Vous avez déjà noté ce produit. Voulez-vous modifier votre avis ?',
          [
            { text: 'Annuler', style: 'cancel' },
            {
              text: 'Modifier',
              onPress: async () => {
                await updateReview(existingReview.id);
              },
            },
          ]
        );
        return;
      }

      // Ajouter le nouvel avis
      const { error: insertError } = await supabase.from('reviews').insert({
        user_id: user.id,
        product_id: productId,
        rating,
        comment: comment.trim(),
      });

      if (insertError) throw insertError;

      // Mettre à jour les statistiques du produit
      await updateProductRating();

      Alert.alert('Merci !', 'Votre avis a été publié avec succès');
      resetForm();
      onReviewAdded();
      onClose();
    } catch (error: any) {
      console.error('Erreur ajout avis:', error);
      Alert.alert('Erreur', 'Impossible de publier votre avis');
    } finally {
      setSubmitting(false);
    }
  };

  const updateReview = async (reviewId: string) => {
    try {
      const { error } = await supabase
        .from('reviews')
        .update({
          rating,
          comment: comment.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', reviewId);

      if (error) throw error;

      await updateProductRating();

      Alert.alert('Succès', 'Votre avis a été modifié');
      resetForm();
      onReviewAdded();
      onClose();
    } catch (error) {
      console.error('Erreur modification avis:', error);
      Alert.alert('Erreur', 'Impossible de modifier votre avis');
    }
  };

  const updateProductRating = async () => {
    try {
      // Recalculer la moyenne et le nombre d'avis
      const { data: reviews } = await supabase
        .from('reviews')
        .select('rating')
        .eq('product_id', productId);

      if (reviews && reviews.length > 0) {
        const avgRating =
          reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

        await supabase
          .from('products')
          .update({
            rating_avg: avgRating,
            rating_count: reviews.length,
          })
          .eq('id', productId);
      }
    } catch (error) {
      console.error('Erreur mise à jour rating:', error);
    }
  };

  const resetForm = () => {
    setRating(5);
    setComment('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const renderStars = () => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => setRating(star)}
            activeOpacity={0.7}
            style={styles.starButton}
          >
            <Text style={styles.starText}>
              {star <= rating ? '⭐' : '☆'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity
          style={styles.modalBackground}
          activeOpacity={1}
          onPress={handleClose}
        >
          <View
            style={styles.modalContent}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Donner votre avis</Text>
              <TouchableOpacity
                onPress={handleClose}
                style={styles.closeButton}
                activeOpacity={0.7}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.productName}>{productName}</Text>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Note *</Text>
              {renderStars()}
              <Text style={styles.ratingLabel}>
                {rating === 1
                  ? 'Décevant'
                  : rating === 2
                  ? 'Moyen'
                  : rating === 3
                  ? 'Correct'
                  : rating === 4
                  ? 'Très bon'
                  : 'Excellent'}
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Votre commentaire *</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Partagez votre expérience avec ce plat..."
                placeholderTextColor="#666"
                value={comment}
                onChangeText={setComment}
                multiline
                numberOfLines={5}
                maxLength={500}
              />
              <Text style={styles.charCount}>
                {comment.length}/500 caractères
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.submitButton,
                (submitting || comment.trim().length < 10) &&
                  styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={submitting || comment.trim().length < 10}
              activeOpacity={0.8}
            >
              {submitting ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.submitButtonText}>Publier l'avis</Text>
              )}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 25,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  closeButton: {
    width: 35,
    height: 35,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2d2d2d',
    borderRadius: 17.5,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#ccc',
  },
  productName: {
    fontSize: 16,
    color: '#ff6b35',
    marginBottom: 25,
    fontWeight: '600',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 15,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 10,
  },
  starButton: {
    padding: 5,
  },
  starText: {
    fontSize: 40,
  },
  ratingLabel: {
    textAlign: 'center',
    color: '#ff6b35',
    fontSize: 16,
    fontWeight: '600',
  },
  textArea: {
    backgroundColor: '#2d2d2d',
    color: 'white',
    padding: 15,
    borderRadius: 12,
    fontSize: 15,
    height: 120,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#444',
  },
  charCount: {
    textAlign: 'right',
    color: '#666',
    fontSize: 12,
    marginTop: 5,
  },
  submitButton: {
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
  submitButtonDisabled: {
    backgroundColor: '#666',
    opacity: 0.6,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});