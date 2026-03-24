// Webhook para notificar novas solicitações
const WEBHOOK_URL = "https://n8n-www4kggggc4c8k8ow4w8g4g0.95.217.164.173.sslip.io/webhook/21deb1c6-29b4-4324-9f80-fc1ec485f365"

export interface SolicitacaoWebhookPayload {
  id: string
  protocolo: string
  status: string
  nomeEmpresa: string
  cnpj: string | null
  nomeContato: string
  telefone: string
  email: string
  cidade: string
  uf: string
  tipoEquipamento: string
  fabricante: string
  modelo: string
  numeroSerie: string | null
  descricaoProblema: string
  urgencia: string
  clienteId: string | null
  midias: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export async function enviarWebhookNovaSolicitacao(solicitacao: SolicitacaoWebhookPayload): Promise<void> {
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        evento: "nova_solicitacao",
        timestamp: new Date().toISOString(),
        dados: solicitacao,
      }),
    })

    if (!response.ok) {
      console.error("Erro ao enviar webhook de nova solicitacao:", response.status, response.statusText)
    } else {
      console.log("Webhook de nova solicitacao enviado com sucesso para protocolo:", solicitacao.protocolo)
    }
  } catch (error) {
    // Não queremos que falha no webhook impeça a criação da solicitação
    console.error("Erro ao enviar webhook de nova solicitacao:", error)
  }
}
