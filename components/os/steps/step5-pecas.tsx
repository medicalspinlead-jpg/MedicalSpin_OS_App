"use client"

import type React from "react"
import { useState, forwardRef, useImperativeHandle } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import type { OrdemServico, Peca } from "@/lib/storage"
import { ArrowRight, Plus, Trash2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export const Step5Pecas = forwardRef(function Step5Pecas(
  {
    os,
    onSave,
  }: {
    os: OrdemServico
    onSave: (data: Partial<OrdemServico>, goToNext?: boolean) => void
  },
  ref,
) {
  const [pecas, setPecas] = useState<Peca[]>(os.pecas)
  const [novaPeca, setNovaPeca] = useState({
    nome: "",
    modeloRef: "",
    numeroSerie: "",
    observacoes: "",
    quantidade: 1,
    categoria: "cliente" as "cliente" | "medical-spin",
  })

  useImperativeHandle(ref, () => ({
    getCurrentData: () => ({
      pecas,
    }),
  }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({ pecas }, true)
  }

  const adicionarPeca = () => {
    if (!novaPeca.nome) return

    // Adicione no topo do componente, logo após o import:
const generateUUID = () => {
  if (crypto.randomUUID) return crypto.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

// Dentro do adicionarPeca, substitua:
const peca: Peca = {
  id: generateUUID(),
  ...novaPeca,
}


    setPecas([...pecas, peca])
    setNovaPeca({ nome: "", modeloRef: "", numeroSerie: "", observacoes: "", quantidade: 1, categoria: "cliente" })
  }

  const removerPeca = (id: string) => {
    setPecas(pecas.filter((p) => p.id !== id))
  }

  const pecasCliente = pecas.filter((p) => p.categoria === "cliente")
  const pecasMedicalSpin = pecas.filter((p) => p.categoria === "medical-spin")

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Adicionar Peça</CardTitle>
            <CardDescription>Registre peças removidas por categoria</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome da Peça *</Label>
                <Input
                  id="nome"
                  value={novaPeca.nome}
                  onChange={(e) => setNovaPeca({ ...novaPeca, nome: e.target.value })}
                  placeholder="Ex: Placa de controle"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="modeloRef">Modelo / Ref</Label>
                <Input
                  id="modeloRef"
                  value={novaPeca.modeloRef}
                  onChange={(e) => setNovaPeca({ ...novaPeca, modeloRef: e.target.value })}
                  placeholder="Ex: PCB-2024-A"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="numeroSerie">Nº de Série</Label>
                <Input
                  id="numeroSerie"
                  value={novaPeca.numeroSerie}
                  onChange={(e) => setNovaPeca({ ...novaPeca, numeroSerie: e.target.value })}
                  placeholder="Ex: SN123456789"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantidade">Quantidade</Label>
                <Input
                  id="quantidade"
                  type="number"
                  min="1"
                  value={novaPeca.quantidade}
                  onChange={(e) => setNovaPeca({ ...novaPeca, quantidade: Number.parseInt(e.target.value) || 1 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="categoria">Posse</Label>
                <Select
                  value={novaPeca.categoria}
                  onValueChange={(value: "cliente" | "medical-spin") => setNovaPeca({ ...novaPeca, categoria: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cliente">Cliente</SelectItem>
                    <SelectItem value="medical-spin">Medical Spin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={novaPeca.observacoes}
                onChange={(e) => setNovaPeca({ ...novaPeca, observacoes: e.target.value })}
                placeholder="Informações adicionais sobre a peça..."
                rows={2}
              />
            </div>

            <Button type="button" onClick={adicionarPeca} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Peça
            </Button>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Partes removidas — Posse do Cliente ({pecasCliente.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {pecasCliente.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">Nenhuma peça do cliente</div>
              ) : (
                <div className="space-y-2">
                  {pecasCliente.map((peca) => (
                    <div key={peca.id} className="flex items-start justify-between p-3 border rounded-lg">
                      <div className="flex-1 space-y-1">
                        <div className="font-medium">{peca.nome}</div>
                        {peca.modeloRef && (
                          <div className="text-sm text-muted-foreground">Modelo/Ref: {peca.modeloRef}</div>
                        )}
                        {peca.numeroSerie && (
                          <div className="text-sm text-muted-foreground">Nº Série: {peca.numeroSerie}</div>
                        )}
                        <div className="text-sm text-muted-foreground">Qtd: {peca.quantidade}</div>
                        {peca.observacoes && (
                          <div className="text-sm text-muted-foreground italic">Obs: {peca.observacoes}</div>
                        )}
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => removerPeca(peca.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Partes removidas — Posse da Medical Spin ({pecasMedicalSpin.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pecasMedicalSpin.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">Nenhuma peça da Medical Spin</div>
              ) : (
                <div className="space-y-2">
                  {pecasMedicalSpin.map((peca) => (
                    <div key={peca.id} className="flex items-start justify-between p-3 border rounded-lg">
                      <div className="flex-1 space-y-1">
                        <div className="font-medium">{peca.nome}</div>
                        {peca.modeloRef && (
                          <div className="text-sm text-muted-foreground">Modelo/Ref: {peca.modeloRef}</div>
                        )}
                        {peca.numeroSerie && (
                          <div className="text-sm text-muted-foreground">Nº Série: {peca.numeroSerie}</div>
                        )}
                        <div className="text-sm text-muted-foreground">Qtd: {peca.quantidade}</div>
                        {peca.observacoes && (
                          <div className="text-sm text-muted-foreground italic">Obs: {peca.observacoes}</div>
                        )}
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => removerPeca(peca.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end">
          <Button type="submit">
            Próxima Etapa
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </form>
  )
})
