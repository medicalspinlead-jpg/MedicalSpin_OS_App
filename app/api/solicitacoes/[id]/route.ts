import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { validateApiKey } from "@/lib/api-auth"
import { getCurrentUser } from "@/lib/auth"
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
          usuarioNome: h.usuarioNome || null,
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

// Função para normalizar tipo de equipamento e encontrar departamento correspondente
function normalizarTipoEquipamento(tipo: string): string {
  const tipoLower = tipo.toLowerCase().trim()
  
  if (tipoLower.includes("ressonância") || tipoLower.includes("ressonancia") || tipoLower === "rm") {
    return "ressonância magnética"
  }
  if (tipoLower.includes("ultrassom") || tipoLower.includes("ultra-som") || tipoLower === "us") {
    return "ultrassom"
  }
  if (tipoLower.includes("tomografia") || tipoLower.includes("tomografo") || tipoLower === "ct" || tipoLower === "tc") {
    return "tomografia"
  }
  
  return tipoLower
}

// PUT - Atualiza solicitação (protegido)
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = validateApiKey(request)
  if (!auth.valid) return auth.response

  try {
    const { id } = await params
    const data = await request.json()
    
    // Obter usuario atual para associar como responsavel
    const currentUser = await getCurrentUser()

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
          em_progresso: "Solicitação em andamento",
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
            usuarioNome: data.usuarioNome || null,
          },
        })
      } catch (histError) {
        console.error("Erro ao registrar historico de status:", histError)
      }
    }

    // Associar cliente ao departamento e tecnico ao aceitar solicitacao (em_progresso)
    if (data.status === "em_progresso" && statusAnterior === "recebida" && solicitacao.clienteId) {
      try {
        const tipoNormalizado = normalizarTipoEquipamento(solicitacaoAntes?.tipoEquipamento || "")
        
        // Buscar departamento correspondente ao tipo de equipamento
        const departamentos = await prisma.departamento.findMany({
          where: { ativo: true },
        })
        
        const departamentoCorrespondente = departamentos.find(
          dep => normalizarTipoEquipamento(dep.nome) === tipoNormalizado
        )
        
        if (departamentoCorrespondente) {
          // Verificar se o cliente ja nao esta associado a este departamento
          const clienteJaAssociado = await prisma.clienteDepartamento.findFirst({
            where: {
              clienteId: solicitacao.clienteId,
              departamentoId: departamentoCorrespondente.id,
            },
          })
          
          if (!clienteJaAssociado) {
            // Associar cliente ao departamento com o usuario atual como responsavel
            await prisma.clienteDepartamento.create({
              data: {
                clienteId: solicitacao.clienteId,
                departamentoId: departamentoCorrespondente.id,
                usuarioResponsavelId: currentUser?.id || null,
              },
            })
            console.log(`Cliente ${solicitacao.clienteId} associado ao departamento ${departamentoCorrespondente.nome} com responsavel ${currentUser?.nome || 'nao definido'}`)
          } else if (currentUser && !clienteJaAssociado.usuarioResponsavelId) {
            // Se ja esta associado mas sem responsavel, atualizar com o usuario atual
            await prisma.clienteDepartamento.update({
              where: { id: clienteJaAssociado.id },
              data: { usuarioResponsavelId: currentUser.id },
            })
            console.log(`Responsavel ${currentUser.nome} atribuido ao cliente ${solicitacao.clienteId} no departamento ${departamentoCorrespondente.nome}`)
          }
        }
      } catch (assocError) {
        console.error("Erro ao associar cliente ao departamento:", assocError)
      }
    }

    // Desassociar cliente do departamento ao finalizar/concluir solicitacao
    if ((data.status === "finalizada" || data.status === "cancelada") && solicitacao.clienteId) {
      try {
        const tipoNormalizado = normalizarTipoEquipamento(solicitacaoAntes?.tipoEquipamento || "")
        
        // Buscar departamento correspondente ao tipo de equipamento
        const departamentos = await prisma.departamento.findMany({
          where: { ativo: true },
        })
        
        const departamentoCorrespondente = departamentos.find(
          dep => normalizarTipoEquipamento(dep.nome) === tipoNormalizado
        )
        
        if (departamentoCorrespondente) {
          // Verificar se existem outras solicitacoes em progresso para este cliente e departamento
          const outrasSolicitacoesAtivas = await prisma.solicitacao.count({
            where: {
              clienteId: solicitacao.clienteId,
              status: "em_progresso",
              id: { not: id }, // Excluir a solicitacao atual
              tipoEquipamento: solicitacaoAntes?.tipoEquipamento,
            },
          })
          
          // So desassociar se nao houver outras solicitacoes ativas
          if (outrasSolicitacoesAtivas === 0) {
            await prisma.clienteDepartamento.deleteMany({
              where: {
                clienteId: solicitacao.clienteId,
                departamentoId: departamentoCorrespondente.id,
              },
            })
            console.log(`Cliente ${solicitacao.clienteId} desassociado do departamento ${departamentoCorrespondente.nome}`)
          } else {
            console.log(`Cliente ${solicitacao.clienteId} mantido no departamento ${departamentoCorrespondente.nome} - ${outrasSolicitacoesAtivas} solicitacoes ativas`)
          }
        }
      } catch (desassocError) {
        console.error("Erro ao desassociar cliente do departamento:", desassocError)
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
