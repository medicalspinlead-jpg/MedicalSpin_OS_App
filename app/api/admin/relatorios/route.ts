import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"
import { validateSession } from "@/lib/auth"

const noCacheHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
}

export async function GET(request: Request) {
  try {
    // Validar sessão do usuário
    const cookieStore = await cookies()
    const token = cookieStore.get("session_token")?.value
    
    if (!token) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401, headers: noCacheHeaders }
      )
    }
    
    const session = await validateSession(token)
    if (!session || session.cargo !== "admin") {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401, headers: noCacheHeaders }
      )
    }

    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get("tipo") // os, clientes, equipamentos, solicitacoes, tecnico
    const dataInicio = searchParams.get("dataInicio")
    const dataFim = searchParams.get("dataFim")
    const tecnicoId = searchParams.get("tecnicoId")

    if (!tipo || !dataInicio || !dataFim) {
      return NextResponse.json(
        { error: "Parâmetros obrigatórios: tipo, dataInicio, dataFim" },
        { status: 400, headers: noCacheHeaders }
      )
    }

    const inicio = new Date(dataInicio)
    inicio.setHours(0, 0, 0, 0)
    const fim = new Date(dataFim)
    fim.setHours(23, 59, 59, 999)

    let dados: unknown = null

    switch (tipo) {
      case "os":
        dados = await gerarRelatorioOS(inicio, fim)
        break
      case "clientes":
        dados = await gerarRelatorioClientes(inicio, fim)
        break
      case "equipamentos":
        dados = await gerarRelatorioEquipamentos(inicio, fim)
        break
      case "solicitacoes":
        dados = await gerarRelatorioSolicitacoes(inicio, fim)
        break
      case "tecnico":
        dados = await gerarRelatorioTecnico(inicio, fim, tecnicoId)
        break
      default:
        return NextResponse.json(
          { error: "Tipo de relatório inválido" },
          { status: 400, headers: noCacheHeaders }
        )
    }

    return NextResponse.json(
      {
        tipo,
        periodo: {
          inicio: inicio.toISOString(),
          fim: fim.toISOString(),
        },
        geradoEm: new Date().toISOString(),
        dados,
      },
      { headers: noCacheHeaders }
    )
  } catch (error) {
    console.error("Erro ao gerar relatório:", error)
    return NextResponse.json(
      { error: "Erro ao gerar relatório" },
      { status: 500, headers: noCacheHeaders }
    )
  }
}

