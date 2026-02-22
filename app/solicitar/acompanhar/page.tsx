"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Search, ArrowLeft, Clock, Loader2, AlertTriangle, CheckCircle, Settings, Inbox } from "lucide-react"

interface SolicitacaoPublica {
  protocolo: string
  status: string
  nomeEmpresa: string
  tipoEquipamento: string
  fabricante: string
  modelo: string
  descricaoProblema: string
  urgencia: string
  createdAt: string
  updatedAt: string
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType; step: number }> = {
  recebida: { label: "Recebida", color: "bg-blue-100 text-blue-800 border-blue-200", icon: Inbox, step: 1 },
  em_progresso: { label: "Em Progresso", color: "bg-amber-100 text-amber-800 border-amber-200", icon: Settings, step: 2 },
  finalizada: { label: "Finalizada", color: "bg-green-100 text-green-800 border-green-200", icon: CheckCircle, step: 3 },
}

function StatusTimeline({ currentStatus }: { currentStatus: string }) {
  const steps = [
    { key: "recebida", label: "Recebida", icon: Inbox },
    { key: "em_progresso", label: "Em Progresso", icon: Settings },
    { key: "finalizada", label: "Finalizada", icon: CheckCircle },
  ]

  const currentStep = STATUS_CONFIG[currentStatus]?.step || 1

  return (
    <div className="flex items-center justify-between w-full py-4">
      {steps.map((s, index) => {
        const isCompleted = s.key === "recebida" ? currentStep >= 1 : s.key === "em_progresso" ? currentStep >= 2 : currentStep >= 3
        const isActive = STATUS_CONFIG[currentStatus]?.step === index + 1
        const Icon = s.icon

        return (
          <div key={s.key} className="flex items-center flex-1">
            <div className="flex flex-col items-center gap-2">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                  isActive
                    ? "bg-primary border-primary text-primary-foreground"
                    : isCompleted
                      ? "bg-primary/20 border-primary text-primary"
                      : "bg-muted border-border text-muted-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <span
                className={`text-xs font-medium text-center ${
                  isActive ? "text-primary" : isCompleted ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {s.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-2 mb-6 ${
                  currentStep > index + 1 ? "bg-primary" : "bg-border"
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function AcompanharPage() {
  const searchParams = useSearchParams()
  const [protocoloInput, setProtocoloInput] = useState("")
  const [solicitacao, setSolicitacao] = useState<SolicitacaoPublica | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [searched, setSearched] = useState(false)

  useEffect(() => {
    const protocoloParam = searchParams.get("protocolo")
    if (protocoloParam) {
      setProtocoloInput(protocoloParam)
      buscarSolicitacao(protocoloParam)
    }
  }, [searchParams])

  async function buscarSolicitacao(protocolo?: string) {
    const protocoloQuery = protocolo || protocoloInput
    if (!protocoloQuery.trim()) {
      setError("Digite o número do protocolo.")
      return
    }

    setLoading(true)
    setError("")
    setSolicitacao(null)
    setSearched(true)

    try {
      const res = await fetch(`/api/solicitacoes/acompanhar?protocolo=${encodeURIComponent(protocoloQuery.trim())}`)

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Solicitação não encontrada")
      }

      const data = await res.json()
      setSolicitacao(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao buscar solicitação")
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    buscarSolicitacao()
  }

  const statusConfig = solicitacao ? STATUS_CONFIG[solicitacao.status] : null

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
              <Link href="/solicitar">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Nova Solicitação
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 md:py-8 max-w-2xl">
        <div className="mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-foreground text-balance">Acompanhar Solicitação</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Digite o numero do protocolo para verificar o status da sua solicitacao.
          </p>
        </div>

        {/* Search Form */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="flex gap-3">
              <div className="flex-1">
                <Label htmlFor="protocolo" className="sr-only">Protocolo</Label>
                <Input
                  id="protocolo"
                  placeholder="Ex: SOL-20260222-ABC123"
                  value={protocoloInput}
                  onChange={(e) => {
                    setProtocoloInput(e.target.value.toUpperCase())
                    setError("")
                  }}
                  className="font-mono"
                />
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg mb-6">
            <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Result */}
        {solicitacao && statusConfig && (
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <CardDescription className="font-mono text-xs">{solicitacao.protocolo}</CardDescription>
                  <CardTitle className="text-lg mt-1">{solicitacao.nomeEmpresa}</CardTitle>
                </div>
                <Badge className={`${statusConfig.color} border`}>
                  {statusConfig.label}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Status Timeline */}
              <StatusTimeline currentStatus={solicitacao.status} />

              {/* Details */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Equipamento</p>
                  <p className="text-sm font-medium text-foreground">{solicitacao.tipoEquipamento}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Fabricante / Modelo</p>
                  <p className="text-sm font-medium text-foreground">{solicitacao.fabricante} - {solicitacao.modelo}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Urgencia</p>
                  <Badge variant={solicitacao.urgencia === "urgente" ? "destructive" : "secondary"}>
                    {solicitacao.urgencia === "urgente" ? "Urgente" : "Normal"}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Data da Solicitação</p>
                  <p className="text-sm font-medium text-foreground">
                    {new Date(solicitacao.createdAt).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Descrição do Problema</p>
                <p className="text-sm text-foreground bg-muted p-3 rounded-lg leading-relaxed">{solicitacao.descricaoProblema}</p>
              </div>

              {solicitacao.status !== solicitacao.status && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>
                    Ultima atualizacao:{" "}
                    {new Date(solicitacao.updatedAt).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Empty state after search */}
        {searched && !loading && !solicitacao && !error && (
          <Card>
            <CardContent className="py-8 text-center">
              <Search className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Nenhuma solicitação encontrada com esse protocolo.</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
