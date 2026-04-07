import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { enviarWebhookNovaSolicitacao } from "@/lib/webhook-solicitacao"

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

// GET - Lista solicitacoes do cliente autenticado
export async function GET() {
  try {
    const usuario = await getCurrentUser()
    if (!usuario || usuario.cargo !== "cliente" || !usuario.clienteId) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401, headers: noCacheHeaders })
    }

    const solicitacoes = await prisma.solicitacao.findMany({
      where: { clienteId: usuario.clienteId },
      orderBy: { createdAt: "desc" },
    })

    const mapped = solicitacoes.map((s) => ({
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
      clienteId: s.clienteId,
      midias: (s.midias as Record<string, unknown>) || {},
      motivoCancelamento: s.motivoCancelamento || null,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    }))

    return NextResponse.json(mapped, { headers: noCacheHeaders })
  } catch (error) {
    console.error("Erro ao buscar solicitacoes do cliente:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500, headers: noCacheHeaders })
  }
}

// POST - Cria solicitacao vinculada ao cliente autenticado
export async function POST(request: Request) {
  try {
    const usuario = await getCurrentUser()
    if (!usuario || usuario.cargo !== "cliente" || !usuario.clienteId) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401, headers: noCacheHeaders })
    }

    // Buscar dados do cliente para preencher automaticamente
    const cliente = await prisma.cliente.findUnique({
      where: { id: usuario.clienteId },
    })

    if (!cliente) {
      return NextResponse.json({ error: "Cliente nao encontrado" }, { status: 404, headers: noCacheHeaders })
    }

    const data = await request.json()

    // Validacao
    const requiredFields = ["tipoEquipamento", "fabricante", "modelo", "descricaoProblema"]
    for (const field of requiredFields) {
      if (!data[field] || String(data[field]).trim() === "") {
        return NextResponse.json(
          { error: `Campo obrigatorio nao preenchido: ${field}` },
          { status: 400, headers: noCacheHeaders }
        )
      }
    }

    const protocolo = generateProtocolo()

    const solicitacao = await prisma.solicitacao.create({
      data: {
        protocolo,
        status: "recebida",
        nomeEmpresa: cliente.razaoSocial,
        cnpj: cliente.cnpj,
        nomeContato: data.nomeContato || cliente.responsavel,
        telefone: data.telefone || cliente.telefone,
        email: data.email || cliente.email,
        cidade: data.cidade || cliente.cidade,
        uf: data.uf || cliente.uf,
        tipoEquipamento: data.tipoEquipamento,
        fabricante: data.fabricante,
        modelo: data.modelo,
        numeroSerie: data.numeroSerie || null,
        descricaoProblema: data.descricaoProblema,
        urgencia: data.urgencia || "normal",
        clienteId: usuario.clienteId,
        midias: data.midias || {},
      },
    })

    // Registrar historico do status inicial
    try {
      await prisma.historicoStatusSolicitacao.create({
        data: {
          solicitacaoId: solicitacao.id,
          status: "recebida",
          observacao: "Solicitação criada pelo portal do cliente",
        },
      })
    } catch (histError) {
      console.error("Erro ao registrar historico de status:", histError)
    }

    // Buscar tecnicos e admins com notificacoes ativadas
    const usuariosComNotificacao = await prisma.usuario.findMany({
      where: {
        cargo: { in: ["admin", "tecnico"] },
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

    // Enviar webhook com todas as informações da solicitação
    enviarWebhookNovaSolicitacao({
      id: solicitacao.id,
      protocolo: solicitacao.protocolo,
      status: solicitacao.status,
      nomeEmpresa: solicitacao.nomeEmpresa,
      cnpj: solicitacao.cnpj,
      nomeContato: solicitacao.nomeContato,
      telefone: solicitacao.telefone,
      email: solicitacao.email,
      cidade: solicitacao.cidade,
      uf: solicitacao.uf,
      tipoEquipamento: solicitacao.tipoEquipamento,
      fabricante: solicitacao.fabricante,
      modelo: solicitacao.modelo,
      numeroSerie: solicitacao.numeroSerie,
      descricaoProblema: solicitacao.descricaoProblema,
      urgencia: solicitacao.urgencia,
      clienteId: solicitacao.clienteId,
      midias: (solicitacao.midias as Record<string, unknown>) || {},
      createdAt: solicitacao.createdAt.toISOString(),
      updatedAt: solicitacao.updatedAt.toISOString(),
      usuariosNotificacao: usuariosComNotificacao.map((u) => ({
        id: u.id,
        nome: u.nome,
        email: u.email,
        telefone: u.telefone,
        canais: {
          email: u.notifEmail,
          whatsapp: u.notifWhatsapp,
        },
      })),
    })

    return NextResponse.json(
      {
        id: solicitacao.id,
        protocolo: solicitacao.protocolo,
        status: solicitacao.status,
        nomeEmpresa: solicitacao.nomeEmpresa,
        cnpj: solicitacao.cnpj || "",
        nomeContato: solicitacao.nomeContato,
        telefone: solicitacao.telefone,
        email: solicitacao.email,
        cidade: solicitacao.cidade,
        uf: solicitacao.uf,
        tipoEquipamento: solicitacao.tipoEquipamento,
        fabricante: solicitacao.fabricante,
        modelo: solicitacao.modelo,
        numeroSerie: solicitacao.numeroSerie || "",
        descricaoProblema: solicitacao.descricaoProblema,
        urgencia: solicitacao.urgencia,
        ordemServicoId: solicitacao.ordemServicoId,
        clienteId: solicitacao.clienteId,
        midias: (solicitacao.midias as Record<string, unknown>) || {},
        motivoCancelamento: solicitacao.motivoCancelamento || null,
        createdAt: solicitacao.createdAt.toISOString(),
        updatedAt: solicitacao.updatedAt.toISOString(),
      },
      { status: 201, headers: noCacheHeaders }
    )
  } catch (error) {
    console.error("Erro ao criar solicitacao do cliente:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500, headers: noCacheHeaders })
  }
}
