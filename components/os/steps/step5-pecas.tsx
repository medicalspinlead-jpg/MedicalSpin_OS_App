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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const generateUUID = () => {
  if (crypto.randomUUID) return crypto.randomUUID()
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

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
  const [pecas, setPecas] = useState<Peca[]>(os.pecas.map((p) => ({ ...p, tipo: p.tipo || "removida" })))
  const [activeTab, setActiveTab] = useState<"removida" | "inclusa">("removida")
  const [novaPeca, setNovaPeca] = useState({
    nome: "",
    modeloRef: "",
    numeroSerie: "",
    observacoes: "",
    quantidade: 1,
    categoria: "cliente" as "cliente" | "medical-spin",
    tipo: "removida" as "removida" | "inclusa",
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

    const peca: Peca = {
      id: generateUUID(),
      descricao: "",
      ...novaPeca,
      tipo: activeTab,
    }

    setPecas([...pecas, peca])
    setNovaPeca({
      nome: "",
      modeloRef: "",
      numeroSerie: "",
      observacoes: "",
      quantidade: 1,
      categoria: "cliente",
      tipo: activeTab,
    })
  }

  const removerPeca = (id: string) => {
    setPecas(pecas.filter((p) => p.id !== id))
  }

  // Peças removidas
  const pecasRemovidasCliente = pecas.filter((p) => p.tipo === "removida" && p.categoria === "cliente")
  const pecasRemovidasMedicalSpin = pecas.filter((p) => p.tipo === "removida" && p.categoria === "medical-spin")

  // Peças inclusas
  const pecasInclusasCliente = pecas.filter((p) => p.tipo === "inclusa" && p.categoria === "cliente")
  const pecasInclusasMedicalSpin = pecas.filter((p) => p.tipo === "inclusa" && p.categoria === "medical-spin")

  const renderPecaCard = (peca: Peca) => (
    <div key={peca.id} className="flex items-start justify-between p-3 border rounded-lg">
      <div className="flex-1 space-y-1">
        <div className="font-medium">{peca.nome}</div>
        {peca.modeloRef && <div className="text-sm text-muted-foreground">Modelo/Ref: {peca.modeloRef}</div>}
        {peca.numeroSerie && <div className="text-sm text-muted-foreground">N Serie: {peca.numeroSerie}</div>}
        <div className="text-sm text-muted-foreground">Qtd: {peca.quantidade}</div>
        {peca.observacoes && <div className="text-sm text-muted-foreground italic">Obs: {peca.observacoes}</div>}
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
  )

  const renderEmptyState = (message: string) => (
    <div className="text-center py-8 text-muted-foreground">{message}</div>
  )

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "removida" | "inclusa")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="removida">Pecas Removidas</TabsTrigger>
            <TabsTrigger value="inclusa">Pecas Inclusas</TabsTrigger>
          </TabsList>

          <TabsContent value="removida" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Adicionar Peca Removida</CardTitle>
                <CardDescription>Registre pecas que foram removidas do equipamento</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="nome-removida">Nome da Peca *</Label>
                    <Input
                      id="nome-removida"
                      value={novaPeca.nome}
                      onChange={(e) => setNovaPeca({ ...novaPeca, nome: e.target.value })}
                      placeholder="Ex: Placa de controle"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="modeloRef-removida">Modelo / Ref</Label>
                    <Input
                      id="modeloRef-removida"
                      value={novaPeca.modeloRef}
                      onChange={(e) => setNovaPeca({ ...novaPeca, modeloRef: e.target.value })}
                      placeholder="Ex: PCB-2024-A"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="numeroSerie-removida">N de Serie</Label>
                    <Input
                      id="numeroSerie-removida"
                      value={novaPeca.numeroSerie}
                      onChange={(e) => setNovaPeca({ ...novaPeca, numeroSerie: e.target.value })}
                      placeholder="Ex: SN123456789"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quantidade-removida">Quantidade</Label>
                    <Input
                      id="quantidade-removida"
                      type="number"
                      min="1"
                      value={novaPeca.quantidade}
                      onChange={(e) => setNovaPeca({ ...novaPeca, quantidade: Number.parseInt(e.target.value) || 1 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="categoria-removida">Posse</Label>
                    <Select
                      value={novaPeca.categoria}
                      onValueChange={(value: "cliente" | "medical-spin") =>
                        setNovaPeca({ ...novaPeca, categoria: value })
                      }
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
                  <Label htmlFor="observacoes-removida">Observacoes</Label>
                  <Textarea
                    id="observacoes-removida"
                    value={novaPeca.observacoes}
                    onChange={(e) => setNovaPeca({ ...novaPeca, observacoes: e.target.value })}
                    placeholder="Informacoes adicionais sobre a peca..."
                    rows={2}
                  />
                </div>

                <Button type="button" onClick={adicionarPeca} variant="outline" size="sm" className="bg-transparent">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Peca Removida
                </Button>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Partes removidas - Posse do Cliente ({pecasRemovidasCliente.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {pecasRemovidasCliente.length === 0 ? (
                    renderEmptyState("Nenhuma peca do cliente")
                  ) : (
                    <div className="space-y-2">{pecasRemovidasCliente.map(renderPecaCard)}</div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Partes removidas - Posse da Medical Spin ({pecasRemovidasMedicalSpin.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {pecasRemovidasMedicalSpin.length === 0 ? (
                    renderEmptyState("Nenhuma peca da Medical Spin")
                  ) : (
                    <div className="space-y-2">{pecasRemovidasMedicalSpin.map(renderPecaCard)}</div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="inclusa" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Adicionar Peca Inclusa</CardTitle>
                <CardDescription>Registre pecas que foram adicionadas ao equipamento</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="nome-inclusa">Nome da Peca *</Label>
                    <Input
                      id="nome-inclusa"
                      value={novaPeca.nome}
                      onChange={(e) => setNovaPeca({ ...novaPeca, nome: e.target.value })}
                      placeholder="Ex: Placa de controle"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="modeloRef-inclusa">Modelo / Ref</Label>
                    <Input
                      id="modeloRef-inclusa"
                      value={novaPeca.modeloRef}
                      onChange={(e) => setNovaPeca({ ...novaPeca, modeloRef: e.target.value })}
                      placeholder="Ex: PCB-2024-A"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="numeroSerie-inclusa">N de Serie</Label>
                    <Input
                      id="numeroSerie-inclusa"
                      value={novaPeca.numeroSerie}
                      onChange={(e) => setNovaPeca({ ...novaPeca, numeroSerie: e.target.value })}
                      placeholder="Ex: SN123456789"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quantidade-inclusa">Quantidade</Label>
                    <Input
                      id="quantidade-inclusa"
                      type="number"
                      min="1"
                      value={novaPeca.quantidade}
                      onChange={(e) => setNovaPeca({ ...novaPeca, quantidade: Number.parseInt(e.target.value) || 1 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="categoria-inclusa">Posse</Label>
                    <Select
                      value={novaPeca.categoria}
                      onValueChange={(value: "cliente" | "medical-spin") =>
                        setNovaPeca({ ...novaPeca, categoria: value })
                      }
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
                  <Label htmlFor="observacoes-inclusa">Observacoes</Label>
                  <Textarea
                    id="observacoes-inclusa"
                    value={novaPeca.observacoes}
                    onChange={(e) => setNovaPeca({ ...novaPeca, observacoes: e.target.value })}
                    placeholder="Informacoes adicionais sobre a peca..."
                    rows={2}
                  />
                </div>

                <Button type="button" onClick={adicionarPeca} variant="outline" size="sm" className="bg-transparent">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Peca Inclusa
                </Button>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Partes inclusas - Posse do Cliente ({pecasInclusasCliente.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {pecasInclusasCliente.length === 0 ? (
                    renderEmptyState("Nenhuma peca do cliente")
                  ) : (
                    <div className="space-y-2">{pecasInclusasCliente.map(renderPecaCard)}</div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Partes inclusas - Posse da Medical Spin ({pecasInclusasMedicalSpin.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {pecasInclusasMedicalSpin.length === 0 ? (
                    renderEmptyState("Nenhuma peca da Medical Spin")
                  ) : (
                    <div className="space-y-2">{pecasInclusasMedicalSpin.map(renderPecaCard)}</div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end">
          <Button type="submit">
            Proxima Etapa
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </form>
  )
})
