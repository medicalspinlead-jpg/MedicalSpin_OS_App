import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

const noCacheHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
}

// GET - Lista equipamentos do cliente autenticado
export async function GET(request: Request) {
  try {
    const usuario = await getCurrentUser()
    if (!usuario || usuario.cargo !== "cliente" || !usuario.clienteId) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401, headers: noCacheHeaders })
    }

    const { searchParams } = new URL(request.url)
    const incluirInativos = searchParams.get("incluirInativos") === "true"

    const equipamentos = await prisma.equipamento.findMany({
      where: { 
        clienteId: usuario.clienteId,
        ...(incluirInativos ? {} : { ativo: true })
      },
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
      { headers: noCacheHeaders }
    )
  } catch (error) {
    console.error("Erro ao buscar equipamentos do cliente:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500, headers: noCacheHeaders })
  }
}

// POST - Cria equipamento vinculado ao cliente autenticado
export async function POST(request: Request) {
  try {
    const usuario = await getCurrentUser()
    if (!usuario || usuario.cargo !== "cliente" || !usuario.clienteId) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401, headers: noCacheHeaders })
    }

    const data = await request.json()

    if (!data.tipo || String(data.tipo).trim() === "") {
      return NextResponse.json(
        { error: "Tipo do equipamento e obrigatorio" },
        { status: 400, headers: noCacheHeaders }
      )
    }
    if (!data.fabricante || String(data.fabricante).trim() === "") {
      return NextResponse.json(
        { error: "Fabricante e obrigatorio" },
        { status: 400, headers: noCacheHeaders }
      )
    }
    if (!data.modelo || String(data.modelo).trim() === "") {
      return NextResponse.json(
        { error: "Modelo e obrigatorio" },
        { status: 400, headers: noCacheHeaders }
      )
    }

    const equipamento = await prisma.equipamento.create({
      data: {
        clienteId: usuario.clienteId,
        tipo: data.tipo,
        fabricante: data.fabricante,
        modelo: data.modelo,
        numeroSerie: data.numeroSerie || "",
      },
    })

    return NextResponse.json(
      {
        id: equipamento.id,
        clienteId: equipamento.clienteId,
        tipo: equipamento.tipo,
        fabricante: equipamento.fabricante,
        modelo: equipamento.modelo,
        numeroSerie: equipamento.numeroSerie,
        ativo: equipamento.ativo,
        createdAt: equipamento.createdAt.toISOString(),
      },
      { status: 201, headers: noCacheHeaders }
    )
  } catch (error) {
    console.error("Erro ao criar equipamento do cliente:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500, headers: noCacheHeaders })
  }
}
