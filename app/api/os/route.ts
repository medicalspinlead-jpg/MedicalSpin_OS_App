import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { validateApiKey } from "@/lib/api-auth"

const noCacheHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
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

export async function GET(request: Request) {
  const auth = validateApiKey(request)
  if (!auth.valid) return auth.response

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")

    // Suporta múltiplos status separados por vírgula (ex: "fechada,finalizada")
    const statusList = status ? status.split(",").map((s) => s.trim()) : null

    const ordens = await prisma.ordemServico.findMany({
      where: statusList ? { status: { in: statusList } } : undefined,
      orderBy: { updatedAt: "desc" },
      include: {
        cliente: true,
        equipamento: true,
        pecas: true,
        maoDeObra: true,
      },
    })

    return NextResponse.json(ordens.map(mapOS).filter(Boolean), { headers: noCacheHeaders })
  } catch (error) {
    console.error("Erro ao buscar ordens de serviço:", error)
    return NextResponse.json({ error: "Erro ao buscar ordens de serviço" }, { status: 500, headers: noCacheHeaders })
  }
}

export async function POST(request: Request) {
  const auth = validateApiKey(request)
  if (!auth.valid) return auth.response

  try {
    const data = await request.json()

    const os = await prisma.ordemServico.create({
      data: {
        numero: data.numero || `OS-${Date.now()}`,
        status: data.status || "rascunho",
        currentStep: data.currentStep || 1,
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

    return NextResponse.json(mapOS(os), { headers: noCacheHeaders })
  } catch (error) {
    console.error("Erro ao criar ordem de serviço:", error)
    return NextResponse.json({ error: "Erro ao criar ordem de serviço" }, { status: 500, headers: noCacheHeaders })
  }
}
