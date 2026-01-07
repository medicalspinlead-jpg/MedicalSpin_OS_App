import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { validateApiKey } from "@/lib/api-auth"

export async function GET(request: Request) {
  const auth = validateApiKey(request)
  if (!auth.valid) return auth.response

  try {
    const clientes = await prisma.cliente.findMany({
      orderBy: { razaoSocial: "asc" },
      include: { equipamentos: true },
    })
    return NextResponse.json(
      clientes.map((c) => ({
        id: c.id,
        razaoSocial: c.razaoSocial,
        nomeFantasia: c.nomeFantasia,
        cnpj: c.cnpj,
        cidade: c.cidade,
        uf: c.uf,
        telefone: c.telefone,
        email: c.email,
        responsavel: c.responsavel,
        createdAt: c.createdAt.toISOString(),
        equipamentos: c.equipamentos.map((e) => ({
          id: e.id,
          clienteId: e.clienteId,
          tipo: e.tipo,
          fabricante: e.fabricante,
          modelo: e.modelo,
          numeroSerie: e.numeroSerie,
          createdAt: e.createdAt.toISOString(),
        })),
      })),
    )
  } catch (error) {
    console.error("Erro ao buscar clientes:", error)
    return NextResponse.json({ error: "Erro ao buscar clientes" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const auth = validateApiKey(request)
  if (!auth.valid) return auth.response

  try {
    const data = await request.json()

    // Verifica se é um array (criação em lote) ou um único objeto
    const isArray = Array.isArray(data)
    const clientesData = isArray ? data : [data]

    const resultados: any[] = []
    const erros: any[] = []

    for (const clienteData of clientesData) {
      try {
        const cliente = await prisma.cliente.create({
          data: {
            razaoSocial: clienteData.razaoSocial,
            nomeFantasia: clienteData.nomeFantasia,
            cnpj: clienteData.cnpj,
            cidade: clienteData.cidade,
            uf: clienteData.uf,
            telefone: clienteData.telefone,
            email: clienteData.email,
            responsavel: clienteData.responsavel,
            equipamentos: clienteData.equipamentos
              ? {
                  create: clienteData.equipamentos.map(
                    (e: { tipo: string; fabricante: string; modelo: string; numeroSerie: string }) => ({
                      tipo: e.tipo,
                      fabricante: e.fabricante,
                      modelo: e.modelo,
                      numeroSerie: e.numeroSerie,
                    }),
                  ),
                }
              : undefined,
          },
          include: { equipamentos: true },
        })

        resultados.push({
          id: cliente.id,
          razaoSocial: cliente.razaoSocial,
          nomeFantasia: cliente.nomeFantasia,
          cnpj: cliente.cnpj,
          cidade: cliente.cidade,
          uf: cliente.uf,
          telefone: cliente.telefone,
          email: cliente.email,
          responsavel: cliente.responsavel,
          createdAt: cliente.createdAt.toISOString(),
          equipamentos: cliente.equipamentos.map((e) => ({
            id: e.id,
            clienteId: e.clienteId,
            tipo: e.tipo,
            fabricante: e.fabricante,
            modelo: e.modelo,
            numeroSerie: e.numeroSerie,
            createdAt: e.createdAt.toISOString(),
          })),
        })
      } catch (error) {
        if (error instanceof Error && error.message.includes("Unique constraint failed on the fields: (`cnpj`)")) {
          erros.push({
            cnpj: clienteData.cnpj,
            razaoSocial: clienteData.razaoSocial,
            error: "CNPJ já cadastrado",
          })
        } else {
          erros.push({
            cnpj: clienteData.cnpj,
            razaoSocial: clienteData.razaoSocial,
            error: error instanceof Error ? error.message : String(error),
          })
        }
      }
    }

    // Se era um único objeto, retorna no formato antigo para compatibilidade
    if (!isArray) {
      if (erros.length > 0) {
        return NextResponse.json(
          { error: erros[0].error, message: `Erro ao criar cliente: ${erros[0].error}` },
          { status: erros[0].error === "CNPJ já cadastrado" ? 409 : 500 },
        )
      }
      return NextResponse.json(resultados[0])
    }

    // Se era um array, retorna o resultado completo
    return NextResponse.json({
      sucesso: resultados.length,
      erros: erros.length,
      clientes: resultados,
      falhas: erros,
    })
  } catch (error) {
    console.error("[v0] Erro ao criar cliente(s):", error)
    return NextResponse.json(
      { error: "Erro ao criar cliente(s)", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
