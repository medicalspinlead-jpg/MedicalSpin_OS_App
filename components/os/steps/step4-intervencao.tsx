"use client"

import type React from "react"
import { useState, forwardRef, useImperativeHandle } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import type { OrdemServico } from "@/lib/storage"
import { TIPOS_INTERVENCAO } from "@/lib/constants"
import { ArrowRight } from "lucide-react"

export const Step4Intervencao = forwardRef(function Step4Intervencao(
  {
    os,
    onSave,
  }: {
    os: OrdemServico
    onSave: (data: Partial<OrdemServico>, goToNext?: boolean) => void
  },
  ref,
) {
  const [formData, setFormData] = useState(os.intervencao)

  useImperativeHandle(ref, () => ({
    getCurrentData: () => ({
      intervencao: formData,
    }),
  }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({ intervencao: formData }, true)
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Tipo de Intervenção</CardTitle>
          <CardDescription>Especifique o tipo e descrição dos serviços realizados</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label>Tipo</Label>
            <RadioGroup
              value={formData.tipo}
              onValueChange={(value) => setFormData({ ...formData, tipo: value })}
              required
            >
              {TIPOS_INTERVENCAO.map((tipo) => (
                <div key={tipo} className="flex items-center space-x-2">
                  <RadioGroupItem value={tipo} id={`tipo-${tipo}`} />
                  <Label htmlFor={`tipo-${tipo}`} className="font-normal cursor-pointer">
                    {tipo}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricaoServicos">Descrição dos Serviços Realizados</Label>
            <Textarea
              id="descricaoServicos"
              value={formData.descricaoServicos}
              onChange={(e) => setFormData({ ...formData, descricaoServicos: e.target.value })}
              placeholder="Descreva detalhadamente todos os serviços realizados..."
              rows={8}
              required
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
