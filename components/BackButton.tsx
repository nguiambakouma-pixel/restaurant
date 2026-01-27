// components/BackButton.tsx - Composant réutilisable
import { router } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

interface BackButtonProps {
  onPress?: () => void;
  style?: any;
}

export default function BackButton({ onPress, style }: BackButtonProps) {
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.back();
    }
  };

  return (
    <TouchableOpacity
      style={[styles.backButton, style]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <Text style={styles.backButtonText}>←</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
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
});

