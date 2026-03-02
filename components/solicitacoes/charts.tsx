"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { getSolicitacoesStats, type SolicitacaoStats } from "@/lib/storage"
import { Loader2 } from "lucide-react"
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from "recharts"

const STATUS_COLORS: Record<string, string> = {
  recebida: "hsl(217, 91%, 60%)",
  em_progresso: "hsl(45, 93%, 47%)",
  finalizada: "hsl(142, 71%, 45%)",
  cancelada: "hsl(0, 84%, 60%)",
}

const STATUS_LABELS: Record<string, string> = {
  recebida: "Recebida",
  em_progresso: "Em Progresso",
  finalizada: "Finalizada",
  cancelada: "Cancelada",
}

const pieChartConfig: ChartConfig = {
  recebida: { label: "Recebida", color: STATUS_COLORS.recebida },
  em_progresso: { label: "Em Progresso", color: STATUS_COLORS.em_progresso },
  finalizada: { label: "Finalizada", color: STATUS_COLORS.finalizada },
  cancelada: { label: "Cancelada", color: STATUS_COLORS.cancelada },
}

const barChartConfig: ChartConfig = {
  em_progresso: { label: "Em Progresso", color: STATUS_COLORS.em_progresso },
  finalizada: { label: "Finalizada", color: STATUS_COLORS.finalizada },
  cancelada: { label: "Cancelada", color: STATUS_COLORS.cancelada },
}

export function SolicitacoesCharts() {
  const [stats, setStats] = useState<SolicitacaoStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const data = await getSolicitacoesStats()
        setStats(data)
      } catch (error) {
        console.error("Erro ao carregar estatisticas:", error)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <Card>
          <CardContent className="py-12 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-12 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!stats || stats.total === 0) {
    return null
  }

  const pieData = Object.entries(stats.porStatus).map(([status, count]) => ({
    name: STATUS_LABELS[status] || status,
    value: count,
    fill: STATUS_COLORS[status] || "hsl(var(--muted))",
  }))

  const hasTecnicoData = stats.porTecnico.length > 0

  return (
    <div className="grid gap-4 md:grid-cols-2 mb-6">
      {/* Grafico por Status */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Solicitacoes por Status</CardTitle>
          <CardDescription className="text-xs">
            Distribuicao geral das {stats.total} solicitacoes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={pieChartConfig} className="mx-auto aspect-square max-h-[260px]">
            <PieChart>
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => (
                      <span className="flex items-center gap-2">
                        <span>{name}</span>
                        <span className="font-mono font-bold">{String(value)}</span>
                      </span>
                    )}
                  />
                }
              />
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                strokeWidth={2}
                stroke="hsl(var(--background))"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Legend
                verticalAlign="bottom"
                formatter={(value: string) => (
                  <span className="text-xs text-foreground">{value}</span>
                )}
              />
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Grafico por Tecnico */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Acoes por Tecnico</CardTitle>
          <CardDescription className="text-xs">
            {hasTecnicoData
              ? "Quantidade de acoes realizadas por cada tecnico"
              : "Nenhuma acao registrada com tecnico identificado"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hasTecnicoData ? (
            <ChartContainer config={barChartConfig} className="mx-auto aspect-[4/3] max-h-[260px]">
              <BarChart
                data={stats.porTecnico}
                layout="vertical"
                margin={{ left: 10, right: 10 }}
              >
                <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                <YAxis
                  dataKey="nome"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  width={90}
                  tick={{ fontSize: 11 }}
                />
                <XAxis type="number" tickLine={false} axisLine={false} allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend
                  verticalAlign="bottom"
                  formatter={(value: string) => (
                    <span className="text-xs text-foreground">
                      {STATUS_LABELS[value] || value}
                    </span>
                  )}
                />
                <Bar dataKey="em_progresso" stackId="a" fill={STATUS_COLORS.em_progresso} radius={[0, 0, 0, 0]} />
                <Bar dataKey="finalizada" stackId="a" fill={STATUS_COLORS.finalizada} radius={[0, 0, 0, 0]} />
                <Bar dataKey="cancelada" stackId="a" fill={STATUS_COLORS.cancelada} radius={[4, 4, 4, 4]} />
              </BarChart>
            </ChartContainer>
          ) : (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
              Dados serao exibidos conforme os tecnicos atuarem nas solicitacoes.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
