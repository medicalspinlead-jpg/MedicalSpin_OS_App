"use client"

import Link from "next/link"
import { FileText, Users, History, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useEffect, useState } from "react"
import { getRascunhos, getOSFinalizadas, getClientes, getEquipamentos } from "@/lib/storage"
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts"

export default function HomePage() {
  const [stats, setStats] = useState({
    rascunhos: 0,
    finalizadas: 0,
    clientes: 0,
    equipamentos: 0,
  })
  const [clientesPorEstado, setClientesPorEstado] = useState<{ estado: string; quantidade: number }[]>([])
  const [clientesPorCidade, setClientesPorCidade] = useState<{ cidade: string; quantidade: number }[]>([])
  const [equipamentosPorModelo, setEquipamentosPorModelo] = useState<{ modelo: string; quantidade: number }[]>([])
  const [equipamentosPorFabricante, setEquipamentosPorFabricante] = useState<{ fabricante: string; quantidade: number }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [rascunhos, finalizadas, clientes, equipamentos] = await Promise.all([
          getRascunhos(),
          getOSFinalizadas(),
          getClientes(),
          getEquipamentos(),
        ])
        setStats({
          rascunhos: rascunhos.length,
          finalizadas: finalizadas.length,
          clientes: clientes.length,
          equipamentos: equipamentos.length,
        })

        // Agrupa clientes por estado
        const estadoCount: Record<string, number> = {}
        clientes.forEach((cliente: { uf?: string }) => {
          const estado = cliente.uf || "N/D"
          estadoCount[estado] = (estadoCount[estado] || 0) + 1
        })
        const estadosData = Object.entries(estadoCount)
          .map(([estado, quantidade]) => ({ estado, quantidade }))
          .sort((a, b) => b.quantidade - a.quantidade)
          .slice(0, 10) // Top 10 estados
        setClientesPorEstado(estadosData)

        // Agrupa clientes por cidade
        const cidadeCount: Record<string, number> = {}
        clientes.forEach((cliente: { cidade?: string }) => {
          const cidade = cliente.cidade || "N/D"
          cidadeCount[cidade] = (cidadeCount[cidade] || 0) + 1
        })
        const cidadesData = Object.entries(cidadeCount)
          .map(([cidade, quantidade]) => ({ cidade, quantidade }))
          .sort((a, b) => b.quantidade - a.quantidade)
          .slice(0, 10) // Top 10 cidades
        setClientesPorCidade(cidadesData)

        // Agrupa equipamentos por modelo
        const modeloCount: Record<string, number> = {}
        equipamentos.forEach((equip: { modelo?: string }) => {
          const modelo = equip.modelo || "N/D"
          modeloCount[modelo] = (modeloCount[modelo] || 0) + 1
        })
        const modelosData = Object.entries(modeloCount)
          .map(([modelo, quantidade]) => ({ modelo, quantidade }))
          .sort((a, b) => b.quantidade - a.quantidade)
          .slice(0, 10) // Top 10 modelos
        setEquipamentosPorModelo(modelosData)

        // Agrupa equipamentos por fabricante
        const fabricanteCount: Record<string, number> = {}
        equipamentos.forEach((equip: { fabricante?: string }) => {
          const fabricante = equip.fabricante || "N/D"
          fabricanteCount[fabricante] = (fabricanteCount[fabricante] || 0) + 1
        })
        const fabricantesData = Object.entries(fabricanteCount)
          .map(([fabricante, quantidade]) => ({ fabricante, quantidade }))
          .sort((a, b) => b.quantidade - a.quantidade)
          .slice(0, 10) // Top 10 fabricantes
        setEquipamentosPorFabricante(fabricantesData)
      } catch (error) {
        console.error("Erro ao carregar estatísticas:", error)
      } finally {
        setLoading(false)
      }
    }
    loadStats()
  }, [])

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Main Content */}
      <main className="container mx-auto px-4 py-4 md:py-8">
        <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-3">
          {/* Nova OS */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <FileText className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base md:text-lg">Ordens de Serviço</CardTitle>
                  <CardDescription className="text-xs md:text-sm">Criar e gerenciar OS</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full" variant="default" size="sm">
                <Link href="/os/nova">
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Ordem de Serviço
                </Link>
              </Button>
              <Button asChild className="w-full bg-transparent" variant="outline" size="sm">
                <Link href="/os/rascunhos">Ver Rascunhos</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Clientes */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Users className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-base md:text-lg">Clientes</CardTitle>
                  <CardDescription className="text-xs md:text-sm">Gerenciar clientes</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full" variant="default" size="sm">
                <Link href="/clientes">
                  <Users className="h-4 w-4 mr-2" />
                  Ver Clientes
                </Link>
              </Button>
              <Button asChild className="w-full bg-transparent" variant="outline" size="sm">
                <Link href="/clientes/novo">Cadastrar Novo Cliente</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Histórico */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <History className="h-5 w-5 md:h-6 md:w-6 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-base md:text-lg">Histórico</CardTitle>
                  <CardDescription className="text-xs md:text-sm">Visualizar OS finalizadas</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full" variant="default" size="sm">
                <Link href="/historico">
                  <History className="h-4 w-4 mr-2" />
                  Ver Histórico
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="mt-6 md:mt-8 grid gap-3 md:gap-4 grid-cols-2 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2 md:pb-3">
              <CardDescription className="text-xs md:text-sm">Rascunhos</CardDescription>
              <CardTitle className="text-2xl md:text-3xl">
                <span className="text-orange-600">{loading ? "..." : stats.rascunhos}</span>
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2 md:pb-3">
              <CardDescription className="text-xs md:text-sm">OS Finalizadas</CardDescription>
              <CardTitle className="text-2xl md:text-3xl">
                <span className="text-green-600">{loading ? "..." : stats.finalizadas}</span>
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2 md:pb-3">
              <CardDescription className="text-xs md:text-sm">Clientes</CardDescription>
              <CardTitle className="text-2xl md:text-3xl">
                <span className="text-blue-600">{loading ? "..." : stats.clientes}</span>
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2 md:pb-3">
              <CardDescription className="text-xs md:text-sm">Equipamentos</CardDescription>
              <CardTitle className="text-2xl md:text-3xl">
                <span className="text-gray-600">{loading ? "..." : stats.equipamentos}</span>
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="mt-6 md:mt-8 grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-3">
          {/* Grafico de OS - Pizza */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base md:text-lg">Ordens de Servico</CardTitle>
              <CardDescription className="text-xs md:text-sm">Distribuicao por status</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                  Carregando...
                </div>
              ) : stats.rascunhos === 0 && stats.finalizadas === 0 ? (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                  Nenhuma OS cadastrada
                </div>
              ) : (
                <ChartContainer
                  config={{
                    rascunhos: { label: "Rascunhos", color: "#f97316" },
                    finalizadas: { label: "Finalizadas", color: "#22c55e" },
                  }}
                  className="h-[250px] w-full"
                >
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Pie
                      data={[
                        { name: "rascunhos", value: stats.rascunhos, fill: "#f97316" },
                        { name: "finalizadas", value: stats.finalizadas, fill: "#22c55e" },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                      nameKey="name"
                      label={({ name, value }) => `${name === "rascunhos" ? "Rascunhos" : "Finalizadas"}: ${value}`}
                      labelLine={false}
                    >
                      <Cell key="rascunhos" fill="#f97316" />
                      <Cell key="finalizadas" fill="#22c55e" />
                    </Pie>
                  </PieChart>
                </ChartContainer>
              )}
              <div className="flex justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500" />
                  <span className="text-xs md:text-sm text-muted-foreground">Rascunhos ({stats.rascunhos})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-xs md:text-sm text-muted-foreground">Finalizadas ({stats.finalizadas})</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Grafico de Clientes por Estado/Cidade - Barras com Tabs */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base md:text-lg">Distribuicao de Clientes</CardTitle>
              <CardDescription className="text-xs md:text-sm">Por localizacao geografica</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="estado" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="estado">Por Estado</TabsTrigger>
                  <TabsTrigger value="cidade">Por Cidade</TabsTrigger>
                </TabsList>
                
                <TabsContent value="estado">
                  {loading ? (
                    <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                      Carregando...
                    </div>
                  ) : clientesPorEstado.length === 0 ? (
                    <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                      Nenhum cliente cadastrado
                    </div>
                  ) : (
                    <ChartContainer
                      config={{
                        quantidade: { label: "Clientes", color: "#3b82f6" },
                      }}
                      className="h-[250px] w-full"
                    >
                      <BarChart data={clientesPorEstado} layout="vertical" margin={{ left: 10, right: 20 }}>
                        <XAxis type="number" hide />
                        <YAxis 
                          type="category" 
                          dataKey="estado" 
                          width={40}
                          tick={{ fontSize: 12 }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <ChartTooltip 
                          content={<ChartTooltipContent />}
                          cursor={{ fill: "rgba(59, 130, 246, 0.1)" }}
                        />
                        <Bar 
                          dataKey="quantidade" 
                          fill="#3b82f6" 
                          radius={[0, 4, 4, 0]}
                          name="quantidade"
                        />
                      </BarChart>
                    </ChartContainer>
                  )}
                </TabsContent>

                <TabsContent value="cidade">
                  {loading ? (
                    <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                      Carregando...
                    </div>
                  ) : clientesPorCidade.length === 0 ? (
                    <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                      Nenhum cliente cadastrado
                    </div>
                  ) : (
                    <ChartContainer
                      config={{
                        quantidade: { label: "Clientes", color: "#8b5cf6" },
                      }}
                      className="h-[250px] w-full"
                    >
                      <BarChart data={clientesPorCidade} layout="vertical" margin={{ left: 10, right: 20 }}>
                        <XAxis type="number" hide />
                        <YAxis 
                          type="category" 
                          dataKey="cidade" 
                          width={80}
                          tick={{ fontSize: 11 }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <ChartTooltip 
                          content={<ChartTooltipContent />}
                          cursor={{ fill: "rgba(139, 92, 246, 0.1)" }}
                        />
                        <Bar 
                          dataKey="quantidade" 
                          fill="#8b5cf6" 
                          radius={[0, 4, 4, 0]}
                          name="quantidade"
                        />
                      </BarChart>
                    </ChartContainer>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Grafico de Equipamentos por Modelo/Fabricante - Barras com Tabs */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base md:text-lg">Distribuicao de Equipamentos</CardTitle>
              <CardDescription className="text-xs md:text-sm">Por modelo e fabricante</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="modelo" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="modelo">Por Modelo</TabsTrigger>
                  <TabsTrigger value="fabricante">Por Fabricante</TabsTrigger>
                </TabsList>
                
                <TabsContent value="modelo">
                  {loading ? (
                    <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                      Carregando...
                    </div>
                  ) : equipamentosPorModelo.length === 0 ? (
                    <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                      Nenhum equipamento cadastrado
                    </div>
                  ) : (
                    <ChartContainer
                      config={{
                        quantidade: { label: "Equipamentos", color: "#10b981" },
                      }}
                      className="h-[250px] w-full"
                    >
                      <BarChart data={equipamentosPorModelo} layout="vertical" margin={{ left: 10, right: 20 }}>
                        <XAxis type="number" hide />
                        <YAxis 
                          type="category" 
                          dataKey="modelo" 
                          width={80}
                          tick={{ fontSize: 11 }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <ChartTooltip 
                          content={<ChartTooltipContent />}
                          cursor={{ fill: "rgba(16, 185, 129, 0.1)" }}
                        />
                        <Bar 
                          dataKey="quantidade" 
                          fill="#10b981" 
                          radius={[0, 4, 4, 0]}
                          name="quantidade"
                        />
                      </BarChart>
                    </ChartContainer>
                  )}
                </TabsContent>

                <TabsContent value="fabricante">
                  {loading ? (
                    <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                      Carregando...
                    </div>
                  ) : equipamentosPorFabricante.length === 0 ? (
                    <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                      Nenhum equipamento cadastrado
                    </div>
                  ) : (
                    <ChartContainer
                      config={{
                        quantidade: { label: "Equipamentos", color: "#f59e0b" },
                      }}
                      className="h-[250px] w-full"
                    >
                      <BarChart data={equipamentosPorFabricante} layout="vertical" margin={{ left: 10, right: 20 }}>
                        <XAxis type="number" hide />
                        <YAxis 
                          type="category" 
                          dataKey="fabricante" 
                          width={80}
                          tick={{ fontSize: 11 }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <ChartTooltip 
                          content={<ChartTooltipContent />}
                          cursor={{ fill: "rgba(245, 158, 11, 0.1)" }}
                        />
                        <Bar 
                          dataKey="quantidade" 
                          fill="#f59e0b" 
                          radius={[0, 4, 4, 0]}
                          name="quantidade"
                        />
                      </BarChart>
                    </ChartContainer>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
