"use client"

import { useEffect, useRef, useState } from "react"
import { getCurrentPatient } from "@/lib/auth"
import { getPendingAssignments, type QuestionnaireCompletion, getMessages, registerFCMToken, testPushNotification } from "@/lib/api"
import { requestFCMToken, onForegroundMessage, initializeFirebaseApp } from "@/lib/firebase"
import { toast } from "sonner"

export function NotificationManager() {
    const [permission, setPermission] = useState<NotificationPermission>('default')
    const [fcmToken, setFcmToken] = useState<string | null>(null)
    const [knownIds, setKnownIds] = useState<Set<number>>(new Set())
    const [knownMessageIds, setKnownMessageIds] = useState<Set<number>>(new Set())
    const initRef = useRef(false)
    const fcmInitRef = useRef(false)

    // Initialize Firebase and request FCM token
    useEffect(() => {
        const patient = getCurrentPatient()
        // console.log("[NotificationManager] Patient:", patient?.id || "no patient")
        if (!patient) return

        // Only run once
        if (fcmInitRef.current) {
            // console.log("[NotificationManager] Already initialized, skipping")
            return
        }
        fcmInitRef.current = true

        const initFCM = async () => {
            try {
                // console.log("[NotificationManager] Starting FCM initialization...")

                // Initialize Firebase
                const app = initializeFirebaseApp()
                // console.log("[NotificationManager] Firebase app:", app ? "initialized" : "null")

                // Request permission and get FCM token
                // console.log("[NotificationManager] Requesting FCM token...")
                const token = await requestFCMToken()
                // console.log("[NotificationManager] Token result:", token ? token.substring(0, 30) + "..." : "null")

                if (token) {
                    setFcmToken(token)
                    setPermission('granted')

                    // Register token with backend
                    // console.log("[NotificationManager] Registering token with backend...")
                    const registered = await registerFCMToken(token)
                    // console.log("[NotificationManager] Token registration result:", registered)
                } else {
                    // console.log("[NotificationManager] No token received, permission:", Notification.permission)
                    setPermission(Notification.permission)
                }
            } catch (error) {
                console.error("[NotificationManager] Error initializing FCM:", error)
                toast.error("Error al activar notificaciones", {
                    description: "Por favor recarga la página o revisa los permisos de notificación."
                })
            }
        }

        initFCM()

        // Set up foreground message handling
        const unsubscribe = onForegroundMessage((payload) => {
            // Show toast for foreground messages
            toast(payload.title || "Nueva Notificación", {
                description: payload.body,
            })
        })

        return () => {
            if (unsubscribe) {
                unsubscribe()
            }
        }
    }, [])


    // Polling for assignments and messages (fallback for local notifications)
    useEffect(() => {
        const patient = getCurrentPatient()
        if (!patient) return

        const checkUpdates = async () => {
            try {
                // 1. Check Assignments
                const pending = await getPendingAssignments()

                // 2. Check Messages
                const messages = patient.id ? await getMessages(patient.id) : []
                const incomingMessages = messages.filter(m => !m.is_from_patient)

                // On first run, just populate knownIds without notifying
                if (!initRef.current) {
                    const ids = new Set(pending.map(p => p.id))
                    setKnownIds(ids)

                    const msgIds = new Set(incomingMessages.map(m => m.id))
                    setKnownMessageIds(msgIds)

                    initRef.current = true
                    return
                }

                // -- Process Assignments --
                const newIds = new Set(pending.map(p => p.id))
                const addedIds = pending.filter(p => !knownIds.has(p.id))

                if (addedIds.length > 0) {
                    addedIds.forEach(assignment => {
                        // Show toast for foreground (push notification handles background)
                        toast("Nueva Tarea Disponible", {
                            description: `Tienes un nuevo cuestionario pendiente: ${assignment.questionnaire.title}`,
                        })
                    })
                }

                if (newIds.size !== knownIds.size || addedIds.length > 0) {
                    setKnownIds(newIds)
                }

                // -- Process Messages --
                const newMsgIds = new Set(incomingMessages.map(m => m.id))
                const addedMessages = incomingMessages.filter(m => !knownMessageIds.has(m.id))

                if (addedMessages.length > 0) {
                    addedMessages.forEach(() => {
                        toast("Nuevo Mensaje", {
                            description: "Tienes un nuevo mensaje de tu psicólogo",
                        })
                    })
                }

                if (newMsgIds.size !== knownMessageIds.size || addedMessages.length > 0) {
                    setKnownMessageIds(newMsgIds)
                }

            } catch (error) {
                console.error("Error checking updates for notifications:", error)
            }
        }

        // Initial check
        checkUpdates()

        // Poll every 60 seconds
        const interval = setInterval(checkUpdates, 60000)

        return () => clearInterval(interval)
    }, [knownIds, knownMessageIds])

    // Test notification button (only in development or for debugging)
    const handleTestNotification = async () => {
        const result = await testPushNotification()
        if (result) {
            toast.success("Notificación de prueba enviada")
        } else {
            toast.error("Error al enviar notificación de prueba")
        }
    }

    // Render a small test button for development/testing
    return null
    // (
    //     <button
    //         onClick={handleTestNotification}
    //         className="fixed bottom-4 right-4 z-50 bg-blue-500 text-white px-4 py-2 rounded-full text-xs shadow-lg opacity-80 hover:opacity-100 transition-opacity"
    //         style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999 }}
    //     >
    //         Test Push
    //     </button>
    // )
}
