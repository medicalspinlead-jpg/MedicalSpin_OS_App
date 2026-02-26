import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

const noCacheHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
}

// GET - Preferencias de notificacao do cliente
export async function GET() {
  try {
    const usuario = await getCurrentUser()
    if (!usuario || usuario.cargo !== "cliente" || !usuario.clienteId) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401, headers: noCacheHeaders })
    }

    const cliente = await prisma.cliente.findUnique({
      where: { id: usuario.clienteId },
      select: { notifEmail: true, notifWhatsapp: true },
    })

    if (!cliente) {
      return NextResponse.json({ error: "Cliente nao encontrado" }, { status: 404, headers: noCacheHeaders })
    }

    return NextResponse.json(
      { notifEmail: cliente.notifEmail, notifWhatsapp: cliente.notifWhatsapp },
      { headers: noCacheHeaders }
    )
  } catch (error) {
    console.error("Erro ao buscar notificacoes:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500, headers: noCacheHeaders })
  }
}

// PUT - Atualizar preferencias de notificacao
export async function PUT(request: Request) {
  try {
    const usuario = await getCurrentUser()
    if (!usuario || usuario.cargo !== "cliente" || !usuario.clienteId) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401, headers: noCacheHeaders })
    }

    const body = await request.json()
    const { notifEmail, notifWhatsapp } = body

    if (typeof notifEmail !== "boolean" || typeof notifWhatsapp !== "boolean") {
      return NextResponse.json(
        { error: "notifEmail e notifWhatsapp devem ser booleanos" },
        { status: 400, headers: noCacheHeaders }
      )
    }

    const cliente = await prisma.cliente.update({
      where: { id: usuario.clienteId },
      data: { notifEmail, notifWhatsapp },
      select: { notifEmail: true, notifWhatsapp: true },
    })

    return NextResponse.json(
      { notifEmail: cliente.notifEmail, notifWhatsapp: cliente.notifWhatsapp },
      { headers: noCacheHeaders }
    )
  } catch (error) {
    console.error("Erro ao atualizar notificacoes:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500, headers: noCacheHeaders })
  }
}
