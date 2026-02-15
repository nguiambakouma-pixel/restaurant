
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet, View } from 'react-native';

interface LoadingScreenProps {
    fullScreen?: boolean;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ fullScreen = true }) => {
    const rotateAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const startAnimation = () => {
            rotateAnim.setValue(0);
            Animated.loop(
                Animated.timing(rotateAnim, {
                    toValue: 1,
                    duration: 2000,
                    easing: Easing.linear,
                    useNativeDriver: true,
                })
            ).start();
        };

        startAnimation();
    }, [rotateAnim]);

    const spin = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    const Container = fullScreen ? View : View;
    const containerStyle = fullScreen ? styles.fullScreenContainer : styles.container;

    return (
        <Container style={containerStyle}>
            <View style={styles.loaderContainer}>
                {/* Animated Circle */}
                <Animated.View
                    style={[
                        styles.circle,
                        {
                            transform: [{ rotate: spin }],
                        },
                    ]}
                />
                {/* Logo in Center */}
                <Image
                    source={require('../../assets/images/logo_delice.jpg')}
                    style={styles.logo}
                />
            </View>
        </Container>
    );
};

const styles = StyleSheet.create({
    fullScreenContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0a0a0a',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0a0a0a',
        minHeight: 200,
    },
    loaderContainer: {
        width: 100,
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    circle: {
        position: 'absolute',
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 3,
        borderColor: '#2d2d2d', // Darker track
        borderTopColor: '#ff6b35', // Primary color for the spinning part
        borderRightColor: 'transparent',
    },
    logo: {
        width: 60,
        height: 60,
        resizeMode: 'contain',
        borderRadius: 30,
    },
});

export default LoadingScreen;
