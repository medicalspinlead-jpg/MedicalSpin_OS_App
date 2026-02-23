"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FABRICANTES, MODELOS } from "@/lib/constants"
import { Send, CheckCircle, AlertTriangle, Wrench, MessageSquare, ArrowLeft, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ClientePerfil {
  razaoSocial: string
  nomeFantasia: string
  cnpj: string
  cidade: string
  uf: string
  telefone: string
  email: string
  responsavel: string
}

export default function NovaSolicitacaoCliente() {
  const router = useRouter()
  const { toast } = useToast()
  const [step, setStep] = useState<"form" | "success">("form")
  const [protocolo, setProtocolo] = useState("")
  const [loading, setLoading] = useState(false)
  const [loadingPerfil, setLoadingPerfil] = useState(true)
  const [error, setError] = useState("")
  const [perfil, setPerfil] = useState<ClientePerfil | null>(null)

  const [form, setForm] = useState({
    tipoEquipamento: "",
    fabricante: "",
    modelo: "",
    numeroSerie: "",
    descricaoProblema: "",
    urgencia: "normal",
    nomeContato: "",
    telefone: "",
    email: "",
  })

  useEffect(() => {
    async function fetchPerfil() {
      try {
        const res = await fetch("/api/cliente/perfil", { credentials: "include" })
        if (res.ok) {
          const data = await res.json()
          setPerfil(data)
          setForm((prev) => ({
            ...prev,
            nomeContato: data.responsavel || "",
            telefone: data.telefone || "",
            email: data.email || "",
          }))
        }
      } catch (error) {
        console.error("Erro ao buscar perfil:", error)
      } finally {
        setLoadingPerfil(false)
      }
    }
    fetchPerfil()
  }, [])

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setError("")
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    const required = [
      { field: "tipoEquipamento", label: "Tipo de Equipamento" },
      { field: "fabricante", label: "Fabricante" },
      { field: "modelo", label: "Modelo" },
      { field: "descricaoProblema", label: "Descricao do Problema" },
    ]

    for (const { field, label } of required) {
      if (!form[field as keyof typeof form] || form[field as keyof typeof form].trim() === "") {
        setError(`O campo "${label}" e obrigatorio.`)
        return
      }
    }

    setLoading(true)
    try {
      const res = await fetch("/api/cliente/solicitacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Erro ao enviar solicitacao")
      }

      const data = await res.json()
      setProtocolo(data.protocolo)
      setStep("success")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar solicitacao.")
    } finally {
      setLoading(false)
    }
  }

  if (step === "success") {
    return (
      <div className="container mx-auto px-4 py-8 max-w-lg">
        <Card>
          <CardHeader className="text-center pb-4">
            <div className="mx-auto p-3 bg-green-100 dark:bg-green-900/30 rounded-full w-fit mb-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-xl">Solicitacao Enviada</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Sua solicitacao foi registrada com sucesso.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg text-center">
              <p className="text-sm text-muted-foreground mb-1">Seu protocolo</p>
              <p className="text-2xl font-bold font-mono tracking-wider text-foreground">{protocolo}</p>
            </div>
            <p className="text-sm text-muted-foreground text-center leading-relaxed">
              Voce pode acompanhar o andamento da sua solicitacao no painel principal.
            </p>
            <div className="flex flex-col gap-2">
              <Button asChild className="w-full">
                <Link href="/cliente">Ver Minhas Solicitacoes</Link>
              </Button>
              <Button
                variant="outline"
                className="w-full bg-transparent"
                onClick={() => {
                  setStep("form")
                  setProtocolo("")
                  setForm({
                    tipoEquipamento: "",
                    fabricante: "",
                    modelo: "",
                    numeroSerie: "",
                    descricaoProblema: "",
                    urgencia: "normal",
                    nomeContato: perfil?.responsavel || "",
                    telefone: perfil?.telefone || "",
                    email: perfil?.email || "",
                  })
                }}
              >
                Nova Solicitacao
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl">
      <div className="mb-6">
        <Button asChild variant="ghost" size="sm" className="mb-2">
          <Link href="/cliente">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Link>
        </Button>
        <h2 className="text-xl md:text-2xl font-bold text-foreground text-balance">Nova Solicitacao de Servico</h2>
        {perfil && (
          <p className="text-sm text-muted-foreground mt-1">
            Solicitando para: <span className="font-medium">{perfil.razaoSocial}</span> ({perfil.cnpj})
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Equipamento */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Dados do Equipamento</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tipoEquipamento">Tipo de Equipamento *</Label>
              <Input
                id="tipoEquipamento"
                placeholder="Ex: Ressonancia Magnetica, Tomografo..."
                value={form.tipoEquipamento}
                onChange={(e) => updateField("tipoEquipamento", e.target.value)}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fabricante">Fabricante *</Label>
                <Select value={form.fabricante} onValueChange={(v) => updateField("fabricante", v)}>
                  <SelectTrigger id="fabricante">
                    <SelectValue placeholder="Selecione o fabricante" />
                  </SelectTrigger>
                  <SelectContent>
                    {FABRICANTES.map((f) => (
                      <SelectItem key={f} value={f}>{f}</SelectItem>
                    ))}
                    <SelectItem value="Outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="modelo">Modelo *</Label>
                <Select value={form.modelo} onValueChange={(v) => updateField("modelo", v)}>
                  <SelectTrigger id="modelo">
                    <SelectValue placeholder="Selecione o modelo" />
                  </SelectTrigger>
                  <SelectContent>
                    {MODELOS.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                    <SelectItem value="Outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="numeroSerie">Numero de Serie</Label>
              <Input
                id="numeroSerie"
                placeholder="Numero de serie do equipamento (opcional)"
                value={form.numeroSerie}
                onChange={(e) => updateField("numeroSerie", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Descricao */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Descricao do Problema</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="descricaoProblema">Descreva o problema ou motivo do servico *</Label>
              <Textarea
                id="descricaoProblema"
                placeholder="Descreva detalhadamente o problema que esta enfrentando com o equipamento..."
                rows={5}
                value={form.descricaoProblema}
                onChange={(e) => updateField("descricaoProblema", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="urgencia">Urgencia</Label>
              <Select value={form.urgencia} onValueChange={(v) => updateField("urgencia", v)}>
                <SelectTrigger id="urgencia">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="urgente">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Contato (pre-preenchido mas editavel) */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Contato para esta solicitacao</CardTitle>
            <p className="text-xs text-muted-foreground">Pre-preenchido com os dados da empresa. Ajuste se necessario.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nomeContato">Nome do Contato</Label>
                <Input
                  id="nomeContato"
                  value={form.nomeContato}
                  onChange={(e) => updateField("nomeContato", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={form.telefone}
                  onChange={(e) => updateField("telefone", e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Submit */}
        <div className="flex flex-col gap-3 md:flex-row md:justify-end">
          <Button type="submit" disabled={loading || loadingPerfil} className="md:min-w-[200px]">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Enviar Solicitacao
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
