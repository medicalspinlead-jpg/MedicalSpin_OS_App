"use client"

import { useState } from "react"
import Link from "next/link"
import { Plus, Search, Trash2, Edit, Users, ArrowLeft, Shield, Wrench, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { toast } from "sonner"

interface Usuario {
  id: string
  nome: string
  email: string
  cargo: string
  ativo: boolean
  createdAt: string
}

const fetcher = async (url: string) => {
  const res = await fetch(url, { credentials: "include" })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || "Erro ao buscar dados")
  }
  return res.json()
}

export default function AdminPage() {
  const { usuario: currentUser } = useAuth()
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [editUser, setEditUser] = useState<Usuario | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    senha: "",
    cargo: "tecnico",
  })
  const [loading, setLoading] = useState(false)

  const {
    data: usuarios = [],
    isLoading,
    mutate,
    error,
  } = useSWR<Usuario[]>("/api/usuarios", fetcher, {
    revalidateOnFocus: true,
    revalidateOnMount: true,
  })

  // Verificar se o usuário é admin
  if (currentUser && currentUser.cargo !== "admin") {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="p-4 bg-destructive/10 rounded-full mb-4">
              <Shield className="h-8 w-8 text-destructive" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Acesso Negado</h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              Apenas administradores podem acessar esta pagina.
            </p>
            <Button asChild>
              <Link href="/">Voltar ao Inicio</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleCreate = async () => {
    if (!formData.nome || !formData.email || !formData.senha) {
      toast.error("Preencha todos os campos obrigatorios")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Erro ao criar usuario")
      }

      toast.success("Usuario criado com sucesso")
      setIsCreateOpen(false)
      setFormData({ nome: "", email: "", senha: "", cargo: "tecnico" })
      mutate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao criar usuario")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async () => {
    if (!editUser) return
    if (!formData.nome || !formData.email) {
      toast.error("Nome e email sao obrigatorios")
      return
    }

    setLoading(true)
    try {
      const updateData: Record<string, string> = {
        nome: formData.nome,
        email: formData.email,
        cargo: formData.cargo,
      }
      
      if (formData.senha) {
        updateData.senha = formData.senha
      }

      const res = await fetch(`/api/usuarios/${editUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updateData),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Erro ao atualizar usuario")
      }

      toast.success("Usuario atualizado com sucesso")
      setEditUser(null)
      setFormData({ nome: "", email: "", senha: "", cargo: "tecnico" })
      mutate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao atualizar usuario")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/usuarios/${id}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Erro ao excluir usuario")
      }

      toast.success("Usuario excluido com sucesso")
      setDeleteId(null)
      mutate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir usuario")
    }
  }

  const openEditDialog = (user: Usuario) => {
    setEditUser(user)
    setFormData({
      nome: user.nome,
      email: user.email,
      senha: "",
      cargo: user.cargo,
    })
    setShowPassword(false)
  }

  const openCreateDialog = () => {
    setFormData({ nome: "", email: "", senha: "", cargo: "tecnico" })
    setShowPassword(false)
    setIsCreateOpen(true)
  }

  const filteredUsuarios = usuarios.filter(
    (user) =>
      user.nome?.toLowerCase().includes(search.toLowerCase()) ||
      user.email?.toLowerCase().includes(search.toLowerCase()) ||
      user.cargo?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-muted/30">
      <main className="container mx-auto px-4 py-4 md:py-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            <Button asChild variant="ghost" size="sm" className="mb-2 md:mb-4">
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Link>
            </Button>
            <h1 className="text-2xl md:text-3xl font-semibold text-foreground">Administracao</h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">Gerencie usuarios do sistema</p>
          </div>
          <Button size="sm" className="w-full sm:w-auto" onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Usuario
          </Button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, email ou cargo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 text-sm md:text-base"
            />
          </div>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
              <p className="text-sm text-muted-foreground">Carregando usuarios...</p>
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="p-4 bg-destructive/10 rounded-full mb-4">
                <Shield className="h-8 w-8 text-destructive" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Erro ao carregar usuarios</h3>
              <p className="text-sm text-muted-foreground mb-4">{error.message}</p>
            </CardContent>
          </Card>
        ) : filteredUsuarios.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="p-4 bg-muted rounded-full mb-4">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Nenhum usuario encontrado</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {search ? "Tente buscar por outro termo" : "Comece cadastrando um novo usuario"}
              </p>
              {!search && (
                <Button onClick={openCreateDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Cadastrar Usuario
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredUsuarios.map((user) => (
              <Card key={user.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="p-4 md:p-6 pb-2 md:pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base md:text-lg truncate">{user.nome}</CardTitle>
                      <CardDescription className="mt-1 text-xs md:text-sm truncate">{user.email}</CardDescription>
                    </div>
                    <Badge 
                      variant={user.cargo === "admin" ? "default" : "secondary"} 
                      className="flex items-center gap-1 shrink-0 text-xs"
                    >
                      {user.cargo === "admin" ? (
                        <Shield className="h-3 w-3" />
                      ) : (
                        <Wrench className="h-3 w-3" />
                      )}
                      {user.cargo === "admin" ? "Admin" : "Tecnico"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 md:p-6 pt-2 md:pt-3">
                  <div className="space-y-1.5 md:space-y-2 text-xs md:text-sm">
                    <div className="flex flex-wrap gap-1">
                      <span className="text-muted-foreground">Status:</span>
                      <span className={user.ativo ? "text-green-600" : "text-red-600"}>
                        {user.ativo ? "Ativo" : "Inativo"}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <span className="text-muted-foreground">Criado em:</span>
                      <span className="text-foreground">
                        {new Date(user.createdAt).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-3 md:mt-4">
                    <Button 
                      size="sm" 
                      className="flex-1 bg-transparent text-xs md:text-sm" 
                      variant="outline"
                      onClick={() => openEditDialog(user)}
                    >
                      <Edit className="h-3 w-3 mr-1.5 md:mr-2" />
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setDeleteId(user.id)}
                      className="text-destructive hover:text-destructive bg-transparent"
                      disabled={user.id === currentUser?.id}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Usuario</DialogTitle>
            <DialogDescription>
              Preencha os dados para criar um novo usuario.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="create-nome">Nome *</Label>
              <Input
                id="create-nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Nome completo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-email">Email *</Label>
              <Input
                id="create-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@exemplo.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-senha">Senha *</Label>
              <div className="relative">
                <Input
                  id="create-senha"
                  type={showPassword ? "text" : "password"}
                  value={formData.senha}
                  onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                  placeholder="Senha"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-cargo">Cargo</Label>
              <Select
                value={formData.cargo}
                onValueChange={(value) => setFormData({ ...formData, cargo: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cargo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tecnico">Tecnico</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)} className="bg-transparent">
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={loading}>
              {loading ? "Criando..." : "Criar Usuario"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
            <DialogDescription>
              Atualize os dados do usuario. Deixe a senha em branco para manter a atual.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-nome">Nome *</Label>
              <Input
                id="edit-nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Nome completo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email *</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@exemplo.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-senha">Nova Senha (opcional)</Label>
              <div className="relative">
                <Input
                  id="edit-senha"
                  type={showPassword ? "text" : "password"}
                  value={formData.senha}
                  onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                  placeholder="Deixe em branco para manter"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-cargo">Cargo</Label>
              <Select
                value={formData.cargo}
                onValueChange={(value) => setFormData({ ...formData, cargo: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cargo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tecnico">Tecnico</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)} className="bg-transparent">
              Cancelar
            </Button>
            <Button onClick={handleUpdate} disabled={loading}>
              {loading ? "Salvando..." : "Salvar Alteracoes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Usuario</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este usuario? Esta acao nao pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
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
