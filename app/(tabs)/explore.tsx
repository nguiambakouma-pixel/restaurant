import { router } from 'expo-router';
import { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useCart } from '../context/CartContext';

export default function MenuScreen() {
  const [selectedCategory, setSelectedCategory] = useState('entrees');
  const [searchText, setSearchText] = useState('');
  const { addToCart, getTotalItems, getTotalPrice } = useCart();

  // Données locales temporaires (tu ajouteras les vraies dans Supabase plus tard)
  const menuItems = {
    entrees: [
      { id: 1, name: 'Salade César', price: 2500, desc: 'Salade croquante, parmesan, croûtons', image: require('../../assets/images/salade.jpeg') },
      { id: 2, name: 'Carpaccio de Bœuf', price: 3000, desc: 'Lamelles de bœuf, roquette, parmesan', image: require('../../assets/images/hero.jpeg') },
      { id: 3, name: 'Velouté du jour', price: 1800, desc: 'Soupe crémeuse selon la saison', image: require('../../assets/images/burger.jpeg') }
    ],
    plats: [
      { id: 4, name: 'Burger Signature', price: 3500, desc: 'Pain artisanal, bœuf angus, légumes frais', image: require('../../assets/images/burger.jpeg') },
      { id: 5, name: 'Saumon Grillé', price: 4500, desc: 'Filet de saumon, légumes de saison', image: require('../../assets/images/salade.jpeg') },
      { id: 6, name: 'Risotto aux Champignons', price: 3800, desc: 'Riz crémeux, champignons frais', image: require('../../assets/images/dessert.jpeg') }
    ],
    desserts: [
      { id: 7, name: 'Tiramisu', price: 1800, desc: 'Mascarpone, café, cacao', image: require('../../assets/images/dessert.jpeg') },
      { id: 8, name: 'Tarte Tatin', price: 2000, desc: 'Pommes caramélisées, pâte croustillante', image: require('../../assets/images/hero.jpeg') },
      { id: 9, name: 'Mousse au Chocolat', price: 1500, desc: 'Chocolat noir 70%, chantilly', image: require('../../assets/images/burger.jpeg') }
    ],
    boissons: [
      { id: 10, name: 'Café Espresso', price: 800, desc: 'Café italien corsé', image: require('../../assets/images/salade.jpeg') },
      { id: 11, name: 'Thé Earl Grey', price: 700, desc: 'Thé noir bergamote', image: require('../../assets/images/dessert.jpeg') },
      { id: 12, name: 'Jus d\'Orange', price: 1000, desc: 'Pressé à la demande', image: require('../../assets/images/hero.jpeg') }
    ]
  };

  const categories = [
    { id: 'entrees', name: 'Entrées', emoji: '🥗' },
    { id: 'plats', name: 'Plats', emoji: '🍖' },
    { id: 'desserts', name: 'Desserts', emoji: '🍰' },
    { id: 'boissons', name: 'Boissons', emoji: '🍷' }
  ];

  const handleAddToCart = (item: any) => {
    addToCart({
      id: item.id,
      name: item.name,
      price: item.price,
      image: item.image,
    });
  };

  const filteredItems = menuItems[selectedCategory as keyof typeof menuItems].filter(item =>
    item.name.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notre Menu</Text>
        <Text style={styles.headerSubtitle}>Tous nos plats préparés avec amour</Text>
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

      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un plat..."
          placeholderTextColor="#999"
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryTabs}>
        {categories.map(category => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryTab,
              selectedCategory === category.id && styles.activeTab
            ]}
            onPress={() => setSelectedCategory(category.id)}
            activeOpacity={0.8}
          >
            <Text style={styles.categoryEmoji}>{category.emoji}</Text>
            <Text style={[
              styles.categoryName,
              selectedCategory === category.id && styles.activeCategoryName
            ]}>
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.menuList} showsVerticalScrollIndicator={false}>
        {filteredItems.map(item => (
          <TouchableOpacity 
            key={item.id} 
            style={styles.menuItem}
            activeOpacity={0.9}
          >
            <Image source={item.image} style={styles.itemImage} />
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemDesc}>{item.desc}</Text>
              <View style={styles.itemFooter}>
                <Text style={styles.itemPrice}>{item.price.toFixed(0)} FCFA</Text>
                <TouchableOpacity 
                  style={styles.addButton}
                  onPress={() => handleAddToCart(item)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.addButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        ))}
        
        {filteredItems.length === 0 && (
          <View style={styles.noResults}>
            <Text style={styles.noResultsText}>Aucun plat trouvé</Text>
          </View>
        )}
      </ScrollView>

      {getTotalItems() > 0 && (
        <TouchableOpacity 
          style={styles.floatingCartButton}
          onPress={() => router.push('/cart')}
          activeOpacity={0.8}
        >
          <Text style={styles.floatingCartText}>
            🛒 Voir Panier ({getTotalItems()}) - {getTotalPrice().toFixed(0)} FCFA
          </Text>
        </TouchableOpacity>
      )}
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
    shadowOffset: { width: 0, height: 2 },
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
    top: 50,
    right: 20,
    backgroundColor: '#ff6b35',
    borderRadius: 15,
    minWidth: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#ff6b35',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  cartBadgeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2d2d2d',
    margin: 20,
    borderRadius: 12,
    paddingHorizontal: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: 'white',
    paddingVertical: 12,
    fontSize: 16,
  },
  categoryTabs: {
    maxHeight: 80,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  categoryTab: {
    backgroundColor: '#2d2d2d',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginHorizontal: 5,
    alignItems: 'center',
    minWidth: 85,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  activeTab: {
    backgroundColor: '#ff6b35',
    elevation: 5,
    shadowColor: '#ff6b35',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
  },
  categoryEmoji: {
    fontSize: 22,
    marginBottom: 4,
  },
  categoryName: {
    color: '#ccc',
    fontSize: 12,
    fontWeight: '600',
  },
  activeCategoryName: {
    color: 'white',
    fontWeight: 'bold',
  },
  menuList: {
    flex: 1,
    padding: 20,
    paddingBottom: 100,
  },
  menuItem: {
    backgroundColor: '#2d2d2d',
    flexDirection: 'row',
    borderRadius: 15,
    marginBottom: 15,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  itemImage: {
    width: 110,
    height: 110,
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
  itemDesc: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 10,
    lineHeight: 18,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ff6b35',
  },
  addButton: {
    backgroundColor: '#ff6b35',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#ff6b35',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  addButtonText: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
  },
  noResults: {
    alignItems: 'center',
    padding: 40,
  },
  noResultsText: {
    color: '#ccc',
    fontSize: 16,
  },
  floatingCartButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#ff6b35',
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#ff6b35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  floatingCartText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});