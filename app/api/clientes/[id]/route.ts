import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { validateApiKey } from "@/lib/api-auth"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = validateApiKey(request)
  if (!auth.valid) return auth.response

  try {
    const { id } = await params
    const cliente = await prisma.cliente.findUnique({
      where: { id },
      include: { equipamentos: true },
    })
    if (!cliente) {
      return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 })
    }
    return NextResponse.json({
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
    console.error("Erro ao buscar cliente:", error)
    return NextResponse.json({ error: "Erro ao buscar cliente" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = validateApiKey(request)
  if (!auth.valid) return auth.response

  try {
    const { id } = await params
    const data = await request.json()
    const cliente = await prisma.cliente.update({
      where: { id },
      data: {
        razaoSocial: data.razaoSocial,
        nomeFantasia: data.nomeFantasia,
        cnpj: data.cnpj,
        cidade: data.cidade,
        uf: data.uf,
        telefone: data.telefone,
        email: data.email,
        responsavel: data.responsavel,
      },
      include: { equipamentos: true },
    })
    return NextResponse.json({
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
    console.error("Erro ao atualizar cliente:", error)
    return NextResponse.json({ error: "Erro ao atualizar cliente" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = validateApiKey(request)
  if (!auth.valid) return auth.response

  try {
    const { id } = await params
    await prisma.cliente.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao excluir cliente:", error)
    return NextResponse.json({ error: "Erro ao excluir cliente" }, { status: 500 })
  }
}
