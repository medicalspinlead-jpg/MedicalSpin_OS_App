"use client"

import type React from "react"
import { useState, forwardRef, useImperativeHandle } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import type { OrdemServico } from "@/lib/storage"
import { ArrowRight } from "lucide-react"

export const Step7Pendencias = forwardRef(function Step7Pendencias(
  {
    os,
    onSave,
  }: {
    os: OrdemServico
    onSave: (data: Partial<OrdemServico>, goToNext?: boolean) => void
  },
  ref,
) {
  const [formData, setFormData] = useState(os.pendencias)

  useImperativeHandle(ref, () => ({
    getCurrentData: () => ({
      pendencias: formData,
    }),
  }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({ pendencias: formData }, true)
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Pendências</CardTitle>
          <CardDescription>Registre pendências separadas por responsável</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="medicalSpin">Pendências da Medical Spin</Label>
            <Textarea
              id="medicalSpin"
              value={formData.medicalSpin}
              onChange={(e) => setFormData({ ...formData, medicalSpin: e.target.value })}
              placeholder="Descreva as pendências que ficam sob responsabilidade da Medical Spin..."
              rows={5}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cliente">Pendências do Cliente</Label>
            <Textarea
              id="cliente"
              value={formData.cliente}
              onChange={(e) => setFormData({ ...formData, cliente: e.target.value })}
              placeholder="Descreva as pendências que ficam sob responsabilidade do cliente..."
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
