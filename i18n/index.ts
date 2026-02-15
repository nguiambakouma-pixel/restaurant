import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import fr from './locales/fr.json';

const RESOURCES = {
    en: { translation: en },
    fr: { translation: fr },
};

// @ts-ignore
const LANGUAGE_DETECTOR = {
    type: 'languageDetector',
    async: true,
    detect: async (callback: (lang: string) => void) => {
        try {
            // 1. Check AsyncStorage for saved preference
            const savedLanguage = await AsyncStorage.getItem('user-language');
            console.log('Detected saved language:', savedLanguage);
            if (savedLanguage) {
                return callback(savedLanguage);
            }

            // 2. Fallback to device locale
            const deviceLanguage = Localization.getLocales()[0]?.languageCode || 'fr';
            console.log('Detected device language:', deviceLanguage);
            return callback(deviceLanguage);
        } catch (error) {
            console.log('Error reading language', error);
            return callback('fr');
        }
    },
    init: () => { },
    cacheUserLanguage: async (language: string) => {
        try {
            console.log('Caching language:', language);
            await AsyncStorage.setItem('user-language', language);
        } catch (error) {
            console.log('Error reading language', error);
        }
    },
};

i18n
    .use(LANGUAGE_DETECTOR as any)
    .use(initReactI18next)
    .init({
        resources: RESOURCES as any,
        fallbackLng: 'fr', // Default if detection fails
        compatibilityJSON: 'v4', // Required for Android
        interpolation: {
            escapeValue: false, // React already safe from XSS
        },
        react: {
            useSuspense: false,
        },
    });

export default i18n;
