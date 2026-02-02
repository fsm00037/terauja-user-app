"use client"

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react"
import { usePathname } from "next/navigation"
import { getCurrentPatient } from "@/lib/auth"
import { getPendingAssignments, getMessages, registerFCMToken, testPushNotification } from "@/lib/api"
import { requestFCMToken, onForegroundMessage, initializeFirebaseApp } from "@/lib/firebase"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Bell, X } from "lucide-react"

interface NotificationContextType {
    showPermissionModal: () => void
    permission: NotificationPermission
    testNotification: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function useNotification() {
    const context = useContext(NotificationContext)
    if (!context) {
        throw new Error("useNotification must be used within a NotificationProvider")
    }
    return context
}

export function NotificationProvider({ children }: { children: ReactNode }) {
    const [permission, setPermission] = useState<NotificationPermission>('default')
    const [fcmToken, setFcmToken] = useState<string | null>(null)
    const [knownIds, setKnownIds] = useState<Set<number>>(new Set())
    const [knownMessageIds, setKnownMessageIds] = useState<Set<number>>(new Set())
    const [showPermissionRequest, setShowPermissionRequest] = useState(false)
    const initRef = useRef(false)
    const fcmInitRef = useRef(false)
    const pathname = usePathname()

    const initFCM = async () => {
        try {
            // Only run once per session if successful
            if (fcmInitRef.current) return

            // Initialize Firebase
            initializeFirebaseApp()

            // Request permission and get FCM token
            const token = await requestFCMToken()

            if (token) {
                setFcmToken(token)
                setPermission('granted')
                fcmInitRef.current = true

                // Register token with backend
                const registered = await registerFCMToken(token)
                if (!registered) {
                    console.error("Failed to register token with backend")
                }
            } else {
                setPermission(Notification.permission)
            }
        } catch (error) {
            console.error("[NotificationProvider] Error initializing FCM:", error)
            toast.error("Error al activar notificaciones")
        }
    }

    // Check permissions and initialize on mount and route change
    useEffect(() => {
        const patient = getCurrentPatient()

        if (!patient) {
            setShowPermissionRequest(false)
            return
        }

        // If permission is already granted, init FCM
        if (Notification.permission === 'granted') {
            setPermission('granted')
            initFCM()
        } else {
            setPermission(Notification.permission)
            // If default, show request automatically on first visit (logic controlled by us)
            // For now, let's behave as requested: prompt on login if default
            if (Notification.permission === 'default') {
                setShowPermissionRequest(true)
            }
        }
    }, [pathname])

    // Ensure we listen for foreground messages
    useEffect(() => {
        if (permission === 'granted') {
            const unsubscribe = onForegroundMessage((payload) => {
                toast(payload.title || "Nueva Notificación", {
                    description: payload.body,
                })
            })

            return () => {
                if (unsubscribe) unsubscribe()
            }
        }
    }, [permission])


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

        checkUpdates()
        const interval = setInterval(checkUpdates, 60000)
        return () => clearInterval(interval)
    }, [knownIds, knownMessageIds])

    const handleEnableNotifications = async () => {
        await initFCM()
        setShowPermissionRequest(false)
    }

    const testNotification = async () => {
        const result = await testPushNotification()
        if (result) {
            toast.success("Notificación de prueba enviada")
        } else {
            toast.error("Error al enviar notificación de prueba")
        }
    }

    return (
        <NotificationContext.Provider value={{
            showPermissionModal: () => setShowPermissionRequest(true),
            permission,
            testNotification
        }}>
            {children}
            {showPermissionRequest && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center pointer-events-none p-4 pb-24 sm:pb-4">
                    <div className="bg-card/95 backdrop-blur-xl border border-border/50 p-6 rounded-3xl shadow-2xl max-w-sm w-full space-y-4 pointer-events-auto animate-in slide-in-from-bottom-4 duration-500">
                        <div className="flex justify-between items-start">
                            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                                <Bell className="w-6 h-6 text-primary" />
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 -mt-2 rounded-full" onClick={() => setShowPermissionRequest(false)}>
                                <X className="w-4 h-4" />
                            </Button>
                        </div>

                        <div className="space-y-1">
                            <h3 className="font-semibold text-lg leading-tight">Activa las notificaciones</h3>
                            <p className="text-muted-foreground text-sm leading-relaxed">
                                Para no perderte los cuestionarios y mensajes importantes de tu terapeuta.
                            </p>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <Button
                                variant="default"
                                onClick={handleEnableNotifications}
                                className="flex-1 rounded-xl h-11 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
                            >
                                Permitir
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={() => setShowPermissionRequest(false)}
                                className="flex-1 rounded-xl h-11"
                            >
                                Ahora no
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </NotificationContext.Provider>
    )
}
