import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { validateApiKey } from "@/lib/api-auth"

const WEBHOOK_APROVACAO_URL = "https://n8n-www4kggggc4c8k8ow4w8g4g0.95.217.164.173.sslip.io/webhook/b99c887c-0cda-4329-ba9e-aa31ebb32fd2"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Verificar autenticação: sessão ou API key
    const currentUser = await getCurrentUser()
    const apiKeyAuth = validateApiKey(request)
    
    if (!currentUser && !apiKeyAuth.valid) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }
    
    // Se autenticado por sessão, verificar se é admin
    if (currentUser && currentUser.cargo !== "admin") {
      return NextResponse.json({ error: "Acesso negado. Apenas administradores podem aprovar usuarios." }, { status: 403 })
    }

    // Buscar usuario
    const usuario = await prisma.usuario.findUnique({
      where: { id },
      include: {
        cliente: true,
      },
    })

    if (!usuario) {
      return NextResponse.json({ error: "Usuario nao encontrado" }, { status: 404 })
    }

    if (usuario.aprovado) {
      return NextResponse.json({ error: "Usuario ja esta aprovado" }, { status: 400 })
    }

    // Aprovar usuario
    const usuarioAtualizado = await prisma.usuario.update({
      where: { id },
      data: { aprovado: true },
      include: {
        cliente: true,
      },
    })

    // Enviar dados para o webhook de aprovacao
    try {
      await fetch(WEBHOOK_APROVACAO_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          evento: "conta_aprovada",
          usuario: {
            id: usuarioAtualizado.id,
            nome: usuarioAtualizado.nome,
            email: usuarioAtualizado.email,
            telefone: usuarioAtualizado.telefone,
            cargo: usuarioAtualizado.cargo,
          },
          empresa: usuarioAtualizado.cliente ? {
            id: usuarioAtualizado.cliente.id,
            razaoSocial: usuarioAtualizado.cliente.razaoSocial,
            nomeFantasia: usuarioAtualizado.cliente.nomeFantasia,
            cnpj: usuarioAtualizado.cliente.cnpj,
            cidade: usuarioAtualizado.cliente.cidade,
            uf: usuarioAtualizado.cliente.uf,
            telefone: usuarioAtualizado.cliente.telefone,
            email: usuarioAtualizado.cliente.email,
          } : null,
          aprovadoPor: currentUser ? {
            id: currentUser.id,
            nome: currentUser.nome,
            email: currentUser.email,
          } : { via: "API Key" },
          dataAprovacao: new Date().toISOString(),
        }),
      })
    } catch (webhookError) {
      console.error("Erro ao enviar webhook de aprovacao:", webhookError)
      // Nao falhar a aprovacao se o webhook falhar
    }

    return NextResponse.json({
      success: true,
      message: "Usuario aprovado com sucesso",
      usuario: {
        id: usuarioAtualizado.id,
        nome: usuarioAtualizado.nome,
        email: usuarioAtualizado.email,
        aprovado: usuarioAtualizado.aprovado,
      },
    })
  } catch (error) {
    console.error("Erro ao aprovar usuario:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// Rejeitar usuario (excluir)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Verificar autenticação: sessão ou API key
    const currentUser = await getCurrentUser()
    const apiKeyAuth = validateApiKey(request)
    
    if (!currentUser && !apiKeyAuth.valid) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }
    
    // Se autenticado por sessão, verificar se é admin
    if (currentUser && currentUser.cargo !== "admin") {
      return NextResponse.json({ error: "Acesso negado. Apenas administradores podem rejeitar usuarios." }, { status: 403 })
    }

    // Buscar usuario
    const usuario = await prisma.usuario.findUnique({
      where: { id },
    })

    if (!usuario) {
      return NextResponse.json({ error: "Usuario nao encontrado" }, { status: 404 })
    }

    // Excluir usuario
    await prisma.usuario.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: "Usuario rejeitado e removido com sucesso",
    })
  } catch (error) {
    console.error("Erro ao rejeitar usuario:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
