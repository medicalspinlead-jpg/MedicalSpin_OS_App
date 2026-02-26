const WEBHOOK_NOTIFICACAO_URL =
  "https://n8n-www4kggggc4c8k8ow4w8g4g0.95.217.164.173.sslip.io/webhook/notificacao"

export type CanalNotificacao = "email" | "whatsapp" | "email_e_whatsapp"

export interface NotificacaoPayload {
  canal: CanalNotificacao
  solicitacao: {
    id: string
    protocolo: string
    statusAnterior: string
    statusAtual: string
    descricaoProblema: string
    urgencia: string
  }
  cliente: {
    id: string
    razaoSocial: string
    nomeFantasia: string
    cnpj: string
    email: string
    telefone: string
  }
  timestamp: string
}

function determinarCanal(notifEmail: boolean, notifWhatsapp: boolean): CanalNotificacao | null {
  if (notifEmail && notifWhatsapp) return "email_e_whatsapp"
  if (notifEmail) return "email"
  if (notifWhatsapp) return "whatsapp"
  return null
}

interface ClienteNotif {
  id: string
  razaoSocial: string
  nomeFantasia: string
  cnpj: string
  email: string
  telefone: string
  notifEmail: boolean
  notifWhatsapp: boolean
}

interface SolicitacaoNotif {
  id: string
  protocolo: string
  descricaoProblema: string
  urgencia: string
}

export async function enviarNotificacaoStatus(
  cliente: ClienteNotif,
  solicitacao: SolicitacaoNotif,
  statusAnterior: string,
  statusAtual: string
): Promise<boolean> {
  const canal = determinarCanal(cliente.notifEmail, cliente.notifWhatsapp)

  if (!canal) {
    return false
  }

  const payload: NotificacaoPayload = {
    canal,
    solicitacao: {
      id: solicitacao.id,
      protocolo: solicitacao.protocolo,
      statusAnterior,
      statusAtual,
      descricaoProblema: solicitacao.descricaoProblema,
      urgencia: solicitacao.urgencia,
    },
    cliente: {
      id: cliente.id,
      razaoSocial: cliente.razaoSocial,
      nomeFantasia: cliente.nomeFantasia,
      cnpj: cliente.cnpj,
      email: cliente.email,
      telefone: cliente.telefone,
    },
    timestamp: new Date().toISOString(),
  }

  try {
    const response = await fetch(WEBHOOK_NOTIFICACAO_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      console.error(`[webhook-notificacao] Erro HTTP ${response.status}`)
    }

    return response.ok
  } catch (error) {
    console.error("[webhook-notificacao] Erro ao enviar notificacao:", error)
    return false
  }
}
