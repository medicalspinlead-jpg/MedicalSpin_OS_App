import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { validateApiKey } from "@/lib/api-auth"

const noCacheHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
}

// Garante que a coluna `ativo` existe na tabela, aplicando a migration automaticamente se necessário
async function ensureAtivoColumn() {
  try {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE equipamentos ADD COLUMN IF NOT EXISTS ativo BOOLEAN NOT NULL DEFAULT true`,
    )
  } catch {
    // coluna já existe ou banco não suporta IF NOT EXISTS — ignorar silenciosamente
  }
}

export async function GET(request: Request) {
  const auth = validateApiKey(request)
  if (!auth.valid) return auth.response

  try {
    await ensureAtivoColumn()

    const { searchParams } = new URL(request.url)
    const clienteId = searchParams.get("clienteId")

    const incluirInativos = searchParams.get("incluirInativos") === "true"

    const where: Record<string, unknown> = {}
    if (clienteId) where.clienteId = clienteId
    if (!incluirInativos) where.ativo = true

    const equipamentos = await prisma.equipamento.findMany({
      where,
      orderBy: { tipo: "asc" },
    })
    return NextResponse.json(
      equipamentos.map((e) => ({
        id: e.id,
        clienteId: e.clienteId,
        tipo: e.tipo,
        fabricante: e.fabricante,
        modelo: e.modelo,
        numeroSerie: e.numeroSerie,
        ativo: e.ativo,
        createdAt: e.createdAt.toISOString(),
      })),
      { headers: noCacheHeaders },
    )
  } catch (error) {
    console.error("Erro ao buscar equipamentos:", error)
    return NextResponse.json({ error: "Erro ao buscar equipamentos" }, { status: 500, headers: noCacheHeaders })
  }
}

export async function POST(request: Request) {
  const auth = validateApiKey(request)
  if (!auth.valid) return auth.response

  try {
    await ensureAtivoColumn()
    const data = await request.json()

    // Verifica se é um array (criação em lote) ou um único objeto
    const isArray = Array.isArray(data)
    const equipamentosData = isArray ? data : [data]

    const resultados: any[] = []
    const erros: any[] = []

    for (const equipData of equipamentosData) {
      try {
        const equipamento = await prisma.equipamento.create({
          data: {
            clienteId: equipData.clienteId,
            tipo: equipData.tipo,
            fabricante: equipData.fabricante,
            modelo: equipData.modelo,
            numeroSerie: equipData.numeroSerie,
            ativo: equipData.ativo !== undefined ? equipData.ativo : true,
          },
        })

        resultados.push({
          id: equipamento.id,
          clienteId: equipamento.clienteId,
          tipo: equipamento.tipo,
          fabricante: equipamento.fabricante,
          modelo: equipamento.modelo,
          numeroSerie: equipamento.numeroSerie,
          ativo: equipamento.ativo,
          createdAt: equipamento.createdAt.toISOString(),
        })
      } catch (error) {
        erros.push({
          numeroSerie: equipData.numeroSerie,
          tipo: equipData.tipo,
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }

    // Se era um único objeto, retorna no formato antigo para compatibilidade
    if (!isArray) {
      if (erros.length > 0) {
        return NextResponse.json(
          { error: "Erro ao criar equipamento", details: erros[0].error },
          { status: 500, headers: noCacheHeaders },
        )
      }
      return NextResponse.json(resultados[0], { headers: noCacheHeaders })
    }

    // Se era um array, retorna o resultado completo
    return NextResponse.json(
      {
        sucesso: resultados.length,
        erros: erros.length,
        equipamentos: resultados,
        falhas: erros,
      },
      { headers: noCacheHeaders },
    )
  } catch (error) {
    console.error("Erro ao criar equipamento(s):", error)
    return NextResponse.json({ error: "Erro ao criar equipamento(s)" }, { status: 500, headers: noCacheHeaders })
  }
}
