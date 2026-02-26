import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

const noCacheHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
}

// GET - Dados da OS vinculada a uma solicitacao do cliente
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const usuario = await getCurrentUser()
    if (!usuario || usuario.cargo !== "cliente" || !usuario.clienteId) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401, headers: noCacheHeaders })
    }

    const { id } = await params

    // Buscar a OS com relacionamentos
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
      return NextResponse.json({ error: "OS nao encontrada" }, { status: 404, headers: noCacheHeaders })
    }

    // Verificar se a OS pertence ao cliente (via solicitacao vinculada)
    const solicitacao = await prisma.solicitacao.findFirst({
      where: {
        ordemServicoId: id,
        clienteId: usuario.clienteId,
      },
    })

    // Tambem verificar se o cliente da OS e o mesmo
    const isOwner = os.clienteId === usuario.clienteId || !!solicitacao

    if (!isOwner) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403, headers: noCacheHeaders })
    }

    const empresa = (os.empresa as Record<string, unknown>) || {}
    const motivo = (os.motivo as Record<string, string>) || {}
    const intervencao = (os.intervencao as Record<string, string>) || {}
    const pendencias = (os.pendencias as Record<string, string>) || {}
    const estadoEquipamento = (os.estadoEquipamento as Record<string, string>) || {}
    const finalizacao = (os.finalizacao as Record<string, string>) || {}
    const midias = (os.midias as { arquivos?: string[] }) || {}

    return NextResponse.json(
      {
        id: os.id,
        numero: os.numero,
        idUnico: (os as Record<string, unknown>).idUnico || null,
        status: os.status,
        createdAt: os.createdAt.toISOString(),
        finalizedAt: os.finalizedAt?.toISOString() || null,
        empresa: {
          razaoSocial: empresa.razaoSocial || "",
          nomeFantasia: empresa.nomeFantasia || "",
          cnpj: empresa.cnpj || "",
          cidade: empresa.cidade || "",
          uf: empresa.uf || "",
          telefone: empresa.telefone || "",
          email: empresa.email || "",
        },
        cliente: os.cliente
          ? {
              razaoSocial: os.cliente.razaoSocial,
              nomeFantasia: os.cliente.nomeFantasia,
              cnpj: os.cliente.cnpj,
              responsavel: os.cliente.responsavel,
            }
          : undefined,
        equipamento: os.equipamento
          ? {
              tipo: os.equipamento.tipo,
              fabricante: os.equipamento.fabricante,
              modelo: os.equipamento.modelo,
              numeroSerie: os.equipamento.numeroSerie,
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
          categoria: p.categoria,
          tipo: p.tipo || "removida",
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
      },
      { headers: noCacheHeaders }
    )
  } catch (error) {
    console.error("Erro ao buscar OS do cliente:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500, headers: noCacheHeaders })
  }
}
