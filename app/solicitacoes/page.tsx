"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getSolicitacoes, type Solicitacao } from "@/lib/storage"
import {
  Inbox,
  Settings,
  CheckCircle,
  Search,
  Eye,
  AlertTriangle,
  Clock,
  Building2,
  Wrench,
  Loader2,
  XCircle,
} from "lucide-react"

const STATUS_CONFIG: Record<string, { label: string; badgeClass: string; icon: React.ElementType }> = {
  recebida: { label: "Recebida", badgeClass: "bg-blue-100 text-blue-800 border-blue-200", icon: Inbox },
  em_progresso: { label: "Em Progresso", badgeClass: "bg-amber-100 text-amber-800 border-amber-200", icon: Settings },
  finalizada: { label: "Finalizada", badgeClass: "bg-green-100 text-green-800 border-green-200", icon: CheckCircle },
  cancelada: { label: "Cancelada", badgeClass: "bg-red-100 text-red-800 border-red-200", icon: XCircle },
}

export default function SolicitacoesPage() {
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState("todas")

  useEffect(() => {
    loadSolicitacoes()
  }, [])

  async function loadSolicitacoes() {
    try {
      setLoading(true)
      const data = await getSolicitacoes()
      setSolicitacoes(data)
    } catch (error) {
      console.error("Erro ao carregar solicitações:", error)
    } finally {
      setLoading(false)
    }
  }

  const filtered = solicitacoes.filter((s) => {
    const matchesSearch =
      search === "" ||
      s.nomeEmpresa.toLowerCase().includes(search.toLowerCase()) ||
      s.protocolo.toLowerCase().includes(search.toLowerCase()) ||
      s.nomeContato.toLowerCase().includes(search.toLowerCase()) ||
      s.modelo.toLowerCase().includes(search.toLowerCase())

    const matchesStatus = filterStatus === "todas" || s.status === filterStatus

    return matchesSearch && matchesStatus
  })

  const counts = {
    todas: solicitacoes.length,
    recebida: solicitacoes.filter((s) => s.status === "recebida").length,
    em_progresso: solicitacoes.filter((s) => s.status === "em_progresso").length,
    finalizada: solicitacoes.filter((s) => s.status === "finalizada").length,
    cancelada: solicitacoes.filter((s) => s.status === "cancelada").length,
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Carregando solicitações...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <main className="container mx-auto px-4 py-4 md:py-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-foreground">Solicitações de Serviço</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Gerencie as solicitações enviadas pelos clientes.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por empresa, protocolo, contato ou modelo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Tabs value={filterStatus} onValueChange={setFilterStatus}>
            <TabsList className="w-full md:w-auto">
              <TabsTrigger value="todas" className="flex-1 md:flex-initial text-xs md:text-sm">
                Todas ({counts.todas})
              </TabsTrigger>
              <TabsTrigger value="recebida" className="flex-1 md:flex-initial text-xs md:text-sm">
                Recebidas ({counts.recebida})
              </TabsTrigger>
              <TabsTrigger value="em_progresso" className="flex-1 md:flex-initial text-xs md:text-sm">
                Em Progresso ({counts.em_progresso})
              </TabsTrigger>
              <TabsTrigger value="finalizada" className="flex-1 md:flex-initial text-xs md:text-sm">
                Finalizadas ({counts.finalizada})
              </TabsTrigger>
              <TabsTrigger value="cancelada" className="flex-1 md:flex-initial text-xs md:text-sm">
                Canceladas ({counts.cancelada})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Inbox className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                {solicitacoes.length === 0
                  ? "Nenhuma solicitação recebida ainda."
                  : "Nenhuma solicitação encontrada com os filtros aplicados."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {filtered.map((sol) => {
              const config = STATUS_CONFIG[sol.status] || STATUS_CONFIG.recebida
              const StatusIcon = config.icon

              return (
                <Card key={sol.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-mono text-xs text-muted-foreground">{sol.protocolo}</span>
                          <Badge className={`${config.badgeClass} border text-xs`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {config.label}
                          </Badge>
                          {sol.urgencia === "urgente" && (
                            <Badge variant="destructive" className="text-xs">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Urgente
                            </Badge>
                          )}
                        </div>

                        <h3 className="font-semibold text-sm text-foreground truncate">
                          <Building2 className="h-3.5 w-3.5 inline mr-1 text-muted-foreground" />
                          {sol.nomeEmpresa}
                        </h3>

                        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Wrench className="h-3 w-3" />
                            {sol.fabricante} - {sol.modelo}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(sol.createdAt).toLocaleDateString("pt-BR")}
                          </span>
                        </div>

                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                          {sol.descricaoProblema}
                        </p>
                      </div>

                      <Button asChild variant="outline" size="sm" className="bg-transparent shrink-0">
                        <Link href={`/solicitacoes/${sol.id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Detalhes
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
