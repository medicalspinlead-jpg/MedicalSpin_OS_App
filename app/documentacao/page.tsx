"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Copy, Key, ShieldCheck, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useState, useEffect } from "react"

export default function DocumentacaoPage() {
  const { toast } = useToast()
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null)
  const [baseUrl, setBaseUrl] = useState("https://seu-dominio.com")

  useEffect(() => {
    if (typeof window !== "undefined") {
      setBaseUrl(window.location.origin)
    }
  }, [])

  const apiKey = "medicalspin2026"

  const copyToClipboard = (text: string, index?: string) => {
    navigator.clipboard.writeText(text)
    if (index) {
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 2000)
    }
    toast({
      title: "Copiado!",
      description: "Comando copiado para a area de transferencia.",
    })
  }

  const generateCurlCommand = (method: string, path: string, body: object | null, protected_: boolean) => {
    const headers = protected_
      ? `-H "x-api-key: ${apiKey}" \\\n  -H "Content-Type: application/json"`
      : `-H "Content-Type: application/json"`

    const bodyPart = body ? ` \\\n  -d '${JSON.stringify(body, null, 2).replace(/\n/g, "\n  ")}'` : ""

    return `curl -X ${method} \\
  "${baseUrl}${path}" \\
  ${headers}${bodyPart}`
  }

  const generateFetchCommand = (method: string, path: string, body: object | null, protected_: boolean) => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }
    if (protected_) {
      headers["x-api-key"] = apiKey
    }

    return `// ${method} ${path}
const response = await fetch("${baseUrl}${path}", {
  method: "${method}",
  headers: ${JSON.stringify(headers, null, 4).replace(/\n/g, "\n  ")},${
    body
      ? `
  body: JSON.stringify(${JSON.stringify(body, null, 4).replace(/\n/g, "\n  ")})`
      : ""
  }
});

const data = await response.json();
console.log(data);`
  }

  const apiRoutes = [
    {
      category: "Autenticacao",
      routes: [
        {
          method: "POST",
          path: "/api/auth/login",
          description: "Autenticar usuario",
          body: { email: "usuario@email.com", senha: "sua_senha" },
          response: { id: "uuid", nome: "Nome Usuario", email: "usuario@email.com" },
          protected: false,
        },
        {
          method: "POST",
          path: "/api/auth/logout",
          description: "Encerrar sessao do usuario",
          body: null,
          response: { success: true },
          protected: false,
        },
        {
          method: "GET",
          path: "/api/auth/me",
          description: "Obter dados do usuario autenticado",
          body: null,
          response: { id: "uuid", nome: "Nome Usuario", email: "usuario@email.com" },
          protected: false,
        },
        {
          method: "POST",
          path: "/api/auth/setup",
          description: "Criar primeiro usuario (setup inicial)",
          body: { nome: "Admin", email: "admin@email.com", senha: "senha123", chaveSeguranca: "medicalspin2026" },
          response: { id: "uuid", nome: "Admin", email: "admin@email.com" },
          protected: false,
        },
      ],
    },
    {
      category: "Usuarios",
      routes: [
        {
          method: "GET",
          path: "/api/usuarios",
          description: "Listar todos os usuarios",
          body: null,
          response: [{ id: "uuid", nome: "Usuario", email: "user@email.com", createdAt: "2024-01-01T00:00:00Z" }],
          protected: true,
        },
        {
          method: "POST",
          path: "/api/usuarios",
          description: "Criar novo usuario",
          body: { nome: "Novo Usuario", email: "novo@email.com", senha: "senha123" },
          response: { id: "uuid", nome: "Novo Usuario", email: "novo@email.com" },
          protected: true,
        },
      ],
    },
    {
      category: "Clientes",
      routes: [
        {
          method: "GET",
          path: "/api/clientes",
          description: "Listar todos os clientes",
          body: null,
          response: [{ id: "uuid", razaoSocial: "Empresa LTDA", cnpj: "12.345.678/0001-90" }],
          protected: true,
        },
        {
          method: "POST",
          path: "/api/clientes",
          description: "Criar um unico cliente",
          body: {
            razaoSocial: "Nova Empresa LTDA",
            nomeFantasia: "Nova Empresa",
            cnpj: "12.345.678/0001-90",
            cidade: "Sao Paulo",
            uf: "SP",
            telefone: "(11) 99999-9999",
            email: "contato@empresa.com",
            responsavel: "Joao Silva",
            equipamentos: [{ tipo: "Monitor", fabricante: "Samsung", modelo: "XYZ-123", numeroSerie: "SN001" }],
          },
          response: { id: "uuid", razaoSocial: "Nova Empresa LTDA", cnpj: "12.345.678/0001-90", equipamentos: [] },
          protected: true,
        },
        {
          method: "POST",
          path: "/api/clientes",
          description: "Criar multiplos clientes em lote (enviar array)",
          body: [
            {
              razaoSocial: "Empresa 1 LTDA",
              nomeFantasia: "Empresa 1",
              cnpj: "11.111.111/0001-11",
              cidade: "Sao Paulo",
              uf: "SP",
              telefone: "(11) 11111-1111",
              email: "empresa1@email.com",
              responsavel: "Responsavel 1",
              equipamentos: [{ tipo: "Monitor", fabricante: "Samsung", modelo: "ABC-111", numeroSerie: "SN111" }],
            },
            {
              razaoSocial: "Empresa 2 LTDA",
              nomeFantasia: "Empresa 2",
              cnpj: "22.222.222/0001-22",
              cidade: "Rio de Janeiro",
              uf: "RJ",
              telefone: "(21) 22222-2222",
              email: "empresa2@email.com",
              responsavel: "Responsavel 2",
              equipamentos: [{ tipo: "Impressora", fabricante: "HP", modelo: "DEF-222", numeroSerie: "SN222" }],
            },
          ],
          response: {
            sucesso: 2,
            erros: 0,
            clientes: [
              { id: "uuid-1", razaoSocial: "Empresa 1 LTDA", cnpj: "11.111.111/0001-11" },
              { id: "uuid-2", razaoSocial: "Empresa 2 LTDA", cnpj: "22.222.222/0001-22" },
            ],
            falhas: [],
          },
          protected: true,
        },
        {
          method: "GET",
          path: "/api/clientes/[id]",
          description: "Obter cliente por ID",
          body: null,
          response: { id: "uuid", razaoSocial: "Empresa LTDA", cnpj: "12.345.678/0001-90", equipamentos: [] },
          protected: true,
        },
        {
          method: "PUT",
          path: "/api/clientes/[id]",
          description: "Atualizar cliente",
          body: { razaoSocial: "Empresa Atualizada LTDA", telefone: "(11) 88888-8888" },
          response: { id: "uuid", razaoSocial: "Empresa Atualizada LTDA" },
          protected: true,
        },
        {
          method: "DELETE",
          path: "/api/clientes/[id]",
          description: "Excluir cliente",
          body: null,
          response: { success: true },
          protected: true,
        },
      ],
    },
    {
      category: "Equipamentos",
      routes: [
        {
          method: "GET",
          path: "/api/equipamentos",
          description: "Listar equipamentos (filtro por clienteId opcional: ?clienteId=uuid)",
          body: null,
          response: [{ id: "uuid", tipo: "Monitor", modelo: "XYZ-123", numeroSerie: "SN12345" }],
          protected: true,
        },
        {
          method: "POST",
          path: "/api/equipamentos",
          description: "Criar um unico equipamento",
          body: {
            clienteId: "uuid-do-cliente",
            tipo: "Monitor",
            fabricante: "Samsung",
            modelo: "XYZ-123",
            numeroSerie: "SN12345",
          },
          response: { id: "uuid", tipo: "Monitor", modelo: "XYZ-123" },
          protected: true,
        },
        {
          method: "POST",
          path: "/api/equipamentos",
          description: "Criar multiplos equipamentos em lote (enviar array)",
          body: [
            {
              clienteId: "uuid-do-cliente",
              tipo: "Monitor",
              fabricante: "Samsung",
              modelo: "ABC-111",
              numeroSerie: "SN001",
            },
            {
              clienteId: "uuid-do-cliente",
              tipo: "Impressora",
              fabricante: "HP",
              modelo: "DEF-222",
              numeroSerie: "SN002",
            },
            {
              clienteId: "uuid-do-cliente",
              tipo: "Servidor",
              fabricante: "Dell",
              modelo: "GHI-333",
              numeroSerie: "SN003",
            },
          ],
          response: {
            sucesso: 3,
            erros: 0,
            equipamentos: [
              { id: "uuid-1", tipo: "Monitor", modelo: "ABC-111", numeroSerie: "SN001" },
              { id: "uuid-2", tipo: "Impressora", modelo: "DEF-222", numeroSerie: "SN002" },
              { id: "uuid-3", tipo: "Servidor", modelo: "GHI-333", numeroSerie: "SN003" },
            ],
            falhas: [],
          },
          protected: true,
        },
        {
          method: "GET",
          path: "/api/equipamentos/[id]",
          description: "Obter equipamento por ID",
          body: null,
          response: { id: "uuid", tipo: "Monitor", modelo: "XYZ-123", cliente: { id: "uuid", razaoSocial: "Empresa" } },
          protected: true,
        },
        {
          method: "PUT",
          path: "/api/equipamentos/[id]",
          description: "Atualizar equipamento",
          body: { tipo: "Monitor Atualizado", modelo: "XYZ-456" },
          response: { id: "uuid", tipo: "Monitor Atualizado", modelo: "XYZ-456" },
          protected: true,
        },
        {
          method: "DELETE",
          path: "/api/equipamentos/[id]",
          description: "Excluir equipamento",
          body: null,
          response: { success: true },
          protected: true,
        },
      ],
    },
    {
      category: "Ordens de Servico",
      routes: [
        {
          method: "GET",
          path: "/api/os",
          description: "Listar todas as OS (filtro opcional: ?status=rascunho ou ?status=finalizada)",
          body: null,
          response: [{ id: "uuid", numero: "OS-001", status: "rascunho", cliente: {}, equipamento: {} }],
          protected: true,
        },
        {
          method: "POST",
          path: "/api/os",
          description: "Criar nova OS",
          body: {
            numero: "OS-001",
            status: "rascunho",
            currentStep: 1,
          },
          response: { id: "uuid", numero: "OS-001", status: "rascunho" },
          protected: true,
        },
        {
          method: "GET",
          path: "/api/os/[id]",
          description: "Obter OS por ID com todos os relacionamentos",
          body: null,
          response: {
            id: "uuid",
            numero: "OS-001",
            status: "finalizada",
            cliente: {},
            equipamento: {},
            pecas: [],
            maoDeObra: [],
            midias: [],
          },
          protected: true,
        },
        {
          method: "PUT",
          path: "/api/os/[id]",
          description: "Atualizar OS",
          body: {
            status: "finalizada",
            currentStep: 9,
            motivo: { dataEntrada: "2024-01-01", descricaoProblema: "Equipamento nao liga" },
          },
          response: { id: "uuid", numero: "OS-001", status: "finalizada" },
          protected: true,
        },
        {
          method: "DELETE",
          path: "/api/os/[id]",
          description: "Excluir OS",
          body: null,
          response: { success: true },
          protected: true,
        },
      ],
    },
  ]

  const getMethodColor = (method: string) => {
    switch (method) {
      case "GET":
        return "bg-green-500"
      case "POST":
        return "bg-blue-500"
      case "PUT":
        return "bg-yellow-500"
      case "DELETE":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 max-w-full overflow-x-hidden">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Documentacao da API</h1>
        <p className="text-muted-foreground text-sm sm:text-base mt-1 sm:mt-2">
          Referencia completa das rotas de API disponiveis no sistema. Comandos prontos para copiar e colar.
        </p>
      </div>

      {/* Card de Autenticação da API */}
      <Alert className="mb-4 sm:mb-6 border-primary/50 bg-primary/5">
        <ShieldCheck className="h-4 w-4" />
        <AlertTitle className="text-sm sm:text-base">Autenticacao da API</AlertTitle>
        <AlertDescription className="mt-2">
          <p className="text-xs sm:text-sm mb-3">
            Todas as rotas protegidas requerem o header <code className="bg-muted px-1 rounded">x-api-key</code> com a
            chave de seguranca.
          </p>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <div className="flex items-center gap-2 bg-muted px-2 sm:px-3 py-1.5 sm:py-2 rounded w-full sm:w-auto">
              <Key className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
              <code className="text-xs sm:text-sm font-mono break-all">{apiKey}</code>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(apiKey, "apikey")}
              className="w-full sm:w-auto text-xs sm:text-sm"
            >
              {copiedIndex === "apikey" ? (
                <Check className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              ) : (
                <Copy className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              )}
              {copiedIndex === "apikey" ? "Copiado!" : "Copiar"}
            </Button>
          </div>
        </AlertDescription>
      </Alert>

      <Card className="mb-4 sm:mb-6">
        <CardHeader className="p-3 sm:p-6">
          <CardTitle className="text-sm sm:text-base">Base URL</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Todas as requisicoes devem ser feitas para:</CardDescription>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
          <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
            <code className="bg-muted px-2 sm:px-3 py-1.5 sm:py-2 rounded text-xs sm:text-sm block break-all flex-1">
              {baseUrl}
            </code>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(baseUrl, "baseurl")}
              className="text-xs sm:text-sm"
            >
              {copiedIndex === "baseurl" ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
              {copiedIndex === "baseurl" ? "Copiado!" : "Copiar"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="Autenticacao" className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-1 mb-4 w-full justify-start">
          {apiRoutes.map((category) => (
            <TabsTrigger
              key={category.category}
              value={category.category}
              className="text-[10px] sm:text-xs md:text-sm px-2 sm:px-3 py-1 sm:py-1.5"
            >
              {category.category}
            </TabsTrigger>
          ))}
        </TabsList>

        {apiRoutes.map((category) => (
          <TabsContent key={category.category} value={category.category}>
            <ScrollArea className="h-[calc(100vh-400px)] sm:h-[calc(100vh-350px)]">
              <div className="space-y-4 sm:space-y-6 pr-2 sm:pr-4">
                {category.routes.map((route, index) => {
                  const routeKey = `${category.category}-${index}`
                  const curlCommand = generateCurlCommand(route.method, route.path, route.body, route.protected)
                  const fetchCommand = generateFetchCommand(route.method, route.path, route.body, route.protected)

                  return (
                    <Card key={index}>
                      <CardHeader className="p-3 sm:p-4 pb-2 sm:pb-3">
                        <div className="flex flex-col gap-2">
                          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                            <Badge className={`${getMethodColor(route.method)} text-white text-[10px] sm:text-xs`}>
                              {route.method}
                            </Badge>
                            {route.protected && (
                              <Badge variant="outline" className="text-[10px] sm:text-xs">
                                <Key className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                                Protegida
                              </Badge>
                            )}
                          </div>
                          <code className="text-[10px] sm:text-xs md:text-sm font-mono bg-muted px-1.5 sm:px-2 py-1 rounded break-all">
                            {route.path}
                          </code>
                        </div>
                        <CardDescription className="mt-2 text-xs sm:text-sm">{route.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="p-3 sm:p-4 pt-0 space-y-4">
                        {/* Comando CURL */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-xs sm:text-sm font-semibold flex items-center gap-2">
                              <Badge variant="secondary" className="text-[10px] sm:text-xs">
                                cURL
                              </Badge>
                              Comando pronto para copiar
                            </h4>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(curlCommand.replace(/\\\n\s*/g, " "), `curl-${routeKey}`)}
                              className="text-[10px] sm:text-xs h-7"
                            >
                              {copiedIndex === `curl-${routeKey}` ? (
                                <>
                                  <Check className="h-3 w-3 mr-1" /> Copiado!
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3 w-3 mr-1" /> Copiar
                                </>
                              )}
                            </Button>
                          </div>
                          <pre className="bg-zinc-900 text-green-400 p-2 sm:p-3 rounded text-[10px] sm:text-xs overflow-x-auto whitespace-pre-wrap">
                            {curlCommand}
                          </pre>
                        </div>

                        {/* Comando JavaScript/Fetch */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-xs sm:text-sm font-semibold flex items-center gap-2">
                              <Badge variant="secondary" className="text-[10px] sm:text-xs">
                                JavaScript
                              </Badge>
                              Fetch API
                            </h4>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(fetchCommand, `fetch-${routeKey}`)}
                              className="text-[10px] sm:text-xs h-7"
                            >
                              {copiedIndex === `fetch-${routeKey}` ? (
                                <>
                                  <Check className="h-3 w-3 mr-1" /> Copiado!
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3 w-3 mr-1" /> Copiar
                                </>
                              )}
                            </Button>
                          </div>
                          <pre className="bg-zinc-900 text-blue-400 p-2 sm:p-3 rounded text-[10px] sm:text-xs overflow-x-auto whitespace-pre-wrap">
                            {fetchCommand}
                          </pre>
                        </div>

                        {/* Response esperada */}
                        <div>
                          <h4 className="text-xs sm:text-sm font-semibold mb-2 flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px] sm:text-xs">
                              Response
                            </Badge>
                            Resposta esperada
                          </h4>
                          <pre className="bg-muted p-2 sm:p-3 rounded text-[10px] sm:text-xs overflow-x-auto">
                            {JSON.stringify(route.response, null, 2)}
                          </pre>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </ScrollArea>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
