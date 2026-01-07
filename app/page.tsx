"use client"

import Link from "next/link"
import { FileText, Users, History, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"
import { getRascunhos, getOSFinalizadas, getClientes, getEquipamentos } from "@/lib/storage"

export default function HomePage() {
  const [stats, setStats] = useState({
    rascunhos: 0,
    finalizadas: 0,
    clientes: 0,
    equipamentos: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [rascunhos, finalizadas, clientes, equipamentos] = await Promise.all([
          getRascunhos(),
          getOSFinalizadas(),
          getClientes(),
          getEquipamentos(),
        ])
        setStats({
          rascunhos: rascunhos.length,
          finalizadas: finalizadas.length,
          clientes: clientes.length,
          equipamentos: equipamentos.length,
        })
      } catch (error) {
        console.error("Erro ao carregar estatísticas:", error)
      } finally {
        setLoading(false)
      }
    }
    loadStats()
  }, [])

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Main Content */}
      <main className="container mx-auto px-4 py-4 md:py-8">
        <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-3">
          {/* Nova OS */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <FileText className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base md:text-lg">Ordens de Serviço</CardTitle>
                  <CardDescription className="text-xs md:text-sm">Criar e gerenciar OS</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full" variant="default" size="sm">
                <Link href="/os/nova">
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Ordem de Serviço
                </Link>
              </Button>
              <Button asChild className="w-full bg-transparent" variant="outline" size="sm">
                <Link href="/os/rascunhos">Ver Rascunhos</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Clientes */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Users className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-base md:text-lg">Clientes</CardTitle>
                  <CardDescription className="text-xs md:text-sm">Gerenciar clientes</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full" variant="default" size="sm">
                <Link href="/clientes">
                  <Users className="h-4 w-4 mr-2" />
                  Ver Clientes
                </Link>
              </Button>
              <Button asChild className="w-full bg-transparent" variant="outline" size="sm">
                <Link href="/clientes/novo">Cadastrar Novo Cliente</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Histórico */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <History className="h-5 w-5 md:h-6 md:w-6 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-base md:text-lg">Histórico</CardTitle>
                  <CardDescription className="text-xs md:text-sm">Visualizar OS finalizadas</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full" variant="default" size="sm">
                <Link href="/historico">
                  <History className="h-4 w-4 mr-2" />
                  Ver Histórico
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="mt-6 md:mt-8 grid gap-3 md:gap-4 grid-cols-2 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2 md:pb-3">
              <CardDescription className="text-xs md:text-sm">Rascunhos</CardDescription>
              <CardTitle className="text-2xl md:text-3xl">
                <span className="text-orange-600">{loading ? "..." : stats.rascunhos}</span>
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2 md:pb-3">
              <CardDescription className="text-xs md:text-sm">OS Finalizadas</CardDescription>
              <CardTitle className="text-2xl md:text-3xl">
                <span className="text-green-600">{loading ? "..." : stats.finalizadas}</span>
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2 md:pb-3">
              <CardDescription className="text-xs md:text-sm">Clientes</CardDescription>
              <CardTitle className="text-2xl md:text-3xl">
                <span className="text-blue-600">{loading ? "..." : stats.clientes}</span>
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2 md:pb-3">
              <CardDescription className="text-xs md:text-sm">Equipamentos</CardDescription>
              <CardTitle className="text-2xl md:text-3xl">
                <span className="text-gray-600">{loading ? "..." : stats.equipamentos}</span>
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      </main>
    </div>
  )
}
