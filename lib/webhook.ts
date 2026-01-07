// Função para enviar dados da OS ao webhook

import type { OrdemServico } from "./storage"
import heic2any from "heic2any"

const WEBHOOK_URL =
  "https://n8n-www4kggggc4c8k8ow4w8g4g0.95.217.164.173.sslip.io/webhook/c419cbce-7e20-4472-bcd9-577c1903e22f"

export interface ImagemWebhook {
  nome: string
  tipo: string
  tamanho: number
  base64: string
}

export interface WebhookPayload {
  os: {
    id: string
    numero: string
    status: string
    criadoEm: string
    finalizadoEm: string
  }
  empresa: {
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
}

export async function enviarParaWebhook(os: OrdemServico, imagens: ImagemWebhook[]): Promise<boolean> {
  const payload: WebhookPayload = {
    os: {
      id: os.id,
      numero: os.numero,
      status: os.status,
      criadoEm: os.createdAt,
      finalizadoEm: os.finalizedAt || new Date().toISOString(),
    },
    empresa: os.empresa,
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
    })),
    maoDeObra: os.maoDeObra.map((m) => ({
      data: m.data,
      descricao: m.descricao,
      horas: m.horas,
    })),
    pendencias: os.pendencias,
    estadoEquipamento: os.estadoEquipamento,
    finalizacao: os.finalizacao,
    imagens,
  }

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    return response.ok
  } catch (error) {
    console.error("[v0] Erro ao enviar para webhook:", error)
    return false
  }
}

// Função para converter imagem para JPG usando Canvas
export async function converterParaJPG(file: File): Promise<{ nome: string; base64: string; tamanho: number }> {
  // Verifica se é HEIC/HEIF e converte usando heic2any
  const isHeic =
    file.type === "image/heic" ||
    file.type === "image/heif" ||
    file.name.toLowerCase().endsWith(".heic") ||
    file.name.toLowerCase().endsWith(".heif")

  let fileToProcess: Blob = file

  if (isHeic) {
    try {
      const convertedBlob = await heic2any({
        blob: file,
        toType: "image/jpeg",
        quality: 0.9,
      })
      fileToProcess = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob
    } catch (error) {
      console.error("[v0] Erro ao converter HEIC:", error)
      throw new Error("Não foi possível converter a imagem HEIC. Tente outro formato.")
    }
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      const img = new Image()
      img.crossOrigin = "anonymous"

      img.onload = () => {
        const canvas = document.createElement("canvas")
        canvas.width = img.width
        canvas.height = img.height

        const ctx = canvas.getContext("2d")
        if (!ctx) {
          reject(new Error("Não foi possível criar contexto do canvas"))
          return
        }

        // Fundo branco para imagens com transparência
        ctx.fillStyle = "#FFFFFF"
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        // Desenha a imagem
        ctx.drawImage(img, 0, 0)

        // Converte para JPG
        const base64 = canvas.toDataURL("image/jpeg", 0.9)

        // Remove o prefixo data:image/jpeg;base64,
        const base64SemPrefixo = base64.split(",")[1]

        // Gera nome do arquivo com extensão .jpg
        const nomeOriginal = file.name.replace(/\.[^/.]+$/, "")
        const nomeArquivo = `${nomeOriginal}.jpg`

        resolve({
          nome: nomeArquivo,
          base64: base64SemPrefixo,
          tamanho: Math.round((base64SemPrefixo.length * 3) / 4), // Tamanho aproximado em bytes
        })
      }

      img.onerror = () => reject(new Error("Erro ao carregar imagem"))
      img.src = e.target?.result as string
    }

    reader.onerror = () => reject(new Error("Erro ao ler arquivo"))
    reader.readAsDataURL(fileToProcess)
  })
}

// Função para validar se é uma imagem
export function isImageFile(file: File): boolean {
  const tiposPermitidos = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/bmp",
    "image/heic",
    "image/heif",
  ]

  // Verifica pelo tipo MIME ou extensão do arquivo (iOS às vezes não envia o tipo correto)
  const extensao = file.name.toLowerCase()
  const isHeicExtension = extensao.endsWith(".heic") || extensao.endsWith(".heif")

  return tiposPermitidos.includes(file.type) || isHeicExtension
}
