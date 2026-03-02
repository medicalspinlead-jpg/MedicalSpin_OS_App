import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { validateApiKey } from "@/lib/api-auth"
import { enviarNotificacaoStatus } from "@/lib/webhook-notificacao"

const noCacheHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
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

// GET - Busca solicitação por ID (protegido)
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = validateApiKey(request)
  if (!auth.valid) return auth.response

  try {
    const { id } = await params
    const solicitacao = await prisma.solicitacao.findUnique({
      where: { id },
      include: {
        historicoStatus: {
          orderBy: { criadoEm: "asc" },
        },
      },
    })

    if (!solicitacao) {
      return NextResponse.json({ error: "Solicitação não encontrada" }, { status: 404, headers: noCacheHeaders })
    }

    const mapped = mapSolicitacao(solicitacao)
    return NextResponse.json(
      {
        ...mapped,
        historicoStatus: solicitacao.historicoStatus.map((h) => ({
          id: h.id,
          status: h.status,
          observacao: h.observacao,
          criadoEm: h.criadoEm.toISOString(),
        })),
      },
      { headers: noCacheHeaders }
    )
  } catch (error) {
    console.error("Erro ao buscar solicitação:", error)
    return NextResponse.json({ error: "Erro ao buscar solicitação" }, { status: 500, headers: noCacheHeaders })
  }
}

// PUT - Atualiza solicitação (protegido)
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = validateApiKey(request)
  if (!auth.valid) return auth.response

  try {
    const { id } = await params
    const data = await request.json()

    // Buscar solicitacao antes do update para capturar status anterior
    const solicitacaoAntes = await prisma.solicitacao.findUnique({ where: { id } })
    const statusAnterior = solicitacaoAntes?.status || ""

    const solicitacao = await prisma.solicitacao.update({
      where: { id },
      data: {
        ...(data.status && { status: data.status }),
        ...(data.ordemServicoId !== undefined && { ordemServicoId: data.ordemServicoId }),
        ...(data.motivoCancelamento !== undefined && { motivoCancelamento: data.motivoCancelamento }),
      },
    })

    // Registrar historico se o status mudou
    if (data.status && data.status !== statusAnterior) {
      try {
        const observacaoMap: Record<string, string> = {
          em_progresso: "Solicitacao em andamento",
          finalizada: "Solicitacao finalizada",
          cancelada: data.motivoCancelamento
            ? `Solicitacao cancelada: ${data.motivoCancelamento}`
            : "Solicitacao cancelada",
        }
        await prisma.historicoStatusSolicitacao.create({
          data: {
            solicitacaoId: id,
            status: data.status,
            observacao: observacaoMap[data.status] || `Status alterado para ${data.status}`,
          },
        })
      } catch (histError) {
        console.error("Erro ao registrar historico de status:", histError)
      }
    }

    // Enviar notificacao ao webhook se o status mudou e ha cliente vinculado
    if (data.status && data.status !== statusAnterior && solicitacao.clienteId) {
      try {
        const cliente = await prisma.cliente.findUnique({ where: { id: solicitacao.clienteId } })
        if (cliente && (cliente.notifEmail || cliente.notifWhatsapp)) {
          await enviarNotificacaoStatus(
            {
              id: cliente.id,
              razaoSocial: cliente.razaoSocial,
              nomeFantasia: cliente.nomeFantasia,
              cnpj: cliente.cnpj,
              email: cliente.email,
              telefone: cliente.telefone,
              notifEmail: cliente.notifEmail,
              notifWhatsapp: cliente.notifWhatsapp,
            },
            {
              id: solicitacao.id,
              protocolo: solicitacao.protocolo,
              descricaoProblema: solicitacao.descricaoProblema,
              urgencia: solicitacao.urgencia,
            },
            statusAnterior,
            data.status
          )
        }
      } catch (notifError) {
        console.error("Erro ao enviar notificacao de status:", notifError)
      }
    }

    return NextResponse.json(mapSolicitacao(solicitacao), { headers: noCacheHeaders })
  } catch (error) {
    console.error("Erro ao atualizar solicitação:", error)
    return NextResponse.json({ error: "Erro ao atualizar solicitação" }, { status: 500, headers: noCacheHeaders })
  }
}

// DELETE - Exclui solicitação (protegido)
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = validateApiKey(request)
  if (!auth.valid) return auth.response

  try {
    const { id } = await params
    await prisma.solicitacao.delete({ where: { id } })
    return NextResponse.json({ success: true }, { headers: noCacheHeaders })
  } catch (error) {
    console.error("Erro ao excluir solicitação:", error)
    return NextResponse.json({ error: "Erro ao excluir solicitação" }, { status: 500, headers: noCacheHeaders })
  }
}
