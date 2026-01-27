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
      <main className="container mx-auto px-4 py-4 md:py-8">
        <div className="mb-6">
          <Button asChild variant="ghost" size="sm" className="mb-2 md:mb-4">
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Link>
          </Button>
          <h1 className="text-2xl md:text-3xl font-semibold text-foreground">Rascunhos de OS</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">Ordens de serviço em andamento</p>
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
          <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {rascunhos.map((os) => (
              <Card key={os.id} className="hover:shadow-md transition-shadow overflow-hidden">
                <CardHeader className="p-4 md:p-6 pb-2 md:pb-3">
                  <div className="flex items-start gap-3 w-full">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-sm sm:text-base md:text-lg truncate max-w-[180px] sm:max-w-[200px] md:max-w-[280px] lg:max-w-[240px]" title={os.numero}>{os.numero}</CardTitle>
                      <CardDescription className="mt-1 text-xs md:text-sm truncate max-w-[180px] sm:max-w-[200px] md:max-w-[280px] lg:max-w-[240px]" title={os.cliente?.nomeFantasia || "Sem cliente"}>{os.cliente?.nomeFantasia || "Sem cliente"}</CardDescription>
                    </div>
                    <Badge variant="secondary" className="text-xs shrink-0">Etapa {os.currentStep}/9</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 md:p-6 pt-2 md:pt-3">
                  <div className="space-y-1.5 md:space-y-2 text-xs md:text-sm mb-3 md:mb-4">
                    <div className="flex flex-wrap gap-1">
                      <span className="text-muted-foreground">Equipamento:</span>
                      <span className="text-foreground truncate">{os.equipamento?.tipo || "-"}</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <span className="text-muted-foreground">Atualizado:</span>
                      <span className="text-foreground">{new Date(os.updatedAt).toLocaleDateString("pt-BR")}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button asChild size="sm" className="flex-1 text-xs md:text-sm">
                      <Link href={`/os/${os.id}/etapa/${os.currentStep}`}>
                        <Edit className="h-3 w-3 mr-1.5 md:mr-2" />
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
