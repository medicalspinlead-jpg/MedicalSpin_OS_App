"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getRascunhos, deleteOrdemServico } from "@/lib/storage"
import { FileText, Trash2, Edit } from "lucide-react"
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
import { ArrowLeft } from "lucide-react"
import useSWR from "swr"

export default function RascunhosPage() {
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const {
    data: rascunhos = [],
    isLoading: loading,
    mutate,
  } = useSWR("rascunhos", getRascunhos, {
    revalidateOnFocus: true,
    revalidateOnMount: true,
    dedupingInterval: 0,
  })

  const handleDelete = async (id: string) => {
    try {
      await deleteOrdemServico(id)
      await mutate()
      setDeleteId(null)
    } catch (error) {
      console.error("Erro ao excluir rascunho:", error)
    }
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button asChild variant="ghost" size="sm" className="mb-4">
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Link>
          </Button>
          <h1 className="text-3xl font-semibold text-foreground">Rascunhos de OS</h1>
          <p className="text-muted-foreground mt-1">Ordens de serviço em andamento</p>
        </div>

        {loading ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground">Carregando rascunhos...</p>
            </CardContent>
          </Card>
        ) : rascunhos.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="p-4 bg-muted rounded-full mb-4">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Nenhum rascunho encontrado</h3>
              <p className="text-sm text-muted-foreground mb-4">Comece criando uma nova ordem de serviço</p>
              <Button asChild>
                <Link href="/os/nova">Nova OS</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {rascunhos.map((os) => (
              <Card key={os.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{os.numero}</CardTitle>
                      <CardDescription className="mt-1">{os.cliente?.nome || "Sem cliente"}</CardDescription>
                    </div>
                    <Badge variant="secondary">Etapa {os.currentStep}/9</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm mb-4">
                    <div>
                      <span className="text-muted-foreground">Equipamento:</span>{" "}
                      <span className="text-foreground">{os.equipamento?.tipo || "-"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Atualizado:</span>{" "}
                      <span className="text-foreground">{new Date(os.updatedAt).toLocaleDateString("pt-BR")}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button asChild size="sm" className="flex-1">
                      <Link href={`/os/${os.id}/etapa/${os.currentStep}`}>
                        <Edit className="h-3 w-3 mr-2" />
                        Continuar
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setDeleteId(os.id)}
                      className="text-destructive hover:text-destructive bg-transparent"
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

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Rascunho</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este rascunho? Esta ação não pode ser desfeita.
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
