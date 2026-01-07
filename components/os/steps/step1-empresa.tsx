"use client"

import type React from "react"

import { useState, forwardRef, useImperativeHandle, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import type { OrdemServico } from "@/lib/storage"
import { getClientes } from "@/lib/storage"
import { ArrowRight, Search } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Cliente } from "@prisma/client"

const UFS = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
]

export interface StepRef {
  getCurrentData: () => Partial<OrdemServico>
}

export const Step1DadosEmpresa = forwardRef<
  StepRef,
  {
    os: OrdemServico
    onSave: (data: Partial<OrdemServico>, goToNext?: boolean) => void
  }
>(({ os, onSave }, ref) => {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [clienteSelecionado, setClienteSelecionado] = useState<string>("")
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState(os.empresa)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setFormData(os.empresa)
  }, [os.empresa])

  useEffect(() => {
    const carregarClientes = async () => {
      try {
        setLoading(true)
        const clientesData = await getClientes()
        setClientes(clientesData)
      } catch (error) {
        console.error("Erro ao carregar clientes:", error)
        setClientes([])
      } finally {
        setLoading(false)
      }
    }
    carregarClientes()
  }, [])

  useImperativeHandle(ref, () => ({
    getCurrentData: () => ({ empresa: formData }),
  }))

  const handleClienteSelect = (clienteId: string) => {
    setClienteSelecionado(clienteId)
    setOpen(false)

    if (clienteId === "manual") {
      const dadosVazios = {
        razaoSocial: "",
        nomeFantasia: "",
        cnpj: "",
        cidade: "",
        uf: "",
        telefone: "",
        email: "",
        responsavel: "",
      }
      setFormData(dadosVazios)
      onSave({ empresa: dadosVazios, cliente: undefined }, false)
      return
    }

    const cliente = clientes.find((c) => c.id === clienteId)
    if (cliente) {
      const ufCorreto = cliente.estado || cliente.uf || ""

      const dadosCliente = {
        razaoSocial: cliente.razaoSocial,
        nomeFantasia: cliente.nomeFantasia,
        cnpj: cliente.cnpj,
        cidade: cliente.cidade,
        uf: ufCorreto,
        telefone: cliente.telefone,
        email: cliente.email,
        responsavel: cliente.responsavel,
      }

      setFormData(dadosCliente)

      onSave(
        {
          empresa: dadosCliente,
          cliente: cliente,
          finalizacao: {
            ...os.finalizacao,
            cidade: cliente.cidade,
            uf: ufCorreto,
          },
        },
        false,
      )
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({ empresa: formData }, true)
  }

  const clienteNome =
    clienteSelecionado === "manual"
      ? "Preencher manualmente"
      : clientes.find((c) => c.id === clienteSelecionado)?.razaoSocial || "Selecione um cliente"

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Dados da Empresa</CardTitle>
          <CardDescription>Selecione um cliente existente ou preencha manualmente</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cliente">Buscar Cliente</Label>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-full justify-between bg-transparent"
                  disabled={loading}
                >
                  {loading ? "Carregando clientes..." : clienteNome}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput placeholder="Pesquisar cliente..." />
                  <CommandList>
                    <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem value="manual" onSelect={() => handleClienteSelect("manual")}>
                        <Check
                          className={cn("mr-2 h-4 w-4", clienteSelecionado === "manual" ? "opacity-100" : "opacity-0")}
                        />
                        <Search className="mr-2 h-4 w-4" />
                        Preencher manualmente
                      </CommandItem>
                      {clientes.map((cliente) => (
                        <CommandItem
                          key={cliente.id}
                          value={`${cliente.razaoSocial} ${cliente.cnpj} ${cliente.nomeFantasia}`}
                          onSelect={() => handleClienteSelect(cliente.id)}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              clienteSelecionado === cliente.id ? "opacity-100" : "opacity-0",
                            )}
                          />
                          <div className="flex flex-col">
                            <span className="font-medium">{cliente.razaoSocial}</span>
                            <span className="text-sm text-muted-foreground">{cliente.cnpj}</span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="razaoSocial">Razão Social</Label>
              <Input
                id="razaoSocial"
                value={formData.razaoSocial}
                onChange={(e) => setFormData({ ...formData, razaoSocial: e.target.value })}
                placeholder="Razão Social"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nomeFantasia">Nome Fantasia</Label>
              <Input
                id="nomeFantasia"
                value={formData.nomeFantasia}
                onChange={(e) => setFormData({ ...formData, nomeFantasia: e.target.value })}
                placeholder="Nome Fantasia"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cnpj">CNPJ</Label>
            <Input
              id="cnpj"
              value={formData.cnpj}
              onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
              placeholder="00.000.000/0000-00"
              required
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="cidade">Cidade</Label>
              <Input
                id="cidade"
                value={formData.cidade}
                onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                placeholder="Cidade"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="uf">UF</Label>
              <Select value={formData.uf} onValueChange={(value) => setFormData({ ...formData, uf: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {UFS.map((uf) => (
                    <SelectItem key={uf} value={uf}>
                      {uf}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                placeholder="(00) 00000-0000"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@empresa.com"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="responsavel">Responsável</Label>
            <Input
              id="responsavel"
              value={formData.responsavel}
              onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
              placeholder="Nome do responsável"
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

Step1DadosEmpresa.displayName = "Step1DadosEmpresa"
