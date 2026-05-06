// Função para enviar dados da OS ao webhook do Drive

import type { OrdemServico } from "./storage"
import type { ImagemWebhook } from "./webhook"
import { gerarPdfOS } from "./pdf-generator"

const WEBHOOK_DRIVE_URL =
  "https://n8n-www4kggggc4c8k8ow4w8g4g0.95.217.164.173.sslip.io/webhook/04e9a827-45c4-4c4b-805f-c892acc06d99"

export interface DriveWebhookPayload {
  os: {
    id: string
    idUnico: string
    numero: string
    status: string
    criadoEm: string
    finalizadoEm: string
  }
  cliente: {
    razaoSocial: string
    nomeFantasia: string
    cnpj: string
    cidade: string
    uf: string
    telefone: string
    email: string
    responsavel: string
  }
  equipamento: {
    tipo: string
    fabricante: string
    modelo: string
    numeroSerie: string
  } | null
  motivo: {
    motivacaoServico: string
    eventosRelevantes: string
  }
  intervencao: {
    tipo: string
    descricaoServicos: string
  }
  pecas: Array<{
    nome: string
    modeloRef: string
    numeroSerie: string
    observacoes: string
    quantidade: number
    categoria: string
    tipo: string
  }>
  maoDeObra: Array<{
    data: string
    descricao: string
    horas: number
  }>
  pendencias: {
    medicalSpin: string
    cliente: string
  }
  estadoEquipamento: {
    estadoInicial: string
    estadoFinal: string
  }
  finalizacao: {
    cidade: string
    uf: string
    nomeEngenheiro: string
    cftEngenheiro: string
    nomeRecebedor: string
  }
  imagens: ImagemWebhook[]
  pdf: {
    nomeArquivo: string
    base64: string
    mimeType: string
  }
}

// Helper para converter Blob para base64
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result as string
      // Remove o prefixo data:application/pdf;base64, para enviar apenas o base64 puro
      const base64 = result.split(",")[1] || result
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export async function enviarParaDrive(os: OrdemServico, imagens: ImagemWebhook[]): Promise<boolean> {
  // Gera o PDF da OS
  let pdfBase64 = ""
  let nomeArquivoPdf = `OS-${os.numero || os.id}.pdf`
  
  try {
    const pdfBlob = await gerarPdfOS(os)
    pdfBase64 = await blobToBase64(pdfBlob)
  } catch (error) {
    console.error("[v0] Erro ao gerar PDF para o Drive:", error)
    // Continua mesmo sem o PDF
  }

  const payload: DriveWebhookPayload = {
    os: {
      id: os.id,
      idUnico: os.idUnico || "",
      numero: os.numero,
      status: os.status,
      criadoEm: os.createdAt,
      finalizadoEm: os.finalizedAt || new Date().toISOString(),
    },
    cliente: {
      razaoSocial: os.empresa.razaoSocial || "",
      nomeFantasia: os.empresa.nomeFantasia || "",
      cnpj: os.empresa.cnpj || "",
      cidade: os.empresa.cidade || "",
      uf: os.empresa.uf || "",
      telefone: os.empresa.telefone || "",
      email: os.empresa.email || "",
      responsavel: os.empresa.responsavel || "",
    },
    equipamento: os.equipamento
      ? {
          tipo: os.equipamento.tipo,
          fabricante: os.equipamento.fabricante,
          modelo: os.equipamento.modelo,
          numeroSerie: os.equipamento.numeroSerie,
        }
      : null,
    motivo: os.motivo,
    intervencao: os.intervencao,
    pecas: os.pecas.map((p) => ({
      nome: p.nome,
      modeloRef: p.modeloRef,
      numeroSerie: p.numeroSerie,
      observacoes: p.observacoes,
      quantidade: p.quantidade,
      categoria: p.categoria,
      tipo: p.tipo || "removida",
    })),
    maoDeObra: os.maoDeObra.map((m) => ({
      data: m.data,
      descricao: m.descricao,
      horas: m.horas,
    })),
    pendencias: os.pendencias,
    estadoEquipamento: os.estadoEquipamento,
    finalizacao: {
      cidade: os.finalizacao.cidade || "",
      uf: os.finalizacao.uf || "",
      nomeEngenheiro: os.finalizacao.nomeEngenheiro || "",
      cftEngenheiro: os.finalizacao.cftEngenheiro || "",
      nomeRecebedor: os.finalizacao.nomeRecebedor || os.finalizacao.responsavel || "",
    },
    imagens,
    pdf: {
      nomeArquivo: nomeArquivoPdf,
      base64: pdfBase64,
      mimeType: "application/pdf",
    },
  }

  try {
    const response = await fetch(WEBHOOK_DRIVE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    return response.ok
  } catch (error) {
    console.error("[v0] Erro ao enviar para Drive:", error)
    return false
  }
}
