import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { validateApiKey } from "@/lib/api-auth"
import { enviarNotificacaoStatus } from "@/lib/webhook-notificacao"

const noCacheHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
}

function generateOSName(data: {
  empresa?: { razaoSocial?: string; cnpj?: string }
  cliente?: { razaoSocial?: string; cnpj?: string }
  numero?: string
  finalizedAt?: Date | null
}) {
  const razaoSocial = data.empresa?.razaoSocial || data.cliente?.razaoSocial
  const cnpj = data.empresa?.cnpj || data.cliente?.cnpj

  if (razaoSocial && cnpj) {
    const dataFinalizacao = data.finalizedAt || new Date()
    const dataStr = dataFinalizacao.toLocaleDateString("pt-BR").replace(/\//g, "-")
    // Adiciona hora e minuto para diferenciar OS do mesmo dia
    const horaStr = dataFinalizacao.toLocaleTimeString("pt-BR", { 
      hour: "2-digit", 
      minute: "2-digit",
      hour12: false 
    }).replace(":", "h")
    const nomeFormatado = razaoSocial.replace(/\s+/g, "_").substring(0, 30)
    const cnpjFormatado = cnpj.replace(/[^\d]/g, "")
    return `OS_${nomeFormatado}_${cnpjFormatado}_${dataStr}_${horaStr}`
  }
  return data.numero || `OS-${Date.now()}`
}

function mapOS(
  os: Awaited<ReturnType<typeof prisma.ordemServico.findUnique>> & {
    cliente?: Awaited<ReturnType<typeof prisma.cliente.findUnique>> | null
    equipamento?: Awaited<ReturnType<typeof prisma.equipamento.findUnique>> | null
    pecas: Awaited<ReturnType<typeof prisma.peca.findMany>>
    maoDeObra: Awaited<ReturnType<typeof prisma.maoDeObra.findMany>>
  },
) {
  if (!os) return null

  const empresa = (os.empresa as Record<string, string>) || {}
  const motivo = (os.motivo as Record<string, string>) || {}
  const intervencao = (os.intervencao as Record<string, string>) || {}
  const pendencias = (os.pendencias as Record<string, string>) || {}
  const estadoEquipamento = (os.estadoEquipamento as Record<string, string>) || {}
  const finalizacao = (os.finalizacao as Record<string, string>) || {}
  const midias = (os.midias as { arquivos?: string[] }) || {}

  return {
    id: os.id,
    numero: os.numero,
    status: os.status,
    currentStep: os.currentStep,
    createdAt: os.createdAt.toISOString(),
    updatedAt: os.updatedAt.toISOString(),
    finalizedAt: os.finalizedAt?.toISOString() || null,
    empresa: {
      razaoSocial: empresa.razaoSocial || "",
      nomeFantasia: empresa.nomeFantasia || "",
      cnpj: empresa.cnpj || "",
      cidade: empresa.cidade || "",
      uf: empresa.uf || "",
      telefone: empresa.telefone || "",
      email: empresa.email || "",
      emails: (empresa.emails as string[]) || [],
      responsavel: empresa.responsavel || "",
    },
    cliente: os.cliente
      ? {
          id: os.cliente.id,
          razaoSocial: os.cliente.razaoSocial,
          nomeFantasia: os.cliente.nomeFantasia,
          cnpj: os.cliente.cnpj,
          cidade: os.cliente.cidade,
          uf: os.cliente.uf,
          telefone: os.cliente.telefone,
          email: os.cliente.email,
          responsavel: os.cliente.responsavel,
          createdAt: os.cliente.createdAt.toISOString(),
        }
      : undefined,
    equipamento: os.equipamento
      ? {
          id: os.equipamento.id,
          clienteId: os.equipamento.clienteId,
          tipo: os.equipamento.tipo,
          fabricante: os.equipamento.fabricante,
          modelo: os.equipamento.modelo,
          numeroSerie: os.equipamento.numeroSerie,
          createdAt: os.equipamento.createdAt.toISOString(),
        }
      : undefined,
    motivo: {
      motivacaoServico: motivo.motivacaoServico || "",
      eventosRelevantes: motivo.eventosRelevantes || "",
    },
    intervencao: {
      tipo: intervencao.tipo || "",
      descricaoServicos: intervencao.descricaoServicos || "",
    },
    pecas: os.pecas.map((p) => ({
      id: p.id,
      nome: p.nome,
      modeloRef: p.modeloRef || "",
      numeroSerie: p.numeroSerie || "",
      observacoes: p.observacoes || "",
      quantidade: p.quantidade,
      categoria: p.categoria as "cliente" | "medical-spin",
      tipo: (p.tipo || "removida") as "removida" | "inclusa",
    })),
    maoDeObra: os.maoDeObra.map((m) => ({
      id: m.id,
      data: m.data,
      descricao: m.descricao,
      horas: m.horas,
    })),
    pendencias: {
      medicalSpin: pendencias.medicalSpin || "",
      cliente: pendencias.cliente || "",
    },
    estadoEquipamento: {
      estadoInicial: estadoEquipamento.estadoInicial || "",
      estadoFinal: estadoEquipamento.estadoFinal || "",
    },
    finalizacao: {
      cidade: finalizacao.cidade || "",
      uf: finalizacao.uf || "",
      nomeEngenheiro: finalizacao.nomeEngenheiro || "",
      cftEngenheiro: finalizacao.cftEngenheiro || "",
      nomeRecebedor: finalizacao.nomeRecebedor || "",
    },
    midias: {
      arquivos: midias.arquivos || [],
    },
  }
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = validateApiKey(request)
  if (!auth.valid) return auth.response

  try {
    const { id } = await params
    const os = await prisma.ordemServico.findUnique({
      where: { id },
      include: {
        cliente: true,
        equipamento: true,
        pecas: true,
        maoDeObra: true,
      },
    })
    if (!os) {
      return NextResponse.json({ error: "Ordem de serviço não encontrada" }, { status: 404, headers: noCacheHeaders })
    }

    // Buscar solicitação vinculada para obter o protocolo e id
    let solicitacaoProtocolo: string | null = null
    let solicitacaoId: string | null = null
    try {
      const solicitacao = await prisma.solicitacao.findFirst({
        where: { ordemServicoId: id },
        select: { id: true, protocolo: true },
      })
      solicitacaoProtocolo = solicitacao?.protocolo || null
      solicitacaoId = solicitacao?.id || null
    } catch {
      // tabela pode não existir ainda
    }

    return NextResponse.json({ ...mapOS(os), solicitacaoProtocolo, solicitacaoId }, { headers: noCacheHeaders })
  } catch (error) {
    console.error("Erro ao buscar ordem de serviço:", error)
    return NextResponse.json({ error: "Erro ao buscar ordem de serviço" }, { status: 500, headers: noCacheHeaders })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = validateApiKey(request)
  if (!auth.valid) return auth.response

  try {
    const { id } = await params
    const data = await request.json()

    // Determinar a data de finalização
    const isFinalizando = data.status === "finalizada" || data.status === "fechada"
    const finalizedAt = isFinalizando ? new Date() : null

    const numero = generateOSName({ ...data, finalizedAt })

    // Buscar OS atual para verificar mudancas
    const osAtual = await prisma.ordemServico.findUnique({
      where: { id },
      select: { clienteId: true, status: true }
    })

    // Atualizar a OS
    const os = await prisma.ordemServico.update({
      where: { id },
      data: {
        numero,
        status: data.status || "rascunho",
        currentStep: data.currentStep || 1,
        finalizedAt,
        empresa: data.empresa || {},
        clienteId: data.cliente?.id || null,
        equipamentoId: data.equipamento?.id || null,
        motivo: data.motivo || {},
        intervencao: data.intervencao || {},
        pendencias: data.pendencias || {},
        estadoEquipamento: data.estadoEquipamento || {},
        finalizacao: data.finalizacao || {},
        midias: data.midias || {},
      },
      include: {
        cliente: true,
        equipamento: true,
        pecas: true,
        maoDeObra: true,
      },
    })

    // Gerenciar associacao cliente-departamento
    const clienteId = data.cliente?.id
    const usuarioResponsavel = data.usuarioResponsavel
    const clienteAnterior = osAtual?.clienteId

    // Se mudou o cliente ou e uma nova atribuicao, associar ao departamento
    if (clienteId && usuarioResponsavel?.departamentos?.length > 0 && clienteId !== clienteAnterior) {
      for (const dep of usuarioResponsavel.departamentos) {
        try {
          const existente = await prisma.clienteDepartamento.findUnique({
            where: {
              clienteId_departamentoId: {
                clienteId,
                departamentoId: dep.id
              }
            }
          })
          
          if (!existente) {
            await prisma.clienteDepartamento.create({
              data: {
                clienteId,
                departamentoId: dep.id,
                usuarioResponsavelId: usuarioResponsavel.id
              }
            })
          } else if (!existente.usuarioResponsavelId) {
            await prisma.clienteDepartamento.update({
              where: { id: existente.id },
              data: { usuarioResponsavelId: usuarioResponsavel.id }
            })
          }
        } catch (assocError) {
          console.error("Erro ao associar cliente ao departamento:", assocError)
        }
      }
    }

    // Atualizar peças - deletar antigas e inserir novas
    await prisma.peca.deleteMany({ where: { osId: id } })
    if (data.pecas && data.pecas.length > 0) {
      await prisma.peca.createMany({
        data: data.pecas.map(
          (p: {
            nome: string
            modeloRef?: string
            numeroSerie?: string
            observacoes?: string
            quantidade: number
            categoria: string
            tipo?: string
          }) => ({
            osId: id,
            nome: p.nome,
            modeloRef: p.modeloRef || null,
            numeroSerie: p.numeroSerie || null,
            observacoes: p.observacoes || null,
            quantidade: p.quantidade,
            categoria: p.categoria,
            tipo: p.tipo || "removida",
          }),
        ),
      })
    }

    // Atualizar mão de obra - deletar antigas e inserir novas
    await prisma.maoDeObra.deleteMany({ where: { osId: id } })
    if (data.maoDeObra && data.maoDeObra.length > 0) {
      await prisma.maoDeObra.createMany({
        data: data.maoDeObra.map((m: { data: string; descricao: string; horas: number }) => ({
          osId: id,
          data: m.data,
          descricao: m.descricao,
          horas: m.horas,
        })),
      })
    }

    // Quando OS e finalizada, marcar solicitacoes vinculadas como finalizadas
    if (data.status === "finalizada") {
      try {
        // Buscar solicitacoes vinculadas antes de atualizar para capturar status anterior
        const solicitacoesVinculadas = await prisma.solicitacao.findMany({
          where: { ordemServicoId: id },
          include: { cliente: true },
        })

        await prisma.solicitacao.updateMany({
          where: { ordemServicoId: id },
          data: { status: "finalizada" },
        })

        // Registrar historico de status e enviar notificacoes para cada solicitacao vinculada
        for (const sol of solicitacoesVinculadas) {
          // Registrar historico de status para que o cliente veja a mudanca
          if (sol.status !== "finalizada") {
            try {
              await prisma.historicoStatusSolicitacao.create({
                data: {
                  solicitacaoId: sol.id,
                  status: "finalizada",
                  observacao: "Solicitação finalizada automaticamente ao concluir a Ordem de Servico",
                  usuarioNome: data.finalizacao?.nomeEngenheiro || null,
                },
              })
            } catch (histErr) {
              console.error("Erro ao registrar historico da solicitacao", sol.id, histErr)
            }
          }

          // Enviar webhook de notificacao para solicitacoes vinculadas com cliente
          if (sol.cliente && (sol.cliente.notifEmail || sol.cliente.notifWhatsapp)) {
            try {
              await enviarNotificacaoStatus(
                {
                  id: sol.cliente.id,
                  razaoSocial: sol.cliente.razaoSocial,
                  nomeFantasia: sol.cliente.nomeFantasia,
                  cnpj: sol.cliente.cnpj,
                  email: sol.cliente.email,
                  telefone: sol.cliente.telefone,
                  notifEmail: sol.cliente.notifEmail,
                  notifWhatsapp: sol.cliente.notifWhatsapp,
                },
                {
                  id: sol.id,
                  protocolo: sol.protocolo,
                  descricaoProblema: sol.descricaoProblema,
                  urgencia: sol.urgencia,
                },
                sol.status,
                "finalizada"
              )
            } catch (notifErr) {
              console.error("Erro ao notificar solicitacao", sol.id, notifErr)
            }
          }
        }
      } catch (solError) {
        console.error("Erro ao atualizar solicitacoes vinculadas:", solError)
      }

      // Remover associacao cliente-departamento quando a OS e finalizada
      // Verifica se nao ha outras OS em andamento para este cliente
      if (clienteId) {
        try {
          // Buscar todas as associacoes do cliente
          const associacoes = await prisma.clienteDepartamento.findMany({
            where: { clienteId }
          })

          for (const assoc of associacoes) {
            // Verificar se existe outra OS (rascunho ou fechada) para este cliente neste departamento
            // Buscar usuarios do departamento
            const usuariosDep = await prisma.usuarioDepartamento.findMany({
              where: { departamentoId: assoc.departamentoId },
              select: { usuarioId: true }
            })

            // Verificar se ha outras OS em andamento vinculadas a este cliente
            // (com status rascunho ou fechada, excluindo a OS atual)
            const outrasOsEmAndamento = await prisma.ordemServico.findMany({
              where: {
                clienteId,
                id: { not: id },
                status: { in: ["rascunho", "fechada"] }
              }
            })

            // Se nao ha outras OS em andamento, remove a associacao
            if (outrasOsEmAndamento.length === 0) {
              await prisma.clienteDepartamento.delete({
                where: { id: assoc.id }
              })
            }
          }
        } catch (desassocError) {
          console.error("Erro ao desassociar cliente do departamento:", desassocError)
        }
      }
    }

    // Buscar OS atualizada com relacionamentos
    const updatedOS = await prisma.ordemServico.findUnique({
      where: { id },
      include: {
        cliente: true,
        equipamento: true,
        pecas: true,
        maoDeObra: true,
      },
    })

    return NextResponse.json(mapOS(updatedOS!), { headers: noCacheHeaders })
  } catch (error) {
    console.error("Erro ao atualizar ordem de serviço:", error)
    return NextResponse.json({ error: "Erro ao atualizar ordem de serviço" }, { status: 500, headers: noCacheHeaders })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = validateApiKey(request)
  if (!auth.valid) return auth.response

  try {
    const { id } = await params
    await prisma.ordemServico.delete({ where: { id } })
    return NextResponse.json({ success: true }, { headers: noCacheHeaders })
  } catch (error) {
    console.error("Erro ao excluir ordem de serviço:", error)
    return NextResponse.json({ error: "Erro ao excluir ordem de serviço" }, { status: 500, headers: noCacheHeaders })
  }
}
