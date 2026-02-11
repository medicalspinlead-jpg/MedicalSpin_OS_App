"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X, Plus, Send, Loader2, Mail, FileText } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { OrdemServico } from "@/lib/storage"

interface EmailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  os: OrdemServico
  onSend: (data: {
    destinatarios: string[]
    assunto: string
    os: OrdemServico
  }) => Promise<void>
  sending?: boolean
}

export function EmailModal({ open, onOpenChange, os, onSend, sending }: EmailModalProps) {
  const [destinatarios, setDestinatarios] = useState<string[]>([])
  const [novoEmail, setNovoEmail] = useState("")
  const [assunto, setAssunto] = useState("")
  const [emailError, setEmailError] = useState("")
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null)
  const [loadingPdf, setLoadingPdf] = useState(false)

  useEffect(() => {
    if (open) {
      // Pre-fill emails from step 1 (empresa data)
      const emailPrincipal = os.empresa?.email || os.cliente?.email
      const emailsAdicionais = os.empresa?.emails || []

      const todosEmails = [emailPrincipal, ...emailsAdicionais]
        .filter((e): e is string => Boolean(e && e.trim()))
        .filter((email, index, self) => self.indexOf(email) === index)

      setDestinatarios(todosEmails)

      // Default subject
      const clienteNome = os.cliente?.razaoSocial || os.cliente?.nomeFantasia || os.empresa?.nomeFantasia || ""
      setAssunto(`Ordem de Servico ${os.numero}${clienteNome ? ` - ${clienteNome}` : ""}`)
      setNovoEmail("")
      setEmailError("")

      // Buscar link do PDF na planilha
      setPdfPreviewUrl(null)
      setLoadingPdf(true)
      fetchPdfLink(os).finally(() => setLoadingPdf(false))
    } else {
      setPdfPreviewUrl(null)
    }
  }, [open, os])

  const fetchPdfLink = async (osData: OrdemServico) => {
    try {
      const url =
        "https://docs.google.com/spreadsheets/d/1mZ4GlKIZieM_yz-CBjwNk4_8K62w45ez4BDTe-4e1e0/gviz/tq?gid=824063472&tqx=out:json&tq=SELECT%20*"
      console.log("[v0] fetchPdfLink chamado, osId:", osData.id, "idUnico:", (osData as any).idUnico)
      const response = await fetch(url)
      const text = await response.text()
      console.log("[v0] Spreadsheet response length:", text.length)

      // Buscar o inicio correto do JSON: "setResponse(" 
      const setResponseIdx = text.indexOf("setResponse(")
      const startIndex = setResponseIdx !== -1 ? text.indexOf("(", setResponseIdx) : text.indexOf("(")
      const endIndex = text.lastIndexOf(")")

      if (startIndex !== -1 && endIndex !== -1 && startIndex < endIndex) {
        const jsonText = text.substring(startIndex + 1, endIndex)
        const data = JSON.parse(jsonText)
        const rows = data.table?.rows || []
        console.log("[v0] Total rows:", rows.length)

        const osId = (osData as any).idUnico || osData.id
        console.log("[v0] Buscando por osId:", osId)
        
        let found = false
        for (const row of rows) {
          const cells = row.c || []
          const idPlanilha = cells[0]?.v as string | null
          console.log("[v0] Comparando planilha id:", idPlanilha, "com osId:", osId, "match:", idPlanilha && String(idPlanilha).trim() === String(osId).trim())
          if (idPlanilha && String(idPlanilha).trim() === String(osId).trim()) {
            const link = cells[2]?.v as string | null
            console.log("[v0] MATCH! Link encontrado:", link)
            if (link) {
              const previewUrl = convertToPreviewUrl(link)
              console.log("[v0] Preview URL:", previewUrl)
              setPdfPreviewUrl(previewUrl)
              found = true
            }
            break
          }
        }
        if (!found) {
          console.log("[v0] Nenhum match encontrado para osId:", osId)
        }
      } else {
        console.log("[v0] Formato de resposta invalido, startIndex:", startIndex, "endIndex:", endIndex)
      }
    } catch (error) {
      console.error("[v0] Erro ao buscar link do PDF:", error)
    }
  }

  const convertToPreviewUrl = (link: string): string => {
    // Google Drive: https://drive.google.com/file/d/FILE_ID/view -> embed preview
    const driveMatch = link.match(/\/d\/([a-zA-Z0-9_-]+)/)
    if (driveMatch) {
      return `https://drive.google.com/file/d/${driveMatch[1]}/preview`
    }
    // Google Drive export link: https://drive.google.com/uc?id=FILE_ID&export=download
    const ucMatch = link.match(/[?&]id=([a-zA-Z0-9_-]+)/)
    if (ucMatch) {
      return `https://drive.google.com/file/d/${ucMatch[1]}/preview`
    }
    // If it's already an embeddable URL or direct PDF link, use Google Docs viewer
    if (link.endsWith(".pdf") || link.includes("pdf")) {
      return `https://docs.google.com/viewer?url=${encodeURIComponent(link)}&embedded=true`
    }
    return link
  }

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const handleAddEmail = () => {
    const email = novoEmail.trim()
    if (!email) return

    if (!isValidEmail(email)) {
      setEmailError("Email invalido")
      return
    }

    if (destinatarios.includes(email)) {
      setEmailError("Email ja adicionado")
      return
    }

    setDestinatarios([...destinatarios, email])
    setNovoEmail("")
    setEmailError("")
  }

  const handleRemoveEmail = (index: number) => {
    setDestinatarios(destinatarios.filter((_, i) => i !== index))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddEmail()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (destinatarios.length === 0) {
      setEmailError("Adicione pelo menos um destinatario")
      return
    }

    await onSend({
      destinatarios,
      assunto,
      os,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-2xl sm:max-w-2xl mx-auto !p-0 !gap-0 overflow-hidden max-h-[90vh] !flex !flex-col">
        {/* Header - Gmail style */}
        <DialogHeader className="px-5 py-4 border-b bg-muted/40">
          <DialogTitle className="flex items-center gap-2 text-base font-medium">
            <Mail className="h-4 w-4" />
            Nova mensagem
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden flex-1">
          {/* Recipients */}
          <div className="px-5 py-3 border-b">
            <div className="flex items-start gap-2">
              <Label className="text-sm text-muted-foreground pt-2 shrink-0 w-12">Para</Label>
              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap gap-1.5 min-h-[32px] items-center">
                  {destinatarios.map((email, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="flex items-center gap-1 py-1 px-2 text-xs font-normal"
                    >
                      {email}
                      <button
                        type="button"
                        onClick={() => handleRemoveEmail(index)}
                        className="ml-0.5 hover:text-destructive transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  <div className="flex items-center gap-1 flex-1 min-w-[200px]">
                    <Input
                      type="email"
                      value={novoEmail}
                      onChange={(e) => {
                        setNovoEmail(e.target.value)
                        setEmailError("")
                      }}
                      onKeyDown={handleKeyDown}
                      placeholder="Adicionar destinatario..."
                      className="border-0 shadow-none px-1 h-8 text-sm focus-visible:ring-0"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      onClick={handleAddEmail}
                      disabled={!novoEmail.trim()}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                {emailError && (
                  <p className="text-xs text-destructive">{emailError}</p>
                )}
              </div>
            </div>
          </div>

          {/* Subject */}
          <div className="px-5 py-3 border-b">
            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground shrink-0 w-12">Assunto</Label>
              <Input
                value={assunto}
                onChange={(e) => setAssunto(e.target.value)}
                placeholder="Assunto do email..."
                className="border-0 shadow-none px-1 h-8 text-sm focus-visible:ring-0"
              />
            </div>
          </div>

          {/* Email body preview (read-only) */}
          <div className="px-5 py-4 overflow-y-auto flex-1">
            <div className="text-sm text-muted-foreground space-y-3">
              <p className="text-foreground">Segue em anexo a Ordem de Servico:</p>
              <div className="rounded-lg border bg-muted/30 p-3 text-xs">
                <table className="w-full">
                  <tbody>
                    <tr>
                      <td className="text-muted-foreground py-1 pr-3 align-top whitespace-nowrap">OS Numero:</td>
                      <td className="text-foreground font-medium py-1 break-all">{os.numero}</td>
                    </tr>
                    <tr>
                      <td className="text-muted-foreground py-1 pr-3 align-top whitespace-nowrap">Cliente:</td>
                      <td className="text-foreground font-medium py-1">
                        {os.cliente?.razaoSocial || os.cliente?.nomeFantasia || os.empresa?.nomeFantasia || "-"}
                      </td>
                    </tr>
                    <tr>
                      <td className="text-muted-foreground py-1 pr-3 align-top whitespace-nowrap">Equipamento:</td>
                      <td className="text-foreground font-medium py-1">{os.equipamento?.tipo || "-"}</td>
                    </tr>
                    {os.finalizedAt && (
                      <tr>
                        <td className="text-muted-foreground py-1 pr-3 align-top whitespace-nowrap">Finalizada em:</td>
                        <td className="text-foreground font-medium py-1">
                          {new Date(os.finalizedAt).toLocaleDateString("pt-BR")}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* PDF Preview */}
              <div className="rounded-lg border overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2 bg-muted/40 border-b">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-medium text-foreground">Documento PDF anexo</span>
                </div>
                {loadingPdf ? (
                  <div className="flex flex-col items-center justify-center h-[300px] sm:h-[400px] bg-muted/10">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mb-2" />
                    <span className="text-xs text-muted-foreground">Carregando documento...</span>
                  </div>
                ) : pdfPreviewUrl ? (
                  <iframe
                    src={pdfPreviewUrl}
                    className="w-full h-[300px] sm:h-[400px] border-0"
                    title="Preview do PDF da Ordem de Servico"
                    allow="autoplay"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-[120px] bg-muted/10">
                    <FileText className="h-8 w-8 text-muted-foreground/50 mb-2" />
                    <span className="text-xs text-muted-foreground">
                      PDF nao disponivel para visualizacao
                    </span>
                    <span className="text-xs text-muted-foreground/70 mt-1">
                      O documento sera anexado automaticamente ao email.
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer - Send button */}
          <div className="px-5 py-3 border-t bg-muted/20 flex items-center justify-between">
            <Button
              type="submit"
              disabled={sending || destinatarios.length === 0}
              className="gap-2"
            >
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Enviar
                </>
              )}
            </Button>
            <span className="text-xs text-muted-foreground">
              {destinatarios.length} destinatario{destinatarios.length !== 1 ? "s" : ""}
            </span>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
