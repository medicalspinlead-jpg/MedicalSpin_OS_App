"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
  ImageIcon,
  Video,
  Download,
  Loader2,
  Copy,
  ExternalLink,
  AlertCircle,
  User,
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
  ordemServicoId: string | null
  midias?: {
    imagens?: string[]
    videos?: string[]
  }
  motivoCancelamento?: string | null
  createdAt: string
  updatedAt: string
  historicoStatus?: HistoricoStatus[]
}

interface HistoricoStatus {
  id: string
  status: string
  observacao: string | null
  usuarioNome: string | null
  criadoEm: string
}

interface OSData {
  id: string
  numero: string
  idUnico?: string | null
  status: string
  createdAt: string
  finalizedAt: string | null
  empresa: {
    razaoSocial: string
    nomeFantasia: string
    cnpj: string
    cidade: string
    uf: string
    telefone: string
    email: string
  }
  cliente?: {
    razaoSocial: string
    nomeFantasia: string
    cnpj: string
    responsavel: string
  }
  equipamento?: {
    tipo: string
    fabricante: string
    modelo: string
    numeroSerie: string
  }
  motivo: {
    motivacaoServico: string
    eventosRelevantes: string
  }
  intervencao: {
    tipo: string
    descricaoServicos: string
  }
  pecas: Array<{
    id: string
    nome: string
    modeloRef: string
    numeroSerie: string
    observacoes: string
    quantidade: number
    categoria: string
    tipo: string
  }>
  maoDeObra: Array<{
    id: string
    data: string
    descricao: string
    horas: number
  }>
  pendencias: {
    medicalSpin: string
    cliente: string
  }
  estadoEquipamento: {
    estadoInicial: string
    estadoFinal: string
  }
  finalizacao: {
    cidade: string
    uf: string
    nomeEngenheiro: string
    cftEngenheiro: string
    nomeRecebedor: string
  }
  midias: {
    arquivos: string[]
  }
}

const statusConfig: Record<string, { label: string; badgeClass: string; icon: typeof Clock; color: string }> = {
  recebida: { 
    label: "Recebida", 
    badgeClass: "bg-sky-100 text-sky-700 border-sky-300 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-500/50", 
    icon: Clock, 
    color: "text-sky-600 dark:text-sky-400" 
  },
  em_progresso: { 
    label: "Em Progresso", 
    badgeClass: "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-500/50", 
    icon: Wrench, 
    color: "text-amber-600 dark:text-amber-400" 
  },
  finalizada: { 
    label: "Finalizada", 
    badgeClass: "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-500/50", 
    icon: CheckCircle, 
    color: "text-emerald-600 dark:text-emerald-400" 
  },
}

