"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  getSolicitacao,
  updateSolicitacao,
  deleteSolicitacao,
  saveOrdemServico,
  createNovaOS,
  getOrdemServico,
  getClientes,
  getEquipamentosByCliente,
  type Solicitacao,
  type OrdemServico,
} from "@/lib/storage"
import { useAuth } from "@/components/auth-provider"
import {
  ArrowLeft,
  Building2,
  Wrench,
  MessageSquare,
  Clock,
  AlertTriangle,
  Inbox,
  Settings,
  CheckCircle,
  Play,
  FileText,
  Trash2,
  Loader2,
  User,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  XCircle,
  ImageIcon,
  Video,
  CalendarCheck,
  CalendarPlus,
} from "lucide-react"

const STATUS_CONFIG: Record<string, { label: string; badgeClass: string; icon: React.ElementType }> = {
  recebida: { label: "Recebida", badgeClass: "bg-blue-100 text-blue-800 border-blue-200", icon: Inbox },
  em_progresso: { label: "Em Progresso", badgeClass: "bg-amber-100 text-amber-800 border-amber-200", icon: Settings },
  finalizada: { label: "Finalizada", badgeClass: "bg-green-100 text-green-800 border-green-200", icon: CheckCircle },
  cancelada: { label: "Cancelada", badgeClass: "bg-red-100 text-red-800 border-red-200", icon: XCircle },
}

