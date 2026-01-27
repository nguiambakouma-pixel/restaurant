import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
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
import { supabase } from '../../../lib/supabase';

interface Category {
    id: string;
    name: string;
    slug: string;
    emoji: string | null;
    display_order: number;
}

export default function EditCategoryScreen() {
    const { id } = useLocalSearchParams();
    const [category, setCategory] = useState<Category | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        emoji: '',
    });

    useEffect(() => {
        loadCategory();
    }, [id]);

    const loadCategory = async () => {
        try {
            setLoading(true);

            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;

            setCategory(data);
            setFormData({
                name: data.name,
                emoji: data.emoji || '',
            });
        } catch (error) {
            console.error('Erreur chargement:', error);
            Alert.alert('Erreur', 'Impossible de charger la catégorie');
            router.back();
        } finally {
            setLoading(false);
        }
    };

    const generateSlug = (name: string): string => {
        return name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    };

    const handleSave = async () => {
        if (!formData.name.trim()) {
            Alert.alert('Erreur', 'Le nom est obligatoire');
            return;
        }

        try {
            setSaving(true);

            const slug = generateSlug(formData.name);

            // Vérifier si le slug existe déjà (sauf pour cette catégorie)
            const { data: existing } = await supabase
                .from('categories')
                .select('id')
                .eq('slug', slug)
                .neq('id', id)
                .single();

            if (existing) {
                Alert.alert('Erreur', 'Une catégorie avec ce nom existe déjà');
                return;
            }

            // Mettre à jour
            const { error } = await supabase
                .from('categories')
                .update({
                    name: formData.name.trim(),
                    slug,
                    emoji: formData.emoji || null,
                })
                .eq('id', id);

            if (error) throw error;

            Alert.alert('Succès', 'Catégorie modifiée', [
                {
                    text: 'OK',
                    onPress: () => router.back(),
                },
            ]);
        } catch (error) {
            console.error('Erreur sauvegarde:', error);
            Alert.alert('Erreur', 'Impossible de modifier la catégorie');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color="#ff6b35" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Modifier catégorie</Text>
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
                    <Ionicons name="arrow-back" size={24} color="#ff6b35" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Modifier catégorie</Text>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.form}>
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Nom de la catégorie *</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.name}
                            onChangeText={(text) => setFormData({ ...formData, name: text })}
                            placeholder="Ex: Entrées, Plats, Desserts..."
                            placeholderTextColor="#666"
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Emoji (optionnel)</Text>
                        <TextInput
                            style={[styles.input, styles.emojiInput]}
                            value={formData.emoji}
                            onChangeText={(text) => setFormData({ ...formData, emoji: text })}
                            placeholder="Ex: 🍕 🍰 🥗"
                            placeholderTextColor="#666"
                            maxLength={2}
                        />
                        <Text style={styles.hint}>Un emoji pour représenter la catégorie</Text>
                    </View>

                    <View style={styles.previewSection}>
                        <Text style={styles.previewLabel}>Aperçu :</Text>
                        <View style={styles.previewCard}>
                            <Text style={styles.previewEmoji}>{formData.emoji || '📁'}</Text>
                            <Text style={styles.previewName}>
                                {formData.name || 'Nom de la catégorie'}
                            </Text>
                        </View>
                    </View>
                </View>
            </ScrollView>

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
                        <>
                            <Ionicons name="save-outline" size={20} color="white" style={{ marginRight: 8 }} />
                            <Text style={styles.saveButtonText}>Sauvegarder</Text>
                        </>
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
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20,
        backgroundColor: '#444',
    },
    // Removed backButtonText
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
    form: {
        padding: 20,
    },
    formGroup: {
        marginBottom: 25,
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
    emojiInput: {
        fontSize: 24,
        textAlign: 'center',
    },
    hint: {
        fontSize: 12,
        color: '#999',
        marginTop: 5,
    },
    previewSection: {
        marginTop: 30,
        padding: 20,
        backgroundColor: '#2d2d2d',
        borderRadius: 15,
    },
    previewLabel: {
        fontSize: 14,
        color: '#ccc',
        marginBottom: 15,
        fontWeight: '600',
    },
    previewCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1a1a1a',
        padding: 15,
        borderRadius: 12,
    },
    previewEmoji: {
        fontSize: 32,
        marginRight: 15,
    },
    previewName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
    },
    footer: {
        backgroundColor: '#2d2d2d',
        paddingHorizontal: 20,
        paddingVertical: 15,
        flexDirection: 'row',
        gap: 10,
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
        flexDirection: 'row',
        justifyContent: 'center',
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