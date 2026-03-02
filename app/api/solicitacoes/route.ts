import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { validateApiKey } from "@/lib/api-auth"

const noCacheHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
}

function generateProtocolo(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `SOL-${year}${month}${day}-${random}`
}

function mapSolicitacao(s: NonNullable<Awaited<ReturnType<typeof prisma.solicitacao.findUnique>>>) {
  return {
    id: s.id,
    protocolo: s.protocolo,
    status: s.status,
    nomeEmpresa: s.nomeEmpresa,
    cnpj: s.cnpj || "",
    nomeContato: s.nomeContato,
    telefone: s.telefone,
    email: s.email,
    cidade: s.cidade,
    uf: s.uf,
    tipoEquipamento: s.tipoEquipamento,
    fabricante: s.fabricante,
    modelo: s.modelo,
    numeroSerie: s.numeroSerie || "",
    descricaoProblema: s.descricaoProblema,
    urgencia: s.urgencia,
    ordemServicoId: s.ordemServicoId,
    midias: (s.midias as Record<string, unknown>) || {},
    motivoCancelamento: s.motivoCancelamento || null,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  }
}

// GET - Lista solicitações (protegido, para técnicos)
export async function GET(request: Request) {
  const auth = validateApiKey(request)
  if (!auth.valid) return auth.response

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")

    const statusList = status ? status.split(",").map((s) => s.trim()) : null

    const solicitacoes = await prisma.solicitacao.findMany({
      where: statusList ? { status: { in: statusList } } : undefined,
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(solicitacoes.map(mapSolicitacao), { headers: noCacheHeaders })
  } catch (error) {
    console.error("Erro ao buscar solicitações:", error)
    return NextResponse.json({ error: "Erro ao buscar solicitações" }, { status: 500, headers: noCacheHeaders })
  }
}

// POST - Cria solicitação (público, sem auth)
export async function POST(request: Request) {
  try {
    const data = await request.json()

    // Validação básica
    const requiredFields = ["nomeEmpresa", "nomeContato", "telefone", "email", "cidade", "uf", "tipoEquipamento", "fabricante", "modelo", "descricaoProblema"]
    for (const field of requiredFields) {
      if (!data[field] || String(data[field]).trim() === "") {
        return NextResponse.json(
          { error: `Campo obrigatório não preenchido: ${field}` },
          { status: 400, headers: noCacheHeaders }
        )
      }
    }

    const protocolo = generateProtocolo()

    const solicitacao = await prisma.solicitacao.create({
      data: {
        protocolo,
        status: "recebida",
        nomeEmpresa: data.nomeEmpresa,
        cnpj: data.cnpj || null,
        nomeContato: data.nomeContato,
        telefone: data.telefone,
        email: data.email,
        cidade: data.cidade,
        uf: data.uf,
        tipoEquipamento: data.tipoEquipamento,
        fabricante: data.fabricante,
        modelo: data.modelo,
        numeroSerie: data.numeroSerie || null,
        descricaoProblema: data.descricaoProblema,
        urgencia: data.urgencia || "normal",
      },
    })

    // Registrar historico do status inicial
    try {
      await prisma.historicoStatusSolicitacao.create({
        data: {
          solicitacaoId: solicitacao.id,
          status: "recebida",
          observacao: "Solicitacao criada",
        },
      })
    } catch (histError) {
      console.error("Erro ao registrar historico de status:", histError)
    }

    return NextResponse.json(mapSolicitacao(solicitacao), { status: 201, headers: noCacheHeaders })
  } catch (error) {
    console.error("Erro ao criar solicitação:", error)
    return NextResponse.json({ error: "Erro ao criar solicitação" }, { status: 500, headers: noCacheHeaders })
  }
}
