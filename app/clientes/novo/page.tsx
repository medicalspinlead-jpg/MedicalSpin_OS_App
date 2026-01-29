"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { saveCliente } from "@/lib/storage"
import { ArrowLeft, Plus, Trash2, AlertTriangle, X } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { UFS, FABRICANTES, MODELOS } from "@/lib/constants"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface EquipamentoForm {
  tempId: string
  tipo: string
  fabricante: string
  modelo: string
  numeroSerie: string
}

// Funcao para formatar CNPJ automaticamente
function formatCNPJ(value: string): string {
  // Remove tudo que nao for numero
  const numbers = value.replace(/\D/g, "")
  
  // Limita a 14 digitos
  const limited = numbers.slice(0, 14)
  
  // Aplica a mascara XX.XXX.XXX/XXXX-XX
  if (limited.length <= 2) {
    return limited
  }
  if (limited.length <= 5) {
    return `${limited.slice(0, 2)}.${limited.slice(2)}`
  }
  if (limited.length <= 8) {
    return `${limited.slice(0, 2)}.${limited.slice(2, 5)}.${limited.slice(5)}`
  }
  if (limited.length <= 12) {
    return `${limited.slice(0, 2)}.${limited.slice(2, 5)}.${limited.slice(5, 8)}/${limited.slice(8)}`
  }
  return `${limited.slice(0, 2)}.${limited.slice(2, 5)}.${limited.slice(5, 8)}/${limited.slice(8, 12)}-${limited.slice(12)}`
}

