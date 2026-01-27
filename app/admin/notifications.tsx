import { router } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { supabase } from '../lib/supabase';
import notificationService from '../services/notificationService.mock';

export default function NotificationsTestScreen() {
    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState('Test Notification');
    const [body, setBody] = useState('Ceci est un test de notification push');

    const sendTestToAdmins = async () => {
        try {
            setLoading(true);

            const { data: adminTokens } = await supabase
                .from('notification_tokens')
                .select('token')
                .eq('is_admin', true);

            if (!adminTokens || adminTokens.length === 0) {
                Alert.alert('Aucun admin', 'Aucun token admin trouvé');
                return;
            }

            const tokens = adminTokens.map((t) => t.token);
            await notificationService.sendPushNotification(tokens, title, body, {
                type: 'test',
            });

            Alert.alert('Succès', `Notification envoyée à ${tokens.length} admin(s)`);
        } catch (error) {
            console.error('Erreur envoi test:', error);
            Alert.alert('Erreur', 'Impossible d\'envoyer la notification');
        } finally {
            setLoading(false);
        }
    };

    const sendTestToAllUsers = async () => {
        try {
            setLoading(true);

            const { data: allTokens } = await supabase
                .from('notification_tokens')
                .select('token');

            if (!allTokens || allTokens.length === 0) {
                Alert.alert('Aucun utilisateur', 'Aucun token trouvé');
                return;
            }

            const tokens = allTokens.map((t) => t.token);
            await notificationService.sendPushNotification(tokens, title, body, {
                type: 'test',
            });

            Alert.alert('Succès', `Notification envoyée à ${tokens.length} utilisateur(s)`);
        } catch (error) {
            console.error('Erreur envoi test:', error);
            Alert.alert('Erreur', 'Impossible d\'envoyer la notification');
        } finally {
            setLoading(false);
        }
    };

    const viewTokens = async () => {
        try {
            const { data: tokens } = await supabase
                .from('notification_tokens')
                .select('*');

            const adminCount = tokens?.filter((t) => t.is_admin).length || 0;
            const userCount = tokens?.length || 0;

            Alert.alert(
                'Tokens enregistrés',
                `Total: ${userCount}\nAdmins: ${adminCount}\nUtilisateurs: ${userCount - adminCount}`
            );
        } catch (error) {
            Alert.alert('Erreur', 'Impossible de récupérer les tokens');
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Text style={styles.backButtonText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Test Notifications</Text>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Message de test</Text>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Titre</Text>
                        <TextInput
                            style={styles.input}
                            value={title}
                            onChangeText={setTitle}
                            placeholder="Titre de la notification"
                            placeholderTextColor="#666"
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Message</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={body}
                            onChangeText={setBody}
                            placeholder="Corps de la notification"
                            placeholderTextColor="#666"
                            multiline
                            numberOfLines={3}
                        />
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Envoyer à</Text>

                    <TouchableOpacity
                        style={[styles.actionButton, styles.actionButtonOrange]}
                        onPress={sendTestToAdmins}
                        disabled={loading}
                        activeOpacity={0.8}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <>
                                <Text style={styles.actionButtonIcon}>👨‍💼</Text>
                                <Text style={styles.actionButtonText}>Tous les admins</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionButton, styles.actionButtonBlue]}
                        onPress={sendTestToAllUsers}
                        disabled={loading}
                        activeOpacity={0.8}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <>
                                <Text style={styles.actionButtonIcon}>👥</Text>
                                <Text style={styles.actionButtonText}>Tous les utilisateurs</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionButton, styles.actionButtonGray]}
                        onPress={viewTokens}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.actionButtonIcon}>📊</Text>
                        <Text style={styles.actionButtonText}>Voir les statistiques</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.infoSection}>
                    <Text style={styles.infoTitle}>ℹ️ Informations</Text>
                    <Text style={styles.infoText}>
                        • Les notifications ne fonctionnent que sur des appareils physiques
                    </Text>
                    <Text style={styles.infoText}>
                        • Les utilisateurs doivent avoir accepté les permissions
                    </Text>
                    <Text style={styles.infoText}>
                        • Les tokens sont automatiquement enregistrés à la connexion
                    </Text>
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
    content: {
        flex: 1,
    },
    section: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 15,
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
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        borderRadius: 12,
        marginBottom: 15,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
    },
    actionButtonOrange: {
        backgroundColor: '#ff6b35',
    },
    actionButtonBlue: {
        backgroundColor: '#2196F3',
    },
    actionButtonGray: {
        backgroundColor: '#666',
    },
    actionButtonIcon: {
        fontSize: 24,
        marginRight: 10,
    },
    actionButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    infoSection: {
        margin: 20,
        padding: 20,
        backgroundColor: '#2d2d2d',
        borderRadius: 15,
        borderLeftWidth: 4,
        borderLeftColor: '#2196F3',
    },
    infoTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 15,
    },
    infoText: {
        fontSize: 14,
        color: '#ccc',
        marginBottom: 8,
        lineHeight: 20,
    },
});