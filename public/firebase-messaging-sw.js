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

// Handle background messages
messaging.onBackgroundMessage((payload) => {
    // console.log('[firebase-messaging-sw.js] Received background message:', payload);


    const notificationTitle = payload.notification?.title || 'Nueva Notificación';
    const notificationOptions = {
        body: payload.notification?.body || '',
        icon: '/icon.svg',
        badge: '/icon.svg',
        tag: payload.data?.tag || 'default',
        data: payload.data || {},
        requireInteraction: true // Keep notification visible until user interacts
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
    // console.log('[firebase-messaging-sw.js] Notification click:', event);
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
            // Check if there's already a window open
            for (const client of windowClients) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    client.navigate(targetUrl);
                    return client.focus();
                }
            }
            // If no window is open, open a new one
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});

// Handle push events (fallback if onBackgroundMessage doesn't fire)
self.addEventListener('push', (event) => {
    // console.log('[firebase-messaging-sw.js] Push event received:', event);


    if (!event.data) {
        return;
    }

    try {
        const data = event.data.json();

        // Only show notification if it wasn't already handled by FCM
        if (data.notification) {
            const options = {
                body: data.notification.body || '',
                icon: '/icon.svg',
                badge: '/icon.svg',
                data: data.data || {}
            };

            event.waitUntil(
                self.registration.showNotification(data.notification.title || 'Notificación', options)
            );
        }
    } catch (e) {
        console.error('[firebase-messaging-sw.js] Error parsing push data:', e);
    }
});

// console.log('[firebase-messaging-sw.js] Firebase Messaging Service Worker loaded');
