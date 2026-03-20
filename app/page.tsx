"use client"

import Link from "next/link"
import { FileText, Users, History, Plus, Inbox, Building2, Zap, Radio, Scan, ChevronRight, Settings, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useEffect, useState } from "react"
import { getRascunhos, getOSFinalizadas, getClientes, getSolicitacoes, getDepartamentosComDetalhes } from "@/lib/storage"
import type { Departamento, UsuarioDepartamento, ClienteDepartamento } from "@/lib/storage"
import { useAuth } from "@/components/auth-provider"

// Mapeamento de icones para departamentos
const departamentoIcons: Record<string, React.ElementType> = {
  "Zap": Zap,
  "Radio": Radio,
  "Scan": Scan,
  "Building2": Building2,
}

// Cores padrão para departamentos
const departamentoCores: Record<string, { bg: string; text: string; border: string }> = {
  "#ef4444": { bg: "bg-red-500/10", text: "text-red-600", border: "border-red-500/20" },
  "#f97316": { bg: "bg-orange-500/10", text: "text-orange-600", border: "border-orange-500/20" },
  "#eab308": { bg: "bg-yellow-500/10", text: "text-yellow-600", border: "border-yellow-500/20" },
  "#22c55e": { bg: "bg-green-500/10", text: "text-green-600", border: "border-green-500/20" },
  "#14b8a6": { bg: "bg-teal-500/10", text: "text-teal-600", border: "border-teal-500/20" },
  "#3b82f6": { bg: "bg-blue-500/10", text: "text-blue-600", border: "border-blue-500/20" },
  "#8b5cf6": { bg: "bg-violet-500/10", text: "text-violet-600", border: "border-violet-500/20" },
  "#ec4899": { bg: "bg-pink-500/10", text: "text-pink-600", border: "border-pink-500/20" },
}

function getCorClasses(cor: string) {
  return departamentoCores[cor] || { bg: "bg-primary/10", text: "text-primary", border: "border-primary/20" }
}

