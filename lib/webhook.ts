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

export function gerarIdUnico(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  const timestamp = Date.now().toString(36)
  let random = ""
  for (let i = 0; i < 8; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `${timestamp}-${random}`
}

export interface WebhookPayload {
  os: {
    id: string
    idUnico: string
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
    emails: string[]
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
    tipo: string // "removida" ou "inclusa"
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
      idUnico: os.idUnico || gerarIdUnico(),
      numero: os.numero,
      status: os.status,
      criadoEm: os.createdAt,
      finalizadoEm: os.finalizedAt || new Date().toISOString(),
    },
    empresa: {
      ...os.empresa,
      emails: os.empresa.emails || [],
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

// Configurações de compressão - exportadas para uso em outros arquivos
export const COMPRESSION_CONFIG = {
  // Resolução máxima (largura ou altura) - reduzido para economia
  MAX_DIMENSION: 1200,
  // Qualidade JPEG (0.0 a 1.0) - valores menores = arquivos menores
  JPEG_QUALITY: 0.5,
  // Tamanho máximo desejado em bytes (500KB por imagem)
  TARGET_SIZE: 500 * 1024,
  // Qualidade mínima para compressão iterativa
  MIN_QUALITY: 0.3,
  // Tamanho máximo para vídeos (15MB)
  MAX_VIDEO_SIZE: 15 * 1024 * 1024,
}

// Função para converter imagem para JPG usando Canvas com compressão agressiva
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
        quality: COMPRESSION_CONFIG.JPEG_QUALITY,
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
        // Calcula novas dimensões mantendo proporção
        let width = img.width
        let height = img.height
        const maxDim = COMPRESSION_CONFIG.MAX_DIMENSION

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width)
            width = maxDim
          } else {
            width = Math.round((width * maxDim) / height)
            height = maxDim
          }
        }

        const canvas = document.createElement("canvas")
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext("2d")
        if (!ctx) {
          reject(new Error("Não foi possível criar contexto do canvas"))
          return
        }

        // Habilita suavização para melhor qualidade no redimensionamento
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = "high"

        // Fundo branco para imagens com transparência
        ctx.fillStyle = "#FFFFFF"
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        // Desenha a imagem redimensionada
        ctx.drawImage(img, 0, 0, width, height)

        // Compressão iterativa - começa com qualidade configurada
        let quality = COMPRESSION_CONFIG.JPEG_QUALITY
        let base64 = canvas.toDataURL("image/jpeg", quality)
        let base64SemPrefixo = base64.split(",")[1]
        let tamanhoAtual = Math.round((base64SemPrefixo.length * 3) / 4)

        // Se ainda estiver grande, reduz a qualidade iterativamente
        while (tamanhoAtual > COMPRESSION_CONFIG.TARGET_SIZE && quality > COMPRESSION_CONFIG.MIN_QUALITY) {
          quality -= 0.1
          base64 = canvas.toDataURL("image/jpeg", quality)
          base64SemPrefixo = base64.split(",")[1]
          tamanhoAtual = Math.round((base64SemPrefixo.length * 3) / 4)
        }

        // Gera nome do arquivo com extensão .jpg
        const nomeOriginal = file.name.replace(/\.[^/.]+$/, "")
        const nomeArquivo = `${nomeOriginal}.jpg`

        resolve({
          nome: nomeArquivo,
          base64: base64SemPrefixo,
          tamanho: tamanhoAtual,
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

// Função para validar se é um vídeo
export function isVideoFile(file: File): boolean {
  const tiposPermitidos = [
    "video/mp4",
    "video/webm",
    "video/ogg",
    "video/quicktime",
    "video/x-msvideo",
    "video/x-ms-wmv",
    "video/3gpp",
  ]

  const extensao = file.name.toLowerCase()
  const isVideoExtension =
    extensao.endsWith(".mp4") ||
    extensao.endsWith(".webm") ||
    extensao.endsWith(".ogg") ||
    extensao.endsWith(".mov") ||
    extensao.endsWith(".avi") ||
    extensao.endsWith(".wmv") ||
    extensao.endsWith(".3gp")

  return tiposPermitidos.includes(file.type) || isVideoExtension
}

// Função para converter vídeo para base64
export function converterVideoParaBase64(file: File): Promise<{ nome: string; base64: string; tamanho: number; tipo: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      const result = e.target?.result as string
      const base64SemPrefixo = result.split(",")[1]

      resolve({
        nome: file.name,
        base64: base64SemPrefixo,
        tamanho: file.size,
        tipo: file.type || "video/mp4",
      })
    }

    reader.onerror = () => reject(new Error("Erro ao ler arquivo de video"))
    reader.readAsDataURL(file)
  })
}
