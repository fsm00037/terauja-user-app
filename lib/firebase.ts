/**
 * Firebase Cloud Messaging configuration for push notifications
 */

import { initializeApp, getApps, type FirebaseApp } from "firebase/app"
import { getMessaging, getToken, onMessage, type Messaging } from "firebase/messaging"

// Firebase configuration - using project ID from service account
const firebaseConfig = {
    apiKey: "AIzaSyDWm_oCIaZIbcU1KNZD5B-0uI5V0lI0wZk",
    authDomain: "psicouja-b1ef9.firebaseapp.com",
    projectId: "psicouja-b1ef9",
    storageBucket: "psicouja-b1ef9.firebasestorage.app",
    messagingSenderId: "270943619163",
    appId: "1:270943619163:web:48f247c3c382b07ebe177e"
};

let app: FirebaseApp | null = null
let messaging: Messaging | null = null

/**
 * Initialize Firebase app (singleton pattern)
 */
export function initializeFirebaseApp(): FirebaseApp | null {
    if (typeof window === "undefined") {
        return null // Firebase client SDK doesn't work on server
    }

    if (app) {
        return app
    }

    if (getApps().length === 0) {
        app = initializeApp(firebaseConfig)
    } else {
        app = getApps()[0]
    }

    return app
}

/**
 * Get Firebase Messaging instance
 */
export function getFirebaseMessaging(): Messaging | null {
    if (typeof window === "undefined") {
        return null
    }

    if (!messaging) {
        const firebaseApp = initializeFirebaseApp()
        if (firebaseApp) {
            messaging = getMessaging(firebaseApp)
        }
    }

    return messaging
}

/**
 * Request notification permission and get FCM token
 * @returns FCM token string or null if permission denied or error
 */
export async function requestFCMToken(): Promise<string | null> {
    try {
        const permission = await Notification.requestPermission()

        if (permission !== "granted") {
            // console.log("Notification permission denied")
            return null
        }

        const messagingInstance = getFirebaseMessaging()
        if (!messagingInstance) {
            console.error("Firebase Messaging not initialized")
            return null
        }

        // Register service worker for FCM
        const swRegistration = await navigator.serviceWorker.register("/firebase-messaging-sw.js")
        console.log("[FCM] Service Worker registered via register()")

        // Wait for it to be ready
        // This is crucial! "no active Service Worker" often means it's installing but not active yet.
        await navigator.serviceWorker.ready
        console.log("[FCM] Service Worker is ready")

        // Get FCM token
        const token = await getToken(messagingInstance, {
            vapidKey: "BDijUT3Hk2Z2QpE3c4-oy6PVcDzlT-zj0SPxesbdc1gvxKRnrkb3RLNkfW26lGpC8ac1q64GUmSxMmzN46clw3o",
            serviceWorkerRegistration: swRegistration
        })

        // console.log("FCM Token:", token)
        return token
    } catch (error) {
        console.error("Error getting FCM token:", error)
        return null
    }
}

/**
 * Set up foreground message handler
 * @param callback Function to call when a message is received in foreground
 */
export function onForegroundMessage(
    callback: (payload: { title?: string; body?: string; data?: Record<string, string> }) => void
): (() => void) | null {
    const messagingInstance = getFirebaseMessaging()
    if (!messagingInstance) {
        return null
    }

    return onMessage(messagingInstance, (payload) => {
        // console.log("Foreground message received:", payload)
        callback({
            title: payload.notification?.title,
            body: payload.notification?.body,
            data: payload.data
        })
    })
}
