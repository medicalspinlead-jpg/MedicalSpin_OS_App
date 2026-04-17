"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Plus, Search, Trash2, Edit, Users, ArrowLeft, Shield, Wrench, Eye, EyeOff, UserCircle, Building2, Zap, Radio, Scan, UserPlus, X, CheckSquare, Square, Clock, CheckCircle, XCircle } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { toast } from "sonner"
import { getClientes } from "@/lib/storage"
import type { Cliente } from "@/lib/storage"

interface Usuario {
  id: string
  nome: string
  email: string
  cargo: string
  ativo: boolean
  aprovado?: boolean
  createdAt: string
  cliente?: {
    id: string
    razaoSocial: string
    nomeFantasia: string
    cnpj: string
    cidade: string
    uf: string
  }
}

interface Departamento {
  id: string
  nome: string
  descricao: string | null
  cor: string
  icone: string
  ativo: boolean
}

interface UsuarioDepartamento {
  id: string
  usuarioId: string
  departamentoId: string
  usuario?: Usuario
}

interface ClienteDepartamento {
  id: string
  clienteId: string
  departamentoId: string
  usuarioResponsavelId: string | null
  cliente?: Cliente
  usuarioResponsavel?: { id: string; nome: string; email: string }
}

const fetcher = async (url: string) => {
  const res = await fetch(url, { credentials: "include" })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || "Erro ao buscar dados")
  }
  return res.json()
}

const departamentoTipos = [
  { value: "Ressonância Magnética", label: "Ressonância Magnética", Icon: Zap },
  { value: "Ultrassom", label: "Ultrassom", Icon: Radio },
  { value: "Tomografia", label: "Tomografia", Icon: Scan },
];

const departamentoIcons = [
  { value: "Zap", label: "Ressonância", Icon: Zap },
  { value: "Radio", label: "Ultrassom", Icon: Radio },
  { value: "Scan", label: "Tomografia", Icon: Scan },
  { value: "Building2", label: "Geral", Icon: Building2 },
]

const departamentoCores = [
  { value: "#ef4444", label: "Vermelho" },
  { value: "#f97316", label: "Laranja" },
  { value: "#eab308", label: "Amarelo" },
  { value: "#22c55e", label: "Verde" },
  { value: "#14b8a6", label: "Teal" },
  { value: "#3b82f6", label: "Azul" },
  { value: "#8b5cf6", label: "Violeta" },
  { value: "#ec4899", label: "Rosa" },
]

