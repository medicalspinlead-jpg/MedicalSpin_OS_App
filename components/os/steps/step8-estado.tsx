"use client"

import type React from "react"
import { useState, forwardRef, useImperativeHandle } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import type { OrdemServico } from "@/lib/storage"
import { ESTADOS_EQUIPAMENTO } from "@/lib/constants"
import { ArrowRight } from "lucide-react"

export const Step8EstadoEquipamento = forwardRef(function Step8EstadoEquipamento(
  {
    os,
    onSave,
  }: {
    os: OrdemServico
    onSave: (data: Partial<OrdemServico>, goToNext?: boolean) => void
  },
  ref,
) {
  const [formData, setFormData] = useState(os.estadoEquipamento)

  useImperativeHandle(ref, () => ({
    getCurrentData: () => ({
      estadoEquipamento: formData,
    }),
  }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({ estadoEquipamento: formData }, true)
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Estado do Equipamento</CardTitle>
          <CardDescription>Selecione o estado inicial e final do equipamento</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label>Estado Inicial</Label>
            <RadioGroup
              value={formData.estadoInicial}
              onValueChange={(value) => setFormData({ ...formData, estadoInicial: value })}
              required
            >
              {ESTADOS_EQUIPAMENTO.map((estado) => (
                <div key={`inicial-${estado}`} className="flex items-center space-x-2">
                  <RadioGroupItem value={estado} id={`inicial-${estado}`} />
                  <Label htmlFor={`inicial-${estado}`} className="font-normal cursor-pointer">
                    {estado}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-3">
            <Label>Estado Final</Label>
            <RadioGroup
              value={formData.estadoFinal}
              onValueChange={(value) => setFormData({ ...formData, estadoFinal: value })}
              required
            >
              {ESTADOS_EQUIPAMENTO.map((estado) => (
                <div key={`final-${estado}`} className="flex items-center space-x-2">
                  <RadioGroupItem value={estado} id={`final-${estado}`} />
                  <Label htmlFor={`final-${estado}`} className="font-normal cursor-pointer">
                    {estado}
                  </Label>
                </div>
              ))}
            </RadioGroup>
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
