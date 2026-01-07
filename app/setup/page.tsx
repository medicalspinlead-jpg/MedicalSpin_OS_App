"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, UserPlus, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function SetupPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [created, setCreated] = useState(false)
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    senha: "",
    cargo: "admin",
    setupKey: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/auth/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erro ao criar usuário")
      }

      setCreated(true)
      toast({
        title: "Usuário criado",
        description: `${data.usuario.nome} foi criado com sucesso!`,
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao criar usuário",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (created) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-950 p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Usuário Criado!</h2>
            <p className="text-muted-foreground mb-4">Agora você pode fazer login com as credenciais criadas.</p>
            <Button asChild>
              <a href="/login">Ir para Login</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-950 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-zinc-900 dark:bg-zinc-100 rounded-2xl flex items-center justify-center mb-4">
            <UserPlus className="w-8 h-8 text-white dark:text-zinc-900" />
          </div>
          <CardTitle className="text-2xl font-bold">Criar Usuário</CardTitle>
          <CardDescription>Configure o primeiro usuário do sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome Completo</Label>
              <Input
                id="nome"
                placeholder="João Silva"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="joao@empresa.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="senha">Senha</Label>
              <Input
                id="senha"
                type="password"
                placeholder="••••••••"
                value={formData.senha}
                onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cargo">Cargo</Label>
              <Select
                value={formData.cargo}
                onValueChange={(value) => setFormData({ ...formData, cargo: value })}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="tecnico">Técnico</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="setupKey">Chave de Setup</Label>
              <Input
                id="setupKey"
                type="password"
                placeholder="Chave de segurança"
                value={formData.setupKey}
                onChange={(e) => setFormData({ ...formData, setupKey: e.target.value })}
                required
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">Digite a chave de segurança para criar o usuário</p>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                "Criar Usuário"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
