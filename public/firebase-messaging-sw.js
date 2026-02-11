/**
 * Firebase Messaging Service Worker
 * Handles background push notifications from Firebase Cloud Messaging
 */

// Import Firebase scripts for service worker
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// Firebase configuration - must match lib/firebase.ts
firebase.initializeApp({
    apiKey: "AIzaSyDWm_oCIaZIbcU1KNZD5B-0uI5V0lI0wZk",
    authDomain: "psicouja-b1ef9.firebaseapp.com",
    projectId: "psicouja-b1ef9",
    storageBucket: "psicouja-b1ef9.firebasestorage.app",
    messagingSenderId: "270943619163",
    appId: "1:270943619163:web:48f247c3c382b07ebe177e"
});

const messaging = firebase.messaging();

// Handle background messages (data-only messages from backend)
messaging.onBackgroundMessage((payload) => {
    // Read from data payload (backend sends data-only messages to avoid browser auto-display)
    const notificationTitle = payload.data?.title || payload.notification?.title || 'Nueva Notificación';
    const notificationOptions = {
        body: payload.data?.body || payload.notification?.body || '',
        icon: '/icon.svg',
        badge: '/icon.svg',
        tag: payload.data?.tag || payload.data?.type || 'default',
        data: payload.data || {},
        requireInteraction: true
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    // Navigate to specific page based on notification data
    let targetUrl = '/';

    if (event.notification.data?.type === 'questionnaire') {
        targetUrl = '/formularios';
    } else if (event.notification.data?.type === 'message') {
        targetUrl = '/chat';
    }

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            for (const client of windowClients) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    client.navigate(targetUrl);
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});
