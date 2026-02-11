"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { getOSHistorico, deleteOrdemServico, type OrdemServico, getOSFinalizadas } from "@/lib/storage"
import { FileText, Search, Eye, Trash2, Download, Copy, ExternalLink, Loader2, Mail, Pencil } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft } from "lucide-react"
import useSWR from "swr"
import { useAuth } from "@/components/auth-provider"
import { EmailModal } from "@/components/email-modal"

export default function HistoricoPage() {
  const [search, setSearch] = useState("")
  const [filtroMes, setFiltroMes] = useState("todos")
  const [osToDelete, setOsToDelete] = useState<OrdemServico | null>(null)
  const [buscandoLink, setBuscandoLink] = useState<string | null>(null)
  const [linkDownload, setLinkDownload] = useState<string | null>(null)
  const [showLinkDialog, setShowLinkDialog] = useState(false)
  const [erroLink, setErroLink] = useState<string | null>(null)
  const [enviandoEmail, setEnviandoEmail] = useState<string | null>(null)
  const [emailModalOpen, setEmailModalOpen] = useState(false)
  const [emailModalOS, setEmailModalOS] = useState<OrdemServico | null>(null)
  const { toast } = useToast()
  const { config } = useAuth()

  const {
    data: ordensRaw = [],
    isLoading: loading,
    mutate,
  } = useSWR("os-historico", getOSHistorico, {
    revalidateOnFocus: true,
    revalidateOnMount: true,
    dedupingInterval: 0,
  })

  // Ordenar por data de finalização
  const ordens = [...ordensRaw].sort((a, b) => new Date(b.finalizedAt!).getTime() - new Date(a.finalizedAt!).getTime())

  const handleDelete = async () => {
    if (osToDelete) {
      try {
        // Envia webhook de exclusao (nao bloqueia a exclusao local)
        fetch(
          "https://n8n-www4kggggc4c8k8ow4w8g4g0.95.217.164.173.sslip.io/webhook/40aa4c15-e9ff-4960-a1ee-94a8b6fdf64b",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: osToDelete.id,
              idUnico: osToDelete.idUnico || null,
              numero: osToDelete.numero,
              nome: osToDelete.nome,
              cliente: osToDelete.cliente?.razaoSocial || osToDelete.cliente?.nomeFantasia || "",
              excluidoEm: new Date().toISOString(),
            }),
          }
        ).catch((err) => console.error("Erro ao enviar webhook de exclusao:", err))

        await deleteOrdemServico(osToDelete.id)
        toast({
          title: "OS excluída",
          description: `A ordem de serviço ${osToDelete.numero} foi removida do histórico.`,
        })
        setOsToDelete(null)
        await mutate()
      } catch (error) {
        toast({
          title: "Erro",
          description: "Não foi possível excluir a OS. Tente novamente.",
          variant: "destructive",
        })
      }
    }
  }

  const handleBaixar = async (os: OrdemServico) => {
    setBuscandoLink(os.id)
    setErroLink(null)
    setLinkDownload(null)

    try {
      const url =
        "https://docs.google.com/spreadsheets/d/1mZ4GlKIZieM_yz-CBjwNk4_8K62w45ez4BDTe-4e1e0/gviz/tq?gid=824063472&tqx=out:json&tq=SELECT%20*"

      const response = await fetch(url)
      const text = await response.text()

      const startIndex = text.indexOf("(")
      const endIndex = text.lastIndexOf(")")

      if (startIndex === -1 || endIndex === -1 || startIndex >= endIndex) {
        throw new Error("Formato de resposta inválido")
      }

      const jsonText = text.substring(startIndex + 1, endIndex)
      const data = JSON.parse(jsonText)

      const rows = data.table?.rows || []
      let linkEncontrado: string | null = null

      // Coluna A (indice 0): ID da OS
      // Coluna B (indice 1): OS NOME
      // Coluna C (indice 2): OS LINK

      // Busca exclusivamente pelo ID da OS na coluna A
      const osId = os.idUnico || os.id
      for (const row of rows) {
        const cells = row.c || []
        const idPlanilha = cells[0]?.v as string | null
        if (idPlanilha && String(idPlanilha).trim() === String(osId).trim()) {
          const osLinkPlanilha = cells[2]?.v as string | null
          if (osLinkPlanilha) {
            linkEncontrado = osLinkPlanilha
          }
          break
        }
      }

      if (linkEncontrado) {
        setLinkDownload(linkEncontrado)
        setShowLinkDialog(true)
      } else {
        setErroLink("Link de download não encontrado para esta OS")
        setShowLinkDialog(true)
      }
    } catch (error) {
      console.error("Erro ao buscar link:", error)
      setErroLink("Erro ao buscar link de download. Tente novamente.")
      setShowLinkDialog(true)
    } finally {
      setBuscandoLink(null)
    }
  }

  const handleCopiarLink = () => {
    if (linkDownload) {
      navigator.clipboard.writeText(linkDownload)
      toast({
        title: "Link copiado!",
        description: "O link foi copiado para a área de transferência",
      })
    }
  }

  const handleAbrirEmailModal = (os: OrdemServico) => {
    setEmailModalOS(os)
    setEmailModalOpen(true)
  }

  const handleEnviarEmailFromModal = async (data: {
    destinatarios: string[]
    assunto: string
    os: OrdemServico
  }) => {
    const { destinatarios, assunto, os } = data

    if (destinatarios.length === 0) {
      toast({
        title: "Email nao encontrado",
        description: "Adicione pelo menos um destinatario.",
        variant: "destructive",
      })
      return
    }

    setEnviandoEmail(os.id)

    try {
      // Buscar link de download primeiro
      let linkDownloadOS: string | null = null
      
      try {
        const url =
          "https://docs.google.com/spreadsheets/d/1mZ4GlKIZieM_yz-CBjwNk4_8K62w45ez4BDTe-4e1e0/gviz/tq?gid=824063472&tqx=out:json&tq=SELECT%20*"

        const response = await fetch(url)
        const text = await response.text()

        const startIndex = text.indexOf("(")
        const endIndex = text.lastIndexOf(")")

        if (startIndex !== -1 && endIndex !== -1 && startIndex < endIndex) {
          const jsonText = text.substring(startIndex + 1, endIndex)
          const data = JSON.parse(jsonText)

          const rows = data.table?.rows || []

          // Coluna A (indice 0): ID da OS
          // Coluna B (indice 1): OS NOME
          // Coluna C (indice 2): OS LINK

          // Busca exclusivamente pelo ID da OS na coluna A
          const osIdEmail = os.idUnico || os.id
          for (const row of rows) {
            const cells = row.c || []
            const idPlanilha = cells[0]?.v as string | null
            if (idPlanilha && String(idPlanilha).trim() === String(osIdEmail).trim()) {
              const osLinkPlanilha = cells[2]?.v as string | null
              if (osLinkPlanilha) {
                linkDownloadOS = osLinkPlanilha
              }
              break
            }
          }
        }
      } catch (linkError) {
        console.error("Erro ao buscar link de download:", linkError)
      }

      // Enviar email com o link - envia para todos os destinatarios do modal
      const response = await fetch(
        "https://n8n-www4kggggc4c8k8ow4w8g4g0.95.217.164.173.sslip.io/webhook/6c58efc2-699c-4c59-8be2-2b7169900363",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: destinatarios[0],
            emails: destinatarios,
            assunto: assunto,
            osNumero: os.numero,
            osNome: os.nome,
            cliente: os.cliente?.razaoSocial || os.cliente?.nomeFantasia,
            equipamento: os.equipamento?.tipo,
            dataFinalizacao: os.finalizedAt,
            linkDownload: linkDownloadOS,
          }),
        }
      )

      if (response.ok) {
        const emailsEnviados = destinatarios.length > 1 
          ? `${destinatarios.length} destinatarios (${destinatarios.join(", ")})`
          : destinatarios[0]
        toast({
          title: "Email enviado!",
          description: `Email enviado com sucesso para ${emailsEnviados}`,
        })
        setEmailModalOpen(false)
        setEmailModalOS(null)
      } else {
        throw new Error("Erro ao enviar email")
      }
    } catch (error) {
      console.error("Erro ao enviar email:", error)
      toast({
        title: "Erro ao enviar email",
        description: "Nao foi possivel enviar o email. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setEnviandoEmail(null)
    }
  }

  const handleEnviarEmail = async (os: OrdemServico) => {
    // Implementação de handleEnviarEmail aqui
  }

  const filteredOrdens = ordens.filter((os) => {
    const matchSearch =
      os.numero.toLowerCase().includes(search.toLowerCase()) ||
      os.cliente?.razaoSocial?.toLowerCase().includes(search.toLowerCase()) ||
      os.cliente?.nomeFantasia?.toLowerCase().includes(search.toLowerCase()) ||
      os.equipamento?.tipo?.toLowerCase().includes(search.toLowerCase())

    if (!matchSearch) return false

    if (filtroMes === "todos") return true

    const osDate = new Date(os.finalizedAt!)
    const now = new Date()
    const mesAtual = now.getMonth()
    const anoAtual = now.getFullYear()

    if (filtroMes === "este-mes") {
      return osDate.getMonth() === mesAtual && osDate.getFullYear() === anoAtual
    } else if (filtroMes === "ultimo-mes") {
      const ultimoMes = new Date(anoAtual, mesAtual - 1)
      return osDate.getMonth() === ultimoMes.getMonth() && osDate.getFullYear() === ultimoMes.getFullYear()
    }

    return true
  })

  return (
    <div className="min-h-screen bg-muted/30">
      <main className="container mx-auto px-4 py-4 md:py-8">
        <div className="mb-6">
          <Button asChild variant="ghost" size="sm" className="mb-2 md:mb-4">
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Link>
          </Button>
          <h1 className="text-2xl md:text-3xl font-semibold text-foreground">Histórico de OS</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">Ordens de serviço finalizadas</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por número, cliente ou equipamento..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filtroMes} onValueChange={setFiltroMes}>
            <SelectTrigger className="sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os períodos</SelectItem>
              <SelectItem value="este-mes">Este mês</SelectItem>
              <SelectItem value="ultimo-mes">Último mês</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-3 md:gap-4 grid-cols-2 mb-6">
          <Card>
            <CardHeader className="p-4 md:p-6 pb-2 md:pb-3">
              <CardDescription className="text-xs md:text-sm">Total de OS</CardDescription>
              <CardTitle className="text-2xl md:text-3xl">{filteredOrdens.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="p-4 md:p-6 pb-2 md:pb-3">
              <CardDescription className="text-xs md:text-sm">Período</CardDescription>
              <CardTitle className="text-lg md:text-3xl text-blue-600">
                {filtroMes === "todos" ? "Todos" : filtroMes === "este-mes" ? "Este mês" : "Último mês"}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* OS List */}
        {loading ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground">Carregando histórico...</p>
            </CardContent>
          </Card>
        ) : filteredOrdens.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="p-4 bg-muted rounded-full mb-4">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Nenhuma OS finalizada</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {search || filtroMes !== "todos" ? "Tente ajustar os filtros" : "As OS finalizadas aparecerão aqui"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 md:gap-4">
            {filteredOrdens.map((os) => {
              return (
                <Card key={os.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-3 sm:p-4 md:p-6">
                    <div className="flex flex-col gap-3 md:gap-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 md:gap-3 mb-2">
                          <h3 className="text-sm sm:text-base md:text-lg font-semibold truncate max-w-[200px] sm:max-w-none">{os.numero}</h3>
                          {os.status === "finalizada" ? (
                            <Badge variant="default" className="bg-green-600 text-xs">
                              Finalizada
                            </Badge>
                          ) : (
                            <Badge variant="default" className="bg-amber-500 text-xs">
                              Fechada
                            </Badge>
                          )}
                          {os.pendencias.possuiPendencias && (
                            <Badge variant="secondary" className="bg-orange-100 text-orange-700 text-xs hidden sm:inline-flex">
                              Com Pendências
                            </Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5 sm:gap-2 md:gap-3 text-xs sm:text-sm">
                          <div className="flex flex-wrap gap-1">
                            <span className="text-muted-foreground">Cliente:</span>
                            <span className="font-medium text-foreground truncate">
                              {os.cliente?.razaoSocial || os.cliente?.nomeFantasia || "-"}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            <span className="text-muted-foreground">Equipamento:</span>
                            <span className="font-medium text-foreground truncate">{os.equipamento?.tipo || "-"}</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            <span className="text-muted-foreground">Finalizada em:</span>
                            <span className="font-medium text-foreground">
                              {new Date(os.finalizedAt!).toLocaleDateString("pt-BR")} às {new Date(os.finalizedAt!).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                        </div>

                        <div className="mt-2 flex items-center gap-4">
                          <div className="text-xs sm:text-sm flex flex-wrap gap-1">
                            <span className="text-muted-foreground">Intervenção:</span>
                            <span className="text-foreground">{os.intervencao.tipo || "-"}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-stretch gap-1.5 sm:gap-2">
                        <Button asChild size="sm" className="flex-1 min-w-[100px] sm:flex-none text-xs sm:text-sm">
                          <Link href={`/os/${os.id}/visualizar`}>
                            <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                            <span className="hidden xs:inline">Ver </span>Detalhes
                          </Link>
                        </Button>
                        {os.status === "fechada" && (
                          <Button asChild variant="outline" size="sm" className="flex-1 min-w-[80px] sm:flex-none bg-transparent text-xs sm:text-sm">
                            <Link href={`/os/${os.id}/etapa/1`}>
                              <Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                              Editar
                            </Link>
                          </Button>
                        )}
                        {os.status !== "fechada" && config?.emailHabilitado !== false && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 min-w-[80px] sm:flex-none bg-transparent text-xs sm:text-sm"
                            onClick={() => handleAbrirEmailModal(os)}
                            disabled={enviandoEmail === os.id}
                          >
                            {enviandoEmail === os.id ? (
                              <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2 animate-spin" />
                            ) : (
                              <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                            )}
                            <span className="hidden sm:inline">{enviandoEmail === os.id ? "Enviando..." : "Email"}</span>
                            <span className="sm:hidden">{enviandoEmail === os.id ? "..." : "Email"}</span>
                          </Button>
                        )}
                        {os.status !== "fechada" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 min-w-[80px] sm:flex-none bg-transparent text-xs sm:text-sm"
                            onClick={() => handleBaixar(os)}
                            disabled={buscandoLink === os.id}
                          >
                            {buscandoLink === os.id ? (
                              <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2 animate-spin" />
                            ) : (
                              <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                            )}
                            {buscandoLink === os.id ? "..." : "Baixar"}
                          </Button>
                        )}
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setOsToDelete(os)}
                          className="shrink-0"
                        >
                          <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </main>

      <AlertDialog open={!!osToDelete} onOpenChange={(open) => !open && setOsToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Ordem de Serviço?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a OS <strong>{osToDelete?.numero}</strong>? Esta ação não pode ser desfeita
              e todos os dados serão permanentemente removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent className="w-[95vw] max-w-lg mx-auto">
          <DialogHeader>
            <DialogTitle>{linkDownload ? "Link de Download" : "Aviso"}</DialogTitle>
            <DialogDescription>
              {linkDownload ? "Copie o link abaixo para baixar o documento da OS" : erroLink}
            </DialogDescription>
          </DialogHeader>
          {linkDownload && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-2">
                <Input value={linkDownload} readOnly className="flex-1 text-xs sm:text-sm" />
                <div className="flex gap-2">
                  <Button onClick={handleCopiarLink} variant="outline" size="icon" className="shrink-0 bg-transparent">
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button asChild variant="outline" size="icon" className="shrink-0 bg-transparent">
                    <a href={linkDownload} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Clique no ícone de cópia para copiar o link ou no ícone de link externo para abrir em uma nova aba.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {emailModalOS && (
        <EmailModal
          open={emailModalOpen}
          onOpenChange={(open) => {
            setEmailModalOpen(open)
            if (!open) setEmailModalOS(null)
          }}
          os={emailModalOS}
          onSend={handleEnviarEmailFromModal}
          sending={enviandoEmail === emailModalOS.id}
        />
      )}
    </div>
  )
}
