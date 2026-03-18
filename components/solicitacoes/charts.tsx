"use client"

import { useEffect, useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from "@/components/ui/chart"
import { getSolicitacoesStats, type SolicitacaoStats } from "@/lib/storage"
import { Loader2 } from "lucide-react"
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"

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

function truncateName(name: string, maxLen: number = 14): string {
  if (name.length <= maxLen) return name
  return name.slice(0, maxLen - 1).trimEnd() + "\u2026"
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

  const barData = useMemo(() => {
    if (!stats?.porTecnico.length) return []
    return stats.porTecnico
      .sort((a, b) => b.total - a.total)
      .map((t) => ({
        ...t,
        nomeExibicao: truncateName(t.nome),
      }))
  }, [stats])

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
    name: status,
    value: count,
    fill: STATUS_COLORS[status] || "hsl(var(--muted))",
  }))

  const hasTecnicoData = barData.length > 0
  const barHeight = Math.max(220, barData.length * 48 + 60)

  return (
    <div className="grid gap-4 md:grid-cols-2 mb-6">
      {/* Grafico por Status */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Solicitações por Status</CardTitle>
          <CardDescription className="text-xs">
            Distribuição geral das {stats.total} solicitações
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={pieChartConfig} className="mx-auto aspect-square max-h-[260px]">
            <PieChart>
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    nameKey="name"
                    formatter={(value, name) => (
                      <span className="flex items-center gap-2">
                        <span>{STATUS_LABELS[name as string] ?? name}</span>
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
              <ChartLegend
                content={
                  <ChartLegendContent
                    nameKey="name"
                    payload={pieData.map((entry) => ({
                      value: entry.name,
                      type: "square" as const,
                      color: entry.fill,
                      payload: entry,
                    }))}
                  />
                }
              />
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Grafico por Tecnico */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Ações por Técnico</CardTitle>
          <CardDescription className="text-xs">
            {hasTecnicoData
              ? "Quantidade de ações realizadas por cada técnico"
              : "Nenhuma ação registrada com técnico identificado"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hasTecnicoData ? (
            <ChartContainer
              config={barChartConfig}
              className="w-full"
              style={{ height: `${barHeight}px` }}
            >
              <BarChart
                data={barData}
                layout="vertical"
                margin={{ left: 0, right: 12, top: 4, bottom: 4 }}
                barCategoryGap="20%"
              >
                <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                <YAxis
                  dataKey="nomeExibicao"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  width={110}
                  tick={{ fontSize: 11, fill: "hsl(var(--foreground))" }}
                />
                <XAxis
                  type="number"
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                  tick={{ fontSize: 11 }}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelFormatter={(_, payload) => {
                        if (payload?.[0]?.payload?.nome) {
                          return payload[0].payload.nome
                        }
                        return String(_)
                      }}
                    />
                  }
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar
                  dataKey="em_progresso"
                  name="Em Progresso"
                  stackId="a"
                  fill={STATUS_COLORS.em_progresso}
                  radius={0}
                />
                <Bar
                  dataKey="finalizada"
                  name="Finalizada"
                  stackId="a"
                  fill={STATUS_COLORS.finalizada}
                  radius={0}
                />
                <Bar
                  dataKey="cancelada"
                  name="Cancelada"
                  stackId="a"
                  fill={STATUS_COLORS.cancelada}
                  radius={[4, 4, 4, 4]}
                />
              </BarChart>
            </ChartContainer>
          ) : (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
              Dados serão exibidos conforme os técnicos atuarem nas solicitações.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
