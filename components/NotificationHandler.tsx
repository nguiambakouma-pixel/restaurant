import { router } from 'expo-router';
import { useEffect } from 'react';
import notificationService from '../app/services/notificationService';

export function NotificationHandler() {
    useEffect(() => {
        // Écouter les notifications reçues pendant que l'app est ouverte
        const receivedSubscription = notificationService.addNotificationReceivedListener(
            (notification) => {
                console.log('Notification reçue:', notification);
            }
        );

        // Écouter les clics sur les notifications
        const responseSubscription = notificationService.addNotificationResponseReceivedListener(
            (response) => {
                const data = response.notification.request.content.data;

                if (data?.type === 'new_order' && data?.orderId) {
                    // Rediriger vers la page des commandes admin
                    router.push('/admin/orders');
                } else if (data?.type === 'order_status' && data?.orderId) {
                    // Rediriger vers la page des commandes client
                    router.push('/(tabs)/orders');
                }
            }
        );

        return () => {
            receivedSubscription.remove();
            responseSubscription.remove();
        };
    }, []);

    return null; // Ce composant n'affiche rien
}