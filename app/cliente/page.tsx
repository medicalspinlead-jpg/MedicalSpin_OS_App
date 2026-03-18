"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/components/auth-provider"
import {
  PlusCircle,
  Search,
  Inbox,
  Clock,
  CheckCircle,
  Building2,
  Wrench,
  Eye,
} from "lucide-react"

interface Solicitacao {
  id: string
  protocolo: string
  status: string
  nomeEmpresa: string
  tipoEquipamento: string
  fabricante: string
  modelo: string
  descricaoProblema: string
  createdAt: string
}

interface ClientePerfil {
  razaoSocial: string
  nomeFantasia: string
  cnpj: string
}

const statusConfig: Record<
  string,
  {
    label: string
    badgeClass: string
    icon: typeof Clock
    cardBorder: string
    cardBg: string
    iconColor: string
    glowColor: string
  }
> = {
  recebida: {
    label: "Recebida",
    badgeClass: "bg-cyan-950 text-cyan-300 border-cyan-500/50",
    icon: Clock,
    cardBorder: "border-l-cyan-400",
    cardBg: "bg-cyan-500/5",
    iconColor: "text-cyan-400",
    glowColor: "shadow-cyan-500/20",
  },
  em_progresso: {
    label: "Em Progresso",
    badgeClass: "bg-amber-950 text-amber-300 border-amber-500/50",
    icon: Wrench,
    cardBorder: "border-l-amber-400",
    cardBg: "bg-amber-500/5",
    iconColor: "text-amber-400",
    glowColor: "shadow-amber-500/20",
  },
  finalizada: {
    label: "Finalizada",
    badgeClass: "bg-emerald-950 text-emerald-300 border-emerald-500/50",
    icon: CheckCircle,
    cardBorder: "border-l-emerald-400",
    cardBg: "bg-emerald-500/5",
    iconColor: "text-emerald-400",
    glowColor: "shadow-emerald-500/20",
  },
}

export default function ClienteDashboard() {
  const { usuario } = useAuth()
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([])
  const [perfil, setPerfil] = useState<ClientePerfil | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    async function fetchData() {
      try {
        const [solRes, perfilRes] = await Promise.all([
          fetch("/api/cliente/solicitacoes", { credentials: "include" }),
          fetch("/api/cliente/perfil", { credentials: "include" }),
        ])

        if (solRes.ok) {
          const data = await solRes.json()
          setSolicitacoes(data)
        }

        if (perfilRes.ok) {
          const data = await perfilRes.json()
          setPerfil(data)
        }
      } catch (error) {
        console.error("Erro ao carregar dados:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const filtered = solicitacoes.filter((s) => {
    const term = searchTerm.toLowerCase()
    return (
      s.protocolo.toLowerCase().includes(term) ||
      s.tipoEquipamento.toLowerCase().includes(term) ||
      s.fabricante.toLowerCase().includes(term) ||
      s.modelo.toLowerCase().includes(term) ||
      s.descricaoProblema.toLowerCase().includes(term)
    )
  })

  const counts = {
    total: solicitacoes.length,
    recebida: solicitacoes.filter((s) => s.status === "recebida").length,
    em_progresso: solicitacoes.filter((s) => s.status === "em_progresso").length,
    finalizada: solicitacoes.filter((s) => s.status === "finalizada").length,
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-5xl">
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
          <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-foreground text-balance">
            Minhas Solicitações
          </h2>
          {perfil && (
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5" />
              {perfil.razaoSocial}
            </p>
          )}
        </div>
        <Button asChild>
          <Link href="/cliente/nova-solicitacao">
            <PlusCircle className="h-4 w-4 mr-2" />
            Nova OS
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card className="border-l-4 border-l-cyan-400 bg-cyan-500/5">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-cyan-500/10 p-2">
              <Clock className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{counts.recebida}</p>
              <p className="text-xs text-muted-foreground">Recebidas</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-400 bg-amber-500/5">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-amber-500/10 p-2">
              <Wrench className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{counts.em_progresso}</p>
              <p className="text-xs text-muted-foreground">Em Progresso</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-400 bg-emerald-500/5">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-emerald-500/10 p-2">
              <CheckCircle className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{counts.finalizada}</p>
              <p className="text-xs text-muted-foreground">Finalizadas</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por protocolo, equipamento, descricao..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Inbox className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-1">
              {searchTerm ? "Nenhuma solicitacao encontrada" : "Nenhuma solicitacao ainda"}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchTerm
                ? "Tente ajustar o termo de busca."
                : "Crie sua primeira solicitacao de servico tecnico."}
            </p>
            {!searchTerm && (
              <Button asChild>
                <Link href="/cliente/nova-solicitacao">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Nova OS
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((sol) => {
            const config = statusConfig[sol.status] || statusConfig.recebida
            const StatusIcon = config.icon
            return (
              <Card
                key={sol.id}
                className={`border-l-4 ${config.cardBorder} ${config.cardBg} hover:shadow-lg ${config.glowColor} transition-all duration-200`}
              >
                <CardContent className="p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-mono text-sm font-medium text-foreground">
                          {sol.protocolo}
                        </span>
                        <Badge className={`${config.badgeClass} border`}>
                          <StatusIcon className={`h-3 w-3 mr-1 ${config.iconColor}`} />
                          {config.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-foreground font-medium">
                        {sol.tipoEquipamento} - {sol.fabricante} {sol.modelo}
                      </p>
                      <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                        {sol.descricaoProblema}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(sol.createdAt).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <Button asChild variant="outline" size="sm" className="bg-transparent shrink-0">
                      <Link href={`/cliente/solicitacao/${sol.id}`}>
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
    </div>
  )
}
