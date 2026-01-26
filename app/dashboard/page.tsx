"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentPatient, type Patient, logout } from "@/lib/auth"
import { getPendingAssignments, type QuestionnaireCompletion } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Bell, Clock, LogOut } from "lucide-react"
import Link from "next/link"
import { BottomNav } from "@/components/bottom-nav"

export default function DashboardPage() {
  const [patient, setPatient] = useState<Patient | null>(null)
  const [pendingCompletions, setPendingCompletions] = useState<QuestionnaireCompletion[]>([])
  const [psychologistOnline, setPsychologistOnline] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const currentPatient = getCurrentPatient()
    if (!currentPatient) {
      router.push("/login")
    } else {
      setPatient(currentPatient)
      setPsychologistOnline(currentPatient.psychologistOnline || false)

      const fetchAssignments = async () => {
        const pending = await getPendingAssignments()
        setPendingCompletions(pending)
      }

      const fetchData = async () => {
        // Fetch fresh assignments
        await fetchAssignments()

        // Fetch fresh profile data to sync therapist info
        const freshProfile = await import("@/lib/api").then(mod => mod.getPatientProfile())
        if (freshProfile) {
          import("@/lib/auth").then(mod => {
            mod.updateCurrentPatient({
              psychologistName: freshProfile.psychologist_name,
              psychologistSchedule: freshProfile.psychologist_schedule
            })
          })
          // Update local state if changed
          if (freshProfile.psychologist_name !== currentPatient.psychologistName ||
            freshProfile.psychologist_schedule !== currentPatient.psychologistSchedule) {
            setPatient(prev => prev ? ({
              ...prev,
              psychologistName: freshProfile.psychologist_name,
              psychologistSchedule: freshProfile.psychologist_schedule
            }) : null)
          }
        }
      }

      const checkStatus = async () => {
        const status = await import("@/lib/api").then(mod => mod.getPatientStatus())
        if (status) {
          setPsychologistOnline(status.psychologist_is_online)
        }
      }

      fetchData()
      checkStatus()

      const interval = setInterval(() => {
        checkStatus()
        fetchAssignments()
      }, 5000)

      return () => clearInterval(interval)
    }
  }, [router])

  const handleLogout = async () => {
    await logout()
    router.push("/login")
  }

  if (!patient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/40">
        <div className="container max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/60 rounded-xl flex items-center justify-center text-primary-foreground font-bold shadow-sm">
                {patient.patientCode ? patient.patientCode.slice(-2) : 'P'}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Bienvenido</p>
                <h1 className="font-semibold text-foreground leading-tight">Usuario {patient.patientCode}</h1>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container max-w-2xl mx-auto px-4 py-6 space-y-6">
        {pendingCompletions.map(completion => (
          <div key={completion.id} className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Bell className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground">Nueva Tarea Disponible</p>
                <p className="text-sm text-muted-foreground mt-0.5">{completion.questionnaire.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Programado: {new Date(completion.scheduled_at).toLocaleString()}</p>
              </div>
              <Button asChild size="sm" className="rounded-xl flex-shrink-0">
                <Link href={`/formularios?assignmentId=${completion.assignment_id}`}>Abrir</Link>
              </Button>
            </div>
          </div>
        ))}

        <div className="rounded-2xl bg-card border border-border/50 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-br from-primary/5 to-secondary/5 p-6 border-b border-border/50">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Tu Terapeuta</h2>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-background/60 backdrop-blur-sm border border-border/50">
                <div
                  className={`w-2 h-2 rounded-full ${psychologistOnline ? "bg-green-500 animate-pulse" : "bg-muted-foreground/50"}`}
                />
                <span className="text-xs font-medium text-foreground">
                  {psychologistOnline ? "Conectado" : "Desconectado"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/60 rounded-2xl flex items-center justify-center text-2xl font-bold text-primary-foreground shadow-md">
                  {patient.psychologistName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)}
                </div>
                <div
                  className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 border-background ${psychologistOnline ? "bg-green-500" : "bg-muted-foreground/50"}`}
                />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-foreground">{patient.psychologistName}</h3>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground mb-1">Horario de atención</p>
                <p className="text-sm text-muted-foreground">
                  {patient.psychologistSchedule || "Consultar disponibilidad"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
