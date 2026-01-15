"use client"

import type React from "react"
import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { getCurrentPatient, type Patient } from "@/lib/auth"
import { getMessages, sendMessage, type ChatMessage } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Send } from "lucide-react"
import { BottomNav } from "@/components/bottom-nav"

export default function ChatPage() {
  const [patient, setPatient] = useState<Patient | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [psychologistOnline, setPsychologistOnline] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const refreshMessages = async (pId: string | number) => {
    const msgs = await getMessages(pId);
    setMessages(msgs);
  }

  useEffect(() => {
    const currentPatient = getCurrentPatient()
    if (!currentPatient) {
      router.push("/login")
    } else {
      setPatient(currentPatient)
      refreshMessages(currentPatient.id)

      const checkStatus = async () => {
        const status = await import("@/lib/api").then(mod => mod.getPatientStatus())
        if (status) setPsychologistOnline(status.psychologist_is_online)
      }

      checkStatus()

      const interval = setInterval(() => {
        refreshMessages(currentPatient.id)
        checkStatus()
      }, 5000)

      return () => clearInterval(interval)
    }
  }, [router])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newMessage.trim() || !patient || sending) return

    setSending(true)
    const messageContent = newMessage.trim()
    setNewMessage("")

    await sendMessage(patient.id, messageContent)
    await refreshMessages(patient.id)

    setSending(false)
  }

  if (!patient) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b bg-card sticky top-0 z-10">
        <div className="container max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center font-semibold text-primary text-sm">
              {patient.psychologistName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)}
            </div>
            <div
              className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-card ${psychologistOnline ? "bg-green-500" : "bg-gray-400"
                }`}
            />
          </div>
          <div className="flex-1">
            <h1 className="font-semibold text-sm">{patient.psychologistName}</h1>
            <p className="text-xs text-muted-foreground">{psychologistOnline ? "En línea" : "Desconectado"}</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto pb-44">
        <div className="container max-w-2xl mx-auto px-4 py-6 space-y-3">
          {messages.map((message) => {
            const isFromPatient = message.is_from_patient;
            return (
              <div key={message.id} className={`flex ${!isFromPatient ? "justify-start" : "justify-end"}`}>
                <div
                  className={`flex items-end gap-2 max-w-[75%] ${!isFromPatient ? "" : "flex-row-reverse"}`}
                >
                  <Card
                    className={`px-3 py-2 ${!isFromPatient
                      ? "bg-muted border-muted rounded-br-sm"
                      : "bg-primary text-primary-foreground border-primary rounded-bl-sm"
                      } rounded-2xl`}
                  >
                    <p className="text-sm leading-relaxed">{message.content}</p>
                  </Card>
                  <p
                    className={`text-[10px] mb-1 whitespace-nowrap ${!isFromPatient ? "text-muted-foreground" : "text-muted-foreground"
                      }`}
                  >
                    {new Date(message.created_at).toLocaleTimeString("es-ES", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            )
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t bg-card fixed bottom-20 left-0 right-0 z-20">
        <div className="container max-w-2xl mx-auto px-4 py-4">
          <form onSubmit={handleSend} className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Escribe tu mensaje..."
              disabled={sending}
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={!newMessage.trim() || sending}>
              <Send className="w-5 h-5" />
            </Button>
          </form>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  )
}
