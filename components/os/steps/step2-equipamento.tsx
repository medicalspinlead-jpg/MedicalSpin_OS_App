"use client"

import type React from "react"
import { useState, useEffect, forwardRef, useImperativeHandle } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { type OrdemServico, getEquipamentosByCliente, type Cliente, type Equipamento } from "@/lib/storage"
import { ArrowRight } from "lucide-react"

export const Step2DadosEquipamento = forwardRef(function Step2DadosEquipamento(
  {
    os,
    onSave,
  }: {
    os: OrdemServico
    onSave: (data: Partial<OrdemServico>, goToNext?: boolean) => void
  },
  ref,
) {
  const [selectedCliente, setSelectedCliente] = useState<Cliente | undefined>(os.cliente)
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([])
  const [selectedEquipamento, setSelectedEquipamento] = useState<Equipamento | undefined>(os.equipamento)
  const [loadingEquipamentos, setLoadingEquipamentos] = useState(false)

  useImperativeHandle(ref, () => ({
    getCurrentData: () => ({
      cliente: selectedCliente,
      equipamento: selectedEquipamento,
    }),
  }))

  useEffect(() => {
    if (os.cliente && os.cliente.id) {
      console.log("[v0] Step2: Cliente detectado automaticamente da etapa 1:", os.cliente)
      setSelectedCliente(os.cliente)
    }
  }, [os.cliente])

  useEffect(() => {
    const loadEquipamentos = async () => {
      if (!selectedCliente?.id) {
        setEquipamentos([])
        return
      }

      setLoadingEquipamentos(true)
      console.log("[v0] Step2: Carregando equipamentos do cliente:", selectedCliente.id)
      try {
        const equips = await getEquipamentosByCliente(selectedCliente.id)
        console.log("[v0] Step2: Equipamentos encontrados:", equips.length)
        setEquipamentos(equips)
        
        // Se o cliente tiver apenas 1 equipamento e nenhum estiver selecionado, seleciona automaticamente
        if (equips.length === 1 && !selectedEquipamento) {
          console.log("[v0] Step2: Selecionando automaticamente o unico equipamento")
          setSelectedEquipamento(equips[0])
        }
      } catch (error) {
        console.error("Erro ao carregar equipamentos:", error)
        setEquipamentos([])
      } finally {
        setLoadingEquipamentos(false)
      }
    }

    loadEquipamentos()
  }, [selectedCliente?.id, selectedEquipamento])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(
      {
        cliente: selectedCliente,
        equipamento: selectedEquipamento,
      },
      true,
    )
  }

  if (!selectedCliente) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Selecionar Equipamento</CardTitle>
          <CardDescription>Nenhum cliente selecionado</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-destructive">
            Por favor, volte para a etapa anterior e selecione um cliente.
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4">
        {/* Cliente Selection - Apenas visualização */}
        <Card>
          <CardHeader>
            <CardTitle>Cliente Selecionado</CardTitle>
            <CardDescription>Cliente definido na etapa anterior</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 border rounded-lg bg-accent/50">
              <div className="font-medium">{selectedCliente.razaoSocial}</div>
              {selectedCliente.nomeFantasia && (
                <div className="text-sm text-muted-foreground">{selectedCliente.nomeFantasia}</div>
              )}
              <div className="text-sm text-muted-foreground">{selectedCliente.cnpj}</div>
              {selectedCliente.telefone && (
                <div className="text-sm text-muted-foreground mt-1">{selectedCliente.telefone}</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Equipment Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Selecionar Equipamento</CardTitle>
            <CardDescription>Escolha o equipamento que será atendido</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!selectedEquipamento ? (
              <>
                {loadingEquipamentos ? (
                  <div className="text-center py-8 text-muted-foreground">Carregando equipamentos...</div>
                ) : equipamentos.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Este cliente não possui equipamentos cadastrados.
                  </div>
                ) : (
                  <div className="grid gap-2">
                    {equipamentos.map((equip) => (
                      <button
                        key={equip.id}
                        type="button"
                        onClick={() => setSelectedEquipamento(equip)}
                        className="p-3 border rounded-lg text-left hover:bg-accent transition-colors"
                      >
                        <div className="font-medium">{equip.tipo}</div>
                        <div className="text-sm text-muted-foreground">
                          {equip.fabricante} {equip.modelo} {equip.numeroSerie && `- N/S: ${equip.numeroSerie}`}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <button
                type="button"
                onClick={() => setSelectedEquipamento(undefined)}
                className="w-full p-4 border rounded-lg bg-accent/50 text-left hover:bg-accent transition-colors cursor-pointer"
              >
                <div className="font-medium">{selectedEquipamento.tipo}</div>
                <div className="text-sm text-muted-foreground">
                  {selectedEquipamento.fabricante} {selectedEquipamento.modelo}
                </div>
                {selectedEquipamento.numeroSerie && (
                  <div className="text-sm text-muted-foreground">N/S: {selectedEquipamento.numeroSerie}</div>
                )}
                <div className="text-xs text-muted-foreground mt-2">Clique para alterar</div>
              </button>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={!selectedEquipamento}>
            Próxima Etapa
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </form>
  )
})
