"use client"

import type React from "react"
import { useState, forwardRef, useImperativeHandle } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import type { OrdemServico, MaoDeObra } from "@/lib/storage"
import { ArrowRight, Plus, Trash2 } from "lucide-react"

export const Step6MaoObra = forwardRef(function Step6MaoObra(
  {
    os,
    onSave,
  }: {
    os: OrdemServico
    onSave: (data: Partial<OrdemServico>, goToNext?: boolean) => void
  },
  ref,
) {
  const [maoDeObra, setMaoDeObra] = useState<MaoDeObra[]>(os.maoDeObra)
  const [novoServico, setNovoServico] = useState({
    data: new Date().toISOString().split("T")[0],
    descricao: "",
    horas: 1,
  })

  useImperativeHandle(ref, () => ({
    getCurrentData: () => ({
      maoDeObra,
    }),
  }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({ maoDeObra }, true)
  }

  const adicionarServico = () => {

    // Adicione no topo do componente, logo após os imports:
const generateUUID = () => {
  if (crypto.randomUUID) return crypto.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

// Dentro do adicionarServico, substitua:
const servico: MaoDeObra = {
  id: generateUUID(),
  ...novoServico,
}


    setMaoDeObra([...maoDeObra, servico])
    setNovoServico({ data: new Date().toISOString().split("T")[0], descricao: "", horas: 1 })
  }

  const removerServico = (id: string) => {
    setMaoDeObra(maoDeObra.filter((m) => m.id !== id))
  }

  const servicosPorData = maoDeObra.reduce(
    (acc, servico) => {
      if (!acc[servico.data]) {
        acc[servico.data] = []
      }
      acc[servico.data].push(servico)
      return acc
    },
    {} as Record<string, MaoDeObra[]>,
  )

  const datas = Object.keys(servicosPorData).sort()

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Adicionar Dia</CardTitle>
            <CardDescription>Registre os serviços realizados por dia</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="data">Data</Label>
                <Input
                  id="data"
                  type="date"
                  value={novoServico.data}
                  onChange={(e) => setNovoServico({ ...novoServico, data: e.target.value })}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="descricao">Descrição do Serviço (opcional)</Label>
                <Input
                  id="descricao"
                  value={novoServico.descricao}
                  onChange={(e) => setNovoServico({ ...novoServico, descricao: e.target.value })}
                  placeholder="Descrição do serviço"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="horas">Horas</Label>
                <Input
                  id="horas"
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={novoServico.horas}
                  onChange={(e) => setNovoServico({ ...novoServico, horas: Number.parseFloat(e.target.value) || 1 })}
                />
              </div>
            </div>
            <Button type="button" onClick={adicionarServico} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Dia
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Serviços Adicionados ({maoDeObra.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {maoDeObra.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">Nenhum serviço adicionado</div>
            ) : (
              <div className="space-y-4">
                {datas.map((data) => (
                  <div key={data} className="space-y-2">
                    <div className="text-sm font-semibold text-muted-foreground">
                      {new Date(data + "T00:00:00").toLocaleDateString("pt-BR")}
                    </div>
                    <div className="space-y-2">
                      {servicosPorData[data].map((servico) => (
                        <div key={servico.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <div className="font-medium">{servico.descricao || "Serviço sem descrição"}</div>
                            <div className="text-sm text-muted-foreground">Horas: {servico.horas}h</div>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => removerServico(servico.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

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
