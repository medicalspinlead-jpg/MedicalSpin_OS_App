"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { getOSFinalizadas, deleteOrdemServico, type OrdemServico } from "@/lib/storage"
import { FileText, Search, Eye, Trash2, Download, Copy, ExternalLink, Loader2 } from "lucide-react"
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
import { ArrowLeft} from "lucide-react"

export default function HistoricoPage() {
  const [ordens, setOrdens] = useState<OrdemServico[]>([])
  const [search, setSearch] = useState("")
  const [filtroMes, setFiltroMes] = useState("todos")
  const [osToDelete, setOsToDelete] = useState<OrdemServico | null>(null)
  const [loading, setLoading] = useState(true)
  const [buscandoLink, setBuscandoLink] = useState<string | null>(null)
  const [linkDownload, setLinkDownload] = useState<string | null>(null)
  const [showLinkDialog, setShowLinkDialog] = useState(false)
  const [erroLink, setErroLink] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadOrdens()
  }, [])

  const loadOrdens = async () => {
    try {
      const data = await getOSFinalizadas()
      setOrdens(data.sort((a, b) => new Date(b.finalizedAt!).getTime() - new Date(a.finalizedAt!).getTime()))
    } catch (error) {
      console.error("Erro ao carregar histórico:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (osToDelete) {
      try {
        await deleteOrdemServico(osToDelete.id)
        toast({
          title: "OS excluída",
          description: `A ordem de serviço ${osToDelete.numero} foi removida do histórico.`,
        })
        setOsToDelete(null)
        await loadOrdens()
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

      const nomeOS = os.nome || os.numero

      for (const row of rows) {
        const cells = row.c || []
        let encontrouOS = false
        for (let i = 0; i < cells.length; i++) {
          const cellValue = cells[i]?.v
          if (cellValue && typeof cellValue === "string") {
            if (cellValue.includes(os.numero) || (nomeOS && cellValue.includes(nomeOS))) {
              encontrouOS = true
              break
            }
          }
        }

        if (encontrouOS) {
          for (const cell of cells) {
            const value = cell?.v
            if (value && typeof value === "string" && (value.startsWith("http://") || value.startsWith("https://"))) {
              linkEncontrado = value
              break
            }
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
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button asChild variant="ghost" size="sm" className="mb-4">
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Link>
          </Button>
          <h1 className="text-3xl font-semibold text-foreground">Histórico de OS</h1>
          <p className="text-muted-foreground mt-1">Ordens de serviço finalizadas</p>
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

        <div className="grid gap-4 md:grid-cols-2 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total de OS</CardDescription>
              <CardTitle className="text-3xl">{filteredOrdens.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Período</CardDescription>
              <CardTitle className="text-3xl text-blue-600">
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
          <div className="grid gap-4">
            {filteredOrdens.map((os) => {
              return (
                <Card key={os.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col gap-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                          <h3 className="text-base sm:text-lg font-semibold">{os.numero}</h3>
                          <Badge variant="default" className="bg-green-600">
                            Finalizada
                          </Badge>
                          {os.pendencias.possuiPendencias && (
                            <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                              Com Pendências
                            </Badge>
                          )}
                        </div>

                        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 text-sm">
                          <div>
                            <span className="text-muted-foreground">Cliente:</span>{" "}
                            <span className="font-medium text-foreground">
                              {os.cliente?.razaoSocial || os.cliente?.nomeFantasia || "-"}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Equipamento:</span>{" "}
                            <span className="font-medium text-foreground">{os.equipamento?.tipo || "-"}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Finalizada em:</span>{" "}
                            <span className="font-medium text-foreground">
                              {new Date(os.finalizedAt!).toLocaleDateString("pt-BR")}
                            </span>
                          </div>
                        </div>

                        <div className="mt-2 sm:mt-3 flex items-center gap-4">
                          <div className="text-sm">
                            <span className="text-muted-foreground">Intervenção:</span>{" "}
                            <span className="text-foreground">{os.intervencao.tipo || "-"}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <Button asChild size="sm" className="flex-1 sm:flex-none">
                          <Link href={`/os/${os.id}/visualizar`}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Detalhes
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 sm:flex-none bg-transparent"
                          onClick={() => handleBaixar(os)}
                          disabled={buscandoLink === os.id}
                        >
                          {buscandoLink === os.id ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4 mr-2" />
                          )}
                          {buscandoLink === os.id ? "Buscando..." : "Baixar"}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setOsToDelete(os)}
                          className="flex-1 sm:flex-none"
                        >
                          <Trash2 className="h-4 w-4 sm:mr-0 mr-2" />
                          <span className="sm:hidden">Excluir</span>
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
    </div>
  )
}