export default function SolicitacaoDetalhes() {
  const params = useParams()
  const [solicitacao, setSolicitacao] = useState<Solicitacao | null>(null)
  const [osData, setOsData] = useState<OSData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showOsPreview, setShowOsPreview] = useState(false)
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null)
  const [pdfDownloadUrl, setPdfDownloadUrl] = useState<string | null>(null)
  const [loadingPdf, setLoadingPdf] = useState(false)

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

        // Se finalizada e tem OS vinculada, carregar dados da OS
        if (data.status === "finalizada" && data.ordemServicoId) {
          try {
            const osRes = await fetch(`/api/cliente/os/${data.ordemServicoId}`, {
              credentials: "include",
            })
            if (osRes.ok) {
              const osJson = await osRes.json()
              setOsData(osJson)
            }
          } catch {
            // OS pode nao estar disponivel
          }
        }
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

  const convertToPreviewUrl = (link: string): string => {
    const driveMatch = link.match(/\/d\/([a-zA-Z0-9_-]+)/)
    if (driveMatch) {
      return `https://drive.google.com/file/d/${driveMatch[1]}/preview`
    }
    const ucMatch = link.match(/[?&]id=([a-zA-Z0-9_-]+)/)
    if (ucMatch) {
      return `https://drive.google.com/file/d/${ucMatch[1]}/preview`
    }
    if (link.endsWith(".pdf") || link.includes("pdf")) {
      return `https://docs.google.com/viewer?url=${encodeURIComponent(link)}&embedded=true`
    }
    return link
  }

  const fetchPdfLink = async () => {
    if (!osData) return
    setLoadingPdf(true)
    setPdfPreviewUrl(null)
    setPdfDownloadUrl(null)

    try {
      const url =
        "https://docs.google.com/spreadsheets/d/1mZ4GlKIZieM_yz-CBjwNk4_8K62w45ez4BDTe-4e1e0/gviz/tq?gid=824063472&tqx=out:json&tq=SELECT%20*"

      const response = await fetch(url)
      const text = await response.text()

      const setResponseIdx = text.indexOf("setResponse(")
      const startIndex = setResponseIdx !== -1 ? text.indexOf("(", setResponseIdx) : text.indexOf("(")
      const endIndex = text.lastIndexOf(")")

      if (startIndex !== -1 && endIndex !== -1 && startIndex < endIndex) {
        const jsonText = text.substring(startIndex + 1, endIndex)
        const data = JSON.parse(jsonText)
        const rows = data.table?.rows || []

        const osId = osData.idUnico || osData.id
        for (const row of rows) {
          const cells = row.c || []
          const idPlanilha = cells[0]?.v as string | null
          if (idPlanilha && String(idPlanilha).trim() === String(osId).trim()) {
            const link = cells[2]?.v as string | null
            if (link) {
              setPdfDownloadUrl(link)
              setPdfPreviewUrl(convertToPreviewUrl(link))
            }
            break
          }
        }
      }
    } catch (error) {
      console.error("Erro ao buscar link do PDF:", error)
    } finally {
      setLoadingPdf(false)
    }
  }

  const handleAbrirPreview = () => {
    setShowOsPreview(true)
    fetchPdfLink()
  }

  const handleCopiarLink = () => {
    if (pdfDownloadUrl) {
      navigator.clipboard.writeText(pdfDownloadUrl)
    }
  }

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
          <Badge className={`${config.badgeClass} border text-sm`}>
            <StatusIcon className="h-3.5 w-3.5 mr-1" />
            {config.label}
          </Badge>
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
        {/* Status Timeline com historico */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Andamento</CardTitle>
            <CardDescription className="text-xs">Histórico de status da solicitação</CardDescription>
          </CardHeader>
          <CardContent>


            {/* Timeline vertical com datas */}
            {solicitacao.historicoStatus && solicitacao.historicoStatus.length > 0 ? (
              <div className="relative">
                {solicitacao.historicoStatus.map((h, index) => {
                  const hConfig = statusConfig[h.status] || statusConfig.recebida
                  const HIcon = hConfig.icon
                  const isLast = index === solicitacao.historicoStatus!.length - 1

                  return (
                    <div key={h.id} className="flex gap-3">
                      {/* Linha vertical + Icone */}
                      <div className="flex flex-col items-center">
                        <div
                          className={`flex items-center justify-center w-8 h-8 rounded-full border-2 shrink-0 ${
                            isLast
                              ? "bg-primary border-primary text-primary-foreground"
                              : "bg-muted border-muted-foreground/30 text-muted-foreground"
                          }`}
                        >
                          <HIcon className="h-4 w-4" />
                        </div>
                        {!isLast && (
                          <div className="w-0.5 flex-1 min-h-6 bg-muted-foreground/20" />
                        )}
                      </div>

                      {/* Conteudo */}
                      <div className={`pb-5 flex-1 ${isLast ? "" : ""}`}>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={`${hConfig.badgeClass} border text-xs`}>
                            {hConfig.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(h.criadoEm).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                          })}{" "}
                          as{" "}
                          {new Date(h.criadoEm).toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                        {h.usuarioNome && (
                          <p className="text-xs text-foreground/70 mt-1 flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span className="font-medium">{h.usuarioNome}</span>
                          </p>
                        )}
                        {h.observacao && (
                          <p className="text-xs text-muted-foreground/80 mt-0.5">{h.observacao}</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              /* Fallback: timeline simples sem historico (retrocompatibilidade) */
              <div className="relative">
                {/* Status criacao */}
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full border-2 bg-primary border-primary text-primary-foreground shrink-0">
                      <Clock className="h-4 w-4" />
                    </div>
                    {solicitacao.status !== "recebida" && (
                      <div className="w-0.5 flex-1 min-h-6 bg-muted-foreground/20" />
                    )}
                  </div>
                  <div className="pb-5 flex-1">
                    <Badge className={`${statusConfig.recebida.badgeClass} border text-xs`}>
                      Recebida
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(solicitacao.createdAt).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}{" "}
                      as{" "}
                      {new Date(solicitacao.createdAt).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>

                {/* Status atual se diferente de recebida */}
                {solicitacao.status !== "recebida" && (() => {
                  const currentConfig = statusConfig[solicitacao.status] || statusConfig.recebida
                  const CurrentIcon = currentConfig.icon
                  return (
                    <div className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full border-2 bg-primary border-primary text-primary-foreground shrink-0">
                          <CurrentIcon className="h-4 w-4" />
                        </div>
                      </div>
                      <div className="pb-5 flex-1">
                        <Badge className={`${currentConfig.badgeClass} border text-xs`}>
                          {currentConfig.label}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(solicitacao.updatedAt).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                          })}{" "}
                          as{" "}
                          {new Date(solicitacao.updatedAt).toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  )
                })()}
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
              <CardTitle className="text-base">Descrição do Problema</CardTitle>
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

        {/* OS Finalizada - Visualizacao completa */}
        {solicitacao.status === "finalizada" && osData && (
          <>
            <Separator className="my-6" />
            
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h3 className="text-lg font-bold text-foreground">Ordem de Servico</h3>
                  <p className="text-sm text-muted-foreground font-mono">{osData.numero}</p>
                </div>
                <Button
                  onClick={handleAbrirPreview}
                  size="sm"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Ver Documento da OS
                </Button>
              </div>

              {/* Dados da Empresa */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">1. Dados da Empresa</CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Razão Social</p>
                    <p className="font-medium">{osData.empresa.razaoSocial || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">CNPJ</p>
                    <p className="font-medium">{osData.empresa.cnpj || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Cidade/UF</p>
                    <p className="font-medium">{osData.empresa.cidade || "-"} {osData.empresa.uf ? `- ${osData.empresa.uf}` : ""}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Telefone</p>
                    <p className="font-medium">{osData.empresa.telefone || "-"}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Equipamento */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">2. Equipamento</CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Tipo</p>
                    <p className="font-medium">{osData.equipamento?.tipo || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Fabricante / Modelo</p>
                    <p className="font-medium">{osData.equipamento?.fabricante || "-"} {osData.equipamento?.modelo || ""}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">N. de Serie</p>
                    <p className="font-medium">{osData.equipamento?.numeroSerie || "-"}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Motivo */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">3. Motivo e Eventos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Motivação do Servico</p>
                    <p className="font-medium whitespace-pre-wrap">{osData.motivo.motivacaoServico || "-"}</p>
                  </div>
                  {osData.motivo.eventosRelevantes && (
                    <div>
                      <p className="text-xs text-muted-foreground">Eventos Relevantes</p>
                      <p className="font-medium whitespace-pre-wrap">{osData.motivo.eventosRelevantes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Intervencao */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">4. Intervenção</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Tipo de Intervenção</p>
                    <Badge variant="secondary">{osData.intervencao.tipo || "-"}</Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Descrição dos Serviços</p>
                    <p className="font-medium whitespace-pre-wrap">{osData.intervencao.descricaoServicos || "-"}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Pecas */}
              {osData.pecas.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">5. Pecas ({osData.pecas.length})</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {osData.pecas.filter((p) => !p.tipo || p.tipo === "removida").length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">Pecas Removidas</p>
                        <div className="space-y-2">
                          {osData.pecas
                            .filter((p) => !p.tipo || p.tipo === "removida")
                            .map((peca) => (
                              <div key={peca.id} className="p-2 border rounded-lg text-sm">
                                <p className="font-medium">{peca.nome}</p>
                                <p className="text-xs text-muted-foreground">
                                  Qtd: {peca.quantidade}
                                  {peca.modeloRef ? ` | Ref: ${peca.modeloRef}` : ""}
                                  {peca.numeroSerie ? ` | Serie: ${peca.numeroSerie}` : ""}
                                </p>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                    {osData.pecas.filter((p) => p.tipo === "inclusa").length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">Pecas Inclusas</p>
                        <div className="space-y-2">
                          {osData.pecas
                            .filter((p) => p.tipo === "inclusa")
                            .map((peca) => (
                              <div key={peca.id} className="p-2 border rounded-lg text-sm">
                                <p className="font-medium">{peca.nome}</p>
                                <p className="text-xs text-muted-foreground">
                                  Qtd: {peca.quantidade}
                                  {peca.modeloRef ? ` | Ref: ${peca.modeloRef}` : ""}
                                  {peca.numeroSerie ? ` | Serie: ${peca.numeroSerie}` : ""}
                                </p>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Mao de Obra */}
              {osData.maoDeObra.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">6. Mão de Obra ({osData.maoDeObra.length} serviço(s))</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {osData.maoDeObra.map((m) => (
                        <div key={m.id} className="p-2 border rounded-lg text-sm">
                          <p className="font-medium">{m.descricao}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(m.data).toLocaleDateString("pt-BR")} - {m.horas}h
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Pendencias */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    7. Pendências
                    {osData.pendencias.medicalSpin || osData.pendencias.cliente ? (
                      <AlertCircle className="h-4 w-4 text-orange-600" />
                    ) : (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  {osData.pendencias.medicalSpin || osData.pendencias.cliente ? (
                    <div className="space-y-2">
                      {osData.pendencias.medicalSpin && (
                        <div>
                          <p className="text-xs text-muted-foreground">Pendências Medical Spin</p>
                          <p className="font-medium whitespace-pre-wrap">{osData.pendencias.medicalSpin}</p>
                        </div>
                      )}
                      {osData.pendencias.cliente && (
                        <div>
                          <p className="text-xs text-muted-foreground">Pendências do Cliente</p>
                          <p className="font-medium whitespace-pre-wrap">{osData.pendencias.cliente}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-green-600 font-medium">Nenhuma pendencia registrada</p>
                  )}
                </CardContent>
              </Card>

              {/* Estado do Equipamento */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">8. Estado do Equipamento</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Estado Inicial</p>
                      <Badge
                        variant={
                          osData.estadoEquipamento.estadoInicial === "Funcional"
                            ? "default"
                            : osData.estadoEquipamento.estadoInicial === "Inoperante"
                              ? "destructive"
                              : "secondary"
                        }
                        className="mt-1"
                      >
                        {osData.estadoEquipamento.estadoInicial || "-"}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Estado Final</p>
                      <Badge
                        variant={
                          osData.estadoEquipamento.estadoFinal === "Funcional"
                            ? "default"
                            : osData.estadoEquipamento.estadoFinal === "Inoperante"
                              ? "destructive"
                              : "secondary"
                        }
                        className="mt-1"
                      >
                        {osData.estadoEquipamento.estadoFinal || "-"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Finalizacao */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">9. Finalização</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Local</p>
                      <p className="font-medium">{osData.finalizacao.cidade || "-"} {osData.finalizacao.uf ? `- ${osData.finalizacao.uf}` : ""}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Engenheiro</p>
                      <p className="font-medium">{osData.finalizacao.nomeEngenheiro || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">CFT</p>
                      <p className="font-medium">{osData.finalizacao.cftEngenheiro || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Recebedor</p>
                      <p className="font-medium">{osData.finalizacao.nomeRecebedor || osData.cliente?.responsavel || "-"}</p>
                    </div>
                  </div>
                  {osData.finalizedAt && (
                    <div>
                      <p className="text-xs text-muted-foreground">Data de Finalização</p>
                      <p className="font-medium">
                        {new Date(osData.finalizedAt).toLocaleDateString("pt-BR")} as{" "}
                        {new Date(osData.finalizedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Registro Fotografico */}
              {osData.midias.arquivos.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4 text-primary" />
                      <CardTitle className="text-sm">Registro Fotografico ({osData.midias.arquivos.length})</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                      {osData.midias.arquivos.map((arq, i) => (
                        <div key={i} className="aspect-square border rounded-lg overflow-hidden bg-muted">
                          <img
                            src={arq || "/placeholder.svg"}
                            alt={`Foto ${i + 1}`}
                            className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => window.open(arq, "_blank")}
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </>
        )}
      </div>

      {/* OS Preview Dialog */}
      <Dialog open={showOsPreview} onOpenChange={setShowOsPreview}>
        <DialogContent className="w-[95vw] max-w-3xl mx-auto !p-0 !gap-0 overflow-hidden max-h-[90vh] flex flex-col">
          <DialogHeader className="px-5 py-4 border-b bg-muted/40">
            <DialogTitle className="flex items-center gap-2 text-base font-medium">
              <FileText className="h-4 w-4" />
              Documento da OS
            </DialogTitle>
            {osData && (
              <DialogDescription className="font-mono text-xs">
                {osData.numero}
              </DialogDescription>
            )}
          </DialogHeader>

          {/* PDF Preview */}
          <div className="flex-1 overflow-hidden">
            {loadingPdf ? (
              <div className="flex flex-col items-center justify-center h-[400px] sm:h-[500px] bg-muted/10">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">Carregando documento...</span>
              </div>
            ) : pdfPreviewUrl ? (
              <iframe
                src={pdfPreviewUrl}
                className="w-full h-[400px] sm:h-[500px] border-0"
                title="Documento da Ordem de Servico"
                allow="autoplay"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-[200px] bg-muted/10">
                <FileText className="h-10 w-10 text-muted-foreground/50 mb-3" />
                <span className="text-sm text-muted-foreground font-medium">
                  Documento nao disponivel
                </span>
                <span className="text-xs text-muted-foreground/70 mt-1">
                  O PDF ainda esta sendo gerado. Tente novamente em alguns minutos.
                </span>
              </div>
            )}
          </div>

          {/* Footer com acoes */}
          <div className="px-5 py-3 border-t bg-muted/20 flex items-center justify-between gap-3 flex-wrap">
            {pdfDownloadUrl ? (
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Input value={pdfDownloadUrl} readOnly className="flex-1 text-xs h-9 min-w-0" />
                <Button
                  onClick={handleCopiarLink}
                  variant="outline"
                  size="icon"
                  className="shrink-0 h-9 w-9 bg-transparent"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div />
            )}
            <div className="flex items-center gap-2">
              {pdfDownloadUrl && (
                <Button asChild size="sm">
                  <a href={pdfDownloadUrl} target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4 mr-2" />
                    Baixar
                  </a>
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
