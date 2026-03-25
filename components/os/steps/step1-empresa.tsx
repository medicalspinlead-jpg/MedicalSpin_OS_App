"use client"

import type React from "react"

import { useState, forwardRef, useImperativeHandle, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import type { OrdemServico } from "@/lib/storage"
import { getClientes } from "@/lib/storage"
import { ArrowRight, Search, Plus, X, AlertCircle } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/components/auth-provider"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface ClienteComEquipamentos {
  id: string
  razaoSocial: string
  nomeFantasia: string
  cnpj: string
  cidade: string
  uf: string
  estado?: string
  telefone: string
  email: string
  responsavel: string
  createdAt: string
  equipamentos?: {
    id: string
    tipo: string
    fabricante: string
    modelo: string
    numeroSerie: string
  }[]
}

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

// Funcao para normalizar o nome do tipo de equipamento para comparacao
function normalizarTipo(tipo: string): string {
  return tipo
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .replace(/[^a-z0-9]/g, "") // Remove caracteres especiais
}

// Verifica se o cliente tem equipamento compativel com o departamento
function clienteTemEquipamentoCompativel(
  cliente: ClienteComEquipamentos,
  departamentos: { id: string; nome: string }[]
): boolean {
  if (!cliente.equipamentos || cliente.equipamentos.length === 0) {
    return false
  }
  
  if (!departamentos || departamentos.length === 0) {
    return true // Se nao tem departamento, permite todos
  }
  
  // Normaliza os nomes dos departamentos
  const tiposDepartamento = departamentos.map(d => normalizarTipo(d.nome))
  
  // Verifica se algum equipamento do cliente tem tipo compativel
  return cliente.equipamentos.some(equip => {
    const tipoEquip = normalizarTipo(equip.tipo)
    return tiposDepartamento.some(tipoDep => 
      tipoEquip.includes(tipoDep) || tipoDep.includes(tipoEquip)
    )
  })
}

export const Step1DadosEmpresa = forwardRef<
  StepRef,
  {
    os: OrdemServico
    onSave: (data: Partial<OrdemServico>, goToNext?: boolean) => void
  }
>(({ os, onSave }, ref) => {
  const { usuario } = useAuth()
  const [clientes, setClientes] = useState<ClienteComEquipamentos[]>([])
  const [clienteSelecionado, setClienteSelecionado] = useState<string>("")
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    ...os.empresa,
    emails: os.empresa.emails || [],
  })
  const [novoEmail, setNovoEmail] = useState("")
  const [loading, setLoading] = useState(true)

  // Departamentos do usuario logado
  const departamentosUsuario = usuario?.departamentos || []

  useEffect(() => {
    setFormData({
      ...os.empresa,
      emails: os.empresa.emails || [],
    })
  }, [os.empresa])

  useEffect(() => {
    const carregarClientes = async () => {
      try {
        setLoading(true)
        const clientesData = await getClientes()
        setClientes(clientesData as ClienteComEquipamentos[])
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
        emails: [],
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
        emails: cliente.email ? [cliente.email] : [],
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
            {departamentosUsuario.length > 0 && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Mostrando clientes com equipamentos de: {departamentosUsuario.map(d => d.nome).join(", ")}
              </p>
            )}
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
                      {clientes.map((cliente) => {
                        const isCompativel = departamentosUsuario.length === 0 || 
                          clienteTemEquipamentoCompativel(cliente, departamentosUsuario)
                        
                        return (
                          <TooltipProvider key={cliente.id}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div>
                                  <CommandItem
                                    value={`${cliente.razaoSocial} ${cliente.cnpj} ${cliente.nomeFantasia}`}
                                    onSelect={() => isCompativel && handleClienteSelect(cliente.id)}
                                    className={cn(
                                      !isCompativel && "opacity-50 cursor-not-allowed"
                                    )}
                                    disabled={!isCompativel}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        clienteSelecionado === cliente.id ? "opacity-100" : "opacity-0",
                                      )}
                                    />
                                    <div className="flex flex-col flex-1">
                                      <div className="flex items-center gap-2">
                                        <span className={cn("font-medium", !isCompativel && "text-muted-foreground")}>
                                          {cliente.razaoSocial}
                                        </span>
                                        {!isCompativel && (
                                          <AlertCircle className="h-4 w-4 text-amber-500" />
                                        )}
                                      </div>
                                      <span className="text-sm text-muted-foreground">{cliente.cnpj}</span>
                                    </div>
                                  </CommandItem>
                                </div>
                              </TooltipTrigger>
                              {!isCompativel && (
                                <TooltipContent side="right">
                                  <p>Este cliente não possui equipamentos</p>
                                  <p>compatíveis com seu departamento</p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    ({departamentosUsuario.map(d => d.nome).join(", ")})
                                  </p>
                                </TooltipContent>
                              )}
                            </Tooltip>
                          </TooltipProvider>
                        )
                      })}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="razaoSocial" className="text-muted-foreground">Razão Social</Label>
              <Input
                id="razaoSocial"
                value={formData.razaoSocial}
                placeholder="Razão Social"
                disabled
                className="bg-muted text-muted-foreground cursor-not-allowed"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nomeFantasia" className="text-muted-foreground">Nome Fantasia</Label>
              <Input
                id="nomeFantasia"
                value={formData.nomeFantasia}
                placeholder="Nome Fantasia"
                disabled
                className="bg-muted text-muted-foreground cursor-not-allowed"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cnpj" className="text-muted-foreground">CNPJ</Label>
            <Input
              id="cnpj"
              value={formData.cnpj}
              placeholder="00.000.000/0000-00"
              disabled
              className="bg-muted text-muted-foreground cursor-not-allowed"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="cidade" className="text-muted-foreground">Cidade</Label>
              <Input
                id="cidade"
                value={formData.cidade}
                placeholder="Cidade"
                disabled
                className="bg-muted text-muted-foreground cursor-not-allowed"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="uf" className="text-muted-foreground">UF</Label>
              <Input
                id="uf"
                value={formData.uf}
                placeholder="UF"
                disabled
                className="bg-muted text-muted-foreground cursor-not-allowed"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefone" className="text-muted-foreground">Telefone</Label>
            <Input
              id="telefone"
              value={formData.telefone}
              placeholder="(00) 00000-0000"
              disabled
              className="bg-muted text-muted-foreground cursor-not-allowed"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-muted-foreground">Email Principal</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              placeholder="email@empresa.com"
              disabled
              className="bg-muted text-muted-foreground cursor-not-allowed"
            />
          </div>

          <div className="space-y-2">
            <Label>Emails Adicionais</Label>
            <div className="flex gap-2">
              <Input
                type="email"
                value={novoEmail}
                onChange={(e) => setNovoEmail(e.target.value)}
                placeholder="Adicionar outro email"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    if (novoEmail && novoEmail.includes("@")) {
                      setFormData({
                        ...formData,
                        emails: [...formData.emails, novoEmail],
                      })
                      setNovoEmail("")
                    }
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="shrink-0 bg-transparent"
                onClick={() => {
                  if (novoEmail && novoEmail.includes("@")) {
                    setFormData({
                      ...formData,
                      emails: [...formData.emails, novoEmail],
                    })
                    setNovoEmail("")
                  }
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {formData.emails.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.emails.map((email, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-1 bg-muted px-2 py-1 rounded-md text-sm"
                  >
                    <span>{email}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          emails: formData.emails.filter((_, i) => i !== index),
                        })
                      }}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Adicione emails adicionais que receberao a OS. Pressione Enter ou clique no botao + para adicionar.
            </p>
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
