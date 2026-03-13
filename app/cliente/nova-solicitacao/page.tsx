"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FABRICANTES, MODELOS } from "@/lib/constants"
import { Send, CheckCircle, AlertTriangle, Wrench, MessageSquare, ArrowLeft, Loader2, ImageIcon, X, Video, Check } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { converterParaJPG, isImageFile, isVideoFile, converterVideoParaBase64 } from "@/lib/webhook"

interface MidiaArmazenada {
  nome: string
  preview: string
  base64: string
  tamanho: number
  tipo: "imagem" | "video"
  mimeType?: string
}

interface EquipamentoCliente {
  id: string
  clienteId: string
  tipo: string
  fabricante: string
  modelo: string
  numeroSerie: string
}

interface ClientePerfil {
  id: string
  razaoSocial: string
  nomeFantasia: string
  cnpj: string
  cidade: string
  uf: string
  telefone: string
  email: string
  responsavel: string
}

export default function NovaSolicitacaoCliente() {
  const router = useRouter()
  const { toast } = useToast()
  const [step, setStep] = useState<"form" | "success">("form")
  const [protocolo, setProtocolo] = useState("")
  const [loading, setLoading] = useState(false)
  const [loadingPerfil, setLoadingPerfil] = useState(true)
  const [error, setError] = useState("")
  const [perfil, setPerfil] = useState<ClientePerfil | null>(null)

  const [midias, setMidias] = useState<MidiaArmazenada[]>([])
  const [isUploading, setIsUploading] = useState(false)

  // Estado de equipamentos
  const [equipamentos, setEquipamentos] = useState<EquipamentoCliente[]>([])
  const [loadingEquipamentos, setLoadingEquipamentos] = useState(true)
  const [equipamentoSelecionadoId, setEquipamentoSelecionadoId] = useState<string>("")

  const [form, setForm] = useState({
    tipoEquipamento: "",
    fabricante: "",
    modelo: "",
    numeroSerie: "",
    descricaoProblema: "",
    nomeContato: "",
    telefone: "",
    email: "",
  })

  useEffect(() => {
    async function fetchData() {
      try {
        // Buscar perfil e equipamentos em paralelo
        const [perfilRes, equipRes] = await Promise.all([
          fetch("/api/cliente/perfil", { credentials: "include" }),
          fetch("/api/cliente/equipamentos", { credentials: "include" }),
        ])

        if (perfilRes.ok) {
          const data = await perfilRes.json()
          setPerfil(data)
          setForm((prev) => ({
            ...prev,
            nomeContato: data.responsavel || "",
            telefone: data.telefone || "",
            email: data.email || "",
          }))
        }

        if (equipRes.ok) {
          const equipData: EquipamentoCliente[] = await equipRes.json()
          setEquipamentos(equipData)

          // Se tem equipamentos, selecionar o primeiro automaticamente
          if (equipData.length > 0) {
            const primeiro = equipData[0]
            setEquipamentoSelecionadoId(primeiro.id)
            setForm((prev) => ({
              ...prev,
              tipoEquipamento: primeiro.tipo,
              fabricante: primeiro.fabricante,
              modelo: primeiro.modelo,
              numeroSerie: primeiro.numeroSerie || "",
            }))
          }
        }
      } catch (error) {
        console.error("Erro ao buscar dados:", error)
      } finally {
        setLoadingPerfil(false)
        setLoadingEquipamentos(false)
      }
    }
    fetchData()
  }, [])

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setError("")
  }

  function selecionarEquipamento(equipId: string) {
    const equip = equipamentos.find((e) => e.id === equipId)
    if (equip) {
      setEquipamentoSelecionadoId(equipId)
      setForm((prev) => ({
        ...prev,
        tipoEquipamento: equip.tipo,
        fabricante: equip.fabricante,
        modelo: equip.modelo,
        numeroSerie: equip.numeroSerie || "",
      }))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    const required = [
      { field: "tipoEquipamento", label: "Tipo de Equipamento" },
      { field: "fabricante", label: "Fabricante" },
      { field: "modelo", label: "Modelo" },
      { field: "descricaoProblema", label: "Descrição do Problema" },
    ]

    for (const { field, label } of required) {
      if (!form[field as keyof typeof form] || form[field as keyof typeof form].trim() === "") {
        setError(`O campo "${label}" e obrigatorio.`)
        return
      }
    }

    setLoading(true)
    try {
      // Separar imagens e videos
      const imagens = midias.filter((m) => m.tipo === "imagem").map((m) => m.preview)
      const videos = midias.filter((m) => m.tipo === "video").map((m) => m.preview)

      const res = await fetch("/api/cliente/solicitacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...form,
          midias: { imagens, videos },
        }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Erro ao enviar solicitacao")
      }

      const data = await res.json()
      setProtocolo(data.protocolo)
      setStep("success")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar solicitacao.")
    } finally {
      setLoading(false)
    }
  }

  if (step === "success") {
    return (
      <div className="container mx-auto px-4 py-8 max-w-lg">
        <Card>
          <CardHeader className="text-center pb-4">
            <div className="mx-auto p-3 bg-green-100 dark:bg-green-900/30 rounded-full w-fit mb-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-xl">Solicitacao Enviada</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Sua solicitacao foi registrada com sucesso.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg text-center">
              <p className="text-sm text-muted-foreground mb-1">Seu protocolo</p>
              <p className="text-2xl font-bold font-mono tracking-wider text-foreground">{protocolo}</p>
            </div>
            <p className="text-sm text-muted-foreground text-center leading-relaxed">
              Voce pode acompanhar o andamento da sua solicitacao no painel principal.
            </p>
            <div className="flex flex-col gap-2">
              <Button asChild className="w-full">
                <Link href="/cliente">Ver Minhas Solicitacoes</Link>
              </Button>
              <Button
                variant="outline"
                className="w-full bg-transparent"
                onClick={() => {
                  setStep("form")
                  setProtocolo("")
                  setMidias([])
                  if (equipamentos.length > 0) {
                    const primeiro = equipamentos[0]
                    setEquipamentoSelecionadoId(primeiro.id)
                    setForm({
                      tipoEquipamento: primeiro.tipo,
                      fabricante: primeiro.fabricante,
                      modelo: primeiro.modelo,
                      numeroSerie: primeiro.numeroSerie || "",
                      descricaoProblema: "",
                      nomeContato: perfil?.responsavel || "",
                      telefone: perfil?.telefone || "",
                      email: perfil?.email || "",
                    })
                  } else {
                    setEquipamentoSelecionadoId("")
                    setForm({
                      tipoEquipamento: "",
                      fabricante: "",
                      modelo: "",
                      numeroSerie: "",
                      descricaoProblema: "",
                      nomeContato: perfil?.responsavel || "",
                      telefone: perfil?.telefone || "",
                      email: perfil?.email || "",
                    })
                  }
                }}
              >
                Nova Solicitacao
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl">
      <div className="mb-6">
        <Button asChild variant="ghost" size="sm" className="mb-2">
          <Link href="/cliente">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Link>
        </Button>
        <h2 className="text-xl md:text-2xl font-bold text-foreground text-balance">Nova Solicitacao de Servico</h2>
        {perfil && (
          <p className="text-sm text-muted-foreground mt-1">
            Solicitando para: <span className="font-medium">{perfil.razaoSocial}</span> ({perfil.cnpj})
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Equipamento */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Equipamento</CardTitle>
            </div>
            {equipamentos.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Selecione um dos equipamentos cadastrados.
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingEquipamentos ? (
              <div className="flex items-center gap-2 text-muted-foreground text-sm py-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando equipamentos...
              </div>
            ) : equipamentos.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">
                Nenhum equipamento cadastrado. Entre em contato com o suporte para cadastrar seus equipamentos.
              </p>
            ) : (
              <div className="space-y-3">
                <Label>Selecione o equipamento *</Label>
                <div className="grid gap-2">
                  {equipamentos.map((equip) => (
                    <div
                      key={equip.id}
                      onClick={() => selecionarEquipamento(equip.id)}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        equipamentoSelecionadoId === equip.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50 hover:bg-muted/50"
                      }`}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault()
                          selecionarEquipamento(equip.id)
                        }
                      }}
                    >
                      <div className={`flex items-center justify-center h-5 w-5 rounded-full border-2 shrink-0 ${
                        equipamentoSelecionadoId === equip.id
                          ? "border-primary bg-primary"
                          : "border-muted-foreground/30"
                      }`}>
                        {equipamentoSelecionadoId === equip.id && (
                          <Check className="h-3 w-3 text-primary-foreground" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">{equip.tipo}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {equip.fabricante} - {equip.modelo}
                          {equip.numeroSerie ? ` | N/S: ${equip.numeroSerie}` : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Descricao */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Descrição do Problema</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="descricaoProblema">Descreva o problema ou motivo do servico *</Label>
              <Textarea
                id="descricaoProblema"
                placeholder="Descreva detalhadamente o problema que esta enfrentando com o equipamento..."
                rows={5}
                value={form.descricaoProblema}
                onChange={(e) => updateField("descricaoProblema", e.target.value)}
              />
            </div>

          </CardContent>
        </Card>

        {/* Fotos e Videos */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Fotos e Videos</CardTitle>
            </div>
            <p className="text-xs text-muted-foreground">
              Anexe fotos ou videos do problema para auxiliar o diagnostico. (Opcional)
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="midias">Arquivos ({midias.length})</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="midias"
                  type="file"
                  multiple
                  accept="image/*,video/*,.heic,.heif"
                  onChange={async (e) => {
                    const files = e.target.files
                    if (!files || files.length === 0) return

                    const arquivosValidos = Array.from(files).filter((file) => {
                      if (!isImageFile(file) && !isVideoFile(file)) {
                        toast({
                          title: "Arquivo nao permitido",
                          description: `"${file.name}" nao e uma imagem ou video valido.`,
                          variant: "destructive",
                        })
                        return false
                      }
                      // Limite de 50MB por video
                      if (isVideoFile(file) && file.size > 50 * 1024 * 1024) {
                        toast({
                          title: "Video muito grande",
                          description: `"${file.name}" excede o limite de 50MB.`,
                          variant: "destructive",
                        })
                        return false
                      }
                      return true
                    })

                    if (arquivosValidos.length === 0) return

                    setIsUploading(true)

                    try {
                      const novasMidias: MidiaArmazenada[] = []

                      for (const file of arquivosValidos) {
                        if (isImageFile(file)) {
                          const resultado = await converterParaJPG(file)
                          novasMidias.push({
                            nome: resultado.nome,
                            preview: `data:image/jpeg;base64,${resultado.base64}`,
                            base64: resultado.base64,
                            tamanho: resultado.tamanho,
                            tipo: "imagem",
                          })
                        } else if (isVideoFile(file)) {
                          const resultado = await converterVideoParaBase64(file)
                          novasMidias.push({
                            nome: resultado.nome,
                            preview: `data:${resultado.tipo};base64,${resultado.base64}`,
                            base64: resultado.base64,
                            tamanho: resultado.tamanho,
                            tipo: "video",
                            mimeType: resultado.tipo,
                          })
                        }
                      }

                      setMidias((prev) => [...prev, ...novasMidias])

                      const numImagens = novasMidias.filter((m) => m.tipo === "imagem").length
                      const numVideos = novasMidias.filter((m) => m.tipo === "video").length
                      const parts = []
                      if (numImagens > 0) parts.push(`${numImagens} imagem(ns)`)
                      if (numVideos > 0) parts.push(`${numVideos} video(s)`)

                      toast({
                        title: "Arquivos adicionados",
                        description: `${parts.join(" e ")} adicionado(s) com sucesso.`,
                      })
                    } catch (error) {
                      toast({
                        title: "Erro",
                        description: "Ocorreu um erro ao processar os arquivos.",
                        variant: "destructive",
                      })
                    } finally {
                      setIsUploading(false)
                      e.target.value = ""
                    }
                  }}
                  disabled={isUploading}
                  className="flex-1"
                />
                {isUploading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
              </div>
              <p className="text-xs text-muted-foreground">
                Imagens: JPG, PNG, WebP, HEIC. Videos: MP4, MOV, WebM (max 50MB).
              </p>
            </div>

            {midias.length > 0 && (
              <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {midias.map((midia, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square border rounded-lg overflow-hidden bg-muted">
                      {midia.tipo === "imagem" ? (
                        <img
                          src={midia.preview || "/placeholder.svg"}
                          alt={midia.nome}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-muted">
                          <Video className="h-8 w-8 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground text-center px-2 truncate max-w-full">
                            {midia.nome}
                          </span>
                        </div>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => setMidias((prev) => prev.filter((_, i) => i !== index))}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                    <div className="flex items-center gap-1 mt-1">
                      {midia.tipo === "video" && <Video className="h-3 w-3 text-muted-foreground shrink-0" />}
                      <p className="text-xs text-muted-foreground truncate" title={midia.nome}>
                        {midia.nome}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Submit */}
        <div className="flex flex-col gap-3 md:flex-row md:justify-end">
          <Button type="submit" disabled={loading || loadingPerfil} className="md:min-w-[200px]">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Enviar Solicitacao
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
