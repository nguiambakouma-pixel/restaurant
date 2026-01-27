import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { supabase } from '../../lib/supabase';

interface Category {
    id: string;
    name: string;
    slug: string;
    emoji: string | null;
    display_order: number;
    created_at: string;
}

export default function CategoriesScreen() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

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
        } catch (error) {
            console.error('Erreur chargement catégories:', error);
            Alert.alert('Erreur', 'Impossible de charger les catégories');
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadCategories();
        setRefreshing(false);
    };

    const deleteCategory = (category: Category) => {
        Alert.alert(
            'Supprimer la catégorie ?',
            `Voulez-vous vraiment supprimer "${category.name}" ?\n\nATTENTION : Les produits de cette catégorie devront être réassignés.`,
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Supprimer',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const { error } = await supabase
                                .from('categories')
                                .delete()
                                .eq('id', category.id);

                            if (error) throw error;

                            Alert.alert('Succès', 'Catégorie supprimée');
                            loadCategories();
                        } catch (error: any) {
                            console.error('Erreur suppression:', error);
                            if (error.code === '23503') {
                                Alert.alert(
                                    'Impossible de supprimer',
                                    'Cette catégorie contient des produits. Veuillez d\'abord réassigner ou supprimer ces produits.'
                                );
                            } else {
                                Alert.alert('Erreur', 'Impossible de supprimer la catégorie');
                            }
                        }
                    },
                },
            ]
        );
    };

    const moveCategory = async (categoryId: string, direction: 'up' | 'down') => {
        try {
            const currentIndex = categories.findIndex((c) => c.id === categoryId);
            if (currentIndex === -1) return;

            const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

            if (newIndex < 0 || newIndex >= categories.length) return;

            // Échanger les display_order
            const category1 = categories[currentIndex];
            const category2 = categories[newIndex];

            await supabase
                .from('categories')
                .update({ display_order: category2.display_order })
                .eq('id', category1.id);

            await supabase
                .from('categories')
                .update({ display_order: category1.display_order })
                .eq('id', category2.id);

            loadCategories();
        } catch (error) {
            console.error('Erreur déplacement:', error);
            Alert.alert('Erreur', 'Impossible de déplacer la catégorie');
        }
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color="#ff6b35" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Catégories</Text>
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
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#ff6b35" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Catégories ({categories.length})</Text>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => router.push('/admin/categories/add')}
                >
                    <Ionicons name="add" size={28} color="white" />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#ff6b35" />
                }
            >
                {categories.map((category, index) => (
                    <View key={category.id} style={styles.categoryCard}>
                        <View style={styles.categoryMain}>
                            <View style={styles.categoryInfo}>
                                <Text style={styles.categoryEmoji}>{category.emoji || '📁'}</Text>
                                <View style={styles.categoryDetails}>
                                    <Text style={styles.categoryName}>{category.name}</Text>
                                    <Text style={styles.categorySlug}>/{category.slug}</Text>
                                </View>
                            </View>

                            <View style={styles.orderControls}>
                                <TouchableOpacity
                                    style={[styles.orderButton, index === 0 && styles.orderButtonDisabled]}
                                    onPress={() => moveCategory(category.id, 'up')}
                                    disabled={index === 0}
                                >
                                    <Ionicons name="chevron-up" size={24} color="white" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[
                                        styles.orderButton,
                                        index === categories.length - 1 && styles.orderButtonDisabled,
                                    ]}
                                    onPress={() => moveCategory(category.id, 'down')}
                                    disabled={index === categories.length - 1}
                                >
                                    <Ionicons name="chevron-down" size={24} color="white" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.categoryActions}>
                            <TouchableOpacity
                                style={styles.editButton}
                                onPress={() => router.push(`./admin/categories/edit/${category.id}`)}
                            >
                                <Ionicons name="pencil" size={16} color="white" style={{ marginRight: 5 }} />
                                <Text style={styles.editButtonText}>Modifier</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.deleteButton}
                                onPress={() => deleteCategory(category)}
                            >
                                <Ionicons name="trash-outline" size={20} color="white" />
                            </TouchableOpacity>
                        </View>
                    </View>
                ))}

                {categories.length === 0 && (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="folder-open-outline" size={60} color="#e65100" style={{ marginBottom: 15 }} />
                        <Text style={styles.emptyText}>Aucune catégorie</Text>
                        <TouchableOpacity
                            style={styles.emptyButton}
                            onPress={() => router.push('/admin/categories/add')}
                        >
                            <Text style={styles.emptyButtonText}>+ Créer une catégorie</Text>
                        </TouchableOpacity>
                    </View>
                )}

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
        paddingBottom: 15,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20,
        backgroundColor: '#444',
    },
    // Removed backButtonText as it's replaced by icon
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
    addButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20,
        backgroundColor: '#ff6b35',
    },
    // Removed addButtonText
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
    categoryCard: {
        backgroundColor: '#2d2d2d',
        marginHorizontal: 20,
        marginTop: 15,
        borderRadius: 15,
        padding: 15,
    },
    categoryMain: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    categoryInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    categoryEmoji: {
        fontSize: 40,
        marginRight: 15,
    },
    categoryDetails: {
        flex: 1,
    },
    categoryName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 4,
    },
    categorySlug: {
        fontSize: 14,
        color: '#999',
    },
    orderControls: {
        flexDirection: 'row',
        gap: 5,
    },
    orderButton: {
        backgroundColor: '#444',
        width: 35,
        height: 35,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    orderButtonDisabled: {
        opacity: 0.3,
    },
    // Removed orderButtonText
    categoryActions: {
        flexDirection: 'row',
        gap: 10,
        borderTopWidth: 1,
        borderTopColor: '#444',
        paddingTop: 15,
    },
    editButton: {
        flex: 1,
        backgroundColor: '#2196F3',
        paddingVertical: 12,
        borderRadius: 10,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    editButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
    },
    deleteButton: {
        backgroundColor: '#F44336',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    // Removed deleteButtonText
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    // Removed emptyEmoji
    emptyText: {
        color: '#999',
        fontSize: 16,
        marginBottom: 20,
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
});