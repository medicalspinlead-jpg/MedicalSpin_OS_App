import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { validateApiKey } from "@/lib/api-auth"

function generateOSName(data: {
  empresa?: { razaoSocial?: string; cnpj?: string }
  cliente?: { razaoSocial?: string; cnpj?: string }
  numero?: string
}) {
  const razaoSocial = data.empresa?.razaoSocial || data.cliente?.razaoSocial
  const cnpj = data.empresa?.cnpj || data.cliente?.cnpj

  if (razaoSocial && cnpj) {
    const dataStr = new Date().toLocaleDateString("pt-BR").replace(/\//g, "-")
    const nomeFormatado = razaoSocial.replace(/\s+/g, "_").substring(0, 30)
    const cnpjFormatado = cnpj.replace(/[^\d]/g, "")
    return `OS_${nomeFormatado}_${cnpjFormatado}_${dataStr}`
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
      return NextResponse.json({ error: "Ordem de serviço não encontrada" }, { status: 404 })
    }
    return NextResponse.json(mapOS(os))
  } catch (error) {
    console.error("Erro ao buscar ordem de serviço:", error)
    return NextResponse.json({ error: "Erro ao buscar ordem de serviço" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = validateApiKey(request)
  if (!auth.valid) return auth.response

  try {
    const { id } = await params
    const data = await request.json()

    const numero = generateOSName(data)

    // Atualizar a OS
    const os = await prisma.ordemServico.update({
      where: { id },
      data: {
        numero,
        status: data.status || "rascunho",
        currentStep: data.currentStep || 1,
        finalizedAt: data.status === "finalizada" ? new Date() : null,
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
          }) => ({
            osId: id,
            nome: p.nome,
            modeloRef: p.modeloRef || null,
            numeroSerie: p.numeroSerie || null,
            observacoes: p.observacoes || null,
            quantidade: p.quantidade,
            categoria: p.categoria,
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

    return NextResponse.json(mapOS(updatedOS!))
  } catch (error) {
    console.error("Erro ao atualizar ordem de serviço:", error)
    return NextResponse.json({ error: "Erro ao atualizar ordem de serviço" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = validateApiKey(request)
  if (!auth.valid) return auth.response

  try {
    const { id } = await params
    await prisma.ordemServico.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao excluir ordem de serviço:", error)
    return NextResponse.json({ error: "Erro ao excluir ordem de serviço" }, { status: 500 })
  }
}
