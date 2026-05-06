"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X, Plus, Send, Loader2, Mail, FileText, Download } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { OrdemServico } from "@/lib/storage"
import { gerarPdfUrl, baixarPdfOS } from "@/lib/pdf-generator"

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

      // Gerar PDF localmente
      setPdfPreviewUrl(null)
      setLoadingPdf(true)
      generateLocalPdf(os).finally(() => setLoadingPdf(false))
    } else {
      // Liberar URL do blob quando fechar
      if (pdfPreviewUrl) {
        URL.revokeObjectURL(pdfPreviewUrl)
      }
      setPdfPreviewUrl(null)
    }
  }, [open, os])

  const generateLocalPdf = async (osData: OrdemServico) => {
    try {
      const pdfUrl = await gerarPdfUrl(osData)
      setPdfPreviewUrl(pdfUrl)
    } catch (error) {
      console.error("Erro ao gerar PDF:", error)
    }
  }

  const handleDownloadPdf = async () => {
    try {
      await baixarPdfOS(os)
    } catch (error) {
      console.error("Erro ao baixar PDF:", error)
    }
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
                <div className="flex items-center justify-between px-3 py-2 bg-muted/40 border-b">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs font-medium text-foreground">Documento PDF anexo</span>
                  </div>
                  {pdfPreviewUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleDownloadPdf}
                      className="h-7 px-2 text-xs"
                    >
                      <Download className="h-3.5 w-3.5 mr-1" />
                      Baixar
                    </Button>
                  )}
                </div>
                {loadingPdf ? (
                  <div className="flex flex-col items-center justify-center h-[300px] sm:h-[400px] bg-muted/10">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mb-2" />
                    <span className="text-xs text-muted-foreground">Gerando documento PDF...</span>
                  </div>
                ) : pdfPreviewUrl ? (
                  <iframe
                    src={pdfPreviewUrl}
                    className="w-full h-[300px] sm:h-[400px] border-0"
                    title="Preview do PDF da Ordem de Servico"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-[120px] bg-muted/10">
                    <FileText className="h-8 w-8 text-muted-foreground/50 mb-2" />
                    <span className="text-xs text-muted-foreground">
                      Erro ao gerar PDF
                    </span>
                    <span className="text-xs text-muted-foreground/70 mt-1">
                      Tente novamente ou entre em contato com o suporte.
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
