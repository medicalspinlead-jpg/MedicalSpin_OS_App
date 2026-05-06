"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Plus, Search, Trash2, Edit, Users, ArrowLeft, Shield, Wrench, Eye, EyeOff, UserCircle, Building2, Zap, Radio, Scan, UserPlus, X, CheckSquare, Square, Clock, CheckCircle, XCircle, Settings, HardDrive, RefreshCw, AlertTriangle, Download, Upload, Database, FileText, Cloud } from "lucide-react"
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
import { Switch } from "@/components/ui/switch"
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
  
  // Estado para armazenamento no Drive
  const [armazenarNoDrive, setArmazenarNoDrive] = useState(true)
  const [armazenarDriveLoading, setArmazenarDriveLoading] = useState(false)

  // Estado para limpeza de mídias
  const [limpezaLoading, setLimpezaLoading] = useState(false)
  const [limpezaResultado, setLimpezaResultado] = useState<{
    sucesso: boolean
    dataExecucao: string
    ordensServico: { encontradas: number; limpas: string[] }
    solicitacoes: { encontradas: number; limpas: string[] }
  } | null>(null)

  // Estado para backup
  const [backupExportLoading, setBackupExportLoading] = useState(false)
  const [backupImportLoading, setBackupImportLoading] = useState(false)
  const [backupResultado, setBackupResultado] = useState<{
    tipo: "export" | "import"
    sucesso: boolean
    mensagem: string
    estatisticas?: Record<string, { importados: number; erros: number }>
  } | null>(null)
  const [isImportConfirmOpen, setIsImportConfirmOpen] = useState(false)
  const [selectedBackupFile, setSelectedBackupFile] = useState<File | null>(null)
  const [importProgress, setImportProgress] = useState<{
    etapa: string
    progresso: number
  } | null>(null)
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [exportOptions, setExportOptions] = useState({
    clientes: true,
    equipamentos: true,
    ordensServico: true,
    pecas: true,
    maoObra: true,
    usuarios: true,
    configuracoes: true,
    solicitacoes: true,
    departamentos: true,
  })

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

  // Load configurações
  useEffect(() => {
    fetch("/api/config", { credentials: "include" })
      .then((res) => res.json())
      .then((config) => {
        if (typeof config.armazenarNoDrive === "boolean") {
          setArmazenarNoDrive(config.armazenarNoDrive)
        }
      })
      .catch(() => {})
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

  // Função para alternar armazenamento no Drive
  const handleToggleArmazenarDrive = async (checked: boolean) => {
    setArmazenarDriveLoading(true)
    try {
      const res = await fetch("/api/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ armazenarNoDrive: checked }),
      })

      if (!res.ok) {
        throw new Error("Erro ao atualizar configuração")
      }

      setArmazenarNoDrive(checked)
      toast.success(checked 
        ? "Armazenamento no Drive ativado" 
        : "Armazenamento no Drive desativado"
      )
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao atualizar configuração")
    } finally {
      setArmazenarDriveLoading(false)
    }
  }

  // Função para executar limpeza de mídias manualmente
  const handleLimpezaMidias = async () => {
    setLimpezaLoading(true)
    setLimpezaResultado(null)
    try {
      const res = await fetch("/api/cron/limpar-midias", {
        method: "GET",
        credentials: "include",
      })

      if (!res.ok) {
        throw new Error("Erro ao executar limpeza")
      }

      const resultado = await res.json()
      setLimpezaResultado(resultado)
      
      const totalLimpas = resultado.ordensServico.limpas.length + resultado.solicitacoes.limpas.length
      if (totalLimpas > 0) {
        toast.success(`Limpeza concluída: ${totalLimpas} registro(s) com mídias removidas`)
      } else {
        toast.info("Nenhuma mídia antiga encontrada para limpeza")
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao executar limpeza")
    } finally {
      setLimpezaLoading(false)
    }
  }

  // Função para exportar backup
  // Abrir modal de exportação
  const handleOpenExportModal = () => {
    setIsExportModalOpen(true)
    setBackupResultado(null)
  }

  // Toggle opção de exportação
  const handleToggleExportOption = (key: keyof typeof exportOptions) => {
    setExportOptions(prev => ({ ...prev, [key]: !prev[key] }))
  }

  // Selecionar/desselecionar todos
  const handleSelectAllExport = (selectAll: boolean) => {
    setExportOptions({
      clientes: selectAll,
      equipamentos: selectAll,
      ordensServico: selectAll,
      pecas: selectAll,
      maoObra: selectAll,
      usuarios: selectAll,
      configuracoes: selectAll,
      solicitacoes: selectAll,
      departamentos: selectAll,
    })
  }

  const handleExportBackup = async () => {
    // Verificar se pelo menos uma opção está selecionada
    const algumSelecionado = Object.values(exportOptions).some(v => v)
    if (!algumSelecionado) {
      toast.error("Selecione pelo menos um tipo de dado para exportar")
      return
    }

    setBackupExportLoading(true)
    setBackupResultado(null)
    setIsExportModalOpen(false)
    
    try {
      // Criar query string com as opções
      const params = new URLSearchParams()
      Object.entries(exportOptions).forEach(([key, value]) => {
        if (value) params.append(key, "true")
      })

      const res = await fetch(`/api/admin/backup?${params.toString()}`, {
        method: "GET",
        credentials: "include",
      })

      if (!res.ok) {
        throw new Error("Erro ao exportar backup")
      }

      // Criar blob e fazer download
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      const dataFormatada = new Date().toISOString().split("T")[0]
      a.download = `backup-msp-${dataFormatada}.json`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      setBackupResultado({
        tipo: "export",
        sucesso: true,
        mensagem: "Backup exportado com sucesso!",
      })
      toast.success("Backup exportado com sucesso!")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao exportar backup")
      setBackupResultado({
        tipo: "export",
        sucesso: false,
        mensagem: err instanceof Error ? err.message : "Erro ao exportar backup",
      })
    } finally {
      setBackupExportLoading(false)
    }
  }

  // Função para selecionar arquivo de backup
  const handleSelectBackupFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.name.endsWith(".json")) {
        toast.error("Por favor, selecione um arquivo JSON válido")
        return
      }
      setSelectedBackupFile(file)
      setIsImportConfirmOpen(true)
    }
    // Reset input
    e.target.value = ""
  }

  // Função para importar backup
  const handleImportBackup = async () => {
    if (!selectedBackupFile) return

    setBackupImportLoading(true)
    setBackupResultado(null)
    setIsImportConfirmOpen(false)
    setImportProgress({ etapa: "Lendo arquivo...", progresso: 5 })

    try {
      const fileContent = await selectedBackupFile.text()
      setImportProgress({ etapa: "Validando dados...", progresso: 15 })
      
      const backupData = JSON.parse(fileContent)
      setImportProgress({ etapa: "Enviando para o servidor...", progresso: 25 })

      const res = await fetch("/api/admin/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(backupData),
      })

      setImportProgress({ etapa: "Processando importação...", progresso: 50 })

      // Simular progresso enquanto aguarda resposta
      const progressInterval = setInterval(() => {
        setImportProgress(prev => {
          if (!prev || prev.progresso >= 90) return prev
          return { ...prev, progresso: prev.progresso + 5 }
        })
      }, 1000)

      if (!res.ok) {
        clearInterval(progressInterval)
        const error = await res.json()
        throw new Error(error.error || "Erro ao importar backup")
      }

      clearInterval(progressInterval)
      setImportProgress({ etapa: "Finalizando...", progresso: 95 })

      const resultado = await res.json()
      setImportProgress({ etapa: "Concluído!", progresso: 100 })
      
      setBackupResultado({
        tipo: "import",
        sucesso: true,
        mensagem: resultado.mensagem,
        estatisticas: resultado.estatisticas,
      })
      toast.success("Backup importado com sucesso!")
      
      // Recarregar dados
      mutate()
      mutateDepts()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao importar backup")
      setBackupResultado({
        tipo: "import",
        sucesso: false,
        mensagem: err instanceof Error ? err.message : "Erro ao importar backup",
      })
    } finally {
      setBackupImportLoading(false)
      setSelectedBackupFile(null)
      // Limpar progresso após um pequeno delay
      setTimeout(() => setImportProgress(null), 2000)
    }
  }

  const filteredUsuarios = usuarios.filter(
    (user) =>
      user.nome?.toLowerCase().includes(search.toLowerCase()) ||
      user.email?.toLowerCase().includes(search.toLowerCase()) ||
      user.cargo?.toLowerCase().includes(search.toLowerCase())
  )

  // Separar usuários por tipo
  const tecnicosEAdmins = filteredUsuarios.filter((u) => u.cargo === "tecnico" || u.cargo === "admin")
  const clientes = filteredUsuarios.filter((u) => u.cargo === "cliente")
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
          <Button asChild variant="outline" className="shrink-0">
            <Link href="/admin/relatorios">
              <FileText className="h-4 w-4 mr-2" />
              Relatórios
            </Link>
          </Button>
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
                <UserPlus className="h-4 w-4" />
                <span className="hidden sm:inline">Aprovações</span>
                {usuariosPendentes.length > 0 && (
                  <Badge variant="destructive" className="h-5 min-w-[20px] rounded-full px-1.5 text-xs">
                    {usuariosPendentes.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="manutencao" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Manutenção</span>
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
            ) : (
              <Tabs defaultValue="tecnicos" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="tecnicos" className="flex items-center gap-2">
                    <Wrench className="h-4 w-4" />
                    Tecnicos e Admins
                    <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1.5">
                      {tecnicosEAdmins.length}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="clientes" className="flex items-center gap-2">
                    <UserCircle className="h-4 w-4" />
                    Clientes
                    <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1.5">
                      {clientes.length}
                    </Badge>
                  </TabsTrigger>
                </TabsList>

                {/* Sub-tab Tecnicos e Admins */}
                <TabsContent value="tecnicos">
                  {tecnicosEAdmins.length === 0 ? (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <div className="p-4 bg-muted rounded-full mb-4">
                          <Wrench className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">Nenhum tecnico ou admin encontrado</h3>
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
                      {tecnicosEAdmins.map((user) => (
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
                </TabsContent>

                {/* Sub-tab Clientes */}
                <TabsContent value="clientes">
                  {clientes.length === 0 ? (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <div className="p-4 bg-muted rounded-full mb-4">
                          <UserCircle className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">Nenhum cliente encontrado</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          {search ? "Tente buscar por outro termo" : "Clientes aparecerao aqui quando se cadastrarem"}
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {clientes.map((user) => (
                        <Card key={user.id} className="hover:shadow-md transition-shadow">
                          <CardHeader className="p-4 md:p-6 pb-2 md:pb-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <CardTitle className="text-base md:text-lg truncate">{user.nome}</CardTitle>
                                <CardDescription className="mt-1 text-xs md:text-sm truncate">{user.email}</CardDescription>
                              </div>
                              <Badge 
                                variant="outline" 
                                className="flex items-center gap-1 shrink-0 text-xs"
                              >
                                <UserCircle className="h-3 w-3" />
                                Cliente
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="p-4 md:p-6 pt-2 md:pt-3">
                            <div className="space-y-1.5 md:space-y-2 text-xs md:text-sm">
                              {user.cliente && (
                                <div className="flex flex-wrap gap-1">
                                  <span className="text-muted-foreground">Empresa:</span>
                                  <span className="text-foreground truncate">
                                    {user.cliente.nomeFantasia || user.cliente.razaoSocial}
                                  </span>
                                </div>
                              )}
                              {user.cliente && (
                                <div className="flex flex-wrap gap-1">
                                  <span className="text-muted-foreground">Cidade:</span>
                                  <span className="text-foreground">
                                    {user.cliente.cidade}, {user.cliente.uf}
                                  </span>
                                </div>
                              )}
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
              </Tabs>
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

{/* Tab de Manutenção */}
          <TabsContent value="manutencao">
            <div className="grid gap-6">
              {/* Card de Armazenamento no Drive */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Cloud className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">Armazenar dados no Drive</CardTitle>
                      <CardDescription>
                        Envia automaticamente as OS finalizadas e suas mídias para o armazenamento externo
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <Cloud className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium">Sobre o armazenamento</p>
                      <p>Quando ativado, ao finalizar uma OS os dados serão enviados automaticamente para o armazenamento externo, incluindo as informações do cliente, equipamento, serviços realizados e todas as fotos anexadas.</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <p className="font-medium">Enviar dados ao Drive</p>
                      <p className="text-sm text-muted-foreground">
                        {armazenarNoDrive 
                          ? "As OS finalizadas serão enviadas automaticamente" 
                          : "As OS serão salvas apenas localmente"}
                      </p>
                    </div>
                    <Switch
                      checked={armazenarNoDrive}
                      onCheckedChange={handleToggleArmazenarDrive}
                      disabled={armazenarDriveLoading}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Card de Limpeza de Mídias */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <HardDrive className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Limpeza de Mídias</CardTitle>
                      <CardDescription>
                        Remove mídias de OS finalizadas há mais de 5 dias para economizar espaço no banco de dados
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                    <div className="text-sm text-amber-800">
                      <p className="font-medium">Atenção</p>
                      <p>Esta ação remove permanentemente as mídias (fotos e vídeos) das ordens de serviço e solicitações finalizadas/concluídas há mais de 5 dias. As mídias não poderão ser recuperadas.</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      <p>A limpeza é executada automaticamente todos os dias às 03:00.</p>
                      <p>Você também pode executar manualmente clicando no botão ao lado.</p>
                    </div>
                    <Button 
                      onClick={handleLimpezaMidias} 
                      disabled={limpezaLoading}
                      variant="outline"
                      className="shrink-0"
                    >
                      {limpezaLoading ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Executando...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Executar Limpeza
                        </>
                      )}
                    </Button>
                  </div>

                  {limpezaResultado && (
                    <div className="mt-4 p-4 bg-muted rounded-lg space-y-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium">Limpeza executada em {new Date(limpezaResultado.dataExecucao).toLocaleString("pt-BR")}</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="p-3 bg-background rounded border">
                          <p className="text-muted-foreground">Ordens de Serviço</p>
                          <p className="text-2xl font-semibold">{limpezaResultado.ordensServico.encontradas}</p>
                          <p className="text-xs text-muted-foreground">registros com mídias limpas</p>
                        </div>
                        <div className="p-3 bg-background rounded border">
                          <p className="text-muted-foreground">Solicitações</p>
                          <p className="text-2xl font-semibold">{limpezaResultado.solicitacoes.encontradas}</p>
                          <p className="text-xs text-muted-foreground">registros com mídias limpas</p>
                        </div>
                      </div>

                      {(limpezaResultado.ordensServico.limpas.length > 0 || limpezaResultado.solicitacoes.limpas.length > 0) && (
                        <div className="text-xs text-muted-foreground">
                          {limpezaResultado.ordensServico.limpas.length > 0 && (
                            <p>OS: {limpezaResultado.ordensServico.limpas.join(", ")}</p>
                          )}
                          {limpezaResultado.solicitacoes.limpas.length > 0 && (
                            <p>Protocolos: {limpezaResultado.solicitacoes.limpas.join(", ")}</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Card de Backup de Dados */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Database className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Backup de Dados</CardTitle>
                      <CardDescription>
                        Exporte ou importe todos os dados do sistema (exceto mídias/arquivos)
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <Database className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium">Sobre o Backup</p>
                      <p>O backup inclui: clientes, equipamentos, ordens de serviço, usuarios, departamentos, solicitações e configurações. As mídias (fotos e videos) não são incluídas no backup.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Exportar */}
                    <div className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center gap-2">
                        <Download className="h-5 w-5 text-green-600" />
                        <span className="font-medium">Exportar Backup</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Selecione os dados que deseja exportar em formato JSON.
                      </p>
                      <Button
                        onClick={handleOpenExportModal}
                        disabled={backupExportLoading}
                        className="w-full"
                      >
                        {backupExportLoading ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Exportando...
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-2" />
                            Selecionar Dados
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Importar */}
                    <div className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center gap-2">
                        <Upload className="h-5 w-5 text-orange-600" />
                        <span className="font-medium">Importar Backup</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Restaure dados a partir de um arquivo de backup JSON.
                      </p>
                      <div className="relative">
                        <input
                          type="file"
                          accept=".json"
                          onChange={handleSelectBackupFile}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          disabled={backupImportLoading}
                        />
                        <Button
                          variant="outline"
                          className="w-full"
                          disabled={backupImportLoading}
                        >
                          {backupImportLoading ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              Importando...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4 mr-2" />
                              Selecionar Arquivo
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Barra de Progresso da Importação */}
                  {importProgress && (
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />
                          <span className="text-sm font-medium text-blue-800">
                            {importProgress.etapa}
                          </span>
                        </div>
                        <span className="text-sm font-bold text-blue-600">
                          {importProgress.progresso}%
                        </span>
                      </div>
                      <div className="w-full bg-blue-200 rounded-full h-3 overflow-hidden">
                        <div 
                          className="bg-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${importProgress.progresso}%` }}
                        />
                      </div>
                      <p className="text-xs text-blue-700">
                        Por favor, aguarde enquanto os dados estão sendo importados. Isso pode levar alguns minutos dependendo do tamanho do backup.
                      </p>
                    </div>
                  )}

                  {/* Resultado do Backup */}
                  {backupResultado && (
                    <div className={`mt-4 p-4 rounded-lg ${backupResultado.sucesso ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
                      <div className="flex items-center gap-2 mb-2">
                        {backupResultado.sucesso ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                        <span className={`text-sm font-medium ${backupResultado.sucesso ? "text-green-800" : "text-red-800"}`}>
                          {backupResultado.mensagem}
                        </span>
                      </div>

                      {backupResultado.tipo === "import" && backupResultado.estatisticas && (
                        <div className="mt-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                          {Object.entries(backupResultado.estatisticas).map(([tabela, stats]) => (
                            <div key={tabela} className="p-2 bg-background rounded border text-xs">
                              <p className="text-muted-foreground capitalize">{tabela}</p>
                              <p className="font-medium text-green-600">{stats.importados} importados</p>
                              {stats.erros > 0 && (
                                <p className="text-red-600">{stats.erros} erros</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Card de Informações do Sistema */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Settings className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Configurações de Compressão</CardTitle>
                      <CardDescription>
                        Configurações atuais de compressão de mídias no upload
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-muted-foreground">Resolução máxima</p>
                      <p className="text-lg font-semibold">1200px</p>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-muted-foreground">Qualidade JPEG</p>
                      <p className="text-lg font-semibold">50%</p>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-muted-foreground">Tamanho alvo</p>
                      <p className="text-lg font-semibold">500KB</p>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-muted-foreground">Limite vídeo</p>
                      <p className="text-lg font-semibold">15MB</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
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

      {/* Dialog de Confirmação de Importação de Backup */}
      <AlertDialog open={isImportConfirmOpen} onOpenChange={setIsImportConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Confirmar Importação de Backup
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm text-muted-foreground">
                <span>
                  Você está prestes a importar dados do arquivo:
                </span>
                <span className="block font-mono text-sm bg-muted p-2 rounded">
                  {selectedBackupFile?.name}
                </span>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-800 text-sm">
                  <span className="font-medium block mb-1">Atenção:</span>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Dados existentes com mesmo ID serão atualizados</li>
                    <li>Novos dados serão adicionados ao sistema</li>
                    <li>Esta ação não pode ser desfeita facilmente</li>
                    <li>Recomendamos fazer um backup antes de importar</li>
                  </ul>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedBackupFile(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleImportBackup} className="bg-orange-600 hover:bg-orange-700">
              Confirmar Importação
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de Seleção de Dados para Exportação */}
      <Dialog open={isExportModalOpen} onOpenChange={setIsExportModalOpen}>
        <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] flex flex-col p-0 gap-0">
          <DialogHeader className="p-4 pb-3 border-b shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Database className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-lg">Exportar Backup</DialogTitle>
                <DialogDescription className="text-sm mt-0.5">
                  Selecione os dados para incluir no backup
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Botões selecionar/desselecionar todos */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSelectAllExport(true)}
                className="flex-1"
              >
                <CheckSquare className="h-4 w-4 mr-1.5" />
                Selecionar Todos
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSelectAllExport(false)}
                className="flex-1"
              >
                <Square className="h-4 w-4 mr-1.5" />
                Limpar
              </Button>
            </div>

            {/* Opções de exportação */}
            <div className="grid grid-cols-1 gap-2">
              {[
                { key: "clientes" as const, label: "Clientes", desc: "Empresas cadastradas", icon: Building2 },
                { key: "equipamentos" as const, label: "Equipamentos", desc: "Vinculados aos clientes", icon: Wrench },
                { key: "ordensServico" as const, label: "Ordens de Serviço", desc: "Inclui peças e mão de obra", icon: Scan },
                { key: "usuarios" as const, label: "Usuários", desc: "Técnicos e admins", icon: Users },
                { key: "solicitacoes" as const, label: "Solicitações", desc: "Pedidos dos clientes", icon: Radio },
                { key: "departamentos" as const, label: "Departamentos", desc: "Vínculos e permissões", icon: Shield },
                { key: "configuracoes" as const, label: "Configurações", desc: "Configurações gerais", icon: Settings },
              ].map((item) => {
                const Icon = item.icon
                return (
                  <label
                    key={item.key}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      exportOptions[item.key]
                        ? "bg-primary/10 border-primary"
                        : "bg-background border-border hover:border-primary/50 hover:bg-muted/50"
                    }`}
                  >
                    <Checkbox
                      checked={exportOptions[item.key]}
                      onCheckedChange={() => handleToggleExportOption(item.key)}
                    />
                    <div className={`p-1.5 rounded-md ${exportOptions[item.key] ? "bg-primary/20" : "bg-muted"}`}>
                      <Icon className={`h-4 w-4 ${exportOptions[item.key] ? "text-primary" : "text-muted-foreground"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-sm block">
                        {item.label}
                      </span>
                      <p className="text-xs text-muted-foreground truncate">{item.desc}</p>
                    </div>
                  </label>
                )
              })}
            </div>

            {/* Aviso sobre mídias */}
            <div className="flex items-center gap-2.5 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
              <span className="text-xs text-destructive">Mídias (fotos e vídeos) não são incluídas.</span>
            </div>
          </div>

          <div className="p-4 border-t bg-muted/50 flex flex-col gap-2 shrink-0">
            <Button
              onClick={handleExportBackup}
              disabled={!Object.values(exportOptions).some(v => v)}
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar Backup
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setIsExportModalOpen(false)}
              className="w-full"
            >
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
