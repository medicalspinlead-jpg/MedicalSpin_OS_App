"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Download, FileText, Users, Wrench, ExternalLink } from "lucide-react"

export default function ManuaisPage() {
  const manuais = [
    {
      id: "cliente",
      titulo: "Manual do Cliente",
      descricao: "Guia completo para clientes utilizarem o Portal do Cliente, incluindo criacao de solicitacoes, acompanhamento e gerenciamento de dados.",
      icon: Users,
      cor: "bg-blue-500/10 text-blue-600 border-blue-200",
      corBadge: "bg-blue-100 text-blue-700",
      arquivo: "/docs/manual-cliente.html",
      topicos: [
        "Acesso ao sistema",
        "Painel principal",
        "Nova solicitacao de servico",
        "Acompanhamento de solicitacoes",
        "Detalhes da solicitacao",
        "Gerenciamento de dados e equipamentos",
        "Status das solicitacoes",
      ],
    },
    {
      id: "tecnico",
      titulo: "Manual do Tecnico",
      descricao: "Documentacao completa para tecnicos, cobrindo desde o gerenciamento de solicitacoes ate a criacao de ordens de servico.",
      icon: Wrench,
      cor: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
      corBadge: "bg-emerald-100 text-emerald-700",
      arquivo: "/docs/manual-tecnico.html",
      topicos: [
        "Painel principal",
        "Gerenciamento de solicitacoes",
        "Criacao de Ordem de Servico",
        "Etapas da OS (9 etapas)",
        "Historico de OS",
        "Gerenciamento de clientes",
        "Administracao (Admin)",
        "Dicas e boas praticas",
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-muted/30">
      <main className="container mx-auto px-4 py-4 md:py-8 max-w-4xl">
        <div className="mb-6">
          <Button asChild variant="ghost" size="sm" className="mb-4">
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Link>
          </Button>
          <h1 className="text-2xl md:text-3xl font-semibold text-foreground">Manuais do Sistema</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            Documentacao completa para clientes e tecnicos
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {manuais.map((manual) => {
            const Icon = manual.icon
            return (
              <Card key={manual.id} className={`border-2 ${manual.cor} hover:shadow-lg transition-shadow`}>
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-3 rounded-xl ${manual.cor}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{manual.titulo}</CardTitle>
                      <Badge className={`${manual.corBadge} mt-1`}>PDF</Badge>
                    </div>
                  </div>
                  <CardDescription className="text-sm">
                    {manual.descricao}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-2">Conteudo:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {manual.topicos.map((topico, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
                          {topico}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex flex-col gap-2 pt-2">
                    <Button asChild className="w-full">
                      <a href={manual.arquivo} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Abrir Manual
                      </a>
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      Clique em &quot;Salvar como PDF&quot; no manual para baixar
                    </p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="mt-8 p-4 bg-muted rounded-lg">
          <h3 className="font-medium text-foreground mb-2">Como salvar como PDF</h3>
          <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Abra o manual desejado clicando em &quot;Abrir Manual&quot;</li>
            <li>No canto inferior direito, clique no botao &quot;Salvar como PDF&quot;</li>
            <li>Na janela de impressao, selecione &quot;Salvar como PDF&quot; como destino</li>
            <li>Clique em &quot;Salvar&quot; e escolha onde guardar o arquivo</li>
          </ol>
        </div>
      </main>
    </div>
  )
}
