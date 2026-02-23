"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Lock, Mail, User, Building2, AlertTriangle, X, CheckCircle } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { Moon, Sun } from "lucide-react"

export default function RegistroPage() {
  const { theme, setTheme } = useTheme()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    senha: "",
    confirmarSenha: "",
    cnpj: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validacoes
    if (!formData.nome || !formData.email || !formData.senha || !formData.cnpj) {
      setError("Todos os campos sao obrigatorios.")
      setLoading(false)
      return
    }

    if (formData.senha.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.")
      setLoading(false)
      return
    }

    if (formData.senha !== formData.confirmarSenha) {
      setError("As senhas nao coincidem.")
      setLoading(false)
      return
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          nome: formData.nome,
          email: formData.email,
          senha: formData.senha,
          cnpj: formData.cnpj,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erro ao criar conta")
      }

      setSuccess(`Conta criada com sucesso! Vinculada a empresa: ${data.empresa}`)

      // Redirecionar apos 2 segundos
      setTimeout(() => {
        window.location.href = "/cliente"
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar conta")
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
          {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </Button>

        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-20 h-12 rounded-2xl flex items-center justify-center">
            <img src="/favicon.png" alt="logo" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Criar Conta de Cliente</CardTitle>
            <CardDescription>
              Cadastre-se para acompanhar suas solicitacoes de servico
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome completo</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="nome"
                  placeholder="Seu nome completo"
                  className="pl-10"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ da Empresa</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="cnpj"
                  placeholder="00.000.000/0000-00"
                  className="pl-10"
                  value={formData.cnpj}
                  onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                  required
                  disabled={loading}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                O CNPJ deve estar previamente cadastrado no sistema pela Medical Spin.
              </p>
            </div>

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
                  placeholder="Minimo 6 caracteres"
                  className="pl-10"
                  value={formData.senha}
                  onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmarSenha">Confirmar Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmarSenha"
                  type="password"
                  placeholder="Repita a senha"
                  className="pl-10"
                  value={formData.confirmarSenha}
                  onChange={(e) => setFormData({ ...formData, confirmarSenha: e.target.value })}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Erro */}
            {error && (
              <div className="relative overflow-hidden rounded-lg border border-red-500/50 bg-red-500/10 p-4 shadow-[0_0_15px_rgba(239,68,68,0.3)] animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 rounded-full bg-red-500/20 p-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-red-500 mb-1">Erro no cadastro</h3>
                    <p className="text-sm text-red-400/90">{error}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setError(null)}
                    className="flex-shrink-0 rounded-full p-1 hover:bg-red-500/20 transition-colors"
                  >
                    <X className="h-4 w-4 text-red-500" />
                  </button>
                </div>
              </div>
            )}

            {/* Sucesso */}
            {success && (
              <div className="rounded-lg border border-green-500/50 bg-green-500/10 p-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 rounded-full bg-green-500/20 p-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-green-600 dark:text-green-400 mb-1">Sucesso</h3>
                    <p className="text-sm text-green-600/90 dark:text-green-400/90">{success}</p>
                  </div>
                </div>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading || !!success}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando conta...
                </>
              ) : (
                "Criar Conta"
              )}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Ja possui uma conta?{" "}
              <Link href="/login" className="text-primary hover:underline font-medium">
                Faca login
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
