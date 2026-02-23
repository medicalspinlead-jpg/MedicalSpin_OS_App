import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

const noCacheHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
}

// GET - Dados do perfil do cliente (empresa vinculada)
export async function GET() {
  try {
    const usuario = await getCurrentUser()
    if (!usuario || usuario.cargo !== "cliente" || !usuario.clienteId) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401, headers: noCacheHeaders })
    }

    const cliente = await prisma.cliente.findUnique({
      where: { id: usuario.clienteId },
    })

    if (!cliente) {
      return NextResponse.json({ error: "Cliente nao encontrado" }, { status: 404, headers: noCacheHeaders })
    }

    return NextResponse.json(
      {
        id: cliente.id,
        razaoSocial: cliente.razaoSocial,
        nomeFantasia: cliente.nomeFantasia,
        cnpj: cliente.cnpj,
        cidade: cliente.cidade,
        uf: cliente.uf,
        telefone: cliente.telefone,
        email: cliente.email,
        responsavel: cliente.responsavel,
      },
      { headers: noCacheHeaders }
    )
  } catch (error) {
    console.error("Erro ao buscar perfil do cliente:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500, headers: noCacheHeaders })
  }
}