export default function HomePage() {
  const { usuario } = useAuth()
  const isAdmin = usuario?.cargo === "admin"
  
  const [stats, setStats] = useState({
    rascunhos: 0,
    finalizadas: 0,
    clientes: 0,
    solicitacoesPendentes: 0,
  })
  const [departamentos, setDepartamentos] = useState<Departamento[]>([])
  const [usuariosPorDepartamento, setUsuariosPorDepartamento] = useState<Record<string, UsuarioDepartamento[]>>({})
  const [clientesPorDepartamento, setClientesPorDepartamento] = useState<Record<string, ClienteDepartamento[]>>({})
  const [loading, setLoading] = useState(true)
  const [selectedDept, setSelectedDept] = useState<string | null>(null)

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [rascunhos, finalizadas, clientes, solicitacoes, deptData] = await Promise.all([
          getRascunhos(),
          getOSFinalizadas(),
          getClientes(),
          getSolicitacoes(),
          getDepartamentosComDetalhes(),
        ])
        const pendentes = solicitacoes.filter((s) => s.status === "recebida").length
        setStats({
          rascunhos: rascunhos.length,
          finalizadas: finalizadas.length,
          clientes: clientes.length,
          solicitacoesPendentes: pendentes,
        })
        
        setDepartamentos(deptData.departamentos)
        setUsuariosPorDepartamento(deptData.usuariosPorDepartamento)
        setClientesPorDepartamento(deptData.clientesPorDepartamento)
        
        if (deptData.departamentos.length > 0) {
          setSelectedDept(deptData.departamentos[0].id)
        }
      } catch (error) {
        console.error("Erro ao carregar estatisticas:", error)
      } finally {
        setLoading(false)
      }
    }
    loadStats()
  }, [])

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <main className="container mx-auto px-4 py-6 md:py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Bem-vindo{usuario?.nome ? `, ${usuario.nome.split(" ")[0]}` : ""}
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie ordens de servico, clientes e departamentos
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-3 md:gap-4 grid-cols-2 md:grid-cols-4 mb-8">
          <Card className="border-l-4 border-l-amber-500">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs md:text-sm flex items-center gap-2">
                <Inbox className="h-4 w-4" />
                Solicitacoes Pendentes
              </CardDescription>
              <CardTitle className="text-2xl md:text-3xl text-amber-600">
                {loading ? "..." : stats.solicitacoesPendentes}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs md:text-sm flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Rascunhos
              </CardDescription>
              <CardTitle className="text-2xl md:text-3xl text-orange-600">
                {loading ? "..." : stats.rascunhos}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs md:text-sm flex items-center gap-2">
                <History className="h-4 w-4" />
                OS Finalizadas
              </CardDescription>
              <CardTitle className="text-2xl md:text-3xl text-green-600">
                {loading ? "..." : stats.finalizadas}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs md:text-sm flex items-center gap-2">
                <Users className="h-4 w-4" />
                Clientes
              </CardDescription>
              <CardTitle className="text-2xl md:text-3xl text-blue-600">
                {loading ? "..." : stats.clientes}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Quick Actions */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Acoes Rapidas</h2>
            
            <Card className="hover:shadow-lg transition-all duration-200 group cursor-pointer" onClick={() => window.location.href = "/os/nova"}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
                  <Plus className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Nova Ordem de Servico</h3>
                  <p className="text-sm text-muted-foreground">Criar uma nova OS</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-200 group cursor-pointer" onClick={() => window.location.href = "/solicitacoes"}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 bg-amber-500/10 rounded-xl group-hover:bg-amber-500/20 transition-colors">
                  <Inbox className="h-6 w-6 text-amber-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Ver Solicitacoes</h3>
                  <p className="text-sm text-muted-foreground">
                    {stats.solicitacoesPendentes > 0 ? `${stats.solicitacoesPendentes} pendente${stats.solicitacoesPendentes > 1 ? "s" : ""}` : "Nenhuma pendente"}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-amber-600 transition-colors" />
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-200 group cursor-pointer" onClick={() => window.location.href = "/clientes"}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 bg-blue-500/10 rounded-xl group-hover:bg-blue-500/20 transition-colors">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Gerenciar Clientes</h3>
                  <p className="text-sm text-muted-foreground">{stats.clientes} cliente{stats.clientes !== 1 ? "s" : ""} cadastrado{stats.clientes !== 1 ? "s" : ""}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-blue-600 transition-colors" />
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-200 group cursor-pointer" onClick={() => window.location.href = "/historico"}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 bg-green-500/10 rounded-xl group-hover:bg-green-500/20 transition-colors">
                  <History className="h-6 w-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Historico de OS</h3>
                  <p className="text-sm text-muted-foreground">{stats.finalizadas} OS finalizada{stats.finalizadas !== 1 ? "s" : ""}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-green-600 transition-colors" />
              </CardContent>
            </Card>

            {isAdmin && (
              <Card className="hover:shadow-lg transition-all duration-200 group cursor-pointer" onClick={() => window.location.href = "/admin"}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="p-3 bg-violet-500/10 rounded-xl group-hover:bg-violet-500/20 transition-colors">
                    <Settings className="h-6 w-6 text-violet-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">Administracao</h3>
                    <p className="text-sm text-muted-foreground">Usuarios e departamentos</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-violet-600 transition-colors" />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Departamentos */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Departamentos</h2>
              {isAdmin && (
                <Button asChild variant="outline" size="sm">
                  <Link href="/admin?tab=departamentos">
                    <Settings className="h-4 w-4 mr-2" />
                    Gerenciar
                  </Link>
                </Button>
              )}
            </div>

            {loading ? (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </CardContent>
              </Card>
            ) : departamentos.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="p-4 bg-muted rounded-full mb-4">
                    <Building2 className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Nenhum departamento configurado</h3>
                  <p className="text-sm text-muted-foreground text-center mb-4">
                    {isAdmin ? "Configure os departamentos na area de administracao" : "Aguarde a configuracao dos departamentos pelo administrador"}
                  </p>
                  {isAdmin && (
                    <Button asChild>
                      <Link href="/admin?tab=departamentos">
                        <Plus className="h-4 w-4 mr-2" />
                        Configurar Departamentos
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Tabs value={selectedDept || departamentos[0]?.id} onValueChange={setSelectedDept} className="w-full">
                <TabsList className="w-full justify-start mb-4 bg-muted/50 p-1 h-auto flex-wrap gap-1">
                  {departamentos.map((dept) => {
                    const IconComponent = departamentoIcons[dept.icone] || Building2
                    const corClasses = getCorClasses(dept.cor)
                    return (
                      <TabsTrigger
                        key={dept.id}
                        value={dept.id}
                        className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm px-4 py-2"
                      >
                        <IconComponent className={`h-4 w-4 ${corClasses.text}`} />
                        <span className="hidden sm:inline">{dept.nome}</span>
                      </TabsTrigger>
                    )
                  })}
                </TabsList>

                {departamentos.map((dept) => {
                  const IconComponent = departamentoIcons[dept.icone] || Building2
                  const corClasses = getCorClasses(dept.cor)
                  const usuarios = usuariosPorDepartamento[dept.id] || []
                  const clientes = clientesPorDepartamento[dept.id] || []

                  return (
                    <TabsContent key={dept.id} value={dept.id} className="mt-0">
                      <Card className={`border ${corClasses.border}`}>
                        <CardHeader className={`${corClasses.bg} border-b ${corClasses.border}`}>
                          <div className="flex items-center gap-3">
                            <div className={`p-3 rounded-xl ${corClasses.bg}`}>
                              <IconComponent className={`h-6 w-6 ${corClasses.text}`} />
                            </div>
                            <div>
                              <CardTitle className="text-lg">{dept.nome}</CardTitle>
                              {dept.descricao && (
                                <CardDescription>{dept.descricao}</CardDescription>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="p-0">
                          {/* Tecnicos do departamento */}
                          <div className="p-4 border-b">
                            <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                              <UserPlus className="h-4 w-4" />
                              Tecnicos Atribuidos ({usuarios.length})
                            </h4>
                            {usuarios.length === 0 ? (
                              <p className="text-sm text-muted-foreground italic">Nenhum tecnico atribuido</p>
                            ) : (
                              <div className="flex flex-wrap gap-2">
                                {usuarios.map((ud) => (
                                  <div
                                    key={ud.id}
                                    className="flex items-center gap-2 bg-muted/50 rounded-full px-3 py-1.5"
                                  >
                                    <Avatar className="h-6 w-6">
                                      <AvatarFallback className="text-xs">
                                        {getInitials(ud.usuario?.nome || "?")}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm font-medium">{ud.usuario?.nome}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Clientes do departamento */}
                          <div className="p-4">
                            <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              Clientes ({clientes.length})
                            </h4>
                            {clientes.length === 0 ? (
                              <p className="text-sm text-muted-foreground italic">Nenhum cliente atribuido</p>
                            ) : (
                              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                {clientes.map((cd) => (
                                  <div
                                    key={cd.id}
                                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                                  >
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium truncate">{cd.cliente?.nomeFantasia || cd.cliente?.razaoSocial}</p>
                                      <p className="text-xs text-muted-foreground truncate">
                                        {cd.cliente?.cidade}, {cd.cliente?.uf}
                                      </p>
                                    </div>
                                    {cd.usuarioResponsavel ? (
                                      <Badge variant="outline" className="ml-2 shrink-0">
                                        <Avatar className="h-4 w-4 mr-1">
                                          <AvatarFallback className="text-[8px]">
                                            {getInitials(cd.usuarioResponsavel.nome)}
                                          </AvatarFallback>
                                        </Avatar>
                                        {cd.usuarioResponsavel.nome.split(" ")[0]}
                                      </Badge>
                                    ) : (
                                      <Badge variant="secondary" className="ml-2 shrink-0 text-muted-foreground">
                                        Sem responsavel
                                      </Badge>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  )
                })}
              </Tabs>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
