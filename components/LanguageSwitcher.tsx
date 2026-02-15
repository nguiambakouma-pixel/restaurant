import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export const LanguageSwitcher = () => {
    const { i18n, t } = useTranslation();

    const changeLanguage = (lang: string) => {
        i18n.changeLanguage(lang);
    };

    const currentLanguage = i18n.language;

    // Simple helper to check if language is active (handling potential region codes like en-US)
    const isActive = (lang: string) => currentLanguage.startsWith(lang);

    return (
        <View style={styles.container}>
            <Text style={styles.label}>{t('profile.language')}</Text>
            <View style={styles.buttonGroup}>
                <TouchableOpacity
                    style={[styles.button, isActive('fr') && styles.activeButton]}
                    onPress={() => changeLanguage('fr')}
                >
                    <Text style={[styles.text, isActive('fr') && styles.activeText]}>Français</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.button, isActive('en') && styles.activeButton]}
                    onPress={() => changeLanguage('en')}
                >
                    <Text style={[styles.text, isActive('en') && styles.activeText]}>English</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginVertical: 10,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
        color: '#333',
    },
    buttonGroup: {
        flexDirection: 'row',
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        padding: 4,
    },
    button: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 6,
    },
    activeButton: {
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
        elevation: 2,
    },
    text: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    activeText: {
        color: '#000',
        fontWeight: '600',
    },
});
