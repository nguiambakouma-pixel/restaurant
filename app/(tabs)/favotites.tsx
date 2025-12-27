import { router } from 'expo-router';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';

export default function FavoritesScreen() {
  const { favorites, loading, clearFavorites, toggleFavorite } = useFavorites();
  const { addToCart } = useCart();

  const handleClearAll = () => {
    Alert.alert(
      'Vider les favoris ?',
      'Voulez-vous supprimer tous vos plats favoris ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Oui, vider',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearFavorites();
              Alert.alert('Succès', 'Tous les favoris ont été supprimés');
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer les favoris');
            }
          },
        },
      ]
    );
  };

  const handleRemoveFavorite = async (product: any) => {
    try {
      await toggleFavorite(product);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de retirer des favoris');
    }
  };

  const handleAddToCart = (product: any) => {
    addToCart({
      id: parseInt(product.id),
      name: product.name,
      price: product.price,
      image: product.image_url
        ? { uri: product.image_url }
        : require('../../assets/images/hero.jpeg'),
    });
  };

  const handleProductPress = (productId: string) => {
    router.push(`/product/${productId}`);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mes Favoris</Text>
          <Text style={styles.headerSubtitle}>Chargement...</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ff6b35" />
        </View>
      </View>
    );
  }

  if (favorites.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mes Favoris</Text>
          <Text style={styles.headerSubtitle}>Vos plats préférés</Text>
        </View>

        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>❤️</Text>
          <Text style={styles.emptyTitle}>Aucun favori pour le moment</Text>
          <Text style={styles.emptyText}>
            Ajoutez vos plats préférés en cliquant sur le cœur ♡
          </Text>

          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => router.push('/explore')}
            activeOpacity={0.8}
          >
            <Text style={styles.browseButtonText}>Parcourir le menu</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Mes Favoris</Text>
            <Text style={styles.headerSubtitle}>
              {favorites.length} plat{favorites.length > 1 ? 's' : ''} favori{favorites.length > 1 ? 's' : ''}
            </Text>
          </View>

          {favorites.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={handleClearAll}
              activeOpacity={0.8}
            >
              <Text style={styles.clearButtonText}>Tout vider</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.favoritesList}>
          {favorites.map((item) => (
            <View key={item.id} style={styles.favoriteCard}>
              <TouchableOpacity
                style={styles.favoriteCardContent}
                onPress={() => handleProductPress(item.id)}
                activeOpacity={0.9}
              >
                <Image
                  source={
                    item.image_url
                      ? { uri: item.image_url }
                      : require('../../assets/images/hero.jpeg')
                  }
                  style={styles.itemImage}
                  defaultSource={require('../../assets/images/hero.jpeg')}
                />

                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemPrice}>{item.price.toFixed(0)} FCFA</Text>

                  <View style={styles.itemActions}>
                    <TouchableOpacity
                      style={styles.addToCartButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleAddToCart(item);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.addToCartButtonText}>
                        Ajouter au panier
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemoveFavorite(item)}
                activeOpacity={0.7}
              >
                <Text style={styles.removeButtonText}>❤️</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
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
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  clearButton: {
    backgroundColor: '#444',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  clearButtonText: {
    color: '#ff6b35',
    fontSize: 13,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
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
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  browseButton: {
    backgroundColor: '#ff6b35',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    elevation: 3,
    shadowColor: '#ff6b35',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  browseButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  favoritesList: {
    padding: 20,
  },
  favoriteCard: {
    backgroundColor: '#2d2d2d',
    borderRadius: 15,
    marginBottom: 15,
    overflow: 'hidden',
    position: 'relative',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  favoriteCardContent: {
    flexDirection: 'row',
  },
  itemImage: {
    width: 120,
    height: 120,
    resizeMode: 'cover',
  },
  itemInfo: {
    flex: 1,
    padding: 15,
    justifyContent: 'space-between',
  },
  itemName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  itemPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ff6b35',
    marginBottom: 10,
  },
  itemActions: {
    flexDirection: 'row',
    gap: 10,
  },
  addToCartButton: {
    backgroundColor: '#ff6b35',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#ff6b35',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  addToCartButtonText: {
    color: 'white',
    fontSize: 13,
    fontWeight: 'bold',
  },
  removeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 40,
    height: 40,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    fontSize: 22,
  },
});