async function gerarRelatorioOS(inicio: Date, fim: Date) {
  const ordensServico = await prisma.ordemServico.findMany({
    where: {
      createdAt: {
        gte: inicio,
        lte: fim,
      },
    },
    include: {
      cliente: true,
      equipamento: true,
      pecas: true,
      maoDeObra: true,
      usuario: {
        select: { id: true, nome: true, email: true },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  const resumo = {
    total: ordensServico.length,
    porStatus: {
      rascunho: ordensServico.filter((os) => os.status === "rascunho").length,
      finalizada: ordensServico.filter((os) => os.status === "finalizada").length,
      fechada: ordensServico.filter((os) => os.status === "fechada").length,
    },
    totalPecas: ordensServico.reduce((acc, os) => acc + os.pecas.length, 0),
    totalHorasMaoDeObra: ordensServico.reduce(
      (acc, os) => acc + os.maoDeObra.reduce((h, m) => h + m.horas, 0),
      0
    ),
  }

  return {
    resumo,
    ordensServico: ordensServico.map((os) => ({
      id: os.id,
      numero: os.numero,
      status: os.status,
      createdAt: os.createdAt.toISOString(),
      finalizedAt: os.finalizedAt?.toISOString() || null,
      cliente: os.cliente
        ? {
            razaoSocial: os.cliente.razaoSocial,
            nomeFantasia: os.cliente.nomeFantasia,
            cidade: os.cliente.cidade,
            uf: os.cliente.uf,
          }
        : null,
      equipamento: os.equipamento
        ? {
            tipo: os.equipamento.tipo,
            fabricante: os.equipamento.fabricante,
            modelo: os.equipamento.modelo,
            numeroSerie: os.equipamento.numeroSerie,
          }
        : null,
      tecnico: os.usuario
        ? {
            nome: os.usuario.nome,
            email: os.usuario.email,
          }
        : null,
      totalPecas: os.pecas.length,
      totalHorasMaoDeObra: os.maoDeObra.reduce((h, m) => h + m.horas, 0),
      motivo: os.motivo,
      intervencao: os.intervencao,
      estadoEquipamento: os.estadoEquipamento,
    })),
  }
}

async function gerarRelatorioClientes(inicio: Date, fim: Date) {
  const clientes = await prisma.cliente.findMany({
    where: {
      createdAt: {
        gte: inicio,
        lte: fim,
      },
    },
    include: {
      equipamentos: true,
      ordens: {
        select: { id: true, status: true, createdAt: true },
      },
      solicitacoes: {
        select: { id: true, status: true, createdAt: true },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  const resumo = {
    totalClientes: clientes.length,
    totalEquipamentos: clientes.reduce((acc, c) => acc + c.equipamentos.length, 0),
    totalOrdensServico: clientes.reduce((acc, c) => acc + c.ordens.length, 0),
    totalSolicitacoes: clientes.reduce((acc, c) => acc + c.solicitacoes.length, 0),
    porUF: clientes.reduce((acc, c) => {
      acc[c.uf] = (acc[c.uf] || 0) + 1
      return acc
    }, {} as Record<string, number>),
  }

  return {
    resumo,
    clientes: clientes.map((c) => ({
      id: c.id,
      razaoSocial: c.razaoSocial,
      nomeFantasia: c.nomeFantasia,
      cnpj: c.cnpj,
      cidade: c.cidade,
      uf: c.uf,
      telefone: c.telefone,
      email: c.email,
      responsavel: c.responsavel,
      createdAt: c.createdAt.toISOString(),
      totalEquipamentos: c.equipamentos.length,
      totalOrdensServico: c.ordens.length,
      totalSolicitacoes: c.solicitacoes.length,
    })),
  }
}

async function gerarRelatorioEquipamentos(inicio: Date, fim: Date) {
  const equipamentos = await prisma.equipamento.findMany({
    where: {
      createdAt: {
        gte: inicio,
        lte: fim,
      },
    },
    include: {
      cliente: {
        select: { razaoSocial: true, nomeFantasia: true, cidade: true, uf: true },
      },
      ordens: {
        select: { id: true, status: true, createdAt: true },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  const porTipo = equipamentos.reduce((acc, e) => {
    acc[e.tipo] = (acc[e.tipo] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const porFabricante = equipamentos.reduce((acc, e) => {
    acc[e.fabricante] = (acc[e.fabricante] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const resumo = {
    totalEquipamentos: equipamentos.length,
    ativos: equipamentos.filter((e) => e.ativo).length,
    inativos: equipamentos.filter((e) => !e.ativo).length,
    porTipo,
    porFabricante,
    totalOrdensServico: equipamentos.reduce((acc, e) => acc + e.ordens.length, 0),
  }

  return {
    resumo,
    equipamentos: equipamentos.map((e) => ({
      id: e.id,
      tipo: e.tipo,
      fabricante: e.fabricante,
      modelo: e.modelo,
      numeroSerie: e.numeroSerie,
      ativo: e.ativo,
      createdAt: e.createdAt.toISOString(),
      cliente: e.cliente
        ? {
            razaoSocial: e.cliente.razaoSocial,
            nomeFantasia: e.cliente.nomeFantasia,
            cidade: e.cliente.cidade,
            uf: e.cliente.uf,
          }
        : null,
      totalOrdensServico: e.ordens.length,
    })),
  }
}

async function gerarRelatorioSolicitacoes(inicio: Date, fim: Date) {
  const solicitacoes = await prisma.solicitacao.findMany({
    where: {
      createdAt: {
        gte: inicio,
        lte: fim,
      },
    },
    include: {
      cliente: {
        select: { razaoSocial: true, nomeFantasia: true },
      },
      historicoStatus: {
        orderBy: { criadoEm: "desc" },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
  })

  const porStatus = solicitacoes.reduce((acc, s) => {
    acc[s.status] = (acc[s.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const porUrgencia = solicitacoes.reduce((acc, s) => {
    acc[s.urgencia] = (acc[s.urgencia] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const porTipoEquipamento = solicitacoes.reduce((acc, s) => {
    acc[s.tipoEquipamento] = (acc[s.tipoEquipamento] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const resumo = {
    totalSolicitacoes: solicitacoes.length,
    porStatus,
    porUrgencia,
    porTipoEquipamento,
    comOrdemServico: solicitacoes.filter((s) => s.ordemServicoId).length,
    semOrdemServico: solicitacoes.filter((s) => !s.ordemServicoId).length,
  }

  return {
    resumo,
    solicitacoes: solicitacoes.map((s) => ({
      id: s.id,
      protocolo: s.protocolo,
      status: s.status,
      urgencia: s.urgencia,
      nomeEmpresa: s.nomeEmpresa,
      nomeContato: s.nomeContato,
      telefone: s.telefone,
      email: s.email,
      cidade: s.cidade,
      uf: s.uf,
      tipoEquipamento: s.tipoEquipamento,
      fabricante: s.fabricante,
      modelo: s.modelo,
      descricaoProblema: s.descricaoProblema,
      ordemServicoId: s.ordemServicoId,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
      cliente: s.cliente
        ? {
            razaoSocial: s.cliente.razaoSocial,
            nomeFantasia: s.cliente.nomeFantasia,
          }
        : null,
    })),
  }
}

async function gerarRelatorioTecnico(inicio: Date, fim: Date, tecnicoId?: string | null) {
  const whereUsuario = tecnicoId ? { id: tecnicoId } : { cargo: { in: ["tecnico", "admin"] } }

  const tecnicos = await prisma.usuario.findMany({
    where: whereUsuario,
    select: {
      id: true,
      nome: true,
      email: true,
      cargo: true,
      ordensServico: {
        where: {
          createdAt: {
            gte: inicio,
            lte: fim,
          },
        },
        include: {
          cliente: {
            select: { razaoSocial: true, nomeFantasia: true, cidade: true, uf: true },
          },
          equipamento: {
            select: { tipo: true, fabricante: true, modelo: true },
          },
          pecas: true,
          maoDeObra: true,
        },
      },
    },
    orderBy: { nome: "asc" },
  })

  // Buscar solicitações por técnico (através do histórico)
  const historicoSolicitacoes = await prisma.historicoStatusSolicitacao.findMany({
    where: {
      criadoEm: {
        gte: inicio,
        lte: fim,
      },
      status: { in: ["em_progresso", "finalizada"] },
    },
    include: {
      solicitacao: {
        select: {
          id: true,
          protocolo: true,
          status: true,
          nomeEmpresa: true,
          tipoEquipamento: true,
        },
      },
    },
  })

  const solicitacoesPorTecnico: Record<string, Set<string>> = {}
  historicoSolicitacoes.forEach((h) => {
    if (h.usuarioNome) {
      if (!solicitacoesPorTecnico[h.usuarioNome]) {
        solicitacoesPorTecnico[h.usuarioNome] = new Set()
      }
      solicitacoesPorTecnico[h.usuarioNome].add(h.solicitacaoId)
    }
  })

  const resumoGeral = {
    totalTecnicos: tecnicos.length,
    totalOrdensServico: tecnicos.reduce((acc, t) => acc + t.ordensServico.length, 0),
    totalSolicitacoes: Object.values(solicitacoesPorTecnico).reduce((acc, s) => acc + s.size, 0),
    mediaOSPorTecnico:
      tecnicos.length > 0
        ? (tecnicos.reduce((acc, t) => acc + t.ordensServico.length, 0) / tecnicos.length).toFixed(1)
        : 0,
  }

  return {
    resumo: resumoGeral,
    tecnicos: tecnicos.map((t) => {
      const osFinalizadas = t.ordensServico.filter((os) => os.status === "finalizada")
      const osFechadas = t.ordensServico.filter((os) => os.status === "fechada")
      const osRascunho = t.ordensServico.filter((os) => os.status === "rascunho")
      const totalHoras = t.ordensServico.reduce(
        (acc, os) => acc + os.maoDeObra.reduce((h, m) => h + m.horas, 0),
        0
      )
      const solicitacoesAtendidas = solicitacoesPorTecnico[t.nome]?.size || 0

      return {
        id: t.id,
        nome: t.nome,
        email: t.email,
        cargo: t.cargo,
        resumo: {
          totalOS: t.ordensServico.length,
          osFinalizadas: osFinalizadas.length,
          osFechadas: osFechadas.length,
          osRascunho: osRascunho.length,
          totalHorasTrabalhadas: totalHoras,
          solicitacoesAtendidas,
        },
        ordensServico: t.ordensServico.map((os) => ({
          id: os.id,
          numero: os.numero,
          status: os.status,
          createdAt: os.createdAt.toISOString(),
          finalizedAt: os.finalizedAt?.toISOString() || null,
          cliente: os.cliente
            ? {
                razaoSocial: os.cliente.razaoSocial,
                nomeFantasia: os.cliente.nomeFantasia,
                cidade: os.cliente.cidade,
                uf: os.cliente.uf,
              }
            : null,
          equipamento: os.equipamento
            ? {
                tipo: os.equipamento.tipo,
                fabricante: os.equipamento.fabricante,
                modelo: os.equipamento.modelo,
              }
            : null,
          totalPecas: os.pecas.length,
          totalHoras: os.maoDeObra.reduce((h, m) => h + m.horas, 0),
        })),
      }
    }),
  }
}
