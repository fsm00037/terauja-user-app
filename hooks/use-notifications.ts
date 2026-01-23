"use client"

import { useEffect, useState } from "react"

export function useNotifications() {
    const [permission, setPermission] = useState<NotificationPermission>('default')

    useEffect(() => {
        // 1. Register Service Worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('Service Worker registered with scope:', registration.scope);
                })
                .catch(error => {
                    console.error('Service Worker registration failed:', error);
                });
        }

        // 2. Check Permission
        if ('Notification' in window) {
            setPermission(Notification.permission)
        }
    }, [])

    const requestPermission = async () => {
        if ('Notification' in window) {
            const result = await Notification.requestPermission()
            setPermission(result)
            return result
        }
        return 'denied'
    }

    const sendNotification = (title: string, options?: NotificationOptions) => {
        if (permission === 'granted') {
            // Use Service Worker registration to show notification if available (better on mobile for some cases)
            navigator.serviceWorker.ready.then(registration => {
                registration.showNotification(title, options)
            })
        }
    }

    return { permission, requestPermission, sendNotification }
}
