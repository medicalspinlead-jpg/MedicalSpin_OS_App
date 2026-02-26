"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
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
import { ArrowLeft, Building2, Save, Loader2, Wrench, Plus, Pencil, Trash2, X, Check } from "lucide-react"

interface PerfilData {
  id: string
  razaoSocial: string
  nomeFantasia: string
  cnpj: string
  cidade: string
  uf: string
  telefone: string
  email: string
  responsavel: string
}

interface Equipamento {
  id: string
  tipo: string
  fabricante: string
  modelo: string
  numeroSerie: string
}

const UF_OPTIONS = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
]

export default function PerfilPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [perfil, setPerfil] = useState<PerfilData | null>(null)
  const [form, setForm] = useState({
    razaoSocial: "",
    nomeFantasia: "",
    cidade: "",
    uf: "",
    telefone: "",
    email: "",
    responsavel: "",
  })

  // Estado dos equipamentos
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([])
  const [equipLoading, setEquipLoading] = useState(true)
  const [editingEquipId, setEditingEquipId] = useState<string | null>(null)
  const [editingEquipForm, setEditingEquipForm] = useState({ tipo: "", fabricante: "", modelo: "", numeroSerie: "" })
  const [addingEquip, setAddingEquip] = useState(false)
  const [newEquipForm, setNewEquipForm] = useState({ tipo: "", fabricante: "", modelo: "", numeroSerie: "" })
  const [equipSaving, setEquipSaving] = useState(false)
  const [deleteEquipId, setDeleteEquipId] = useState<string | null>(null)

  useEffect(() => {
    async function loadPerfil() {
      try {
        const res = await fetch("/api/cliente/perfil", { credentials: "include" })
        if (res.ok) {
          const data: PerfilData = await res.json()
          setPerfil(data)
          setForm({
            razaoSocial: data.razaoSocial,
            nomeFantasia: data.nomeFantasia,
            cidade: data.cidade,
            uf: data.uf,
            telefone: data.telefone,
            email: data.email,
            responsavel: data.responsavel,
          })
        }
      } catch {
        toast({ title: "Erro ao carregar perfil", variant: "destructive" })
      } finally {
        setLoading(false)
      }
    }
    loadPerfil()
  }, [toast])

  // Carregar equipamentos
  useEffect(() => {
    async function loadEquipamentos() {
      try {
        const res = await fetch("/api/cliente/equipamentos", { credentials: "include" })
        if (res.ok) {
          setEquipamentos(await res.json())
        }
      } catch {
        // silenciar
      } finally {
        setEquipLoading(false)
      }
    }
    loadEquipamentos()
  }, [])

  // Salvar edicao de equipamento
  const handleSaveEquip = async (id: string) => {
    if (!editingEquipForm.tipo.trim() || !editingEquipForm.fabricante.trim() || !editingEquipForm.modelo.trim()) {
      toast({ title: "Tipo, fabricante e modelo sao obrigatorios", variant: "destructive" })
      return
    }
    setEquipSaving(true)
    try {
      const res = await fetch(`/api/cliente/equipamentos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(editingEquipForm),
      })
      if (res.ok) {
        const updated = await res.json()
        setEquipamentos((prev) => prev.map((e) => (e.id === id ? updated : e)))
        setEditingEquipId(null)
        toast({ title: "Equipamento atualizado" })
      } else {
        toast({ title: "Erro ao atualizar equipamento", variant: "destructive" })
      }
    } catch {
      toast({ title: "Erro ao atualizar equipamento", variant: "destructive" })
    } finally {
      setEquipSaving(false)
    }
  }

  // Adicionar novo equipamento
  const handleAddEquip = async () => {
    if (!newEquipForm.tipo.trim() || !newEquipForm.fabricante.trim() || !newEquipForm.modelo.trim()) {
      toast({ title: "Tipo, fabricante e modelo sao obrigatorios", variant: "destructive" })
      return
    }
    setEquipSaving(true)
    try {
      const res = await fetch("/api/cliente/equipamentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(newEquipForm),
      })
      if (res.ok) {
        const created = await res.json()
        setEquipamentos((prev) => [...prev, created])
        setAddingEquip(false)
        setNewEquipForm({ tipo: "", fabricante: "", modelo: "", numeroSerie: "" })
        toast({ title: "Equipamento adicionado" })
      } else {
        toast({ title: "Erro ao adicionar equipamento", variant: "destructive" })
      }
    } catch {
      toast({ title: "Erro ao adicionar equipamento", variant: "destructive" })
    } finally {
      setEquipSaving(false)
    }
  }

  // Excluir equipamento
  const handleDeleteEquip = async () => {
    if (!deleteEquipId) return
    setEquipSaving(true)
    try {
      const res = await fetch(`/api/cliente/equipamentos/${deleteEquipId}`, {
        method: "DELETE",
        credentials: "include",
      })
      if (res.ok) {
        setEquipamentos((prev) => prev.filter((e) => e.id !== deleteEquipId))
        toast({ title: "Equipamento removido" })
      } else {
        toast({ title: "Erro ao remover equipamento", variant: "destructive" })
      }
    } catch {
      toast({ title: "Erro ao remover equipamento", variant: "destructive" })
    } finally {
      setEquipSaving(false)
      setDeleteEquipId(null)
    }
  }

  const startEditEquip = (equip: Equipamento) => {
    setEditingEquipId(equip.id)
    setEditingEquipForm({
      tipo: equip.tipo,
      fabricante: equip.fabricante,
      modelo: equip.modelo,
      numeroSerie: equip.numeroSerie,
    })
  }

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    if (!form.razaoSocial.trim() || !form.nomeFantasia.trim() || !form.telefone.trim() || !form.email.trim() || !form.responsavel.trim()) {
      toast({ title: "Preencha todos os campos obrigatorios", variant: "destructive" })
      return
    }

    setSaving(true)
    try {
      const res = await fetch("/api/cliente/perfil", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      })

      if (res.ok) {
        const updated = await res.json()
        setPerfil(updated)
        toast({ title: "Dados atualizados com sucesso" })
      } else {
        toast({ title: "Erro ao salvar alteracoes", variant: "destructive" })
      }
    } catch {
      toast({ title: "Erro ao salvar alteracoes", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <Skeleton className="h-8 w-48 mb-6" />
        <Card>
          <CardContent className="p-6 space-y-4">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  const hasChanges =
    perfil &&
    (form.razaoSocial !== perfil.razaoSocial ||
      form.nomeFantasia !== perfil.nomeFantasia ||
      form.cidade !== perfil.cidade ||
      form.uf !== perfil.uf ||
      form.telefone !== perfil.telefone ||
      form.email !== perfil.email ||
      form.responsavel !== perfil.responsavel)

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.push("/cliente")} className="bg-transparent">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-foreground text-balance">Meus Dados</h2>
          <p className="text-sm text-muted-foreground">Edite as informacoes da sua empresa</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Dados da Empresa
          </CardTitle>
          <CardDescription>
            Essas informacoes ficam visiveis para a equipe tecnica. O CNPJ nao pode ser alterado.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* CNPJ - somente leitura */}
          <div className="space-y-2">
            <Label className="text-muted-foreground">CNPJ</Label>
            <Input value={perfil?.cnpj || ""} disabled className="bg-muted" />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="razaoSocial">Razao Social *</Label>
              <Input
                id="razaoSocial"
                value={form.razaoSocial}
                onChange={(e) => updateField("razaoSocial", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nomeFantasia">Nome Fantasia *</Label>
              <Input
                id="nomeFantasia"
                value={form.nomeFantasia}
                onChange={(e) => updateField("nomeFantasia", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="responsavel">Responsavel *</Label>
            <Input
              id="responsavel"
              value={form.responsavel}
              onChange={(e) => updateField("responsavel", e.target.value)}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail *</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone *</Label>
              <Input
                id="telefone"
                value={form.telefone}
                onChange={(e) => updateField("telefone", e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cidade">Cidade</Label>
              <Input
                id="cidade"
                value={form.cidade}
                onChange={(e) => updateField("cidade", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="uf">UF</Label>
              <select
                id="uf"
                value={form.uf}
                onChange={(e) => updateField("uf", e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Selecione</option>
                {UF_OPTIONS.map((uf) => (
                  <option key={uf} value={uf}>{uf}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button onClick={handleSave} disabled={saving || !hasChanges}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Alteracoes
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Equipamentos */}
      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Equipamentos
              </CardTitle>
              <CardDescription>
                Gerencie os equipamentos vinculados a sua empresa
              </CardDescription>
            </div>
            {!addingEquip && (
              <Button
                size="sm"
                onClick={() => {
                  setAddingEquip(true)
                  setEditingEquipId(null)
                  setNewEquipForm({ tipo: "", fabricante: "", modelo: "", numeroSerie: "" })
                }}
              >
                <Plus className="h-4 w-4 mr-1" />
                Adicionar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {equipLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {/* Formulario de adicao */}
              {addingEquip && (
                <div className="rounded-lg border border-dashed border-primary/40 bg-muted/30 p-4 space-y-3">
                  <p className="text-sm font-medium text-foreground">Novo Equipamento</p>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Tipo *</Label>
                      <Input
                        placeholder="Ex: Compressor"
                        value={newEquipForm.tipo}
                        onChange={(e) => setNewEquipForm((p) => ({ ...p, tipo: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Fabricante *</Label>
                      <Input
                        placeholder="Ex: Atlas Copco"
                        value={newEquipForm.fabricante}
                        onChange={(e) => setNewEquipForm((p) => ({ ...p, fabricante: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Modelo *</Label>
                      <Input
                        placeholder="Ex: GA 45+"
                        value={newEquipForm.modelo}
                        onChange={(e) => setNewEquipForm((p) => ({ ...p, modelo: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">N. Serie</Label>
                      <Input
                        placeholder="Opcional"
                        value={newEquipForm.numeroSerie}
                        onChange={(e) => setNewEquipForm((p) => ({ ...p, numeroSerie: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setAddingEquip(false)}
                      disabled={equipSaving}
                      className="bg-transparent"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Cancelar
                    </Button>
                    <Button size="sm" onClick={handleAddEquip} disabled={equipSaving}>
                      {equipSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
                      Salvar
                    </Button>
                  </div>
                </div>
              )}

              {/* Lista de equipamentos */}
              {equipamentos.length === 0 && !addingEquip ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhum equipamento cadastrado
                </p>
              ) : (
                equipamentos.map((equip) =>
                  editingEquipId === equip.id ? (
                    /* Formulario de edicao inline */
                    <div key={equip.id} className="rounded-lg border border-primary/40 bg-muted/30 p-4 space-y-3">
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Tipo *</Label>
                          <Input
                            value={editingEquipForm.tipo}
                            onChange={(e) => setEditingEquipForm((p) => ({ ...p, tipo: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Fabricante *</Label>
                          <Input
                            value={editingEquipForm.fabricante}
                            onChange={(e) => setEditingEquipForm((p) => ({ ...p, fabricante: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Modelo *</Label>
                          <Input
                            value={editingEquipForm.modelo}
                            onChange={(e) => setEditingEquipForm((p) => ({ ...p, modelo: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">N. Serie</Label>
                          <Input
                            value={editingEquipForm.numeroSerie}
                            onChange={(e) => setEditingEquipForm((p) => ({ ...p, numeroSerie: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingEquipId(null)}
                          disabled={equipSaving}
                          className="bg-transparent"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Cancelar
                        </Button>
                        <Button size="sm" onClick={() => handleSaveEquip(equip.id)} disabled={equipSaving}>
                          {equipSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
                          Salvar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* Card do equipamento */
                    <div key={equip.id} className="rounded-lg border p-4 flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-foreground truncate">
                          {equip.tipo} - {equip.fabricante} {equip.modelo}
                        </p>
                        {equip.numeroSerie && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {"N. Serie: "}{equip.numeroSerie}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 bg-transparent"
                          onClick={() => startEditEquip(equip)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          <span className="sr-only">Editar</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive bg-transparent"
                          onClick={() => setDeleteEquipId(equip.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span className="sr-only">Excluir</span>
                        </Button>
                      </div>
                    </div>
                  )
                )
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de confirmacao de exclusao */}
      <AlertDialog open={!!deleteEquipId} onOpenChange={(open) => !open && setDeleteEquipId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir equipamento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acao nao pode ser desfeita. O equipamento sera removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={equipSaving}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteEquip}
              disabled={equipSaving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {equipSaving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
