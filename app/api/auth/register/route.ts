import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hashPassword } from "@/lib/auth"

const WEBHOOK_REGISTRO_URL = "https://n8n-www4kggggc4c8k8ow4w8g4g0.95.217.164.173.sslip.io/webhook/73836a3f-236a-4f76-8cbf-522c95c93db9"

export async function POST(request: Request) {
  try {
    const { nome, email, senha, cnpj } = await request.json()

    if (!nome || !email || !senha || !cnpj) {
      return NextResponse.json(
        { error: "Nome, email, senha e CNPJ sao obrigatorios" },
        { status: 400 }
      )
    }

    // Verificar se email ja existe
    const existingUser = await prisma.usuario.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "Este email ja esta cadastrado no sistema" },
        { status: 409 }
      )
    }

    // Normalizar CNPJ - remover caracteres especiais
    const cnpjNormalizado = cnpj.replace(/[^\d]/g, "")

    // Buscar cliente pelo CNPJ
    let cliente = await prisma.cliente.findFirst({
      where: {
        cnpj: {
          contains: cnpjNormalizado,
        },
      },
    })

    if (!cliente) {
      // Tentar buscar com CNPJ formatado tambem
      cliente = await prisma.cliente.findFirst({
        where: {
          cnpj: {
            contains: cnpj,
          },
        },
      })

      if (!cliente) {
        return NextResponse.json(
          { error: "CNPJ nao encontrado no sistema. Entre em contato com a Medical Spin para que sua empresa seja cadastrada antes de criar uma conta." },
          { status: 404 }
        )
      }
    }

    // Criar usuario com aprovado = false (aguardando aprovacao)
    const senhaHash = hashPassword(senha)
    const usuario = await prisma.usuario.create({
      data: {
        nome,
        email: email.toLowerCase(),
        senha: senhaHash,
        cargo: "cliente",
        clienteId: cliente.id,
        aprovado: false, // Aguardando aprovacao
      },
    })

    // Buscar admins com notificacoes ativadas
    const adminsComNotificacao = await prisma.usuario.findMany({
      where: {
        cargo: "admin",
        ativo: true,
        OR: [
          { notifEmail: true },
          { notifWhatsapp: true },
        ],
      },
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        notifEmail: true,
        notifWhatsapp: true,
      },
    })

    // Enviar dados para o webhook
    try {
      await fetch(WEBHOOK_REGISTRO_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          evento: "novo_registro_cliente",
          usuario: {
            id: usuario.id,
            nome: usuario.nome,
            email: usuario.email,
            cargo: usuario.cargo,
          },
          empresa: {
            id: cliente.id,
            razaoSocial: cliente.razaoSocial,
            nomeFantasia: cliente.nomeFantasia,
            cnpj: cliente.cnpj,
            cidade: cliente.cidade,
            uf: cliente.uf,
          },
          adminsNotificacao: adminsComNotificacao.map((admin) => ({
            id: admin.id,
            nome: admin.nome,
            email: admin.email,
            telefone: admin.telefone,
            canais: {
              email: admin.notifEmail,
              whatsapp: admin.notifWhatsapp,
            },
          })),
          dataRegistro: new Date().toISOString(),
        }),
      })
    } catch (webhookError) {
      console.error("Erro ao enviar webhook de registro:", webhookError)
      // Nao falhar o registro se o webhook falhar
    }

    // NAO criar sessao - aguardar aprovacao
    return NextResponse.json({
      success: true,
      pendingApproval: true,
      message: "Cadastro realizado com sucesso! Sua conta esta aguardando aprovacao. Voce recebera uma notificacao quando sua conta for aprovada.",
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        cargo: usuario.cargo,
        clienteId: cliente.id,
      },
      empresa: cliente.razaoSocial,
    })
  } catch (error) {
    console.error("Erro ao registrar usuario:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
