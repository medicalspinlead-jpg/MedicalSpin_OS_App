"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Lock, Mail, User, Building2, AlertTriangle, X, CheckCircle, Clock } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { Moon, Sun } from "lucide-react"

export default function RegistroPage() {
  const { theme, setTheme } = useTheme()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingApproval, setPendingApproval] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
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

      // Verificar se esta aguardando aprovacao
      if (data.pendingApproval) {
        setPendingApproval(true)
        setSuccessMessage(data.message)
      } else {
        // Redirecionar para o portal do cliente
        window.location.href = "/cliente"
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar conta")
    } finally {
      setLoading(false)
    }
  }

  // Se esta aguardando aprovacao, mostrar tela de confirmacao
  if (pendingApproval) {
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

          <CardContent className="pt-8 pb-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Clock className="h-8 w-8 text-amber-600 dark:text-amber-400" />
              </div>
              
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-foreground">Cadastro Recebido!</h2>
                <p className="text-muted-foreground">
                  Sua solicitacao de cadastro foi enviada com sucesso.
                </p>
              </div>

              <div className="w-full p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                  <div className="text-left">
                    <h3 className="font-semibold text-amber-800 dark:text-amber-300">Aguardando Aprovacao</h3>
                    <p className="text-sm text-amber-700 dark:text-amber-400/90 mt-1">
                      Sua conta esta sendo analisada pela equipe da Medical Spin. 
                      Voce recebera uma notificacao assim que sua conta for aprovada.
                    </p>
                  </div>
                </div>
              </div>

              <div className="w-full space-y-3 pt-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Dados recebidos com sucesso</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 text-amber-500" />
                  <span>Aguardando aprovacao do administrador</span>
                </div>
              </div>

              <div className="w-full pt-4">
                <Button asChild variant="outline" className="w-full">
                  <Link href="/login">Voltar para Login</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
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

            {/* Aviso de aprovacao */}
            <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-3">
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Apos o cadastro, sua conta sera analisada pela equipe da Medical Spin antes de ser liberada.
                </p>
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

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando cadastro...
                </>
              ) : (
                "Solicitar Cadastro"
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
