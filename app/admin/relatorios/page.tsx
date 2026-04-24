"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import { 
  ArrowLeft, 
  FileText, 
  Users, 
  Building2, 
  Wrench, 
  ClipboardList, 
  UserCog,
  Calendar,
  Download,
  Loader2,
  AlertCircle,
  Check
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { useAuth } from "@/components/auth-provider"
import { toast } from "sonner"
import useSWR from "swr"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

// Type for jsPDF with autoTable
type jsPDFWithAutoTable = jsPDF & {
  lastAutoTable: { finalY: number }
}

interface Usuario {
  id: string
  nome: string
  cargo: string
}

const fetcher = async (url: string) => {
  const res = await fetch(url, { credentials: "include" })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || "Erro ao buscar dados")
  }
  return res.json()
}

const tiposRelatorio = [
  { 
    value: "os", 
    label: "Ordens de Serviço", 
    description: "Todas as OS no período",
    icon: ClipboardList,
    color: "bg-blue-500"
  },
  { 
    value: "clientes", 
    label: "Clientes", 
    description: "Clientes cadastrados e seus dados",
    icon: Building2,
    color: "bg-green-500"
  },
  { 
    value: "equipamentos", 
    label: "Equipamentos", 
    description: "Por tipo e fabricante",
    icon: Wrench,
    color: "bg-orange-500"
  },
  { 
    value: "solicitacoes", 
    label: "Solicitações", 
    description: "Solicitações de serviço",
    icon: FileText,
    color: "bg-amber-500"
  },
  { 
    value: "tecnico", 
    label: "Por Técnico", 
    description: "OS e solicitações por técnico",
    icon: UserCog,
    color: "bg-teal-500"
  },
]

const periodos = [
  { value: "hoje", label: "Hoje" },
  { value: "ontem", label: "Ontem" },
  { value: "semana", label: "Esta Semana" },
  { value: "mes", label: "Este Mês" },
  { value: "semestre", label: "Este Semestre" },
  { value: "ano", label: "Este Ano" },
  { value: "personalizado", label: "Período Personalizado" },
]

function calcularPeriodo(periodo: string): { inicio: string; fim: string } {
  const hoje = new Date()
  let inicio = new Date()
  const fim = new Date()

  switch (periodo) {
    case "hoje":
      inicio = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())
      break
    case "ontem":
      inicio = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - 1)
      fim.setDate(fim.getDate() - 1)
      break
    case "semana":
      const diaSemana = hoje.getDay()
      inicio = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - diaSemana)
      break
    case "mes":
      inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
      break
    case "semestre":
      const mesSemestre = hoje.getMonth() < 6 ? 0 : 6
      inicio = new Date(hoje.getFullYear(), mesSemestre, 1)
      break
    case "ano":
      inicio = new Date(hoje.getFullYear(), 0, 1)
      break
    default:
      inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
  }

  return {
    inicio: inicio.toISOString().split("T")[0],
    fim: fim.toISOString().split("T")[0],
  }
}

