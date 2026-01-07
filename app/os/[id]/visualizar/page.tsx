"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { AppHeader } from "@/components/layout/app-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { getOrdemServico, type OrdemServico } from "@/lib/storage"
import { ArrowLeft, Download, CheckCircle, AlertCircle, Loader2, Copy, ExternalLink } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

export default function VisualizarOSPage() {
  const params = useParams()
  const id = params?.id as string
  const router = useRouter()
  const { toast } = useToast()
  const [os, setOs] = useState<OrdemServico | null>(null)
  const [loading, setLoading] = useState(true)
  const [buscandoLink, setBuscandoLink] = useState(false)
  const [linkDownload, setLinkDownload] = useState<string | null>(null)
  const [showLinkDialog, setShowLinkDialog] = useState(false)
  const [erroLink, setErroLink] = useState<string | null>(null)

  useEffect(() => {
    async function loadOS() {
      try {
        const osData = await getOrdemServico(id)
        if (!osData) {
          toast({
            title: "Erro",
            description: "Ordem de Serviço não encontrada",
            variant: "destructive",
          })
          router.push("/")
          return
        }
        setOs(osData)
      } catch (error) {
        console.error("Erro ao carregar OS:", error)
        toast({
          title: "Erro",
          description: "Falha ao carregar a Ordem de Serviço",
          variant: "destructive",
        })
        router.push("/")
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      loadOS()
    }
  }, [id, router, toast])

  const handleBaixar = async () => {
    if (!os) return

    setBuscandoLink(true)
    setErroLink(null)
    setLinkDownload(null)

    try {
      const url =
        "https://docs.google.com/spreadsheets/d/1mZ4GlKIZieM_yz-CBjwNk4_8K62w45ez4BDTe-4e1e0/gviz/tq?gid=824063472&tqx=out:json&tq=SELECT%20*"

      const response = await fetch(url)
      const text = await response.text()

      // A resposta vem no formato: /*O_o*/google.visualization.Query.setResponse({...});
      // Removemos o prefixo e pegamos apenas o JSON
      const startIndex = text.indexOf("(")
      const endIndex = text.lastIndexOf(")")

      if (startIndex === -1 || endIndex === -1 || startIndex >= endIndex) {
        console.error("[v0] Formato de resposta inválido. Resposta:", text.substring(0, 200))
        throw new Error("Formato de resposta inválido")
      }

      const jsonText = text.substring(startIndex + 1, endIndex)
      const data = JSON.parse(jsonText)

      // Procura pela linha que contém o nome da OS
      const rows = data.table?.rows || []
      let linkEncontrado: string | null = null

      const nomeOS = os.nome || os.numero
      console.log("[v0] Buscando OS com nome:", nomeOS, "ou número:", os.numero)

      for (const row of rows) {
        const cells = row.c || []
        // Verifica cada célula para encontrar o nome da OS
        let encontrouOS = false
        for (let i = 0; i < cells.length; i++) {
          const cellValue = cells[i]?.v
          if (cellValue && typeof cellValue === "string") {
            // Verifica se o nome da OS está na célula (compara com numero ou nome gerado)
            if (cellValue.includes(os.numero) || (nomeOS && cellValue.includes(nomeOS))) {
              encontrouOS = true
              console.log("[v0] Encontrou OS na célula:", cellValue)
              break
            }
          }
        }

        // Se encontrou a OS, procura o link na mesma linha
        if (encontrouOS) {
          for (const cell of cells) {
            const value = cell?.v
            if (value && typeof value === "string" && (value.startsWith("http://") || value.startsWith("https://"))) {
              linkEncontrado = value
              console.log("[v0] Link encontrado:", linkEncontrado)
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
      console.error("[v0] Erro ao buscar link:", error)
      setErroLink("Erro ao buscar link de download. Tente novamente.")
      setShowLinkDialog(true)
    } finally {
      setBuscandoLink(false)
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

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30">
        <main className="container mx-auto px-4 py-8 max-w-5xl">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </main>
      </div>
    )
  }

  if (!os) return null

  return (
    <div className="min-h-screen bg-muted/30">
      <AppHeader />

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-6 no-print">
          <Button asChild variant="ghost" size="sm" className="mb-4">
            <Link href="/historico">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Histórico
            </Link>
          </Button>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">OS {os.numero}</h1>
                <Badge variant="default" className={os.status === "finalizada" ? "bg-green-600" : "bg-orange-600"}>
                  {os.status === "finalizada" ? "Finalizada" : "Rascunho"}
                </Badge>
              </div>
              {os.finalizedAt && (
                <p className="text-muted-foreground mt-1 text-sm sm:text-base">
                  Finalizada em {new Date(os.finalizedAt).toLocaleDateString("pt-BR")}
                </p>
              )}
            </div>
            <Button
              onClick={handleBaixar}
              variant="outline"
              disabled={buscandoLink}
              className="w-full sm:w-auto bg-transparent"
            >
              {buscandoLink ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
              {buscandoLink ? "Buscando..." : "Baixar"}
            </Button>
          </div>
        </div>

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
                    <Button
                      onClick={handleCopiarLink}
                      variant="outline"
                      size="icon"
                      className="shrink-0 bg-transparent"
                    >
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

        <div className="space-y-6">
          {/* Dados da Empresa */}
          <Card>
            <CardHeader>
              <CardTitle>1. Dados da Empresa</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Nome da Empresa</div>
                <div className="font-medium">{os.empresa.nome || "-"}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">CNPJ</div>
                <div className="font-medium">{os.empresa.cnpj || "-"}</div>
              </div>
              <div className="md:col-span-2">
                <div className="text-sm text-muted-foreground">Endereço</div>
                <div className="font-medium">{os.empresa.endereco || "-"}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Telefone</div>
                <div className="font-medium">{os.empresa.telefone || "-"}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Email</div>
                <div className="font-medium">{os.empresa.email || "-"}</div>
              </div>
            </CardContent>
          </Card>

          {/* Dados do Cliente e Equipamento */}
          <Card>
            <CardHeader>
              <CardTitle>2. Cliente e Equipamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <CardDescription className="mb-2">Cliente</CardDescription>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Razão Social</div>
                      <div className="font-medium">{os.cliente?.razaoSocial || "-"}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Nome Fantasia</div>
                      <div className="font-medium">{os.cliente?.nomeFantasia || "-"}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">CNPJ</div>
                      <div className="font-medium">{os.cliente?.cnpj || "-"}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Responsável</div>
                      <div className="font-medium">{os.cliente?.responsavel || "-"}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Telefone</div>
                      <div className="font-medium">{os.cliente?.telefone || "-"}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Email</div>
                      <div className="font-medium">{os.cliente?.email || "-"}</div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <CardDescription className="mb-2">Equipamento</CardDescription>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Tipo</div>
                      <div className="font-medium">{os.equipamento?.tipo || "-"}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Fabricante/Modelo</div>
                      <div className="font-medium">
                        {os.equipamento?.fabricante} {os.equipamento?.modelo || "-"}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Número de Série</div>
                      <div className="font-medium">{os.equipamento?.numeroSerie || "-"}</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Motivo e Eventos */}
          <Card>
            <CardHeader>
              <CardTitle>3. Motivo e Eventos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">Motivação do Serviço</div>
                <div className="font-medium whitespace-pre-wrap">{os.motivo.motivacaoServico || "-"}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Eventos Relevantes</div>
                <div className="font-medium whitespace-pre-wrap">{os.motivo.eventosRelevantes || "-"}</div>
              </div>
            </CardContent>
          </Card>

          {/* Intervenção */}
          <Card>
            <CardHeader>
              <CardTitle>4. Tipo de Intervenção</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground mb-2">Tipo de Intervenção</div>
                <Badge variant="secondary">{os.intervencao.tipo || "-"}</Badge>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Descrição dos Serviços Realizados</div>
                <div className="font-medium whitespace-pre-wrap">{os.intervencao.descricaoServicos || "-"}</div>
              </div>
            </CardContent>
          </Card>

          {/* Peças Utilizadas */}
          <Card>
            <CardHeader>
              <CardTitle>5. Peças Utilizadas</CardTitle>
            </CardHeader>
            <CardContent>
              {os.pecas.length === 0 ? (
                <div className="text-muted-foreground">Nenhuma peça utilizada</div>
              ) : (
                <div className="space-y-2">
                  {os.pecas.map((peca) => (
                    <div key={peca.id} className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{peca.nome || peca.descricao}</div>
                        {peca.modeloRef && (
                          <div className="text-sm text-muted-foreground">Modelo/Ref: {peca.modeloRef}</div>
                        )}
                        {peca.numeroSerie && (
                          <div className="text-sm text-muted-foreground">Nº Série: {peca.numeroSerie}</div>
                        )}
                        {peca.observacoes && (
                          <div className="text-sm text-muted-foreground">Obs: {peca.observacoes}</div>
                        )}
                        <div className="text-sm text-muted-foreground">Quantidade: {peca.quantidade}</div>
                      </div>
                    </div>
                  ))}
                  <Separator className="my-4" />
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total de Peças:</span>
                    <span className="text-xl font-bold">{os.pecas.length}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Mão de Obra */}
          <Card>
            <CardHeader>
              <CardTitle>6. Mão de Obra</CardTitle>
            </CardHeader>
            <CardContent>
              {os.maoDeObra.length === 0 ? (
                <div className="text-muted-foreground">Nenhum serviço registrado</div>
              ) : (
                <div className="space-y-2">
                  {os.maoDeObra.map((servico) => (
                    <div key={servico.id} className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{servico.descricao}</div>
                        <div className="text-sm text-muted-foreground">Horas: {servico.horas}h</div>
                      </div>
                    </div>
                  ))}
                  <Separator className="my-4" />
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total de Serviços:</span>
                    <span className="text-xl font-bold">{os.maoDeObra.length}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pendências */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                7. Pendências
                {os.pendencias.medicalSpin || os.pendencias.cliente ? (
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {os.pendencias.medicalSpin || os.pendencias.cliente ? (
                <div className="space-y-4">
                  {os.pendencias.medicalSpin && (
                    <div>
                      <div className="text-sm text-muted-foreground">Pendências da Medical Spin</div>
                      <div className="font-medium whitespace-pre-wrap">{os.pendencias.medicalSpin}</div>
                    </div>
                  )}
                  {os.pendencias.cliente && (
                    <div>
                      <div className="text-sm text-muted-foreground">Pendências do Cliente</div>
                      <div className="font-medium whitespace-pre-wrap">{os.pendencias.cliente}</div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-green-600 font-medium">Nenhuma pendência registrada</div>
              )}
            </CardContent>
          </Card>

          {/* Estado do Equipamento */}
          <Card>
            <CardHeader>
              <CardTitle>8. Estado do Equipamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Estado Inicial</div>
                  <Badge
                    variant={
                      os.estadoEquipamento.estadoInicial === "Funcional"
                        ? "default"
                        : os.estadoEquipamento.estadoInicial === "Inoperante"
                          ? "destructive"
                          : "secondary"
                    }
                    className="mt-1"
                  >
                    {os.estadoEquipamento.estadoInicial || "-"}
                  </Badge>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Estado Final</div>
                  <Badge
                    variant={
                      os.estadoEquipamento.estadoFinal === "Funcional"
                        ? "default"
                        : os.estadoEquipamento.estadoFinal === "Inoperante"
                          ? "destructive"
                          : "secondary"
                    }
                    className="mt-1"
                  >
                    {os.estadoEquipamento.estadoFinal || "-"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Finalização */}
          <Card>
            <CardHeader>
              <CardTitle>9. Local e Assinaturas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Local de Execução</div>
                  <div className="font-medium">{os.finalizacao.localExecucao || "-"}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Data de Finalização</div>
                  <div className="font-medium">
                    {os.finalizacao.dataFinalizacao
                      ? new Date(os.finalizacao.dataFinalizacao).toLocaleDateString("pt-BR")
                      : "-"}
                  </div>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Cidade</div>
                  <div className="font-medium">{os.finalizacao.cidade || "-"}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">UF</div>
                  <div className="font-medium">{os.finalizacao.uf || "-"}</div>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Nome do Engenheiro</div>
                  <div className="font-medium">{os.finalizacao.nomeEngenheiro || "-"}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">CFT do Engenheiro</div>
                  <div className="font-medium">{os.finalizacao.cftEngenheiro || "-"}</div>
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Nome do Recebedor</div>
                <div className="font-medium">{os.finalizacao.nomeRecebedor || "-"}</div>
              </div>
              {os.finalizedAt && (
                <div>
                  <div className="text-sm text-muted-foreground">Data de Finalização</div>
                  <div className="font-medium">{new Date(os.finalizedAt).toLocaleDateString("pt-BR")}</div>
                </div>
              )}

              {os.midias?.arquivos && os.midias.arquivos.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <div className="text-sm text-muted-foreground mb-3">
                      Registro Fotográfico ({os.midias.arquivos.length} imagens)
                    </div>
                    <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                      {os.midias.arquivos.map((arquivo, index) => (
                        <div key={index} className="aspect-square border rounded-lg overflow-hidden bg-muted">
                          <img
                            src={arquivo || "/placeholder.svg"}
                            alt={`Foto ${index + 1}`}
                            className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => window.open(arquivo, "_blank")}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: white;
          }
        }
      `}</style>
    </div>
  )
}
