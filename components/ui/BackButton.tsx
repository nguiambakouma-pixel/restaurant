import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { IconSymbol } from './icon-symbol';

interface BackButtonProps {
    style?: ViewStyle;
}

export function BackButton({ style }: BackButtonProps) {
    const router = useRouter();

    return (
        <TouchableOpacity
            style={[styles.backButton, style]}
            onPress={() => router.back()}
            activeOpacity={0.8}
        >
            <IconSymbol name="chevron.left" size={28} color="#000" />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        zIndex: 10,
    },
});