export default function AdminPage() {
  const { usuario: currentUser } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialTab = searchParams.get("tab") || "usuarios"
  
  const [activeTab, setActiveTab] = useState(initialTab)
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

  // Departamentos state
  const [selectedDept, setSelectedDept] = useState<Departamento | null>(null)
  const [isDeptCreateOpen, setIsDeptCreateOpen] = useState(false)
  const [isDeptEditOpen, setIsDeptEditOpen] = useState(false)
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const [isAddClienteOpen, setIsAddClienteOpen] = useState(false)
  const [deptFormData, setDeptFormData] = useState({
    nome: "",
    descricao: "",
    cor: "#3b82f6",
    icone: "Building2",
  })
  const [deptUsuarios, setDeptUsuarios] = useState<UsuarioDepartamento[]>([])
  const [deptClientes, setDeptClientes] = useState<ClienteDepartamento[]>([])
  const [allClientes, setAllClientes] = useState<Cliente[]>([])
  const [selectedUsuarioId, setSelectedUsuarioId] = useState("")
  const [selectedClienteId, setSelectedClienteId] = useState("")
  const [selectedResponsavelId, setSelectedResponsavelId] = useState("")
  const [selectedClienteIds, setSelectedClienteIds] = useState<string[]>([])
  const [clienteSearch, setClienteSearch] = useState("")

  const {
    data: usuarios = [],
    isLoading,
    mutate,
    error,
  } = useSWR<Usuario[]>("/api/usuarios", fetcher, {
    revalidateOnFocus: true,
    revalidateOnMount: true,
  })

  const {
    data: departamentos = [],
    isLoading: isLoadingDepts,
    mutate: mutateDepts,
  } = useSWR<Departamento[]>("/api/departamentos", fetcher, {
    revalidateOnFocus: true,
    revalidateOnMount: true,
  })

  const {
    data: usuariosPendentes = [],
    isLoading: isLoadingPendentes,
    mutate: mutatePendentes,
  } = useSWR<Usuario[]>("/api/usuarios/pendentes", fetcher, {
    revalidateOnFocus: true,
    revalidateOnMount: true,
  })

  // Load clientes
  useEffect(() => {
    getClientes().then(setAllClientes)
  }, [])

  // Load dept usuarios e clientes when selected
  useEffect(() => {
    if (selectedDept) {
      fetch(`/api/departamentos/${selectedDept.id}/usuarios`, { credentials: "include" })
        .then((res) => res.json())
        .then(setDeptUsuarios)
        .catch(() => setDeptUsuarios([]))

      fetch(`/api/departamentos/${selectedDept.id}/clientes`, { credentials: "include" })
        .then((res) => res.json())
        .then(setDeptClientes)
        .catch(() => setDeptClientes([]))
    }
  }, [selectedDept])

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
              Apenas administradores podem acessar esta página.
            </p>
            <Button asChild>
              <Link href="/">Voltar ao Início</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Usuário handlers
  const handleCreate = async () => {
    if (!formData.nome || !formData.email || !formData.senha) {
      toast.error("Preencha todos os campos obrigatórios")
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
        throw new Error(error.error || "Erro ao criar usuário")
      }

      toast.success("Usuário criado com sucesso")
      setIsCreateOpen(false)
      setFormData({ nome: "", email: "", senha: "", cargo: "tecnico" })
      mutate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao criar usuário")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async () => {
    if (!editUser) return
    if (!formData.nome || !formData.email) {
      toast.error("Nome e email são obrigatórios")
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
        throw new Error(error.error || "Erro ao atualizar usuário")
      }

      toast.success("Usuário atualizado com sucesso")
      setEditUser(null)
      setFormData({ nome: "", email: "", senha: "", cargo: "tecnico" })
      mutate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao atualizar usuário")
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
        throw new Error(error.error || "Erro ao excluir usuário")
      }

      toast.success("Usuário excluído com sucesso")
      setDeleteId(null)
      mutate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir usuário")
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

  // Departamento handlers
  const handleCreateDept = async () => {
    if (!deptFormData.nome) {
      toast.error("Nome é obrigatório")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/departamentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(deptFormData),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Erro ao criar departamento")
      }

      toast.success("Departamento criado com sucesso")
      setIsDeptCreateOpen(false)
      setDeptFormData({ nome: "", descricao: "", cor: "#3b82f6", icone: "Building2" })
      mutateDepts()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao criar departamento")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateDept = async () => {
    if (!selectedDept) return

    setLoading(true)
    try {
      const res = await fetch(`/api/departamentos/${selectedDept.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(deptFormData),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Erro ao atualizar departamento")
      }

      toast.success("Departamento atualizado com sucesso")
      setIsDeptEditOpen(false)
      mutateDepts()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao atualizar departamento")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteDept = async (id: string) => {
    try {
      const res = await fetch(`/api/departamentos/${id}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Erro ao excluir departamento")
      }

      toast.success("Departamento excluído com sucesso")
      setSelectedDept(null)
      mutateDepts()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir departamento")
    }
  }

  const handleAddUsuarioToDept = async () => {
    if (!selectedDept || !selectedUsuarioId) return

    setLoading(true)
    try {
      const res = await fetch(`/api/departamentos/${selectedDept.id}/usuarios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ usuarioId: selectedUsuarioId }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Erro ao adicionar usuário")
      }

      toast.success("Usuário adicionado ao departamento")
      setIsAddUserOpen(false)
      setSelectedUsuarioId("")
      
      // Reload usuários
      const usersRes = await fetch(`/api/departamentos/${selectedDept.id}/usuarios`, { credentials: "include" })
      setDeptUsuarios(await usersRes.json())
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao adicionar usuário")
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveUsuarioFromDept = async (usuarioId: string) => {
    if (!selectedDept) return

    try {
      await fetch(`/api/departamentos/${selectedDept.id}/usuarios/${usuarioId}`, {
        method: "DELETE",
        credentials: "include",
      })

      toast.success("Usuário removido do departamento")
      setDeptUsuarios(deptUsuarios.filter((u) => u.usuarioId !== usuarioId))
    } catch (err) {
      toast.error("Erro ao remover usuário")
    }
  }

  const handleAddClienteToDept = async () => {
    if (!selectedDept || selectedClienteIds.length === 0) return

    setLoading(true)
    let successCount = 0
    let errorCount = 0

    try {
      for (const clienteId of selectedClienteIds) {
        try {
          const res = await fetch(`/api/departamentos/${selectedDept.id}/clientes`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              clienteId,
              usuarioResponsavelId: selectedResponsavelId || null,
            }),
          })

          if (res.ok) {
            successCount++
          } else {
            errorCount++
          }
        } catch {
          errorCount++
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} cliente(s) adicionado(s) ao departamento`)
      }
      if (errorCount > 0) {
        toast.error(`${errorCount} cliente(s) não puderam ser adicionados`)
      }

      setIsAddClienteOpen(false)
      setSelectedClienteIds([])
      setSelectedResponsavelId("")
      setClienteSearch("")
      
      // Reload clientes
      const clientesRes = await fetch(`/api/departamentos/${selectedDept.id}/clientes`, { credentials: "include" })
      setDeptClientes(await clientesRes.json())
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao adicionar clientes")
    } finally {
      setLoading(false)
    }
  }
  
  const toggleClienteSelection = (clienteId: string) => {
    setSelectedClienteIds((prev) =>
      prev.includes(clienteId)
        ? prev.filter((id) => id !== clienteId)
        : [...prev, clienteId]
    )
  }

  const toggleSelectAllClientes = () => {
    const availableClientes = allClientes.filter(
      (c) =>
        !deptClientes.some((dc) => dc.clienteId === c.id) &&
        (clienteSearch === "" ||
          c.nomeFantasia?.toLowerCase().includes(clienteSearch.toLowerCase()) ||
          c.razaoSocial?.toLowerCase().includes(clienteSearch.toLowerCase()) ||
          c.cidade?.toLowerCase().includes(clienteSearch.toLowerCase()))
    )
    
    if (selectedClienteIds.length === availableClientes.length) {
      setSelectedClienteIds([])
    } else {
      setSelectedClienteIds(availableClientes.map((c) => c.id))
    }
  }

  const handleRemoveClienteFromDept = async (clienteId: string) => {
    if (!selectedDept) return

    try {
      await fetch(`/api/departamentos/${selectedDept.id}/clientes/${clienteId}`, {
        method: "DELETE",
        credentials: "include",
      })

      toast.success("Cliente removido do departamento")
      setDeptClientes(deptClientes.filter((c) => c.clienteId !== clienteId))
    } catch (err) {
      toast.error("Erro ao remover cliente")
    }
  }

  const handleUpdateResponsavel = async (clienteId: string, usuarioId: string | null) => {
    if (!selectedDept) return

    try {
      await fetch(`/api/departamentos/${selectedDept.id}/clientes/${clienteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ usuarioResponsavelId: usuarioId }),
      })

      toast.success("Responsável atualizado")
      
      // Reload clientes
      const clientesRes = await fetch(`/api/departamentos/${selectedDept.id}/clientes`, { credentials: "include" })
      setDeptClientes(await clientesRes.json())
    } catch (err) {
      toast.error("Erro ao atualizar responsável")
    }
  }

  // Aprovação de usuários
  const handleAprovarUsuario = async (id: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/usuarios/${id}/aprovar`, {
        method: "POST",
        credentials: "include",
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Erro ao aprovar usuário")
      }

      toast.success("Usuário aprovado com sucesso! Uma notificação foi enviada.")
      mutatePendentes()
      mutate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao aprovar usuário")
    } finally {
      setLoading(false)
    }
  }

  const handleRejeitarUsuario = async (id: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/usuarios/${id}/aprovar`, {
        method: "DELETE",
        credentials: "include",
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Erro ao rejeitar usuário")
      }

      toast.success("Usuário rejeitado e removido")
      mutatePendentes()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao rejeitar usuário")
    } finally {
      setLoading(false)
    }
  }

  const filteredUsuarios = usuarios.filter(
    (user) =>
      user.nome?.toLowerCase().includes(search.toLowerCase()) ||
      user.email?.toLowerCase().includes(search.toLowerCase()) ||
      user.cargo?.toLowerCase().includes(search.toLowerCase())
  )

  const tecnicos = usuarios.filter((u) => u.cargo === "tecnico" && u.ativo)

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const getIconComponent = (iconName: string) => {
    const found = departamentoIcons.find((i) => i.value === iconName)
    return found ? found.Icon : Building2
  }

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
            <h1 className="text-2xl md:text-3xl font-semibold text-foreground">Administração</h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">Gerencie usuarios e departamentos</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="usuarios" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="departamentos" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Departamentos
            </TabsTrigger>
            <TabsTrigger value="aprovacoes" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Aprovações
              {usuariosPendentes.length > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 min-w-5 px-1.5">
                  {usuariosPendentes.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Tab Usuarios */}
          <TabsContent value="usuarios">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div className="relative w-full sm:max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, email ou cargo..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 text-sm md:text-base"
                />
              </div>
              <Button size="sm" className="w-full sm:w-auto" onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Usuario
              </Button>
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
                          variant={user.cargo === "admin" ? "default" : user.cargo === "cliente" ? "outline" : "secondary"} 
                          className="flex items-center gap-1 shrink-0 text-xs"
                        >
                          {user.cargo === "admin" ? (
                            <Shield className="h-3 w-3" />
                          ) : user.cargo === "cliente" ? (
                            <UserCircle className="h-3 w-3" />
                          ) : (
                            <Wrench className="h-3 w-3" />
                          )}
                          {user.cargo === "admin" ? "Admin" : user.cargo === "cliente" ? "Cliente" : "Tecnico"}
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
          </TabsContent>

          {/* Tab Departamentos */}
          <TabsContent value="departamentos">
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Lista de Departamentos */}
              <div className="lg:col-span-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Departamentos</h3>
                  <Button size="sm" onClick={() => {
                    setDeptFormData({ nome: "", descricao: "", cor: "#3b82f6", icone: "Building2" })
                    setIsDeptCreateOpen(true)
                  }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo
                  </Button>
                </div>

                {isLoadingDepts ? (
                  <Card>
                    <CardContent className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    </CardContent>
                  </Card>
                ) : departamentos.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-8">
                      <Building2 className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">Nenhum departamento</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-2">
                    {departamentos.map((dept) => {
                      const IconComponent = getIconComponent(dept.icone)
                      return (
                        <Card
                          key={dept.id}
                          className={`cursor-pointer transition-all ${selectedDept?.id === dept.id ? "ring-2 ring-primary" : "hover:shadow-md"}`}
                          onClick={() => setSelectedDept(dept)}
                        >
                          <CardContent className="p-4 flex items-center gap-3">
                            <div
                              className="p-2 rounded-lg"
                              style={{ backgroundColor: `${dept.cor}20` }}
                            >
                              <IconComponent className="h-5 w-5" style={{ color: dept.cor }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{dept.nome}</p>
                              {dept.descricao && (
                                <p className="text-xs text-muted-foreground truncate">{dept.descricao}</p>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Detalhes do Departamento */}
              <div className="lg:col-span-2">
                {selectedDept ? (
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="p-3 rounded-xl"
                          style={{ backgroundColor: `${selectedDept.cor}20` }}
                        >
                          {(() => {
                            const IconComponent = getIconComponent(selectedDept.icone)
                            return <IconComponent className="h-6 w-6" style={{ color: selectedDept.cor }} />
                          })()}
                        </div>
                        <div>
                          <CardTitle>{selectedDept.nome}</CardTitle>
                          {selectedDept.descricao && (
                            <CardDescription>{selectedDept.descricao}</CardDescription>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setDeptFormData({
                              nome: selectedDept.nome,
                              descricao: selectedDept.descricao || "",
                              cor: selectedDept.cor,
                              icone: selectedDept.icone,
                            })
                            setIsDeptEditOpen(true)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteDept(selectedDept.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Tecnicos */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium flex items-center gap-2">
                            <Wrench className="h-4 w-4" />
                            Tecnicos ({deptUsuarios.length})
                          </h4>
                          <Button size="sm" variant="outline" onClick={() => setIsAddUserOpen(true)}>
                            <UserPlus className="h-4 w-4 mr-2" />
                            Adicionar
                          </Button>
                        </div>
                        {deptUsuarios.length === 0 ? (
                          <p className="text-sm text-muted-foreground italic">Nenhum tecnico atribuido</p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {deptUsuarios.map((ud) => (
                              <div
                                key={ud.id}
                                className="flex items-center gap-2 bg-muted/50 rounded-full px-3 py-1.5"
                              >
                                <Avatar className="h-6 w-6">
                                  <AvatarFallback className="text-xs">
                                    {getInitials(ud.usuario?.nome || "?")}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm font-medium">{ud.usuario?.nome}</span>
                                {currentUser?.cargo === "admin" && (
                                  <button
                                    onClick={() => handleRemoveUsuarioFromDept(ud.usuarioId)}
                                    className="ml-1 p-0.5 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                    title="Remover tecnico do departamento"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Clientes */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Clientes ({deptClientes.length})
                          </h4>
                          <Button size="sm" variant="outline" onClick={() => setIsAddClienteOpen(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Adicionar
                          </Button>
                        </div>
                        {deptClientes.length === 0 ? (
                          <p className="text-sm text-muted-foreground italic">Nenhum cliente atribuido</p>
                        ) : (
                          <div className="space-y-2 max-h-[400px] overflow-y-auto">
                            {deptClientes.map((cd) => (
                              <div
                                key={cd.id}
                                className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3 bg-muted/30 rounded-lg"
                              >
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm leading-tight line-clamp-2">
                                    {cd.cliente?.nomeFantasia || cd.cliente?.razaoSocial}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    {cd.cliente?.cidade}, {cd.cliente?.uf}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                  <Select
                                    value={cd.usuarioResponsavelId || "none"}
                                    onValueChange={(value) =>
                                      handleUpdateResponsavel(cd.clienteId, value === "none" ? null : value)
                                    }
                                  >
                                    <SelectTrigger className="flex-1 sm:w-[140px] h-8 text-xs">
                                      <SelectValue placeholder="Responsavel" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="none">Sem responsavel</SelectItem>
                                      {deptUsuarios.map((ud) => (
                                        <SelectItem key={ud.usuarioId} value={ud.usuarioId}>
                                          {ud.usuario?.nome}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  {currentUser?.cargo === "admin" && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                                      onClick={() => handleRemoveClienteFromDept(cd.clienteId)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                      <span className="sr-only">Remover cliente</span>
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Selecione um departamento</h3>
                      <p className="text-sm text-muted-foreground text-center">
                        Clique em um departamento para ver detalhes e gerenciar tecnicos e clientes
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Tab Aprovacoes */}
          <TabsContent value="aprovacoes">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-amber-500" />
                  Contas Aguardando Aprovacao
                </CardTitle>
                <CardDescription>
                  Usuarios que se cadastraram e aguardam liberacao para acessar o sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingPendentes ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                    <p className="text-sm text-muted-foreground">Carregando...</p>
                  </div>
                ) : usuariosPendentes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
                      <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-lg font-semibold mb-1">Nenhuma pendencia</h3>
                    <p className="text-sm text-muted-foreground max-w-sm">
                      Nao ha usuarios aguardando aprovacao no momento.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {usuariosPendentes.map((usuario) => (
                      <div
                        key={usuario.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg border bg-card"
                      >
                        <div className="flex items-start gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                              {getInitials(usuario.nome)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold">{usuario.nome}</h4>
                              <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-900/20">
                                <Clock className="h-3 w-3 mr-1" />
                                Pendente
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{usuario.email}</p>
                            {usuario.cliente && (
                              <div className="flex items-center gap-2 text-sm">
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{usuario.cliente.nomeFantasia || usuario.cliente.razaoSocial}</span>
                                <span className="text-muted-foreground">-</span>
                                <span className="text-muted-foreground">{usuario.cliente.cnpj}</span>
                              </div>
                            )}
                            {usuario.cliente && (
                              <p className="text-xs text-muted-foreground">
                                {usuario.cliente.cidade}, {usuario.cliente.uf}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              Cadastrado em: {new Date(usuario.createdAt).toLocaleDateString("pt-BR", { 
                                day: "2-digit", 
                                month: "2-digit", 
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit"
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 sm:flex-shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRejeitarUsuario(usuario.id)}
                            disabled={loading}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Rejeitar
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleAprovarUsuario(usuario.id)}
                            disabled={loading}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Aprovar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Create User Dialog */}
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
                  <SelectItem value="cliente">Cliente</SelectItem>
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

      {/* Edit User Dialog */}
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
                  <SelectItem value="cliente">Cliente</SelectItem>
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

      {/* Delete User Confirmation */}
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

      {/* Create Departamento Dialog */}
      <Dialog open={isDeptCreateOpen} onOpenChange={setIsDeptCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Departamento</DialogTitle>
            <DialogDescription>
              Crie um novo departamento para organizar tecnicos e clientes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tipo *</Label>
              <Select
                value={deptFormData.nome}
                onValueChange={(value) =>
                  setDeptFormData({ ...deptFormData, nome: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>

                <SelectContent>
                  {departamentoTipos.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      <div className="flex items-center gap-2">
                        <item.Icon className="h-4 w-4" />
                        {item.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dept-descricao">Descricao</Label>
              <Input
                id="dept-descricao"
                value={deptFormData.descricao}
                onChange={(e) => setDeptFormData({ ...deptFormData, descricao: e.target.value })}
                placeholder="Descricao opcional"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Icone</Label>
                <Select
                  value={deptFormData.icone}
                  onValueChange={(value) => setDeptFormData({ ...deptFormData, icone: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {departamentoIcons.map((icon) => (
                      <SelectItem key={icon.value} value={icon.value}>
                        <div className="flex items-center gap-2">
                          <icon.Icon className="h-4 w-4" />
                          {icon.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Cor</Label>
                <Select
                  value={deptFormData.cor}
                  onValueChange={(value) => setDeptFormData({ ...deptFormData, cor: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {departamentoCores.map((cor) => (
                      <SelectItem key={cor.value} value={cor.value}>
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 rounded-full" style={{ backgroundColor: cor.value }} />
                          {cor.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeptCreateOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateDept} disabled={loading}>
              {loading ? "Criando..." : "Criar Departamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Departamento Dialog */}
      <Dialog open={isDeptEditOpen} onOpenChange={setIsDeptEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Departamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tipo *</Label>
              <Select
                value={deptFormData.nome}
                onValueChange={(value) =>
                  setDeptFormData({ ...deptFormData, nome: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>

                <SelectContent>
                  {departamentoTipos.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      <div className="flex items-center gap-2">
                        <item.Icon className="h-4 w-4" />
                        {item.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dept-edit-descricao">Descricao</Label>
              <Input
                id="dept-edit-descricao"
                value={deptFormData.descricao}
                onChange={(e) => setDeptFormData({ ...deptFormData, descricao: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Icone</Label>
                <Select
                  value={deptFormData.icone}
                  onValueChange={(value) => setDeptFormData({ ...deptFormData, icone: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {departamentoIcons.map((icon) => (
                      <SelectItem key={icon.value} value={icon.value}>
                        <div className="flex items-center gap-2">
                          <icon.Icon className="h-4 w-4" />
                          {icon.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Cor</Label>
                <Select
                  value={deptFormData.cor}
                  onValueChange={(value) => setDeptFormData({ ...deptFormData, cor: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {departamentoCores.map((cor) => (
                      <SelectItem key={cor.value} value={cor.value}>
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 rounded-full" style={{ backgroundColor: cor.value }} />
                          {cor.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeptEditOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateDept} disabled={loading}>
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Usuario to Dept Dialog */}
      <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Tecnico</DialogTitle>
            <DialogDescription>
              Selecione um tecnico para adicionar ao departamento.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tecnico</Label>
              <Select value={selectedUsuarioId} onValueChange={setSelectedUsuarioId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um tecnico" />
                </SelectTrigger>
                <SelectContent>
                  {tecnicos
                    .filter((t) => !deptUsuarios.some((du) => du.usuarioId === t.id))
                    .map((tecnico) => (
                      <SelectItem key={tecnico.id} value={tecnico.id}>
                        {tecnico.nome}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddUsuarioToDept} disabled={loading || !selectedUsuarioId}>
              {loading ? "Adicionando..." : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Clientes to Dept Dialog - Bulk Selection */}
      <Dialog open={isAddClienteOpen} onOpenChange={(open) => {
        setIsAddClienteOpen(open)
        if (!open) {
          setSelectedClienteIds([])
          setClienteSearch("")
        }
      }}>
        <DialogContent className="w-[95vw] max-w-lg p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-4 pt-4 pb-3 sm:px-6 sm:pt-6 shrink-0">
            <DialogTitle>Adicionar Clientes</DialogTitle>
            <DialogDescription>
              Selecione um ou mais clientes para adicionar ao departamento.
            </DialogDescription>
          </DialogHeader>
          
          {/* Search - Fixed */}
          <div className="px-4 sm:px-6 pb-3 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar clientes..."
                value={clienteSearch}
                onChange={(e) => setClienteSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          {/* Select All - Fixed */}
          <div className="px-4 sm:px-6 pb-2 shrink-0">
            {(() => {
              const availableClientes = allClientes.filter(
                (c) =>
                  !deptClientes.some((dc) => dc.clienteId === c.id) &&
                  (clienteSearch === "" ||
                    c.nomeFantasia?.toLowerCase().includes(clienteSearch.toLowerCase()) ||
                    c.razaoSocial?.toLowerCase().includes(clienteSearch.toLowerCase()) ||
                    c.cidade?.toLowerCase().includes(clienteSearch.toLowerCase()) ||
                    c.cnpj?.includes(clienteSearch))
              )
              
              const allSelected = availableClientes.length > 0 && 
                availableClientes.every((c) => selectedClienteIds.includes(c.id))
              
              return (
                <div className="flex items-center justify-between gap-2 py-2 border-b">
                  <button
                    type="button"
                    onClick={toggleSelectAllClientes}
                    className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
                  >
                    <Checkbox checked={allSelected} />
                    <span className="hidden sm:inline">Selecionar todos ({availableClientes.length})</span>
                    <span className="sm:hidden">Todos ({availableClientes.length})</span>
                  </button>
                  {selectedClienteIds.length > 0 && (
                    <Badge variant="secondary" className="shrink-0">
                      {selectedClienteIds.length} selecionado(s)
                    </Badge>
                  )}
                </div>
              )
            })()}
          </div>
          
          {/* Cliente List - Scrollable */}
          <div className="px-4 sm:px-6 min-h-0 shrink">
            <ScrollArea className="h-[200px] sm:h-[250px] border rounded-lg">
              <div className="p-2 space-y-1">
                {allClientes
                  .filter(
                    (c) =>
                      !deptClientes.some((dc) => dc.clienteId === c.id) &&
                      (clienteSearch === "" ||
                        c.nomeFantasia?.toLowerCase().includes(clienteSearch.toLowerCase()) ||
                        c.razaoSocial?.toLowerCase().includes(clienteSearch.toLowerCase()) ||
                        c.cidade?.toLowerCase().includes(clienteSearch.toLowerCase()) ||
                        c.cnpj?.includes(clienteSearch))
                  )
                  .map((cliente) => {
                    const isSelected = selectedClienteIds.includes(cliente.id)
                    return (
                      <button
                        key={cliente.id}
                        type="button"
                        onClick={() => toggleClienteSelection(cliente.id)}
                        className={`w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors ${
                          isSelected
                            ? "bg-primary/10 border border-primary/30"
                            : "hover:bg-muted/50 border border-transparent"
                        }`}
                      >
                        <Checkbox checked={isSelected} className="mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm leading-tight line-clamp-2">
                            {cliente.nomeFantasia || cliente.razaoSocial}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {cliente.cidade}, {cliente.uf}
                          </p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {cliente.cnpj}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                {allClientes.filter(
                  (c) =>
                    !deptClientes.some((dc) => dc.clienteId === c.id) &&
                    (clienteSearch === "" ||
                      c.nomeFantasia?.toLowerCase().includes(clienteSearch.toLowerCase()) ||
                      c.razaoSocial?.toLowerCase().includes(clienteSearch.toLowerCase()) ||
                      c.cidade?.toLowerCase().includes(clienteSearch.toLowerCase()) ||
                      c.cnpj?.includes(clienteSearch))
                ).length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <Users className="h-8 w-8 mb-2" />
                    <p className="text-sm">Nenhum cliente disponivel</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
          
          {/* Responsavel Selection - Fixed */}
          <div className="px-4 sm:px-6 py-3 space-y-2 shrink-0 border-t mt-3 bg-muted/30">
            <Label className="text-sm">Tecnico Responsavel (opcional)</Label>
            <p className="text-xs text-muted-foreground">Sera aplicado a todos os clientes selecionados</p>
            <Select value={selectedResponsavelId} onValueChange={setSelectedResponsavelId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um responsavel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem responsavel</SelectItem>
                {deptUsuarios.map((ud) => (
                  <SelectItem key={ud.usuarioId} value={ud.usuarioId}>
                    {ud.usuario?.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <DialogFooter className="px-4 py-4 sm:px-6 border-t gap-2 sm:gap-0 shrink-0">
            <Button variant="outline" onClick={() => setIsAddClienteOpen(false)} className="flex-1 sm:flex-none">
              Cancelar
            </Button>
            <Button onClick={handleAddClienteToDept} disabled={loading || selectedClienteIds.length === 0} className="flex-1 sm:flex-none">
              {loading ? "Adicionando..." : `Adicionar${selectedClienteIds.length > 0 ? ` (${selectedClienteIds.length})` : ""}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
