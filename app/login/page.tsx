"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Lock, Mail, AlertTriangle, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useTheme } from "@/components/theme-provider"
import { Moon, Sun } from "lucide-react"


export default function LoginPage() {
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    email: "",
    senha: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setLoginError(null)

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erro ao fazer login")
      }

      toast({
        title: "Login realizado",
        description: `Bem-vindo, ${data.usuario.nome}!`,
      })

      window.location.href = "/"
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao fazer login"
      
      // Define mensagem amigavel baseada no tipo de erro
      if (errorMessage.includes("Credenciais") || errorMessage.includes("credenciais") || errorMessage.includes("invalidas") || errorMessage.includes("inválidas")) {
        setLoginError("Email ou senha incorretos. Verifique suas credenciais e tente novamente.")
      } else if (errorMessage.includes("Usuario") || errorMessage.includes("Usuário") || errorMessage.includes("nao encontrado") || errorMessage.includes("não encontrado")) {
        setLoginError("Usuario nao encontrado. Verifique se voce possui uma conta cadastrada no sistema.")
      } else {
        setLoginError(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-950 p-4">
      
      <Card className="relative w-full max-w-md">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          className="absolute right-3 top-3"
        >
          {theme === "light" ? (
            <Moon className="h-4 w-4" />
          ) : (
            <Sun className="h-4 w-4" />
          )}
        </Button>
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-20 h-12 rounded-2xl flex items-center justify-center">
            <img src="/favicon.png" alt="logo" />
          </div>

          <div>
            <CardTitle className="text-2xl font-bold">
              Medical Spin OS
            </CardTitle>
            <CardDescription>
              Entre com suas credenciais para acessar
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">             
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  className="pl-10"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="senha">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="senha"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10"
                  value={formData.senha}
                  onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Card de erro de login */}
            {loginError && (
              <div className="relative overflow-hidden rounded-lg border border-red-500/50 bg-red-500/10 p-4 shadow-[0_0_15px_rgba(239,68,68,0.3)] animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-transparent pointer-events-none" />
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 rounded-full bg-red-500/20 p-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-red-500 mb-1">Falha no login</h3>
                    <p className="text-sm text-red-400/90">{loginError}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLoginError(null)}
                    className="flex-shrink-0 rounded-full p-1 hover:bg-red-500/20 transition-colors"
                  >
                    <X className="h-4 w-4 text-red-500" />
                  </button>
                </div>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