export default function SolicitacaoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { usuario } = useAuth()
  const [solicitacao, setSolicitacao] = useState<Solicitacao | null>(null)
  const [osVinculada, setOsVinculada] = useState<OrdemServico | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState("")
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [motivoCancelamento, setMotivoCancelamento] = useState("")

  useEffect(() => {
    loadSolicitacao()
  }, [id])

  async function loadSolicitacao() {
    try {
      setLoading(true)
      const data = await getSolicitacao(id)
      if (data) {
        setSolicitacao(data)
        // Carregar dados da OS vinculada
        if (data.ordemServicoId) {
          try {
            const osData = await getOrdemServico(data.ordemServicoId)
            if (osData) {
              setOsVinculada(osData)
            }
          } catch {
            // OS pode ter sido excluída
          }
        }
      }
    } catch (error) {
      console.error("Erro ao carregar solicitação:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleAccept() {
    if (!solicitacao) return
    setActionLoading("accept")

    try {
      // Criar OS rascunho pré-preenchida com dados da solicitação
      const novaOS = createNovaOS() as any
      novaOS.empresa = {
        razaoSocial: solicitacao.nomeEmpresa,
        nomeFantasia: solicitacao.nomeEmpresa,
        cnpj: solicitacao.cnpj || "",
        cidade: solicitacao.cidade,
        uf: solicitacao.uf,
        telefone: solicitacao.telefone,
        email: solicitacao.email,
        emails: [solicitacao.email],
        responsavel: solicitacao.nomeContato,
      }
      novaOS.motivo = {
        motivacaoServico: solicitacao.descricaoProblema,
        eventosRelevantes: "",
      }

      // Buscar cliente cadastrado pelo CNPJ para preencher etapa 1 automaticamente
      let clienteEncontrado = null
      try {
        const clientes = await getClientes()
        if (solicitacao.cnpj) {
          clienteEncontrado = clientes.find(
            (c) => c.cnpj.replace(/\D/g, "") === solicitacao.cnpj.replace(/\D/g, "")
          ) || null
        }
        // Se nao achou por CNPJ, tentar por razao social
        if (!clienteEncontrado) {
          clienteEncontrado = clientes.find(
            (c) => c.razaoSocial.toLowerCase().trim() === solicitacao.nomeEmpresa.toLowerCase().trim()
          ) || null
        }
      } catch {
        // Se falhar a busca, continua sem vincular cliente
      }

      if (clienteEncontrado) {
        // Preenche os dados da empresa com os dados do cliente cadastrado
        novaOS.empresa = {
          razaoSocial: clienteEncontrado.razaoSocial,
          nomeFantasia: clienteEncontrado.nomeFantasia,
          cnpj: clienteEncontrado.cnpj,
          cidade: clienteEncontrado.cidade,
          uf: clienteEncontrado.uf,
          telefone: clienteEncontrado.telefone,
          email: clienteEncontrado.email,
          emails: clienteEncontrado.email ? [clienteEncontrado.email] : [],
          responsavel: clienteEncontrado.responsavel || solicitacao.nomeContato,
        }
        novaOS.cliente = clienteEncontrado
        novaOS.finalizacao = {
          ...novaOS.finalizacao,
          cidade: clienteEncontrado.cidade,
          uf: clienteEncontrado.uf,
        }

        // Buscar equipamento correspondente para preencher etapa 2 automaticamente
        try {
          const equipamentos = await getEquipamentosByCliente(clienteEncontrado.id)
          if (equipamentos.length > 0) {
            // Tentar match exato por numero de serie
            let equipEncontrado = solicitacao.numeroSerie
              ? equipamentos.find(
                  (e) => e.numeroSerie && e.numeroSerie.toLowerCase().trim() === solicitacao.numeroSerie.toLowerCase().trim()
                )
              : undefined

            // Se nao achou por serie, tentar por tipo + fabricante + modelo
            if (!equipEncontrado) {
              equipEncontrado = equipamentos.find(
                (e) =>
                  e.tipo.toLowerCase().trim() === solicitacao.tipoEquipamento.toLowerCase().trim() &&
                  e.fabricante.toLowerCase().trim() === solicitacao.fabricante.toLowerCase().trim() &&
                  e.modelo.toLowerCase().trim() === solicitacao.modelo.toLowerCase().trim()
              )
            }

            // Se nao achou match exato e tem apenas 1 equipamento, usa ele
            if (!equipEncontrado && equipamentos.length === 1) {
              equipEncontrado = equipamentos[0]
            }

            if (equipEncontrado) {
              novaOS.equipamento = equipEncontrado
            }
          }
        } catch {
          // Se falhar a busca de equipamentos, continua sem vincular
        }
      }

      // Copiar apenas imagens da solicitação para a OS (videos ficam so na solicitação)
      const solicitacaoMidias = solicitacao.midias as { imagens?: string[]; videos?: string[] } | undefined
      if (solicitacaoMidias?.imagens && solicitacaoMidias.imagens.length > 0) {
        novaOS.midias = {
          arquivos: [...solicitacaoMidias.imagens],
        }
      }

      const osCriada = await saveOrdemServico(novaOS)

      // Atualizar status da solicitação
      await updateSolicitacao(id, {
        status: "em_progresso",
        ordemServicoId: osCriada.id,
        usuarioNome: usuario?.nome || undefined,
      } as any)

      setSolicitacao((prev) =>
        prev ? { ...prev, status: "em_progresso", ordemServicoId: osCriada.id } : prev
      )

      // Redirecionar para a OS criada - pula para etapa 3 se etapas 1 e 2 ja estao preenchidas
      const startStep = clienteEncontrado && novaOS.equipamento ? 3 : 1
      router.push(`/os/${osCriada.id}/etapa/${startStep}`)
    } catch (error) {
      console.error("Erro ao aceitar solicitação:", error)
    } finally {
      setActionLoading("")
    }
  }

  async function handleStatusChange(newStatus: "em_progresso" | "finalizada" | "cancelada") {
    if (!solicitacao) return
    setActionLoading(newStatus)

    try {
      await updateSolicitacao(id, { status: newStatus, usuarioNome: usuario?.nome || undefined } as any)
      setSolicitacao((prev) => (prev ? { ...prev, status: newStatus } : prev))
    } catch (error) {
      console.error("Erro ao atualizar status:", error)
    } finally {
      setActionLoading("")
    }
  }

  async function handleCancelamento() {
    if (!solicitacao || !motivoCancelamento.trim()) return
    setActionLoading("cancelada")

    try {
      await updateSolicitacao(id, {
        status: "cancelada",
        motivoCancelamento: motivoCancelamento.trim(),
        usuarioNome: usuario?.nome || undefined,
      } as any)
      setSolicitacao((prev) =>
        prev ? { ...prev, status: "cancelada", motivoCancelamento: motivoCancelamento.trim() } : prev
      )
      setCancelDialogOpen(false)
      setMotivoCancelamento("")
    } catch (error) {
      console.error("Erro ao cancelar solicitacao:", error)
    } finally {
      setActionLoading("")
    }
  }

  async function handleDelete() {
    if (!solicitacao) return
    setActionLoading("delete")

    try {
      await deleteSolicitacao(id)
      router.push("/solicitacoes")
    } catch (error) {
      console.error("Erro ao excluir solicitação:", error)
    } finally {
      setActionLoading("")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Carregando solicitação...</p>
        </div>
      </div>
    )
  }

  if (!solicitacao) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="py-8 text-center">
            <AlertTriangle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-4">Solicitação não encontrada.</p>
            <Button asChild variant="outline" className="bg-transparent">
              <Link href="/solicitacoes">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const statusConfig = STATUS_CONFIG[solicitacao.status] || STATUS_CONFIG.recebida
  const StatusIcon = statusConfig.icon

  return (
    <div className="min-h-screen bg-muted/30">
      <main className="container mx-auto px-4 py-4 md:py-8 max-w-3xl">
        {/* Back button */}
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link href="/solicitacoes">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Solicitações
          </Link>
        </Button>

        {/* Header Card */}
        <Card className="mb-4">
          <CardHeader>
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <CardDescription className="font-mono text-xs">{solicitacao.protocolo}</CardDescription>
                <CardTitle className="text-xl mt-1">{solicitacao.nomeEmpresa}</CardTitle>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={`${statusConfig.badgeClass} border`}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {statusConfig.label}
                  </Badge>
                  {solicitacao.urgencia === "urgente" && (
                    <Badge variant="destructive">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Urgente
                    </Badge>
                  )}
                </div>
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(solicitacao.createdAt).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* OS Vinculada */}
        {osVinculada && (
          <Card className="mb-4 border-primary/20">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm">Ordem de Servico Vinculada</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Nome da OS</p>
                <p className="text-sm font-medium text-foreground font-mono break-all">
                  {osVinculada.numero || "-"}
                </p>
              </div>
              <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                <div className="flex items-start gap-2">
                  <CalendarPlus className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Criada em</p>
                    <p className="text-sm font-medium text-foreground">
                      {new Date(osVinculada.createdAt).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}{" "}
                      <span className="text-muted-foreground">
                        {new Date(osVinculada.createdAt).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CalendarCheck className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Finalizada em</p>
                    <p className="text-sm font-medium text-foreground">
                      {osVinculada.finalizedAt ? (
                        <>
                          {new Date(osVinculada.finalizedAt).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })}{" "}
                          <span className="text-muted-foreground">
                            {new Date(osVinculada.finalizedAt).toLocaleTimeString("pt-BR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </>
                      ) : (
                        <span className="text-muted-foreground italic">Ainda nao finalizada</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <Badge
                  className={
                    osVinculada.status === "finalizada"
                      ? "bg-green-100 text-green-800 border-green-200 border"
                      : osVinculada.status === "fechada"
                        ? "bg-amber-100 text-amber-800 border-amber-200 border"
                        : "bg-orange-100 text-orange-800 border-orange-200 border"
                  }
                >
                  {osVinculada.status === "finalizada"
                    ? "Finalizada"
                    : osVinculada.status === "fechada"
                      ? "Fechada"
                      : "Rascunho"}
                </Badge>
                {(osVinculada.status !== "finalizada" && osVinculada.status !== "cancelada") && (
                  <Button asChild variant="outline" size="sm" className="bg-transparent">
                    <Link href={`/os/${osVinculada.id}/etapa/1`}>
                      <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                      Abrir OS
                    </Link>
                  </Button>
                )}
                {(osVinculada.status === "finalizada" || osVinculada.status === "fechada") && (
                  <Button asChild variant="outline" size="sm" className="bg-transparent">
                    <Link href={`/os/${osVinculada.id}/visualizar`}>
                      <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                      Visualizar OS
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Details Grid */}
        <div className="grid gap-4 md:grid-cols-2 mb-4">
          {/* Dados do Contato */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm">Dados do Contato</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm text-foreground">{solicitacao.nomeContato}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm text-foreground">{solicitacao.telefone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm text-foreground">{solicitacao.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm text-foreground">{solicitacao.cidade} - {solicitacao.uf}</span>
              </div>
              {solicitacao.cnpj && (
                <div className="text-xs text-muted-foreground">
                  CNPJ: {solicitacao.cnpj}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dados do Equipamento */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Wrench className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm">Equipamento</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Tipo</p>
                <p className="text-sm font-medium text-foreground">{solicitacao.tipoEquipamento}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Fabricante</p>
                <p className="text-sm font-medium text-foreground">{solicitacao.fabricante}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Modelo</p>
                <p className="text-sm font-medium text-foreground">{solicitacao.modelo}</p>
              </div>
              {solicitacao.numeroSerie && (
                <div>
                  <p className="text-xs text-muted-foreground">N. Série *</p>
                  <p className="text-sm font-medium text-foreground">{solicitacao.numeroSerie}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Descrição do Problema */}
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm">Descrição do Problema</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground bg-muted p-3 rounded-lg leading-relaxed whitespace-pre-wrap">
              {solicitacao.descricaoProblema}
            </p>
          </CardContent>
        </Card>

        {/* Midias do Cliente */}
        {(() => {
          const midiasData = solicitacao.midias as { imagens?: string[]; videos?: string[] } | undefined
          const hasImagens = midiasData?.imagens && midiasData.imagens.length > 0
          const hasVideos = midiasData?.videos && midiasData.videos.length > 0
          if (!hasImagens && !hasVideos) return null
          return (
            <Card className="mb-4">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm">Fotos e Videos do Cliente</CardTitle>
                </div>
                <CardDescription>Midias enviadas pelo cliente junto com a solicitacao</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {hasImagens && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground font-medium">
                      Fotos ({midiasData!.imagens!.length})
                    </p>
                    <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                      {midiasData!.imagens!.map((img, index) => (
                        <div key={index} className="aspect-square border rounded-lg overflow-hidden bg-muted">
                          <img
                            src={img || "/placeholder.svg"}
                            alt={`Foto do cliente ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {hasVideos && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground font-medium">
                      Videos ({midiasData!.videos!.length})
                    </p>
                    <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
                      {midiasData!.videos!.map((vid, index) => (
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
          )
        })()}

        {/* Actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Ações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2 md:flex-row">
              {solicitacao.status === "recebida" && (
                <Button
                  onClick={handleAccept}
                  disabled={actionLoading !== ""}
                  className="flex-1"
                >
                  {actionLoading === "accept" ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  Aceitar e Criar OS
                </Button>
              )}

              {solicitacao.status === "em_progresso" && (
                <Button
                  onClick={() => handleStatusChange("finalizada")}
                  disabled={actionLoading !== ""}
                  variant="default"
                  className="flex-1"
                >
                  {actionLoading === "finalizada" ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Marcar como Finalizada
                </Button>
              )}              

              {solicitacao.ordemServicoId && solicitacao.status !== "finalizada" && solicitacao.status !== "cancelada" && (
                <Button asChild variant="outline" className="flex-1 bg-transparent">
                  <Link href={`/os/${solicitacao.ordemServicoId}/etapa/1`}>
                    <FileText className="h-4 w-4 mr-2" />
                    Ir para OS
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
