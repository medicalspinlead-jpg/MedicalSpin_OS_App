"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft, 
  FileText, 
  Users, 
  ExternalLink, 
  Phone, 
  Mail, 
  MessageCircle, 
  HelpCircle,
  BookOpen,
  Building2
} from "lucide-react"

export default function AjudaClientePage() {
  const contatos = [
    {
      icon: Phone,
      label: "Telefone",
      valor: "(51) 3181-1899",
      descricao: "Segunda a Sexta, 8h as 18h",
    },
    {
      icon: MessageCircle,
      label: "WhatsApp",
      valor: "(51) 3181-1899",
      descricao: "Atendimento rapido",
      link: "https://wa.me/555131811899?text=Ol%C3%A1%2C+preciso+de+suporte+tecnico+no+Portal+do+Cliente+MedicalSpin",
    },
    {
      icon: Mail,
      label: "E-mail",
      valor: "contato@medicalspin.com.br",
      descricao: "Resposta em ate 24h",
      link: "mailto:contato@medicalspin.com.br",
    },
  ]

  const manual = {
    id: "cliente",
    titulo: "Manual do Cliente",
    descricao: "Guia completo para utilizar o Portal do Cliente, incluindo criacao de solicitacoes, acompanhamento e gerenciamento de dados.",
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
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <main className="container mx-auto px-4 py-4 md:py-8 max-w-4xl">
        <div className="mb-6">
          <Button asChild variant="ghost" size="sm" className="mb-4">
            <Link href="/cliente">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <HelpCircle className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold text-foreground">Ajuda</h1>
              <p className="text-sm md:text-base text-muted-foreground mt-1">
                Central de suporte e documentacao
              </p>
            </div>
          </div>
        </div>

        {/* Informacoes de Contato */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Informacoes de Contato</CardTitle>
            </div>
            <CardDescription>
              Entre em contato conosco para suporte tecnico
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {contatos.map((contato) => {
                const Icon = contato.icon
                const content = (
                  <div className="flex items-start gap-3 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{contato.label}</p>
                      <p className="text-sm text-primary font-medium">{contato.valor}</p>
                      <p className="text-xs text-muted-foreground mt-1">{contato.descricao}</p>
                    </div>
                  </div>
                )

                if (contato.link) {
                  return (
                    <a key={contato.label} href={contato.link} target="_blank" rel="noopener noreferrer">
                      {content}
                    </a>
                  )
                }
                return <div key={contato.label}>{content}</div>
              })}
            </div>
          </CardContent>
        </Card>

        {/* Documentacao */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">Documentacao</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Manual disponivel para voce aprender a utilizar o portal
          </p>
        </div>

        <Card className={`border-2 ${manual.cor} hover:shadow-lg transition-shadow max-w-md`}>
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-3 rounded-xl ${manual.cor}`}>
                <manual.icon className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-lg">{manual.titulo}</CardTitle>
                <Badge className={`${manual.corBadge} mt-1`}>HTML</Badge>
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
                {manual.topicos.slice(0, 5).map((topico, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
                    {topico}
                  </li>
                ))}
                {manual.topicos.length > 5 && (
                  <li className="text-xs text-muted-foreground/70">
                    E mais {manual.topicos.length - 5} topicos...
                  </li>
                )}
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

        {/* Dicas */}
        <div className="mt-8 p-4 bg-muted rounded-lg">
          <h3 className="font-medium text-foreground mb-2">Como salvar como PDF</h3>
          <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Abra o manual desejado clicando em &quot;Abrir Manual&quot;</li>
            <li>No canto inferior direito, clique no botao &quot;Salvar como PDF&quot;</li>
            <li>Na janela de impressao, selecione &quot;Salvar como PDF&quot; como destino</li>
            <li>Clique em &quot;Salvar&quot; e escolha onde guardar o arquivo</li>
          </ol>
        </div>

        {/* Info */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Building2 className="h-3.5 w-3.5" />
          <span>Portal do Cliente - Medical Spin</span>
        </div>
      </main>
    </div>
  )
}
