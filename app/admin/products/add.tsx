import { router } from 'expo-router';
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
import { supabase } from '../../lib/supabase';
import { uploadService } from '../../services/uploadService';

interface Category {
    id: string;
    name: string;
    emoji: string | null;
    display_order: number;
}

const DEFAULT_IMAGE = require('../../../assets/images/hero.jpeg');

export default function AddProductScreen() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        preparation_time: '',
        category_id: '',
        calories: '',
        is_available: true,
        is_vegetarian: false,
        is_vegan: false,
        is_spicy: false,
    });

    const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
    const [ingredients, setIngredients] = useState('');
    const [allergens, setAllergens] = useState('');

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            setLoading(true);

            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .order('display_order');

            if (error) throw error;
            setCategories(data || []);

            // Sélectionner la première catégorie par défaut
            if (data && data.length > 0) {
                setFormData((prev) => ({ ...prev, category_id: data[0].id }));
            }
        } catch (error) {
            console.error('Erreur chargement catégories:', error);
            Alert.alert('Erreur', 'Impossible de charger les catégories');
        } finally {
            setLoading(false);
        }
    };

    const handlePickImage = async () => {
        try {
            const image = await uploadService.pickImage();
            if (image) {
                setSelectedImageUri(image.uri);
            }
        } catch (error: any) {
            Alert.alert('Erreur', error.message || 'Impossible de sélectionner une image');
        }
    };

    const validateForm = (): boolean => {
        if (!formData.name.trim()) {
            Alert.alert('Erreur', 'Le nom du produit est obligatoire');
            return false;
        }

        if (!formData.price || parseFloat(formData.price) <= 0) {
            Alert.alert('Erreur', 'Le prix doit être supérieur à 0');
            return false;
        }

        if (!formData.category_id) {
            Alert.alert('Erreur', 'Veuillez sélectionner une catégorie');
            return false;
        }

        return true;
    };

    const handleSave = async () => {
        if (!validateForm()) return;

        try {
            setSaving(true);

            // 1. Créer d'abord le produit pour avoir un ID
            const productData: any = {
                name: formData.name.trim(),
                description: formData.description.trim() || null,
                price: parseFloat(formData.price),
                category_id: formData.category_id,
                preparation_time: formData.preparation_time
                    ? parseInt(formData.preparation_time)
                    : null,
                calories: formData.calories ? parseInt(formData.calories) : null,
                is_available: formData.is_available,
                is_vegetarian: formData.is_vegetarian,
                is_vegan: formData.is_vegan,
                is_spicy: formData.is_spicy,
                image_url: null,
            };

            // Ingrédients (convertir la chaîne en tableau)
            if (ingredients.trim()) {
                productData.ingredients = ingredients
                    .split('\n')
                    .map((i) => i.trim())
                    .filter((i) => i.length > 0);
            }

            // Allergènes (convertir la chaîne en tableau)
            if (allergens.trim()) {
                productData.allergens = allergens
                    .split(',')
                    .map((a) => a.trim())
                    .filter((a) => a.length > 0);
            }

            const { data: newProduct, error: productError } = await supabase
                .from('products')
                .insert(productData)
                .select()
                .single();

            if (productError) throw productError;

            // 2. Upload l'image si une image a été sélectionnée
            if (selectedImageUri && newProduct) {
                setUploadingImage(true);

                const uploadResult = await uploadService.uploadProductImage(
                    selectedImageUri,
                    newProduct.id
                );

                // 3. Mettre à jour le produit avec l'URL de l'image
                const { error: updateError } = await supabase
                    .from('products')
                    .update({ image_url: uploadResult.url })
                    .eq('id', newProduct.id);

                if (updateError) throw updateError;
            }

            Alert.alert('Succès', 'Produit créé avec succès', [
                {
                    text: 'OK',
                    onPress: () => router.back(),
                },
            ]);
        } catch (error) {
            console.error('Erreur création produit:', error);
            Alert.alert('Erreur', 'Impossible de créer le produit');
        } finally {
            setSaving(false);
            setUploadingImage(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <Text style={styles.backButtonText}>←</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Nouveau produit</Text>
                    <View style={styles.headerSpacer} />
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#ff6b35" />
                    <Text style={styles.loadingText}>Chargement...</Text>
                </View>
            </View>
        );
    }

    if (categories.length === 0) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <Text style={styles.backButtonText}>←</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Nouveau produit</Text>
                    <View style={styles.headerSpacer} />
                </View>
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyEmoji}>📂</Text>
                    <Text style={styles.emptyTitle}>Aucune catégorie</Text>
                    <Text style={styles.emptyText}>
                        Vous devez d'abord créer au moins une catégorie avant d'ajouter des produits.
                    </Text>
                    <TouchableOpacity
                        style={styles.emptyButton}
                        onPress={() => router.push('/admin/categories/add')}
                    >
                        <Text style={styles.emptyButtonText}>+ Créer une catégorie</Text>
                    </TouchableOpacity>
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
                <Text style={styles.headerTitle}>Nouveau produit</Text>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Section Image */}
                <View style={styles.imageSection}>
                    <Image
                        source={selectedImageUri ? { uri: selectedImageUri } : DEFAULT_IMAGE}
                        style={styles.productImage}
                    />
                    {uploadingImage && (
                        <View style={styles.uploadingOverlay}>
                            <ActivityIndicator size="large" color="#ff6b35" />
                            <Text style={styles.uploadingText}>Upload en cours...</Text>
                        </View>
                    )}
                    <TouchableOpacity
                        style={styles.changeImageButton}
                        onPress={handlePickImage}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.changeImageText}>
                            {selectedImageUri ? '📷 Changer' : '📷 Ajouter une image'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Formulaire */}
                <View style={styles.form}>
                    {/* Nom du produit */}
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Nom du produit *</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.name}
                            onChangeText={(text) => setFormData({ ...formData, name: text })}
                            placeholder="Ex: Pizza Margherita"
                            placeholderTextColor="#666"
                        />
                    </View>

                    {/* Catégorie */}
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Catégorie *</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <View style={styles.categorySelector}>
                                {categories.map((cat) => (
                                    <TouchableOpacity
                                        key={cat.id}
                                        style={[
                                            styles.categoryChip,
                                            formData.category_id === cat.id && styles.categoryChipActive,
                                        ]}
                                        onPress={() => setFormData({ ...formData, category_id: cat.id })}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={styles.categoryChipEmoji}>{cat.emoji || '📁'}</Text>
                                        <Text
                                            style={[
                                                styles.categoryChipText,
                                                formData.category_id === cat.id && styles.categoryChipTextActive,
                                            ]}
                                        >
                                            {cat.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>
                    </View>

                    {/* Description */}
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Description</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={formData.description}
                            onChangeText={(text) => setFormData({ ...formData, description: text })}
                            placeholder="Décrivez votre plat..."
                            placeholderTextColor="#666"
                            multiline
                            numberOfLines={4}
                        />
                    </View>

                    {/* Prix et Temps */}
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

                    {/* Calories */}
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Calories (optionnel)</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.calories}
                            onChangeText={(text) => setFormData({ ...formData, calories: text })}
                            placeholder="Ex: 450"
                            placeholderTextColor="#666"
                            keyboardType="numeric"
                        />
                    </View>

                    {/* Ingrédients */}
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Ingrédients (un par ligne)</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={ingredients}
                            onChangeText={setIngredients}
                            placeholder={'Tomates\nMozzarella\nBasilic\nHuile d\'olive'}
                            placeholderTextColor="#666"
                            multiline
                            numberOfLines={5}
                        />
                        <Text style={styles.hint}>Appuyez sur Entrée pour séparer les ingrédients</Text>
                    </View>

                    {/* Allergènes */}
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Allergènes (séparés par des virgules)</Text>
                        <TextInput
                            style={styles.input}
                            value={allergens}
                            onChangeText={setAllergens}
                            placeholder="Ex: Gluten, Lactose, Œufs"
                            placeholderTextColor="#666"
                        />
                    </View>

                    {/* Options diététiques */}
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

            {/* Footer */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => router.back()}
                    activeOpacity={0.8}
                >
                    <Text style={styles.cancelButtonText}>Annuler</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.saveButton, (saving || uploadingImage) && styles.saveButtonDisabled]}
                    onPress={handleSave}
                    disabled={saving || uploadingImage}
                    activeOpacity={0.8}
                >
                    {saving || uploadingImage ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={styles.saveButtonText}>✨ Créer le produit</Text>
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
    emptyButton: {
        backgroundColor: '#ff6b35',
        paddingHorizontal: 30,
        paddingVertical: 15,
        borderRadius: 25,
    },
    emptyButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
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
    uploadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    uploadingText: {
        color: 'white',
        marginTop: 10,
        fontSize: 14,
    },
    changeImageButton: {
        position: 'absolute',
        bottom: 20,
        alignSelf: 'center',
        backgroundColor: '#ff6b35',
        paddingHorizontal: 30,
        paddingVertical: 15,
        borderRadius: 30,
        elevation: 5,
        shadowColor: '#ff6b35',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.5,
        shadowRadius: 5,
    },
    changeImageText: {
        color: 'white',
        fontSize: 16,
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
    hint: {
        fontSize: 12,
        color: '#999',
        marginTop: 5,
        fontStyle: 'italic',
    },
    categorySelector: {
        flexDirection: 'row',
        gap: 10,
        paddingVertical: 5,
    },
    categoryChip: {
        backgroundColor: '#2d2d2d',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderRadius: 15,
        borderWidth: 2,
        borderColor: '#444',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    categoryChipActive: {
        backgroundColor: '#ff6b35',
        borderColor: '#ff6b35',
        transform: [{ scale: 1.05 }],
    },
    categoryChipEmoji: {
        fontSize: 20,
    },
    categoryChipText: {
        color: '#ccc',
        fontSize: 14,
        fontWeight: '600',
    },
    categoryChipTextActive: {
        color: 'white',
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