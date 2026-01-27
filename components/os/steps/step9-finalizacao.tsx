"use client"

import type React from "react"
import { useState, forwardRef, useImperativeHandle, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import type { OrdemServico } from "@/lib/storage"
import { CheckCircle, Save, X, ImageIcon, Loader2, Lock } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { enviarParaWebhook, converterParaJPG, isImageFile, type ImagemWebhook } from "@/lib/webhook"
import { useToast } from "@/hooks/use-toast"
import { areSteps1to8Complete } from "@/components/os/step-indicator"

const UFS = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
]

interface ImagemArmazenada {
  nome: string
  preview: string // base64 com prefixo para exibição
  base64: string // base64 sem prefixo para envio
  tamanho: number
}

export const Step9Finalizacao = forwardRef(function Step9Finalizacao(
  {
    os,
    onSave,
    onFinalizar,
    onFechar,
    onSaveDraft,
  }: {
    os: OrdemServico
    onSave: (data: Partial<OrdemServico>, goToNext?: boolean) => void
    onFinalizar: (data: Partial<OrdemServico>) => void
    onFechar?: (data: Partial<OrdemServico>) => void
    onSaveDraft?: () => void
  },
  ref,
) {
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    ...os.finalizacao,
    cidade: os.finalizacao.cidade || os.empresa.cidade || "",
    uf: os.finalizacao.uf || os.empresa.uf || "",
    responsavel: os.finalizacao.responsavel|| os.empresa.responsavel || "",
  })
  const [imagens, setImagens] = useState<ImagemArmazenada[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isFinalizando, setIsFinalizando] = useState(false)
  const [isFechando, setIsFechando] = useState(false)
  
  // Verifica se todas as etapas de 1 a 8 estao completas
  const canFinalize = areSteps1to8Complete(os)

  useEffect(() => {
    if (os.empresa.cidade && !formData.cidade) {
      setFormData((prev) => ({ ...prev, cidade: os.empresa.cidade }))
    }
    if (os.empresa.uf && !formData.uf) {
      setFormData((prev) => ({ ...prev, uf: os.empresa.uf }))
    }
    if (os.empresa.responsavel && !formData.responsavel) {
      setFormData((prev) => ({ ...prev, responsavel: os.empresa.responsavel }))
    }
  }, [os.empresa])

  useImperativeHandle(ref, () => ({
    getCurrentData: () => ({
      finalizacao: formData,
      midias: { arquivos: imagens.map((img) => img.preview) },
    }),
  }))

  const handleSalvarRascunho = () => {
    if (onSaveDraft) {
      onSaveDraft()
    } else {
      onSave({ finalizacao: formData, midias: { arquivos: imagens.map((img) => img.preview) } }, false)
    }
  }

  const handleFechar = (e: React.MouseEvent) => {
    e.preventDefault()

    if (!onFechar) return

    setIsFechando(true)

    try {
      // Apenas salva a OS com status fechada, sem enviar para o webhook
      toast({
        title: "OS Fechada",
        description: "Ordem de serviço fechada e salva. Ainda pode ser editada.",
      })
      onFechar({ finalizacao: formData, midias: { arquivos: imagens.map((img) => img.preview) } })
    } catch (error) {
      console.error("Erro ao fechar:", error)
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao fechar a OS. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsFechando(false)
    }
  }

  const handleFinalizar = async (e: React.FormEvent) => {
  e.preventDefault()

  setIsFinalizando(true)

    try {
      // Prepara as imagens para o webhook
      const imagensWebhook: ImagemWebhook[] = imagens.map((img) => ({
        nome: img.nome,
        tipo: "image/jpeg",
        tamanho: img.tamanho,
        base64: img.base64,
      }))

      // Cria OS atualizada com os dados finais
      const osAtualizada: OrdemServico = {
        ...os,
        finalizacao: formData,
        midias: { arquivos: imagens.map((img) => img.preview) },
        status: "finalizada",
        finalizedAt: new Date().toISOString(),
      }

      // Envia para o webhook
      const sucesso = await enviarParaWebhook(osAtualizada, imagensWebhook)

      if (sucesso) {
        toast({
          title: "OS Finalizada",
          description: "Ordem de serviço finalizada e enviada com sucesso!",
        })
        onFinalizar({ finalizacao: formData, midias: { arquivos: imagens.map((img) => img.preview) } })
      } else {
        toast({
          title: "Aviso",
          description: "OS finalizada localmente, mas houve um erro ao enviar para o servidor.",
          variant: "destructive",
        })
        onFinalizar({ finalizacao: formData, midias: { arquivos: imagens.map((img) => img.preview) } })
      }
    } catch (error) {
      console.error("[v0] Erro ao finalizar:", error)
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao finalizar a OS. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsFinalizando(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    // Filtra apenas arquivos de imagem
    const imagensValidas = Array.from(files).filter((file) => {
      if (!isImageFile(file)) {
        toast({
          title: "Arquivo não permitido",
          description: `"${file.name}" não é uma imagem válida. Apenas imagens são aceitas.`,
          variant: "destructive",
        })
        return false
      }
      return true
    })

    if (imagensValidas.length === 0) return

    setIsUploading(true)

    try {
      const novasImagens: ImagemArmazenada[] = []

      for (const file of imagensValidas) {
        const resultado = await converterParaJPG(file)
        novasImagens.push({
          nome: resultado.nome,
          preview: `data:image/jpeg;base64,${resultado.base64}`,
          base64: resultado.base64,
          tamanho: resultado.tamanho,
        })
      }

      setImagens((prev) => [...prev, ...novasImagens])

      toast({
        title: "Imagens adicionadas",
        description: `${novasImagens.length} imagem(ns) convertida(s) para JPG e adicionada(s).`,
      })
    } catch (error) {
      console.error("[v0] Erro ao processar imagens:", error)
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao processar as imagens.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
      // Limpa o input
      e.target.value = ""
    }
  }

  const handleRemoverImagem = (index: number) => {
    setImagens((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <form onSubmit={handleFinalizar}>
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Local e Assinaturas</CardTitle>
            <CardDescription>Informações finais da ordem de serviço</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="cidade">Cidade *</Label>
                <Input
                  id="cidade"
                  value={formData.cidade}
                  onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                  placeholder="Cidade"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="uf">UF *</Label>
                <Select value={formData.uf} onValueChange={(value) => setFormData({ ...formData, uf: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {UFS.map((uf) => (
                      <SelectItem key={uf} value={uf}>
                        {uf}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nomeEngenheiro">Nome do Engenheiro *</Label>
                <Input
                  id="nomeEngenheiro"
                  value={formData.nomeEngenheiro || "Julio Cezar"}
                  onChange={(e) => setFormData({ ...formData, nomeEngenheiro: e.target.value })}
                  placeholder="Nome completo do engenheiro"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cftEngenheiro">CFT do Engenheiro *</Label>
                <Input
                  id="cftEngenheiro"
                  value={formData.cftEngenheiro || "2000103820"}
                  onChange={(e) => setFormData({ ...formData, cftEngenheiro: e.target.value })}
                  placeholder="Número do CFT"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="responsavel">Nome do Recebedor *</Label>
              <Input
                id="responsavel"
                value={formData.responsavel} 
                onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
                placeholder="Nome de quem recebeu o serviço"
                required
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Registro Fotográfico
            </CardTitle>
            <CardDescription>Anexe fotos do serviço (serão convertidas para JPG automaticamente)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="arquivos">Imagens ({imagens.length})</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="arquivos"
                  type="file"
                  multiple
                  accept="image/*,.heic,.heif"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="flex-1"
                />
                {isUploading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
              </div>
              <p className="text-xs text-muted-foreground">
                Formatos aceitos: JPG, PNG, GIF, WebP, BMP, HEIC (iOS). Todas as imagens serão convertidas para JPG.
              </p>
            </div>

            {imagens.length > 0 && (
              <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {imagens.map((imagem, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square border rounded-lg overflow-hidden bg-muted">
                      <img
                        src={imagem.preview || "/placeholder.svg"}
                        alt={imagem.nome}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleRemoverImagem(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1 truncate" title={imagem.nome}>
                      {imagem.nome}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumo da Ordem de Serviço</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 text-sm">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <span className="text-muted-foreground">Cliente:</span>
                  <p className="font-medium">{os.empresa.razaoSocial || os.empresa.nomeFantasia || "-"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Equipamento:</span>
                  <p className="font-medium">{os.equipamento?.tipo || "-"}</p>
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Motivação:</span>
                <p className="font-medium">{os.motivo.motivacaoServico || "-"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Serviços:</span>
                <p className="font-medium">{os.intervencao.descricaoServicos || "-"}</p>
              </div>
              <div className="grid md:grid-cols-2 gap-4 pt-2 border-t">
                <div>
                  <span className="text-muted-foreground">Peças Utilizadas:</span>
                  <p className="font-semibold">{os.pecas.length} peça(s)</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Dias de Trabalho:</span>
                  <p className="font-semibold">{new Set(os.maoDeObra.map((m) => m.data)).size} dia(s)</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3 flex-wrap">
          <Button type="button" variant="outline" onClick={handleSalvarRascunho} className="flex-1 min-w-[140px] bg-transparent">
            <Save className="h-4 w-4 mr-2" />
            Salvar Rascunho
          </Button>
          {onFechar && (
            <Button
              type="button"
              variant="outline"
              onClick={handleFechar}
              className="flex-1 min-w-[140px] bg-transparent border-amber-500 text-amber-600 hover:bg-amber-50 hover:text-amber-700"
              disabled={isFechando || isFinalizando}
            >
              {isFechando ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Fechando...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Fechar OS
                </>
              )}
            </Button>
          )}
          <Button 
            type="submit" 
            className="flex-1 min-w-[140px] bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed" 
            disabled={!canFinalize || isFinalizando || isFechando}
            title={!canFinalize ? "Preencha todos os campos das etapas 1 a 8 para finalizar" : undefined}
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
        </div>
      </div>
    </form>
  )
})
