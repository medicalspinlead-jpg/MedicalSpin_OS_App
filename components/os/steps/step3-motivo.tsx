"use client"

import type React from "react"
import { useState, forwardRef, useImperativeHandle } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import type { OrdemServico } from "@/lib/storage"
import { ArrowRight } from "lucide-react"

export const Step3MotivoEventos = forwardRef(function Step3MotivoEventos(
  {
    os,
    onSave,
  }: {
    os: OrdemServico
    onSave: (data: Partial<OrdemServico>, goToNext?: boolean) => void
  },
  ref,
) {
  const [formData, setFormData] = useState(os.motivo)

  useImperativeHandle(ref, () => ({
    getCurrentData: () => ({
      motivo: formData,
    }),
  }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({ motivo: formData }, true)
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Motivo e Eventos</CardTitle>
          <CardDescription>Descreva a motivação do serviço e eventos relevantes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="motivacaoServico">Motivação do Serviço</Label>
            <Textarea
              id="motivacaoServico"
              value={formData.motivacaoServico}
              onChange={(e) => setFormData({ ...formData, motivacaoServico: e.target.value })}
              placeholder="Descreva o motivo que levou à abertura desta ordem de serviço..."
              rows={5}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="eventosRelevantes">Eventos Relevantes</Label>
            <Textarea
              id="eventosRelevantes"
              value={formData.eventosRelevantes}
              onChange={(e) => setFormData({ ...formData, eventosRelevantes: e.target.value })}
              placeholder="Liste eventos importantes relacionados ao equipamento ou serviço..."
              rows={5}
            />
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit">
              Próxima Etapa
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
})
