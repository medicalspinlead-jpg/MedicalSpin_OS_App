"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  Wrench,
  AlertTriangle,
  Building2,
  Mail,
  Phone,
  MapPin,
  FileText,
  XCircle,
  ImageIcon,
  Video,
} from "lucide-react"

interface Solicitacao {
  id: string
  protocolo: string
  status: string
  nomeEmpresa: string
  cnpj: string
  nomeContato: string
  telefone: string
  email: string
  cidade: string
  uf: string
  tipoEquipamento: string
  fabricante: string
  modelo: string
  numeroSerie: string
  descricaoProblema: string
  urgencia: string
  ordemServicoId: string | null
  midias?: {
    imagens?: string[]
    videos?: string[]
  }
  motivoCancelamento?: string | null
  createdAt: string
  updatedAt: string
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof Clock; color: string }> = {
  recebida: { label: "Recebida", variant: "secondary", icon: Clock, color: "text-muted-foreground" },
  em_progresso: { label: "Em Progresso", variant: "default", icon: Wrench, color: "text-blue-600" },
  finalizada: { label: "Finalizada", variant: "outline", icon: CheckCircle, color: "text-green-600" },
  cancelada: { label: "Cancelada", variant: "destructive", icon: XCircle, color: "text-red-600" },
}

export default function SolicitacaoDetalhes() {
  const params = useParams()
  const [solicitacao, setSolicitacao] = useState<Solicitacao | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function fetchSolicitacao() {
      try {
        const res = await fetch(`/api/cliente/solicitacoes/${params.id}`, {
          credentials: "include",
        })

        if (!res.ok) {
          if (res.status === 403) {
            setError("Voce nao tem permissao para ver esta solicitacao.")
          } else if (res.status === 404) {
            setError("Solicitacao nao encontrada.")
          } else {
            setError("Erro ao carregar solicitacao.")
          }
          return
        }

        const data = await res.json()
        setSolicitacao(data)
      } catch (err) {
        setError("Erro ao carregar solicitacao.")
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchSolicitacao()
    }
  }, [params.id])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-3xl">
        <Skeleton className="h-8 w-32 mb-4" />
        <Skeleton className="h-6 w-64 mb-2" />
        <Skeleton className="h-4 w-48 mb-6" />
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (error || !solicitacao) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-3xl">
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link href="/cliente">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Link>
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-1">Erro</h3>
            <p className="text-sm text-muted-foreground">{error || "Solicitacao nao encontrada."}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const config = statusConfig[solicitacao.status] || statusConfig.recebida
  const StatusIcon = config.icon

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl">
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link href="/cliente">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Link>
      </Button>

      {/* Header */}
      <div className="flex flex-col gap-2 mb-6">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-xl md:text-2xl font-bold text-foreground font-mono">
            {solicitacao.protocolo}
          </h2>
          <Badge variant={config.variant} className="text-sm">
            <StatusIcon className="h-3.5 w-3.5 mr-1" />
            {config.label}
          </Badge>
          {solicitacao.urgencia === "urgente" && (
            <Badge variant="destructive">
              <AlertTriangle className="h-3.5 w-3.5 mr-1" />
              Urgente
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Criada em{" "}
          {new Date(solicitacao.createdAt).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>

      <div className="space-y-4">
        {/* Status Timeline */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Andamento</CardTitle>
          </CardHeader>
          <CardContent>
            {solicitacao.status === "cancelada" ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <XCircle className="h-5 w-5 text-red-600 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-red-800">Solicitacao Cancelada</p>
                    <p className="text-xs text-red-600">Esta solicitacao foi cancelada pela equipe tecnica.</p>
                  </div>
                </div>
                {solicitacao.motivoCancelamento && (
                  <div className="p-3 bg-red-50/50 border border-red-100 rounded-lg">
                    <p className="text-xs font-medium text-red-700 mb-1">Motivo do cancelamento:</p>
                    <p className="text-sm text-red-900 leading-relaxed whitespace-pre-wrap">
                      {solicitacao.motivoCancelamento}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {["recebida", "em_progresso", "finalizada"].map((s, i) => {
                  const sc = statusConfig[s]
                  const isActive = s === solicitacao.status
                  const isPast =
                    (s === "recebida") ||
                    (s === "em_progresso" && ["em_progresso", "finalizada"].includes(solicitacao.status)) ||
                    (s === "finalizada" && solicitacao.status === "finalizada")

                  return (
                    <div key={s} className="flex items-center gap-2 flex-1">
                      <div
                        className={`flex items-center justify-center w-8 h-8 rounded-full border-2 shrink-0 ${
                          isPast
                            ? "bg-primary border-primary text-primary-foreground"
                            : "border-muted-foreground/30 text-muted-foreground"
                        }`}
                      >
                        <sc.icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-medium ${isPast ? "text-foreground" : "text-muted-foreground"}`}>
                          {sc.label}
                        </p>
                      </div>
                      {i < 2 && (
                        <div
                          className={`h-0.5 flex-1 ${isPast ? "bg-primary" : "bg-muted-foreground/20"}`}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Equipamento */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Wrench className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Equipamento</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Tipo</p>
                <p className="text-sm font-medium">{solicitacao.tipoEquipamento}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Fabricante</p>
                <p className="text-sm font-medium">{solicitacao.fabricante}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Modelo</p>
                <p className="text-sm font-medium">{solicitacao.modelo}</p>
              </div>
              {solicitacao.numeroSerie && (
                <div>
                  <p className="text-xs text-muted-foreground">N. de Serie</p>
                  <p className="text-sm font-medium">{solicitacao.numeroSerie}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Descricao */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Descricao do Problema</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
              {solicitacao.descricaoProblema}
            </p>
          </CardContent>
        </Card>

        {/* Midias */}
        {solicitacao.midias && ((solicitacao.midias.imagens && solicitacao.midias.imagens.length > 0) || (solicitacao.midias.videos && solicitacao.midias.videos.length > 0)) && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">Fotos e Videos Anexados</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {solicitacao.midias.imagens && solicitacao.midias.imagens.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-medium">
                    Fotos ({solicitacao.midias.imagens.length})
                  </p>
                  <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {solicitacao.midias.imagens.map((img, index) => (
                      <div key={index} className="aspect-square border rounded-lg overflow-hidden bg-muted">
                        <img
                          src={img || "/placeholder.svg"}
                          alt={`Foto ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {solicitacao.midias.videos && solicitacao.midias.videos.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-medium">
                    Videos ({solicitacao.midias.videos.length})
                  </p>
                  <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
                    {solicitacao.midias.videos.map((vid, index) => (
                      <div key={index} className="border rounded-lg overflow-hidden bg-muted">
                        <video
                          src={vid}
                          controls
                          className="w-full max-h-64 object-contain"
                          preload="metadata"
                        >
                          Seu navegador nao suporta videos.
                        </video>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Contato */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Dados do Contato</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="flex items-center gap-2">
                <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Empresa</p>
                  <p className="text-sm font-medium">{solicitacao.nomeEmpresa}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-medium">{solicitacao.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Telefone</p>
                  <p className="text-sm font-medium">{solicitacao.telefone}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Localidade</p>
                  <p className="text-sm font-medium">{solicitacao.cidade} - {solicitacao.uf}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
