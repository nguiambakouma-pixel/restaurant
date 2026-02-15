import { Stack } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackButton } from '../../components/ui/BackButton';

export default function SettingsScreen() {
    const insets = useSafeAreaInsets();
    const { t, i18n } = useTranslation();

    const changeLanguage = (lang: string) => {
        i18n.changeLanguage(lang);
    };

    const currentLanguage = i18n.language;
    // Simple helper to check if language is active (handling potential region codes like en-US)
    const isActive = (lang: string) => currentLanguage.startsWith(lang);

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <BackButton />
                <Text style={styles.headerTitle}>{t('profile.settings')}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('profile.language')}</Text>

                    <TouchableOpacity
                        style={[styles.option, isActive('fr') && styles.activeOption]}
                        onPress={() => changeLanguage('fr')}
                        activeOpacity={0.7}
                    >
                        <View style={styles.optionContent}>
                            <Text style={styles.flag}>🇫🇷</Text>
                            <Text style={styles.optionText}>Français</Text>
                        </View>
                        {isActive('fr') && <Text style={styles.checkmark}>✓</Text>}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.option, isActive('en') && styles.activeOption]}
                        onPress={() => changeLanguage('en')}
                        activeOpacity={0.7}
                    >
                        <View style={styles.optionContent}>
                            <Text style={styles.flag}>🇬🇧</Text>
                            <Text style={styles.optionText}>English</Text>
                        </View>
                        {isActive('en') && <Text style={styles.checkmark}>✓</Text>}
                    </TouchableOpacity>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>App Info</Text>
                    <View style={styles.option}>
                        <View style={styles.optionContent}>
                            <Text style={styles.optionText}>Version</Text>
                        </View>
                        <Text style={styles.valueText}>1.0.0</Text>
                    </View>
                </View>
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
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 20,
        backgroundColor: '#2d2d2d',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    section: {
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 16,
        color: '#999',
        marginBottom: 10,
        textTransform: 'uppercase',
        letterSpacing: 1,
        fontWeight: '600',
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#2d2d2d',
        padding: 16,
        borderRadius: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    activeOption: {
        borderColor: '#ff6b35',
        backgroundColor: '#2d2d2d',
    },
    optionContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    flag: {
        fontSize: 24,
        marginRight: 15,
    },
    optionText: {
        fontSize: 16,
        color: 'white',
        fontWeight: '500',
    },
    valueText: {
        fontSize: 16,
        color: '#999',
    },
    checkmark: {
        fontSize: 18,
        color: '#ff6b35',
        fontWeight: 'bold',
    },
});
