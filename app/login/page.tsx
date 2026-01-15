"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { validatePatientLogin, setCurrentPatient } from "@/lib/auth"
import { BriefcaseMedicalIcon, ArrowRight, Mail } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [accessCode, setAccessCode] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    await new Promise((resolve) => setTimeout(resolve, 500))

    const patient = await validatePatientLogin(email, accessCode)

    if (patient) {
      setCurrentPatient(patient)
      router.push("/dashboard")
    } else {
      setError("Credenciales inválidas")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background via-primary/5 to-background p-4 relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary to-primary/70 rounded-2xl shadow-lg shadow-primary/20">
            <BriefcaseMedicalIcon className="w-10 h-10 text-primary-foreground" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">{""}</h1>
            <p className="text-muted-foreground">Bienvenido a tu espacio </p>
          </div>
        </div>

        <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-3xl shadow-2xl p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-3">
              <label htmlFor="email" className="text-sm font-medium text-foreground block">
                Email
              </label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-14 pl-4 border-2 focus:border-primary transition-all duration-200"
                  disabled={loading}
                  autoFocus
                />
              </div>
            </div>

            <div className="space-y-3">
              <label htmlFor="accessCode" className="text-sm font-medium text-foreground block">
                Código de acceso
              </label>
              <div className="relative">
                <Input
                  id="accessCode"
                  type="text"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                  className="h-14 text-center text-xl font-mono tracking-widest border-2 focus:border-primary transition-all duration-200"
                  disabled={loading}
                />
              </div>
            </div>

            {error && (
              <div className="bg-destructive/10 text-destructive text-sm px-4 py-3 rounded-xl border border-destructive/20 animate-in fade-in slide-in-from-top-2 duration-300">
                {error}
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full h-14 text-base rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-200"
              disabled={loading || !accessCode || !email}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Verificando...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Acceder
                  <ArrowRight className="w-5 h-5" />
                </span>
              )}
            </Button>
          </form>
        </div>

        <div className="bg-muted/30 backdrop-blur-sm border border-border/30 rounded-2xl p-4">
          <p className="text-xs text-center text-muted-foreground">Códigos de demostración</p>
          <div className="flex items-center justify-center gap-3 mt-2">


            <code className="px-3 py-1.5 bg-background/80 rounded-lg font-mono text-xs font-semibold border border-border/50">
              DEMO123
            </code>
          </div>
        </div>
      </div>
    </div>
  )
}
