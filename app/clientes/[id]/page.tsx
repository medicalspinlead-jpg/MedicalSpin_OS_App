"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  getCliente,
  saveCliente,
  getEquipamentosByCliente,
  saveEquipamento,
  deleteEquipamento,
  type Cliente,
  type Equipamento,
} from "@/lib/storage"
import { ArrowLeft, Plus, Trash2, Edit2, Save, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { UFS, FABRICANTES, MODELOS } from "@/lib/constants"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function ClienteDetalhePage() {
  const params = useParams()
  const id = params.id as string

  return <ClienteDetalhePageClient id={id} />
}

function ClienteDetalhePageClient({ id }: { id: string }) {
  const router = useRouter()
  const { toast } = useToast()
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([])
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [showEquipamentoForm, setShowEquipamentoForm] = useState(false)
  const [editingEquipamento, setEditingEquipamento] = useState<Equipamento | null>(null)
  const [deleteEquipamentoId, setDeleteEquipamentoId] = useState<string | null>(null)

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

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const clienteData = await getCliente(id)
        if (!clienteData) {
          toast({
            title: "Erro",
            description: "Cliente não encontrado",
            variant: "destructive",
          })
          router.push("/clientes")
          return
        }
        setCliente(clienteData)
        setFormData({
          razaoSocial: clienteData.razaoSocial || "",
          nomeFantasia: clienteData.nomeFantasia || "",
          cnpj: clienteData.cnpj || "",
          cidade: clienteData.cidade || "",
          uf: clienteData.uf || "",
          telefone: clienteData.telefone || "",
          email: clienteData.email || "",
          responsavel: clienteData.responsavel || "",
        })
        await loadEquipamentos()
      } catch (error) {
        console.error("Erro ao carregar cliente:", error)
        toast({
          title: "Erro",
          description: "Erro ao carregar dados do cliente",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [id])

  const loadEquipamentos = async () => {
    const equips = await getEquipamentosByCliente(id)
    setEquipamentos(equips)
  }

  const handleSaveCliente = async () => {
    if (!cliente) return

    const updatedCliente: Cliente = {
      ...cliente,
      ...formData,
    }

    await saveCliente(updatedCliente)
    setCliente(updatedCliente)
    setIsEditing(false)
    toast({
      title: "Sucesso",
      description: "Cliente atualizado com sucesso!",
    })
  }

  const handleDeleteEquipamento = async (equipamentoId: string) => {
    await deleteEquipamento(equipamentoId)
    await loadEquipamentos()
    setDeleteEquipamentoId(null)
    toast({
      title: "Sucesso",
      description: "Equipamento excluído com sucesso!",
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30">
        <main className="container mx-auto px-4 py-8 max-w-5xl">
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </main>
      </div>
    )
  }

  if (!cliente) return null

  return (
    <div className="min-h-screen bg-muted/30">
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-6">
          <Button asChild variant="ghost" size="sm" className="mb-4">
            <Link href="/clientes">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Link>
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-foreground">{cliente.razaoSocial}</h1>
              <p className="text-muted-foreground mt-1">{cliente.cnpj}</p>
            </div>
            {!isEditing && (
              <Button onClick={() => setIsEditing(true)}>
                <Edit2 className="h-4 w-4 mr-2" />
                Editar
              </Button>
            )}
          </div>
        </div>

        {/* Dados do Cliente */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Dados do Cliente</CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <div className="space-y-4">
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
                      onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                      placeholder="00.000.000/0000-00"
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

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setIsEditing(false)} className="flex-1">
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                  <Button onClick={handleSaveCliente} className="flex-1">
                    <Save className="h-4 w-4 mr-2" />
                    Salvar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-muted-foreground">Razão Social</Label>
                  <p className="text-foreground">{cliente.razaoSocial || "-"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Nome Fantasia</Label>
                  <p className="text-foreground">{cliente.nomeFantasia || "-"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">CNPJ</Label>
                  <p className="text-foreground">{cliente.cnpj || "-"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Responsável</Label>
                  <p className="text-foreground">{cliente.responsavel || "-"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Telefone</Label>
                  <p className="text-foreground">{cliente.telefone || "-"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="text-foreground">{cliente.email || "-"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Cidade</Label>
                  <p className="text-foreground">{cliente.cidade || "-"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">UF</Label>
                  <p className="text-foreground">{cliente.uf || "-"}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Equipamentos */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Equipamentos</CardTitle>
                <CardDescription>Equipamentos cadastrados para este cliente</CardDescription>
              </div>
              <Button size="sm" onClick={() => setShowEquipamentoForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {showEquipamentoForm && (
              <EquipamentoForm
                clienteId={id}
                equipamento={editingEquipamento}
                onSave={() => {
                  loadEquipamentos()
                  setShowEquipamentoForm(false)
                  setEditingEquipamento(null)
                }}
                onCancel={() => {
                  setShowEquipamentoForm(false)
                  setEditingEquipamento(null)
                }}
              />
            )}

            {equipamentos.length === 0 && !showEquipamentoForm ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum equipamento cadastrado. Clique em "Adicionar" para começar.
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {equipamentos.map((equip) => (
                  <Card key={equip.id} className="border">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">{equip.tipo}</CardTitle>
                          <CardDescription>
                            {equip.fabricante} {equip.modelo}
                          </CardDescription>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeleteEquipamentoId(equip.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="text-sm space-y-1">
                      {equip.numeroSerie && (
                        <div>
                          <span className="text-muted-foreground">N/S:</span> {equip.numeroSerie}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Delete Equipment Dialog */}
      <AlertDialog open={!!deleteEquipamentoId} onOpenChange={() => setDeleteEquipamentoId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Equipamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este equipamento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteEquipamentoId && handleDeleteEquipamento(deleteEquipamentoId)}
              className="bg-destructive text-destructive-foreground"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function EquipamentoForm({
  clienteId,
  equipamento,
  onSave,
  onCancel,
}: {
  clienteId: string
  equipamento: Equipamento | null
  onSave: () => void
  onCancel: () => void
}) {
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    tipo: equipamento?.tipo || "",
    fabricante: equipamento?.fabricante || "",
    modelo: equipamento?.modelo || "",
    numeroSerie: equipamento?.numeroSerie || "",
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.tipo) {
      toast({
        title: "Erro",
        description: "Tipo do equipamento é obrigatório",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      if (equipamento?.id) {
        // Atualizar equipamento existente
        await saveEquipamento({
          id: equipamento.id,
          clienteId,
          ...formData,
        })
      } else {
        // Criar novo equipamento sem ID
        await saveEquipamento({
          clienteId,
          ...formData,
        })
      }

      toast({
        title: "Sucesso",
        description: equipamento ? "Equipamento atualizado!" : "Equipamento adicionado!",
      })
      onSave()
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar equipamento",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="mb-4 border-primary">
      <CardHeader>
        <CardTitle className="text-base">{equipamento ? "Editar" : "Novo"} Equipamento</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo</Label>
              <Input
                id="tipo"
                value={formData.tipo}
                onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                placeholder="Ex: Compressor, Gerador"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fabricante">Fabricante</Label>
              <Select
                value={formData.fabricante}
                onValueChange={(value) => setFormData({ ...formData, fabricante: value })}
              >
                <SelectTrigger id="fabricante">
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
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="modelo">Modelo</Label>
              <Select value={formData.modelo} onValueChange={(value) => setFormData({ ...formData, modelo: value })}>
                <SelectTrigger id="modelo">
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
              <Label htmlFor="numeroSerie">Nº Série</Label>
              <Input
                id="numeroSerie"
                value={formData.numeroSerie}
                onChange={(e) => setFormData({ ...formData, numeroSerie: e.target.value })}
                placeholder="Número de série"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1 bg-transparent"
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={saving}>
              {saving ? "Salvando..." : equipamento ? "Atualizar" : "Adicionar"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
