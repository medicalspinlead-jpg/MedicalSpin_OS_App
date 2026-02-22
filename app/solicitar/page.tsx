"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { UFS, FABRICANTES, MODELOS } from "@/lib/constants"
import { Send, CheckCircle, Search, ArrowLeft, AlertTriangle, Building2, Wrench, MessageSquare } from "lucide-react"

export default function SolicitarPage() {
  const [step, setStep] = useState<"form" | "success">("form")
  const [protocolo, setProtocolo] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [form, setForm] = useState({
    nomeEmpresa: "",
    cnpj: "",
    nomeContato: "",
    telefone: "",
    email: "",
    cidade: "",
    uf: "",
    tipoEquipamento: "",
    fabricante: "",
    modelo: "",
    numeroSerie: "",
    descricaoProblema: "",
    urgencia: "normal",
  })

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setError("")
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    // Validação
    const required = [
      { field: "nomeEmpresa", label: "Nome da Empresa" },
      { field: "nomeContato", label: "Nome do Contato" },
      { field: "telefone", label: "Telefone" },
      { field: "email", label: "Email" },
      { field: "cidade", label: "Cidade" },
      { field: "uf", label: "UF" },
      { field: "tipoEquipamento", label: "Tipo de Equipamento" },
      { field: "fabricante", label: "Fabricante" },
      { field: "modelo", label: "Modelo" },
      { field: "descricaoProblema", label: "Descrição do Problema" },
    ]

    for (const { field, label } of required) {
      if (!form[field as keyof typeof form] || form[field as keyof typeof form].trim() === "") {
        setError(`O campo "${label}" é obrigatório.`)
        return
      }
    }

    setLoading(true)
    try {
      const res = await fetch("/api/solicitacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Erro ao enviar solicitação")
      }

      const data = await res.json()
      setProtocolo(data.protocolo)
      setStep("success")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar solicitação. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  if (step === "success") {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto p-3 bg-green-100 rounded-full w-fit mb-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-xl">Solicitação Enviada</CardTitle>
            <CardDescription>Sua solicitação de serviço foi registrada com sucesso.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg text-center">
              <p className="text-sm text-muted-foreground mb-1">Seu protocolo</p>
              <p className="text-2xl font-bold font-mono tracking-wider text-foreground">{protocolo}</p>
            </div>
            <p className="text-sm text-muted-foreground text-center leading-relaxed">
              Guarde este numero de protocolo. Voce pode usar ele para acompanhar o status da sua solicitacao a qualquer momento.
            </p>
            <div className="flex flex-col gap-2">
              <Button asChild className="w-full">
                <Link href={`/solicitar/acompanhar?protocolo=${protocolo}`}>
                  <Search className="h-4 w-4 mr-2" />
                  Acompanhar Solicitação
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full bg-transparent">
                <Link href="/solicitar">
                  Nova Solicitação
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="border-b bg-card shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link href="/solicitar" className="flex items-center gap-2 hover:opacity-80">
              <img src="/favicon.png" alt="logo" className="h-5 w-5 md:h-6 md:w-6" />
              <h1 className="text-base md:text-xl font-semibold text-foreground">Medical Spin</h1>
            </Link>
            <Button asChild variant="outline" size="sm" className="bg-transparent">
              <Link href="/solicitar/acompanhar">
                <Search className="h-4 w-4 mr-2" />
                Acompanhar Solicitação
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 md:py-8 max-w-3xl">
        <div className="mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-foreground text-balance">Solicitar Serviço Tecnico</h2>
          <p className="text-sm text-muted-foreground mt-1">Preencha os dados abaixo para solicitar um serviço. Voce receberá um protocolo para acompanhar o andamento.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Seção 1: Dados da Empresa */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">Dados da Empresa</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nomeEmpresa">Nome da Empresa *</Label>
                  <Input
                    id="nomeEmpresa"
                    placeholder="Razão social ou nome fantasia"
                    value={form.nomeEmpresa}
                    onChange={(e) => updateField("nomeEmpresa", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input
                    id="cnpj"
                    placeholder="00.000.000/0000-00"
                    value={form.cnpj}
                    onChange={(e) => updateField("cnpj", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nomeContato">Nome do Contato *</Label>
                  <Input
                    id="nomeContato"
                    placeholder="Pessoa responsável"
                    value={form.nomeContato}
                    onChange={(e) => updateField("nomeContato", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone *</Label>
                  <Input
                    id="telefone"
                    placeholder="(00) 00000-0000"
                    value={form.telefone}
                    onChange={(e) => updateField("telefone", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@empresa.com"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="cidade">Cidade *</Label>
                  <Input
                    id="cidade"
                    placeholder="Cidade"
                    value={form.cidade}
                    onChange={(e) => updateField("cidade", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="uf">UF *</Label>
                  <Select value={form.uf} onValueChange={(value) => updateField("uf", value)}>
                    <SelectTrigger id="uf">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {UFS.map((uf) => (
                        <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seção 2: Dados do Equipamento */}
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
                  placeholder="Ex: Ressonância Magnética, Tomógrafo..."
                  value={form.tipoEquipamento}
                  onChange={(e) => updateField("tipoEquipamento", e.target.value)}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fabricante">Fabricante *</Label>
                  <Select value={form.fabricante} onValueChange={(value) => updateField("fabricante", value)}>
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
                  <Select value={form.modelo} onValueChange={(value) => updateField("modelo", value)}>
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
                  placeholder="Número de série do equipamento (opcional)"
                  value={form.numeroSerie}
                  onChange={(e) => updateField("numeroSerie", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Seção 3: Descrição do Problema */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">Descrição do Problema</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="descricaoProblema">Descreva o problema ou motivo do serviço *</Label>
                <Textarea
                  id="descricaoProblema"
                  placeholder="Descreva detalhadamente o problema que está enfrentando com o equipamento, incluindo quando começou e quais sintomas apresenta..."
                  rows={5}
                  value={form.descricaoProblema}
                  onChange={(e) => updateField("descricaoProblema", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="urgencia">Urgencia</Label>
                <Select value={form.urgencia} onValueChange={(value) => updateField("urgencia", value)}>
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

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Submit */}
          <div className="flex flex-col gap-3 md:flex-row md:justify-end">
            <Button type="submit" disabled={loading} className="md:min-w-[200px]">
              {loading ? (
                "Enviando..."
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar Solicitação
                </>
              )}
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}
