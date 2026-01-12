"use client"

export interface ChatMessage {
  id: string
  senderId: string
  senderName: string
  content: string
  timestamp: Date
  isFromPsychologist: boolean
}

// Mensajes de ejemplo
const DEMO_MESSAGES: ChatMessage[] = [
  {
    id: "1",
    senderId: "psych1",
    senderName: "Dr. Juan Pérez",
    content: "Hola, ¿cómo has estado esta semana?",
    timestamp: new Date(Date.now() - 86400000),
    isFromPsychologist: true,
  },
  {
    id: "2",
    senderId: "1",
    senderName: "María García",
    content: "Hola doctor, he estado mejor. He seguido las técnicas de respiración.",
    timestamp: new Date(Date.now() - 82800000),
    isFromPsychologist: false,
  },
]

export function getChatMessages(patientId: string): ChatMessage[] {
  const key = `chat_${patientId}`
  const data = localStorage.getItem(key)

  if (!data) {
    // Primera vez, guardar mensajes de demostración
    localStorage.setItem(key, JSON.stringify(DEMO_MESSAGES))
    return DEMO_MESSAGES
  }

  try {
    const messages = JSON.parse(data)
    return messages.map((m: any) => ({
      ...m,
      timestamp: new Date(m.timestamp),
    }))
  } catch {
    return []
  }
}

export function sendMessage(
  patientId: string,
  content: string,
  isFromPsychologist: boolean,
  senderName: string,
): ChatMessage {
  const messages = getChatMessages(patientId)

  const newMessage: ChatMessage = {
    id: Date.now().toString(),
    senderId: isFromPsychologist ? "psych" : patientId,
    senderName,
    content,
    timestamp: new Date(),
    isFromPsychologist,
  }

  messages.push(newMessage)
  localStorage.setItem(`chat_${patientId}`, JSON.stringify(messages))

  return newMessage
}
