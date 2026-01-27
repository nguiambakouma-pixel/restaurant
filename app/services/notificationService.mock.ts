// Mock pour désactiver complètement les notifications
class NotificationServiceMock {
    async registerForPushNotifications() {
        return null;
    }
    async saveToken() { }
    async removeToken() { }
    async sendPushNotification() { }
    async notifyAdminsNewOrder() { }
    async notifyCustomerOrderStatus() { }
    addNotificationReceivedListener() {
        return { remove: () => { } };
    }
    addNotificationResponseReceivedListener() {
        return { remove: () => { } };
    }
}

export const notificationService = new NotificationServiceMock();
export default notificationService;
