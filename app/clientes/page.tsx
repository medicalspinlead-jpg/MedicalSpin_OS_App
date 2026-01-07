"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Plus, Search, Trash2, Edit, Wrench } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getClientes, deleteCliente, getEquipamentosByCliente, type Cliente } from "@/lib/storage"
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
import { Badge } from "@/components/ui/badge"
import { ArrowLeft } from "lucide-react"

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [search, setSearch] = useState("")
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadClientes()
  }, [])

  const loadClientes = async () => {
    setLoading(true)
    try {
      const data = await getClientes()
      setClientes(data || [])
    } catch (error) {
      console.error("Erro ao carregar clientes:", error)
      setClientes([])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    await deleteCliente(id)
    await loadClientes()
    setDeleteId(null)
  }

  const filteredClientes = clientes.filter(
    (cliente) =>
      cliente.razaoSocial?.toLowerCase().includes(search.toLowerCase()) ||
      cliente.nomeFantasia?.toLowerCase().includes(search.toLowerCase()) ||
      cliente.cnpj?.includes(search) ||
      cliente.email?.toLowerCase().includes(search.toLowerCase()) ||
      cliente.cidade?.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="min-h-screen bg-muted/30">
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">         
          <div>
            <Button asChild variant="ghost" size="sm" className="mb-4">
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Link>
            </Button>            
            <h1 className="text-3xl font-semibold text-foreground">Clientes</h1>
            <p className="text-muted-foreground mt-1">Gerencie seus clientes e equipamentos</p>
          </div>
          <Button asChild>
            <Link href="/clientes/novo">
              <Plus className="h-4 w-4 mr-2" />
              Novo Cliente
            </Link>
          </Button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, CPF/CNPJ ou email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {loading ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
              <p className="text-sm text-muted-foreground">Carregando clientes...</p>
            </CardContent>
          </Card>
        ) : filteredClientes.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="p-4 bg-muted rounded-full mb-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Nenhum cliente encontrado</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {search ? "Tente buscar por outro termo" : "Comece cadastrando seu primeiro cliente"}
              </p>
              {!search && (
                <Button asChild>
                  <Link href="/clientes/novo">
                    <Plus className="h-4 w-4 mr-2" />
                    Cadastrar Cliente
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredClientes.map((cliente) => (
              <ClienteCard
                key={cliente.id}
                cliente={cliente}
                onDelete={() => setDeleteId(cliente.id)}
                onUpdate={loadClientes}
              />
            ))}
          </div>
        )}
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Cliente</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.
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

function ClienteCard({
  cliente,
  onDelete,
  onUpdate,
}: {
  cliente: Cliente
  onDelete: () => void
  onUpdate: () => void
}) {
  const [equipamentos, setEquipamentos] = useState(0)

  useEffect(() => {
    const loadEquipamentos = async () => {
      try {
        const equips = await getEquipamentosByCliente(cliente.id)
        setEquipamentos(equips?.length || 0)
      } catch {
        setEquipamentos(0)
      }
    }
    loadEquipamentos()
  }, [cliente.id])

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{cliente.nomeFantasia || cliente.razaoSocial}</CardTitle>
            <CardDescription className="mt-1">{cliente.cnpj}</CardDescription>
          </div>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Wrench className="h-3 w-3" />
            {equipamentos}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          {cliente.responsavel && (
            <div>
              <span className="text-muted-foreground">Responsável:</span>{" "}
              <span className="text-foreground">{cliente.responsavel}</span>
            </div>
          )}
          <div>
            <span className="text-muted-foreground">Telefone:</span>{" "}
            <span className="text-foreground">{cliente.telefone || "-"}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Email:</span>{" "}
            <span className="text-foreground">{cliente.email || "-"}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Cidade:</span>{" "}
            <span className="text-foreground">
              {cliente.cidade || "-"} {cliente.uf && `- ${cliente.uf}`}
            </span>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <Button asChild size="sm" className="flex-1 bg-transparent" variant="outline">
            <Link href={`/clientes/${cliente.id}`}>
              <Edit className="h-3 w-3 mr-2" />
              Editar
            </Link>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onDelete}
            className="text-destructive hover:text-destructive bg-transparent"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
