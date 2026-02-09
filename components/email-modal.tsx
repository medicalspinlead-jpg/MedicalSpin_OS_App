"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { X, Plus, Send, Loader2, Mail } from "lucide-react"
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
    }
  }, [open, os])

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
      <DialogContent className="w-[95vw] max-w-2xl mx-auto p-0 gap-0 overflow-hidden">
        {/* Header - Gmail style */}
        <DialogHeader className="px-5 py-4 border-b bg-muted/40">
          <DialogTitle className="flex items-center gap-2 text-base font-medium">
            <Mail className="h-4 w-4" />
            Nova mensagem
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col">
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
          <div className="px-5 py-4 min-h-[180px] max-h-[300px] overflow-y-auto">
            <div className="text-sm text-muted-foreground space-y-3">
              <p className="text-foreground">Segue em anexo a Ordem de Servico:</p>
              <div className="rounded-lg border bg-muted/30 p-3 space-y-1.5 text-xs">
                <div className="flex gap-2">
                  <span className="text-muted-foreground w-24 shrink-0">OS Numero:</span>
                  <span className="text-foreground font-medium">{os.numero}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-muted-foreground w-24 shrink-0">Cliente:</span>
                  <span className="text-foreground font-medium">
                    {os.cliente?.razaoSocial || os.cliente?.nomeFantasia || os.empresa?.nomeFantasia || "-"}
                  </span>
                </div>
                <div className="flex gap-2">
                  <span className="text-muted-foreground w-24 shrink-0">Equipamento:</span>
                  <span className="text-foreground font-medium">{os.equipamento?.tipo || "-"}</span>
                </div>
                {os.finalizedAt && (
                  <div className="flex gap-2">
                    <span className="text-muted-foreground w-24 shrink-0">Finalizada em:</span>
                    <span className="text-foreground font-medium">
                      {new Date(os.finalizedAt).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground italic">
                O documento PDF sera anexado automaticamente ao email.
              </p>
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