export default function RelatoriosPage() {
  const { usuario: currentUser } = useAuth()
  const [tiposSelecionados, setTiposSelecionados] = useState<string[]>([])
  const [periodo, setPeriodo] = useState("mes")
  const [dataInicio, setDataInicio] = useState(() => calcularPeriodo("mes").inicio)
  const [dataFim, setDataFim] = useState(() => calcularPeriodo("mes").fim)
  const [tecnicoId, setTecnicoId] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data: usuarios = [] } = useSWR<Usuario[]>("/api/usuarios", fetcher)
  const tecnicos = usuarios.filter((u) => u.cargo === "tecnico" || u.cargo === "admin")

  const handlePeriodoChange = (value: string) => {
    setPeriodo(value)
    if (value !== "personalizado") {
      const { inicio, fim } = calcularPeriodo(value)
      setDataInicio(inicio)
      setDataFim(fim)
    }
  }

  const toggleTipo = (tipo: string) => {
    setTiposSelecionados(prev => 
      prev.includes(tipo) 
        ? prev.filter(t => t !== tipo)
        : [...prev, tipo]
    )
  }

  const selecionarTodos = () => {
    if (tiposSelecionados.length === tiposRelatorio.length) {
      setTiposSelecionados([])
    } else {
      setTiposSelecionados(tiposRelatorio.map(t => t.value))
    }
  }

  const formatarData = (data: string) => {
    return new Date(data + "T00:00:00").toLocaleDateString("pt-BR")
  }

  const gerarPDF = useCallback(async () => {
    if (tiposSelecionados.length === 0) {
      toast.error("Selecione pelo menos uma métrica para o relatório")
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Buscar dados de todos os tipos selecionados
      const dadosRelatorios: Record<string, unknown> = {}
      
      for (const tipo of tiposSelecionados) {
        const params = new URLSearchParams({
          tipo,
          dataInicio,
          dataFim,
        })

        if (tipo === "tecnico" && tecnicoId) {
          params.append("tecnicoId", tecnicoId)
        }

        const res = await fetch(`/api/admin/relatorios?${params.toString()}`, {
          credentials: "include",
        })

        if (!res.ok) {
          const errorData = await res.json()
          throw new Error(errorData.error || `Erro ao gerar relatório de ${tipo}`)
        }

        const relatorio = await res.json()
        dadosRelatorios[tipo] = relatorio.dados
      }
      
      // Gerar PDF consolidado
      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.getWidth()
      
      // Cabeçalho
      doc.setFontSize(20)
      doc.setFont("helvetica", "bold")
      doc.text("Medical Spin", 14, 20)
      
      doc.setFontSize(14)
      doc.setFont("helvetica", "normal")
      
      // Título dinâmico
      const tiposLabels = tiposSelecionados.map(t => 
        tiposRelatorio.find(tipo => tipo.value === t)?.label
      ).filter(Boolean)
      
      if (tiposSelecionados.length === tiposRelatorio.length) {
        doc.text("Relatório Completo", 14, 30)
      } else if (tiposSelecionados.length === 1) {
        doc.text(`Relatório de ${tiposLabels[0]}`, 14, 30)
      } else {
        doc.text("Relatório Consolidado", 14, 30)
      }
      
      doc.setFontSize(10)
      doc.setTextColor(100)
      doc.text(`Período: ${formatarData(dataInicio)} a ${formatarData(dataFim)}`, 14, 38)
      doc.text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`, 14, 44)
      
      // Lista de seções incluídas
      if (tiposSelecionados.length > 1 && tiposSelecionados.length < tiposRelatorio.length) {
        doc.text(`Seções: ${tiposLabels.join(", ")}`, 14, 50)
      }
      doc.setTextColor(0)

      let yPos = tiposSelecionados.length > 1 ? 60 : 55

      // Gerar cada seção do relatório
      for (const tipo of tiposSelecionados) {
        const dados = dadosRelatorios[tipo]
        
        // Adicionar separador de seção se houver múltiplos tipos
        if (tiposSelecionados.length > 1) {
          // Verificar se precisa de nova página
          if (yPos > 240) {
            doc.addPage()
            yPos = 20
          }
          
          const tipoInfo = tiposRelatorio.find(t => t.value === tipo)
          doc.setFillColor(240, 240, 240)
          doc.rect(14, yPos - 5, pageWidth - 28, 12, "F")
          doc.setFontSize(13)
          doc.setFont("helvetica", "bold")
          doc.setTextColor(50)
          doc.text(tipoInfo?.label || tipo, 18, yPos + 3)
          doc.setTextColor(0)
          yPos += 15
        }

        switch (tipo) {
          case "os":
            yPos = gerarPDFOS(doc, dados as { resumo: Record<string, unknown>; ordensServico: unknown[] }, yPos, pageWidth)
            break
          case "clientes":
            yPos = gerarPDFClientes(doc, dados as { resumo: Record<string, unknown>; clientes: unknown[] }, yPos, pageWidth)
            break
          case "equipamentos":
            yPos = gerarPDFEquipamentos(doc, dados as { resumo: Record<string, unknown>; equipamentos: unknown[] }, yPos, pageWidth)
            break
          case "solicitacoes":
            yPos = gerarPDFSolicitacoes(doc, dados as { resumo: Record<string, unknown>; solicitacoes: unknown[] }, yPos, pageWidth)
            break
          case "tecnico":
            yPos = gerarPDFTecnico(doc, dados as { resumo: Record<string, unknown>; tecnicos: unknown[] }, yPos, pageWidth, tecnicoId ? tecnicos.find(t => t.id === tecnicoId)?.nome : undefined)
            break
        }
        
        // Espaço entre seções
        if (tiposSelecionados.length > 1) {
          yPos += 10
        }
      }

      // Rodapé em todas as páginas
      const pageCount = doc.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(150)
        doc.text(
          `Página ${i} de ${pageCount}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: "center" }
        )
      }

      // Salvar PDF
      const tipoNome = tiposSelecionados.length === tiposRelatorio.length 
        ? "completo" 
        : tiposSelecionados.length === 1 
          ? tiposSelecionados[0] 
          : "consolidado"
      const fileName = `relatorio-${tipoNome}-${dataInicio}-a-${dataFim}.pdf`
      doc.save(fileName)
      
      toast.success("Relatório gerado com sucesso!")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao gerar relatório"
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [tiposSelecionados, dataInicio, dataFim, tecnicoId, tecnicos])

  // Verificar se o usuário é admin
  if (currentUser && currentUser.cargo !== "admin") {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="p-4 bg-destructive/10 rounded-full mb-4">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Acesso Negado</h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              Apenas administradores podem acessar esta página.
            </p>
            <Button asChild>
              <Link href="/">Voltar ao Início</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const mostrarFiltroTecnico = tiposSelecionados.includes("tecnico")

  return (
    <div className="min-h-screen bg-muted/30">
      <main className="container mx-auto px-4 py-4 md:py-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            <Button asChild variant="ghost" size="sm" className="mb-2 md:mb-4">
              <Link href="/admin">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para Administração
              </Link>
            </Button>
            <h1 className="text-2xl md:text-3xl font-semibold text-foreground">Relatórios</h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              Gere relatórios detalhados em PDF com múltiplas métricas
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Coluna de configuração */}
          <div className="lg:col-span-2 space-y-6">
            {/* Métricas do Relatório */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Métricas do Relatório
                    </CardTitle>
                    <CardDescription>Selecione uma ou mais métricas para incluir no relatório</CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={selecionarTodos}
                  >
                    {tiposSelecionados.length === tiposRelatorio.length ? "Desmarcar Todos" : "Selecionar Todos"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2">
                  {tiposRelatorio.map((tipo) => {
                    const Icon = tipo.icon
                    const isSelected = tiposSelecionados.includes(tipo.value)
                    return (
                      <button
                        key={tipo.value}
                        onClick={() => toggleTipo(tipo.value)}
                        className={`flex items-start gap-3 p-4 rounded-lg border text-left transition-all ${
                          isSelected
                            ? "bg-primary/10 border-primary ring-1 ring-primary"
                            : "bg-background hover:bg-muted/50 hover:border-primary/50"
                        }`}
                      >
                        <div className={`p-2 rounded-lg ${tipo.color} text-white shrink-0`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{tipo.label}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {tipo.description}
                          </p>
                        </div>
                        <div className={`shrink-0 mt-0.5 h-5 w-5 rounded border flex items-center justify-center ${
                          isSelected ? "bg-primary border-primary" : "border-muted-foreground/30"
                        }`}>
                          {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Período */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Período do Relatório
                </CardTitle>
                <CardDescription>Defina o intervalo de datas para o relatório</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="periodo">Período</Label>
                  <Select value={periodo} onValueChange={handlePeriodoChange}>
                    <SelectTrigger id="periodo" className="mt-1.5">
                      <SelectValue placeholder="Selecione o período" />
                    </SelectTrigger>
                    <SelectContent>
                      {periodos.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {periodo === "personalizado" && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="dataInicio">Data Início</Label>
                      <Input
                        id="dataInicio"
                        type="date"
                        value={dataInicio}
                        onChange={(e) => setDataInicio(e.target.value)}
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="dataFim">Data Fim</Label>
                      <Input
                        id="dataFim"
                        type="date"
                        value={dataFim}
                        onChange={(e) => setDataFim(e.target.value)}
                        className="mt-1.5"
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {formatarData(dataInicio)} a {formatarData(dataFim)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Filtro por Técnico (apenas quando métrica tecnico está selecionada) */}
            {mostrarFiltroTecnico && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Filtrar por Técnico
                  </CardTitle>
                  <CardDescription>
                    Opcional: selecione um técnico específico ou deixe em branco para todos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Select value={tecnicoId || "all"} onValueChange={(value) => setTecnicoId(value === "all" ? "" : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os técnicos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os técnicos</SelectItem>
                      {tecnicos.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.nome} ({t.cargo === "admin" ? "Admin" : "Técnico"})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Coluna de resumo e ação */}
          <div className="space-y-6">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="text-lg">Resumo do Relatório</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-sm text-muted-foreground">Métricas selecionadas:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {tiposSelecionados.length > 0 ? (
                        tiposSelecionados.map(tipo => {
                          const tipoInfo = tiposRelatorio.find(t => t.value === tipo)
                          return (
                            <Badge key={tipo} variant="secondary" className="text-xs">
                              {tipoInfo?.label}
                            </Badge>
                          )
                        })
                      ) : (
                        <span className="text-sm text-muted-foreground italic">Nenhuma selecionada</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Período:</span>
                    <span className="font-medium">
                      {periodos.find((p) => p.value === periodo)?.label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Datas:</span>
                    <span className="text-xs">
                      {formatarData(dataInicio)} - {formatarData(dataFim)}
                    </span>
                  </div>
                  {mostrarFiltroTecnico && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Técnico:</span>
                      <span className="font-medium">
                        {tecnicoId && tecnicoId !== "all"
                          ? tecnicos.find((t) => t.id === tecnicoId)?.nome
                          : "Todos"}
                      </span>
                    </div>
                  )}
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button
                  className="w-full"
                  size="lg"
                  onClick={gerarPDF}
                  disabled={tiposSelecionados.length === 0 || loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Gerar PDF
                    </>
                  )}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  {tiposSelecionados.length === 0 
                    ? "Selecione ao menos uma métrica" 
                    : tiposSelecionados.length === 1 
                      ? "1 seção será incluída no PDF"
                      : `${tiposSelecionados.length} seções serão incluídas no PDF`}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

// Funções auxiliares para geração de PDF

function gerarPDFOS(doc: jsPDF, dados: { resumo: Record<string, unknown>; ordensServico: unknown[] }, yPos: number, pageWidth: number): number {
  const { resumo, ordensServico } = dados
  const docWithTable = doc as jsPDFWithAutoTable

  // Verificar se precisa de nova página
  if (yPos > 240) {
    doc.addPage()
    yPos = 20
  }

  // Resumo
  doc.setFontSize(11)
  doc.setFont("helvetica", "bold")
  doc.text("Resumo", 14, yPos)
  yPos += 6

  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  
  const resumoData = [
    ["Total de OS", String(resumo.total)],
    ["Em Rascunho", String((resumo.porStatus as Record<string, number>)?.rascunho || 0)],
    ["Finalizadas", String((resumo.porStatus as Record<string, number>)?.finalizada || 0)],
    ["Fechadas", String((resumo.porStatus as Record<string, number>)?.fechada || 0)],
    ["Total de Peças", String(resumo.totalPecas)],
    ["Total Horas Trabalhadas", `${resumo.totalHorasMaoDeObra}h`],
  ]

  autoTable(doc, {
    startY: yPos,
    head: [["Métrica", "Valor"]],
    body: resumoData,
    theme: "grid",
    headStyles: { fillColor: [59, 130, 246] },
    margin: { left: 14, right: 14 },
  })

  yPos = docWithTable.lastAutoTable.finalY + 10

  // Tabela de OS
  if (ordensServico.length > 0) {
    // Verificar se precisa de nova página
    if (yPos > 240) {
      doc.addPage()
      yPos = 20
    }

    doc.setFontSize(11)
    doc.setFont("helvetica", "bold")
    doc.text("Detalhamento das Ordens de Serviço", 14, yPos)
    yPos += 6

    const osData = (ordensServico as Record<string, unknown>[]).map((os) => [
      os.numero as string,
      os.status as string,
      (os.cliente as Record<string, string>)?.nomeFantasia || (os.cliente as Record<string, string>)?.razaoSocial || "-",
      (os.equipamento as Record<string, string>)?.tipo || "-",
      (os.tecnico as Record<string, string>)?.nome || "-",
      new Date(os.createdAt as string).toLocaleDateString("pt-BR"),
    ])

    autoTable(doc, {
      startY: yPos,
      head: [["Número", "Status", "Cliente", "Equipamento", "Técnico", "Data"]],
      body: osData,
      theme: "striped",
      headStyles: { fillColor: [59, 130, 246] },
      margin: { left: 14, right: 14 },
      styles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 22 },
        2: { cellWidth: 45 },
        3: { cellWidth: 30 },
        4: { cellWidth: 35 },
        5: { cellWidth: 25 },
      },
    })

    yPos = docWithTable.lastAutoTable.finalY + 10
  }

  return yPos
}

function gerarPDFClientes(doc: jsPDF, dados: { resumo: Record<string, unknown>; clientes: unknown[] }, yPos: number, pageWidth: number): number {
  const { resumo, clientes } = dados
  const docWithTable = doc as jsPDFWithAutoTable

  // Verificar se precisa de nova página
  if (yPos > 240) {
    doc.addPage()
    yPos = 20
  }

  // Resumo
  doc.setFontSize(11)
  doc.setFont("helvetica", "bold")
  doc.text("Resumo", 14, yPos)
  yPos += 6

  const resumoData = [
    ["Total de Clientes", String(resumo.totalClientes)],
    ["Total de Equipamentos", String(resumo.totalEquipamentos)],
    ["Total de OS", String(resumo.totalOrdensServico)],
    ["Total de Solicitações", String(resumo.totalSolicitacoes)],
  ]

  autoTable(doc, {
    startY: yPos,
    head: [["Métrica", "Valor"]],
    body: resumoData,
    theme: "grid",
    headStyles: { fillColor: [34, 197, 94] },
    margin: { left: 14, right: 14 },
  })

  yPos = docWithTable.lastAutoTable.finalY + 10

  // Tabela de Clientes
  if (clientes.length > 0) {
    // Verificar se precisa de nova página
    if (yPos > 240) {
      doc.addPage()
      yPos = 20
    }

    doc.setFontSize(11)
    doc.setFont("helvetica", "bold")
    doc.text("Lista de Clientes", 14, yPos)
    yPos += 6

    const clientesData = (clientes as Record<string, unknown>[]).map((c) => [
      (c.nomeFantasia as string) || (c.razaoSocial as string),
      c.cnpj as string,
      `${c.cidade}, ${c.uf}`,
      c.telefone as string,
      String(c.totalEquipamentos),
      String(c.totalOrdensServico),
    ])

    autoTable(doc, {
      startY: yPos,
      head: [["Nome", "CNPJ", "Cidade/UF", "Telefone", "Equip.", "OS"]],
      body: clientesData,
      theme: "striped",
      headStyles: { fillColor: [34, 197, 94] },
      margin: { left: 14, right: 14 },
      styles: { fontSize: 8 },
    })

    yPos = docWithTable.lastAutoTable.finalY + 10
  }

  return yPos
}

function gerarPDFEquipamentos(doc: jsPDF, dados: { resumo: Record<string, unknown>; equipamentos: unknown[] }, yPos: number, pageWidth: number): number {
  const { resumo, equipamentos } = dados
  const docWithTable = doc as jsPDFWithAutoTable

  // Verificar se precisa de nova página
  if (yPos > 240) {
    doc.addPage()
    yPos = 20
  }

  // Resumo
  doc.setFontSize(11)
  doc.setFont("helvetica", "bold")
  doc.text("Resumo", 14, yPos)
  yPos += 6

  const resumoData = [
    ["Total de Equipamentos", String(resumo.totalEquipamentos)],
    ["Ativos", String(resumo.ativos)],
    ["Inativos", String(resumo.inativos)],
    ["Total de OS Relacionadas", String(resumo.totalOrdensServico)],
  ]

  autoTable(doc, {
    startY: yPos,
    head: [["Métrica", "Valor"]],
    body: resumoData,
    theme: "grid",
    headStyles: { fillColor: [249, 115, 22] },
    margin: { left: 14, right: 14 },
  })

  yPos = docWithTable.lastAutoTable.finalY + 10

  // Por Tipo
  const porTipo = resumo.porTipo as Record<string, number>
  if (porTipo && Object.keys(porTipo).length > 0) {
    // Verificar se precisa de nova página
    if (yPos > 240) {
      doc.addPage()
      yPos = 20
    }

    doc.setFontSize(11)
    doc.setFont("helvetica", "bold")
    doc.text("Por Tipo de Equipamento", 14, yPos)
    yPos += 6

    const tipoData = Object.entries(porTipo).map(([tipo, qtd]) => [tipo, String(qtd)])

    autoTable(doc, {
      startY: yPos,
      head: [["Tipo", "Quantidade"]],
      body: tipoData,
      theme: "grid",
      headStyles: { fillColor: [249, 115, 22] },
      margin: { left: 14, right: 14 },
    })

    yPos = docWithTable.lastAutoTable.finalY + 10
  }

  // Tabela de Equipamentos
  if (equipamentos.length > 0) {
    // Verificar se precisa de nova página
    if (yPos > 240) {
      doc.addPage()
      yPos = 20
    }

    doc.setFontSize(11)
    doc.setFont("helvetica", "bold")
    doc.text("Lista de Equipamentos", 14, yPos)
    yPos += 6

    const equipData = (equipamentos as Record<string, unknown>[]).map((e) => [
      e.tipo as string,
      e.fabricante as string,
      e.modelo as string,
      e.numeroSerie as string,
      (e.cliente as Record<string, string>)?.nomeFantasia || "-",
      (e.ativo as boolean) ? "Ativo" : "Inativo",
    ])

    autoTable(doc, {
      startY: yPos,
      head: [["Tipo", "Fabricante", "Modelo", "N Série", "Cliente", "Status"]],
      body: equipData,
      theme: "striped",
      headStyles: { fillColor: [249, 115, 22] },
      margin: { left: 14, right: 14 },
      styles: { fontSize: 8 },
    })

    yPos = docWithTable.lastAutoTable.finalY + 10
  }

  return yPos
}

function gerarPDFSolicitacoes(doc: jsPDF, dados: { resumo: Record<string, unknown>; solicitacoes: unknown[] }, yPos: number, pageWidth: number): number {
  const { resumo, solicitacoes } = dados
  const docWithTable = doc as jsPDFWithAutoTable

  // Verificar se precisa de nova página
  if (yPos > 240) {
    doc.addPage()
    yPos = 20
  }

  // Resumo
  doc.setFontSize(11)
  doc.setFont("helvetica", "bold")
  doc.text("Resumo", 14, yPos)
  yPos += 6

  const porStatus = resumo.porStatus as Record<string, number>
  const resumoData = [
    ["Total de Solicitações", String(resumo.totalSolicitacoes)],
    ["Recebidas", String(porStatus?.recebida || 0)],
    ["Em Progresso", String(porStatus?.em_progresso || 0)],
    ["Finalizadas", String(porStatus?.finalizada || 0)],
    ["Canceladas", String(porStatus?.cancelada || 0)],
    ["Com OS Gerada", String(resumo.comOrdemServico)],
    ["Sem OS", String(resumo.semOrdemServico)],
  ]

  autoTable(doc, {
    startY: yPos,
    head: [["Métrica", "Valor"]],
    body: resumoData,
    theme: "grid",
    headStyles: { fillColor: [245, 158, 11] },
    margin: { left: 14, right: 14 },
  })

  yPos = docWithTable.lastAutoTable.finalY + 10

  // Tabela de Solicitações
  if (solicitacoes.length > 0) {
    // Verificar se precisa de nova página
    if (yPos > 240) {
      doc.addPage()
      yPos = 20
    }

    doc.setFontSize(11)
    doc.setFont("helvetica", "bold")
    doc.text("Lista de Solicitações", 14, yPos)
    yPos += 6

    const solData = (solicitacoes as Record<string, unknown>[]).map((s) => [
      s.protocolo as string,
      s.status as string,
      s.nomeEmpresa as string,
      s.tipoEquipamento as string,
      s.urgencia as string,
      new Date(s.createdAt as string).toLocaleDateString("pt-BR"),
    ])

    autoTable(doc, {
      startY: yPos,
      head: [["Protocolo", "Status", "Empresa", "Equipamento", "Urgência", "Data"]],
      body: solData,
      theme: "striped",
      headStyles: { fillColor: [245, 158, 11] },
      margin: { left: 14, right: 14 },
      styles: { fontSize: 8 },
    })

    yPos = docWithTable.lastAutoTable.finalY + 10
  }

  return yPos
}

function gerarPDFTecnico(doc: jsPDF, dados: { resumo: Record<string, unknown>; tecnicos: unknown[] }, yPos: number, pageWidth: number, nomeTecnico?: string): number {
  const { resumo, tecnicos } = dados
  const docWithTable = doc as jsPDFWithAutoTable

  // Verificar se precisa de nova página
  if (yPos > 240) {
    doc.addPage()
    yPos = 20
  }

  // Título específico
  if (nomeTecnico) {
    doc.setFontSize(10)
    doc.setFont("helvetica", "italic")
    doc.text(`Técnico: ${nomeTecnico}`, 14, yPos)
    yPos += 8
  }

  // Resumo Geral
  doc.setFontSize(11)
  doc.setFont("helvetica", "bold")
  doc.text("Resumo Geral", 14, yPos)
  yPos += 6

  const resumoData = [
    ["Total de Técnicos", String(resumo.totalTecnicos)],
    ["Total de OS", String(resumo.totalOrdensServico)],
    ["Total de Solicitações", String(resumo.totalSolicitacoes)],
    ["Média de OS por Técnico", String(resumo.mediaOSPorTecnico)],
  ]

  autoTable(doc, {
    startY: yPos,
    head: [["Métrica", "Valor"]],
    body: resumoData,
    theme: "grid",
    headStyles: { fillColor: [20, 184, 166] },
    margin: { left: 14, right: 14 },
  })

  yPos = docWithTable.lastAutoTable.finalY + 10

  // Detalhamento por Técnico
  ;(tecnicos as Record<string, unknown>[]).forEach((tecnico) => {
    // Verificar se precisa de nova página
    if (yPos > 230) {
      doc.addPage()
      yPos = 20
    }

    doc.setFontSize(10)
    doc.setFont("helvetica", "bold")
    doc.text(`${tecnico.nome} (${(tecnico.cargo as string) === "admin" ? "Admin" : "Técnico"})`, 14, yPos)
    yPos += 5

    const res = tecnico.resumo as Record<string, unknown>
    const tecResumo = [
      ["Total OS", String(res.totalOS)],
      ["OS Finalizadas", String(res.osFinalizadas)],
      ["OS Fechadas", String(res.osFechadas)],
      ["OS em Rascunho", String(res.osRascunho)],
      ["Horas Trabalhadas", `${res.totalHorasTrabalhadas}h`],
      ["Solicitações Atendidas", String(res.solicitacoesAtendidas)],
    ]

    autoTable(doc, {
      startY: yPos,
      body: tecResumo,
      theme: "plain",
      margin: { left: 14, right: 14 },
      styles: { fontSize: 8 },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 45 },
      },
    })

    yPos = docWithTable.lastAutoTable.finalY + 3

    // OS do técnico
    const osLista = tecnico.ordensServico as Record<string, unknown>[]
    if (osLista.length > 0) {
      const osData = osLista.slice(0, 10).map((os) => [
        os.numero as string,
        os.status as string,
        (os.cliente as Record<string, string>)?.nomeFantasia || "-",
        `${os.totalHoras}h`,
        new Date(os.createdAt as string).toLocaleDateString("pt-BR"),
      ])

      autoTable(doc, {
        startY: yPos,
        head: [["OS", "Status", "Cliente", "Horas", "Data"]],
        body: osData,
        theme: "striped",
        headStyles: { fillColor: [20, 184, 166] },
        margin: { left: 14, right: 14 },
        styles: { fontSize: 8 },
      })

      yPos = docWithTable.lastAutoTable.finalY + 3

      if (osLista.length > 10) {
        doc.setFontSize(8)
        doc.setTextColor(100)
        doc.text(`... e mais ${osLista.length - 10} OS`, 14, yPos)
        doc.setTextColor(0)
        yPos += 3
      }
    }

    yPos += 8
  })

  return yPos
}
