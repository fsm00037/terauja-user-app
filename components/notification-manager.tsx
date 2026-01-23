"use client"

import { useEffect, useRef, useState } from "react"
import { useNotifications } from "@/hooks/use-notifications"
import { getCurrentPatient } from "@/lib/auth"
import { getPendingAssignments, type QuestionnaireCompletion, getMessages } from "@/lib/api"

export function NotificationManager() {
    const { requestPermission, sendNotification, permission } = useNotifications()
    const [knownIds, setKnownIds] = useState<Set<number>>(new Set())
    const [knownMessageIds, setKnownMessageIds] = useState<Set<number>>(new Set())
    const initRef = useRef(false)

    useEffect(() => {
        // Only run on client side and if user is logged in
        const patient = getCurrentPatient()
        if (!patient) return

        // Request permission immediately if not granted/denied
        if (permission === 'default') {
            requestPermission()
        }

        const checkUpdates = async () => {
            try {
                // 1. Check Assignments
                const pending = await getPendingAssignments()

                // 2. Check Messages
                // We assume patient.id is available. If not, we can't fetch messages.
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
                        sendNotification("Nueva Tarea Disponible", {
                            body: `Tienes un nuevo cuestionario pendiente: ${assignment.questionnaire.title}`,
                            icon: "/icon.svg",
                            tag: `assignment-${assignment.id}`
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
                    addedMessages.forEach(msg => {
                        sendNotification("Nuevo Mensaje", {
                            body: "Tienes un nuevo mensaje de tu psicólogo",
                            icon: "/icon.svg",
                            tag: `message-${msg.id}`
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
    }, [permission, knownIds, knownMessageIds, requestPermission, sendNotification])

    // Render a small test button for development/testing
    return (
        <button
            onClick={() => sendNotification("Notificación de Prueba", {
                body: "Esta es una notificación de prueba para verificar el sistema.",
                icon: "/icon.svg"
            })}
            className="fixed bottom-4 right-4 z-50 bg-blue-500 text-white px-4 py-2 rounded-full text-xs shadow-lg opacity-80 hover:opacity-100 transition-opacity"
            style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999 }}
        >
            Test Notificación
        </button>
    )
}
