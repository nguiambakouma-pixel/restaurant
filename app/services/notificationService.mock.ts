// Service Mock pour le développement sans notifications
class NotificationServiceMock {
    async registerForPushNotifications() {
        console.log('[DEV] Notifications désactivées en mode développement');
        return null;
    }

    async saveToken() {
        console.log('[DEV] Token non sauvegardé (mode dev)');
    }

    async removeToken() {
        console.log('[DEV] Token non supprimé (mode dev)');
    }

    async sendPushNotification(tokens: string[], title: string, body: string, data?: any) {
        console.log('[DEV] Notification simulée (mode dev)', { tokens, title, body, data });
    }

    async notifyAdminsNewOrder(orderId: string, customerName: string, total: number) {
        console.log(`[DEV] Admin notifié: Commande #${orderId} - ${customerName} - ${total} FCFA`);
    }

    async notifyCustomerOrderStatus(userId: string, orderId: string, status: string) {
        console.log(`[DEV] Client ${userId} notifié: Commande #${orderId} - ${status}`);
    }

    addNotificationReceivedListener(callback: (notification: any) => void) {
        return { remove: () => { } };
    }

    addNotificationResponseReceivedListener(callback: (response: any) => void) {
        return { remove: () => { } };
    }
}

export const notificationService = new NotificationServiceMock();
export default notificationService;