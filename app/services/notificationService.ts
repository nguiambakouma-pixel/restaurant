// MOCKED SERVICE - NOTIFICATIONS DISABLED
export const notificationService = {
    registerForPushNotifications: async () => null,
    saveToken: async () => { },
    removeToken: async () => { },
    sendPushNotification: async () => { },
    notifyAdminsNewOrder: async () => { },
    notifyCustomerOrderStatus: async () => { },
    addNotificationReceivedListener: () => ({ remove: () => { } }),
    addNotificationResponseReceivedListener: () => ({ remove: () => { } }),
};

export default notificationService;