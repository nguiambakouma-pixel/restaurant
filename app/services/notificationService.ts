// MOCKED SERVICE - NOTIFICATIONS DISABLED
export const notificationService = {
    registerForPushNotifications: async () => null,
    saveToken: async () => { },
    removeToken: async () => { },
    sendPushNotification: async () => { },
    notifyAdminsNewOrder: async () => { },
    notifyCustomerOrderStatus: async () => { },
    addNotificationReceivedListener: (callback: (notification: any) => void) => ({ remove: () => { } }),
    addNotificationResponseReceivedListener: (callback: (response: any) => void) => ({ remove: () => { } }),
};

export default notificationService;