export default function NovoClientePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [cnpjError, setCnpjError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    razaoSocial: "",
    nomeFantasia: "",
    cnpj: "",
    cidade: "",
    uf: "",
    telefone: "",
    email: "",
    responsavel: "",
  })

  const [equipamentos, setEquipamentos] = useState<EquipamentoForm[]>([])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Limpa erro anterior
    setCnpjError(null)

    if (!formData.razaoSocial || !formData.cnpj) {
      toast({
        title: "Erro",
        description: "Razão Social e CNPJ são obrigatórios",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const clienteData = {
        ...formData,
        equipamentos: equipamentos.map((eq) => ({
          tipo: eq.tipo,
          fabricante: eq.fabricante,
          modelo: eq.modelo,
          numeroSerie: eq.numeroSerie,
        })),
      }

      const cliente = await saveCliente(clienteData)

      toast({
        title: "Sucesso",
        description: `Cliente cadastrado com ${equipamentos.length} equipamento(s)!`,
      })

      router.push(`/clientes/${cliente.id}`)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao cadastrar cliente. Tente novamente."

      // Verifica se e erro de CNPJ duplicado
      if (errorMessage.includes("CNPJ já cadastrado") || errorMessage.includes("CNPJ ja cadastrado")) {
        setCnpjError(`O CNPJ ${formData.cnpj} ja esta cadastrado no sistema. Por favor, verifique os dados ou utilize outro CNPJ.`)
      } else {
        toast({
          title: "Erro ao cadastrar cliente",
          description: errorMessage,
          variant: "destructive",
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const generateUUID = () => {
  if (crypto.randomUUID) return crypto.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

const addEquipamento = () => {
  setEquipamentos([
    ...equipamentos,
    {
      tempId: generateUUID(),
      tipo: "",
      fabricante: "",
      modelo: "",
      numeroSerie: "",
    },
  ])
}

  const removeEquipamento = (tempId: string) => {
    setEquipamentos(equipamentos.filter((eq) => eq.tempId !== tempId))
  }

  const updateEquipamento = (tempId: string, field: keyof Omit<EquipamentoForm, "tempId">, value: string) => {
    setEquipamentos(equipamentos.map((eq) => (eq.tempId === tempId ? { ...eq, [field]: value } : eq)))
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Button asChild variant="ghost" size="sm" className="mb-4">
            <Link href="/clientes">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Link>
          </Button>
          <h1 className="text-3xl font-semibold text-foreground">Novo Cliente</h1>
          <p className="text-muted-foreground mt-1">Cadastre um novo cliente e seus equipamentos</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Dados do Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="razaoSocial">
                    Razão Social <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="razaoSocial"
                    value={formData.razaoSocial}
                    onChange={(e) => setFormData({ ...formData, razaoSocial: e.target.value })}
                    placeholder="Razão social da empresa"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nomeFantasia">Nome Fantasia</Label>
                  <Input
                    id="nomeFantasia"
                    value={formData.nomeFantasia}
                    onChange={(e) => setFormData({ ...formData, nomeFantasia: e.target.value })}
                    placeholder="Nome fantasia"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="cnpj">
                    CNPJ <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="cnpj"
                    value={formData.cnpj}
                    onChange={(e) => setFormData({ ...formData, cnpj: formatCNPJ(e.target.value) })}
                    placeholder="00.000.000/0000-00"
                    maxLength={18}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="responsavel">Responsável</Label>
                  <Input
                    id="responsavel"
                    value={formData.responsavel}
                    onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
                    placeholder="Nome do responsável"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input
                    id="cidade"
                    value={formData.cidade}
                    onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                    placeholder="Cidade"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="uf">UF</Label>
                  <Select value={formData.uf} onValueChange={(value) => setFormData({ ...formData, uf: value })}>
                    <SelectTrigger id="uf">
                      <SelectValue placeholder="Selecione a UF" />
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
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@exemplo.com"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Equipamentos</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Adicione os equipamentos do cliente</p>
              </div>
              <Button type="button" onClick={addEquipamento} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Equipamento
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {equipamentos.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Nenhum equipamento adicionado</p>
                  <p className="text-sm mt-1">Clique no botão acima para adicionar equipamentos</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {equipamentos.map((eq, index) => (
                    <Card key={eq.tempId} className="border-2">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-4">
                          <h4 className="font-medium">Equipamento {index + 1}</h4>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeEquipamento(eq.tempId)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor={`tipo-${eq.tempId}`}>Tipo</Label>
                            <Input
                              id={`tipo-${eq.tempId}`}
                              value={eq.tipo}
                              onChange={(e) => updateEquipamento(eq.tempId, "tipo", e.target.value)}
                              placeholder="Ex: Compressor, Gerador"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`fabricante-${eq.tempId}`}>Fabricante</Label>
                            <Select
                              value={eq.fabricante}
                              onValueChange={(value) => updateEquipamento(eq.tempId, "fabricante", value)}
                            >
                              <SelectTrigger id={`fabricante-${eq.tempId}`}>
                                <SelectValue placeholder="Selecione o fabricante" />
                              </SelectTrigger>
                              <SelectContent>
                                {FABRICANTES.map((fab) => (
                                  <SelectItem key={fab} value={fab}>
                                    {fab}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`modelo-${eq.tempId}`}>Modelo</Label>
                            <Select
                              value={eq.modelo}
                              onValueChange={(value) => updateEquipamento(eq.tempId, "modelo", value)}
                            >
                              <SelectTrigger id={`modelo-${eq.tempId}`}>
                                <SelectValue placeholder="Selecione o modelo" />
                              </SelectTrigger>
                              <SelectContent>
                                {MODELOS.map((mod) => (
                                  <SelectItem key={mod} value={mod}>
                                    {mod}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`numeroSerie-${eq.tempId}`}>Nº Série</Label>
                            <Input
                              id={`numeroSerie-${eq.tempId}`}
                              value={eq.numeroSerie}
                              onChange={(e) => updateEquipamento(eq.tempId, "numeroSerie", e.target.value)}
                              placeholder="Número de série"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card de erro CNPJ duplicado */}
          {cnpjError && (
            <div className="relative overflow-hidden rounded-lg border border-red-500/50 bg-red-500/10 p-4 shadow-[0_0_15px_rgba(239,68,68,0.3)] animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-transparent pointer-events-none" />
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 rounded-full bg-red-500/20 p-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-red-500 mb-1">CNPJ ja cadastrado</h3>
                  <p className="text-sm text-red-400/90">{cnpjError}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setCnpjError(null)}
                  className="flex-shrink-0 rounded-full p-1 hover:bg-red-500/20 transition-colors"
                >
                  <X className="h-4 w-4 text-red-500" />
                </button>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="flex-1"
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? "Salvando..." : "Cadastrar Cliente"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}
