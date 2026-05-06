"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { getOrdemServico, saveOrdemServico, type OrdemServico } from "@/lib/storage"
import { useAuth } from "@/components/auth-provider"
import { ArrowLeft, Download, CheckCircle, Loader2, Pencil, Link2, Mail, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { gerarIdUnico, type ImagemWebhook } from "@/lib/webhook"
import { enviarParaDrive } from "@/lib/webhook-drive"
import { baixarPdfOS } from "@/lib/pdf-generator"
import { EmailModal } from "@/components/email-modal"

export default function VisualizarOSPage() {
  const params = useParams()
  const id = params?.id as string
  const router = useRouter()
  const { toast } = useToast()
  const { usuario } = useAuth()
  const [os, setOs] = useState<OrdemServico | null>(null)
  const [loading, setLoading] = useState(true)
  const [baixandoPdf, setBaixandoPdf] = useState(false)
  const [isFinalizando, setIsFinalizando] = useState(false)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)

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

    setBaixandoPdf(true)
    try {
      await baixarPdfOS(os)
      toast({
        title: "Download iniciado",
        description: "O PDF da OS esta sendo baixado.",
      })
    } catch (error) {
      console.error("Erro ao baixar PDF:", error)
      toast({
        title: "Erro",
        description: "Erro ao gerar o PDF. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setBaixandoPdf(false)
    }
  }

  const handleSendEmail = async (data: { destinatarios: string[]; assunto: string; os: OrdemServico }) => {
    setSendingEmail(true)
    try {
      // Aqui você pode implementar a lógica de envio de email
      // Por enquanto, apenas simula o envio
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast({
        title: "Email enviado",
        description: `Email enviado para ${data.destinatarios.length} destinatario(s).`,
      })
      setShowEmailModal(false)
    } catch (error) {
      console.error("Erro ao enviar email:", error)
      toast({
        title: "Erro",
        description: "Erro ao enviar email. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setSendingEmail(false)
    }
  }

  const handleFinalizar = async () => {
    if (!os) return
    setIsFinalizando(true)
    try {
      const imagensWebhook: ImagemWebhook[] = (os.midias?.arquivos || [])
        .filter((arq) => arq && arq.startsWith("data:image/"))
        .map((arq, index) => {
          const base64 = arq.split(",")[1] || ""
          return {
            nome: `foto-${index + 1}.jpg`,
            tipo: "image/jpeg",
            tamanho: Math.round((base64.length * 3) / 4),
            base64,
          }
        })

      const idUnico = os.idUnico || gerarIdUnico()
      const osAtualizada: OrdemServico = {
        ...os,
        idUnico,
        status: "finalizada",
        finalizedAt: new Date().toISOString(),
      }

      // Busca configuração para verificar se deve enviar ao Drive
      let enviarDrive = true
      try {
        const configRes = await fetch("/api/config", { credentials: "include" })
        if (configRes.ok) {
          const config = await configRes.json()
          enviarDrive = config.armazenarNoDrive ?? true
        }
      } catch {
        // Se falhar, assume que deve enviar
      }

      // Envia para o webhook do Drive se a opção estiver ativada
      let sucessoDrive = true
      if (enviarDrive) {
        sucessoDrive = await enviarParaDrive(osAtualizada, imagensWebhook)
      }

      await saveOrdemServico({ ...osAtualizada }, usuario ? {
        id: usuario.id,
        nome: usuario.nome,
        departamentos: usuario.departamentos
      } : undefined)
      setOs(osAtualizada)

      if (enviarDrive && sucessoDrive) {
        toast({
          title: "OS Finalizada",
          description: "Ordem de serviço finalizada e armazenada no Drive com sucesso!",
        })
      } else if (enviarDrive && !sucessoDrive) {
        toast({
          title: "Aviso",
          description: "OS finalizada, mas houve um erro ao enviar para o Drive.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "OS Finalizada",
          description: "Ordem de serviço finalizada com sucesso!",
        })
      }
    } catch (error) {
      console.error("Erro ao finalizar OS:", error)
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao finalizar a OS. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsFinalizando(false)
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
                <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">{os.numero}</h1>
                <Badge
                  variant="default"
                  className={
                    os.status === "finalizada"
                      ? "bg-green-600"
                      : os.status === "fechada"
                        ? "bg-amber-500"
                        : "bg-orange-600"
                  }
                >
                  {os.status === "finalizada" ? "Finalizada" : os.status === "fechada" ? "Fechada" : "Rascunho"}
                </Badge>
              </div>
              {os.finalizedAt && (
                <p className="text-muted-foreground mt-1 text-sm sm:text-base">
                  {os.status === "finalizada" ? "Finalizada" : "Fechada"} em{" "}
                  {new Date(os.finalizedAt).toLocaleDateString("pt-BR")}
                </p>
              )}
              {os.solicitacaoProtocolo && (
                <div className="flex items-center gap-1.5 mt-1">
                  <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Solicitação:</span>
                  {os.solicitacaoId ? (
                    <Link
                      href={`/solicitacoes/${os.solicitacaoId}`}
                      className="text-sm font-mono font-medium text-primary hover:underline"
                    >
                      {os.solicitacaoProtocolo}
                    </Link>
                  ) : (
                    <span className="text-sm font-mono font-medium">{os.solicitacaoProtocolo}</span>
                  )}
                </div>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">              
              {os.status === "fechada" && (
                <>
                  <Button asChild variant="outline" className="w-full sm:w-auto bg-transparent">
                    <Link href={`/os/${os.id}/etapa/1`}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Reabrir OS
                    </Link>
                  </Button>
                  <Button
                    onClick={handleFinalizar}
                    disabled={isFinalizando}
                    className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
                  >
                    {isFinalizando ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Finalizando...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Finalizar OS
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Email Modal */}
        <EmailModal
          open={showEmailModal}
          onOpenChange={setShowEmailModal}
          os={os}
          onSend={handleSendEmail}
          sending={sendingEmail}
        />

        <div className="space-y-6">
          {/* Dados da Empresa */}
          <Card>
            <CardHeader>
              <CardTitle>1. Dados da Empresa</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Nome Fantasia</div>
                <div className="font-medium">{os.empresa.nomeFantasia || "-"}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">CNPJ</div>
                <div className="font-medium">{os.empresa.cnpj || "-"}</div>
              </div>
              <div className="md:col-span-2">
                <div className="text-sm text-muted-foreground">Endereço</div>
                <div className="font-medium">{os.empresa.cidade || "-"}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Telefone</div>
                <div className="font-medium">{os.empresa.telefone || "-"}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Email(s)</div>
                <div className="font-medium">
                  {os.empresa.email || "-"}
                  {os.empresa.emails && os.empresa.emails.length > 0 && (
                    <div className="text-sm text-muted-foreground mt-1">
                      Emails adicionais: {os.empresa.emails.join(", ")}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dados do Cliente e Equipamento */}
          <Card>
            <CardHeader>
              <CardTitle>2.Equipamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>                 
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
              <CardTitle>5. Pecas Utilizadas</CardTitle>
            </CardHeader>
            <CardContent>
              {os.pecas.length === 0 ? (
                <div className="text-muted-foreground">Nenhuma peca utilizada</div>
              ) : (
                <div className="space-y-6">
                  {/* Peças Removidas */}
                  {os.pecas.filter((p) => !p.tipo || p.tipo === "removida").length > 0 && (
                    <div>
                      <h4 className="font-semibold text-base mb-3">Pecas Removidas</h4>
                      <div className="space-y-2">
                        {os.pecas
                          .filter((p) => !p.tipo || p.tipo === "removida")
                          .map((peca) => (
                            <div key={peca.id} className="flex justify-between items-center p-3 border rounded-lg">
                              <div>
                                <div className="font-medium">{peca.nome || peca.descricao}</div>
                                {peca.modeloRef && (
                                  <div className="text-sm text-muted-foreground">Modelo/Ref: {peca.modeloRef}</div>
                                )}
                                {peca.numeroSerie && (
                                  <div className="text-sm text-muted-foreground">N Serie: {peca.numeroSerie}</div>
                                )}
                                {peca.observacoes && (
                                  <div className="text-sm text-muted-foreground">Obs: {peca.observacoes}</div>
                                )}
                                <div className="text-sm text-muted-foreground">
                                  Quantidade: {peca.quantidade} | Posse:{" "}
                                  {peca.categoria === "medical-spin" ? "Medical Spin" : "Cliente"}
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Peças Inclusas */}
                  {os.pecas.filter((p) => p.tipo === "inclusa").length > 0 && (
                    <div>
                      <h4 className="font-semibold text-base mb-3">Pecas Inclusas</h4>
                      <div className="space-y-2">
                        {os.pecas
                          .filter((p) => p.tipo === "inclusa")
                          .map((peca) => (
                            <div key={peca.id} className="flex justify-between items-center p-3 border rounded-lg">
                              <div>
                                <div className="font-medium">{peca.nome || peca.descricao}</div>
                                {peca.modeloRef && (
                                  <div className="text-sm text-muted-foreground">Modelo/Ref: {peca.modeloRef}</div>
                                )}
                                {peca.numeroSerie && (
                                  <div className="text-sm text-muted-foreground">N Serie: {peca.numeroSerie}</div>
                                )}
                                {peca.observacoes && (
                                  <div className="text-sm text-muted-foreground">Obs: {peca.observacoes}</div>
                                )}
                                <div className="text-sm text-muted-foreground">
                                  Quantidade: {peca.quantidade} | Posse:{" "}
                                  {peca.categoria === "medical-spin" ? "Medical Spin" : "Cliente"}
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  <Separator className="my-4" />
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total de Pecas:</span>
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
                        <div className="text-sm text-muted-foreground">
                          {new Date(servico.data).toLocaleDateString("pt-BR")} - Horas: {servico.horas}h
                        </div>
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
                  <div className="font-medium">{os.finalizacao.nomeEngenheiro || "Julio Cesar"}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">CFT do Engenheiro</div>
                  <div className="font-medium">{os.finalizacao.cftEngenheiro || "2000103820"}</div>
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Nome do Recebedor</div>
                <div className="font-medium">{os.cliente?.responsavel || ""}</div>
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
