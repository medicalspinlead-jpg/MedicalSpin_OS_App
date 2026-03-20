// Tipos para o sistema de OS

const API_KEY = "medicalspin2026"

function getHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
    "x-api-key": API_KEY,
  }
}

function fetchNoCache(url: string, options: RequestInit = {}): Promise<Response> {
  const timestamp = Date.now()
  const separator = url.includes("?") ? "&" : "?"
  const urlWithTimestamp = `${url}${separator}_t=${timestamp}`

  return fetch(urlWithTimestamp, {
    ...options,
    cache: "no-store",
    headers: {
      ...getHeaders(),
      ...options.headers,
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
    },
  })
}

export interface Cliente {
  id: string
  razaoSocial: string
  nomeFantasia: string
  cnpj: string
  cidade: string
  uf: string
  telefone: string
  email: string
  responsavel: string
  createdAt: string
}

export interface Equipamento {
  id: string
  clienteId: string
  tipo: string
  fabricante: string
  modelo: string
  numeroSerie: string
  ativo: boolean
  createdAt: string
}

export interface Peca {
  descricao: string
  id: string
  nome: string
  modeloRef: string
  numeroSerie: string
  observacoes: string
  quantidade: number
  categoria: "cliente" | "medical-spin"
  tipo: "removida" | "inclusa"
}

export interface MaoDeObra {
  id: string
  data: string
  descricao: string
  horas: number
}

export interface OrdemServico {
  nome: string
  id: string
  idUnico?: string
  numero: string
  status: "rascunho" | "fechada" | "finalizada"
  currentStep: number
  createdAt: string
  updatedAt: string
  finalizedAt?: string
  solicitacaoProtocolo?: string | null
  solicitacaoId?: string | null

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

  cliente?: Cliente
  equipamento?: Equipamento

  motivo: {
    motivacaoServico: string
    eventosRelevantes: string
  }

  intervencao: {
    tipo: string
    descricaoServicos: string
  }

  pecas: Peca[]
  maoDeObra: MaoDeObra[]

  pendencias: {
    medicalSpin: string
    cliente: string
  }

  estadoEquipamento: {
    estadoInicial: string
    estadoFinal: string
  }

  finalizacao: {
    localExecucao: string
    dataFinalizacao: any
    responsavel: string
    cidade: string
    uf: string
    nomeEngenheiro: string
    cftEngenheiro: string
    nomeRecebedor: string
  }

  midias: {
    arquivos: string[]
  }
}

// Clientes
export async function getClientes(): Promise<Cliente[]> {
  const res = await fetchNoCache("/api/clientes")
  if (!res.ok) return []
  return res.json()
}

export async function saveCliente(
  cliente: Omit<Cliente, "id" | "createdAt"> & {
    id?: string
    equipamentos?: { tipo: string; fabricante: string; modelo: string; numeroSerie: string }[]
    departamentoId?: string
    tecnicoResponsavelId?: string
  },
): Promise<Cliente> {
  if (cliente.id) {
    const res = await fetchNoCache(`/api/clientes/${cliente.id}`, {
      method: "PUT",
      body: JSON.stringify(cliente),
    })
    if (!res.ok) {
      const errorData = await res.json()
      throw new Error(errorData.message || errorData.error || "Erro ao atualizar cliente")
    }
    return res.json()
  } else {
    const res = await fetchNoCache("/api/clientes", {
      method: "POST",
      body: JSON.stringify(cliente),
    })
    if (!res.ok) {
      const errorData = await res.json()
      throw new Error(errorData.message || errorData.error || "Erro ao criar cliente")
    }
    return res.json()
  }
}

export async function deleteCliente(id: string): Promise<void> {
  await fetchNoCache(`/api/clientes/${id}`, { method: "DELETE" })
}

export async function getCliente(id: string): Promise<Cliente | undefined> {
  const res = await fetchNoCache(`/api/clientes/${id}`)
  if (!res.ok) return undefined
  return res.json()
}

// Equipamentos
export async function getEquipamentos(): Promise<Equipamento[]> {
  const res = await fetchNoCache("/api/equipamentos")
  if (!res.ok) return []
  return res.json()
}

export async function getEquipamentosByCliente(clienteId: string): Promise<Equipamento[]> {
  const res = await fetchNoCache(`/api/equipamentos?clienteId=${clienteId}`)
  if (!res.ok) return []
  return res.json()
}

export async function saveEquipamento(
  equipamento: Omit<Equipamento, "id" | "createdAt"> & { id?: string },
): Promise<Equipamento> {
  if (equipamento.id) {
    const res = await fetchNoCache(`/api/equipamentos/${equipamento.id}`, {
      method: "PUT",
      body: JSON.stringify(equipamento),
    })
    return res.json()
  } else {
    const res = await fetchNoCache("/api/equipamentos", {
      method: "POST",
      body: JSON.stringify(equipamento),
    })
    return res.json()
  }
}

export interface DeleteEquipamentoResult {
  excluido?: boolean
  inativado?: boolean
  motivo?: string
  id?: string
  ativo?: boolean
}

export async function deleteEquipamento(id: string): Promise<DeleteEquipamentoResult> {
  const res = await fetchNoCache(`/api/equipamentos/${id}`, { method: "DELETE" })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || "Erro ao excluir equipamento")
  }
  return res.json()
}

export async function inativarEquipamento(id: string): Promise<Equipamento> {
  const res = await fetchNoCache(`/api/equipamentos/${id}`, {
    method: "PUT",
    body: JSON.stringify({ ativo: false }),
  })
  if (!res.ok) throw new Error("Erro ao inativar equipamento")
  return res.json()
}

export async function reativarEquipamento(id: string): Promise<Equipamento> {
  const res = await fetchNoCache(`/api/equipamentos/${id}`, {
    method: "PUT",
    body: JSON.stringify({ ativo: true }),
  })
  if (!res.ok) throw new Error("Erro ao reativar equipamento")
  return res.json()
}

export async function getEquipamentosByClienteComInativos(clienteId: string): Promise<Equipamento[]> {
  const res = await fetchNoCache(`/api/equipamentos?clienteId=${clienteId}&incluirInativos=true`)
  if (!res.ok) return []
  return res.json()
}

// Ordens de Serviço
export async function getOrdensServico(): Promise<OrdemServico[]> {
  const res = await fetchNoCache("/api/os")
  if (!res.ok) return []
  return res.json()
}

export async function getRascunhos(): Promise<OrdemServico[]> {
  const res = await fetchNoCache("/api/os?status=rascunho")
  if (!res.ok) return []
  return res.json()
}

export async function getOSFinalizadas(): Promise<OrdemServico[]> {
  const res = await fetchNoCache("/api/os?status=finalizada")
  if (!res.ok) return []
  return res.json()
}

export async function getOSFechadas(): Promise<OrdemServico[]> {
  const res = await fetchNoCache("/api/os?status=fechada")
  if (!res.ok) return []
  return res.json()
}

export async function getOSHistorico(): Promise<OrdemServico[]> {
  const res = await fetchNoCache("/api/os?status=fechada,finalizada")
  if (!res.ok) return []
  return res.json()
}

export async function saveOrdemServico(os: Partial<OrdemServico> & { id?: string }): Promise<OrdemServico> {
  if (os.id) {
    const res = await fetchNoCache(`/api/os/${os.id}`, {
      method: "PUT",
      body: JSON.stringify(os),
    })
    if (!res.ok) {
      throw new Error("Erro ao atualizar OS")
    }
    return res.json()
  } else {
    const res = await fetchNoCache("/api/os", {
      method: "POST",
      body: JSON.stringify(os),
    })
    if (!res.ok) {
      throw new Error("Erro ao criar OS")
    }
    return res.json()
  }
}

export async function getOrdemServico(id: string): Promise<OrdemServico | undefined> {
  const res = await fetchNoCache(`/api/os/${id}`)
  if (!res.ok) return undefined
  return res.json()
}

export async function deleteOrdemServico(id: string): Promise<void> {
  await fetchNoCache(`/api/os/${id}`, { method: "DELETE" })
}

export async function finalizarOrdemServico(id: string): Promise<void> {
  const os = await getOrdemServico(id)
  if (os) {
    os.status = "finalizada"
    os.finalizedAt = new Date().toISOString()
    await saveOrdemServico(os)
  }
}

export async function fecharOrdemServico(id: string): Promise<void> {
  const os = await getOrdemServico(id)
  if (os) {
    os.status = "fechada"
    os.finalizedAt = new Date().toISOString()
    await saveOrdemServico(os)
  }
}

// Solicitações
export interface Solicitacao {
  id: string
  protocolo: string
  status: "recebida" | "em_progresso" | "finalizada" | "cancelada"
  nomeEmpresa: string
  cnpj: string
  nomeContato: string
  telefone: string
  email: string
  cidade: string
  uf: string
  tipoEquipamento: string
  fabricante: string
  modelo: string
  numeroSerie: string
  descricaoProblema: string
  urgencia: "normal" | "urgente"
  ordemServicoId: string | null
  midias?: {
    imagens?: string[] // base64 com prefixo data:image/jpeg;base64,...
    videos?: string[]  // base64 com prefixo data:video/...;base64,...
  }
  motivoCancelamento?: string | null
  createdAt: string
  updatedAt: string
}

export async function getSolicitacoes(): Promise<Solicitacao[]> {
  const res = await fetchNoCache("/api/solicitacoes")
  if (!res.ok) return []
  return res.json()
}

export async function getSolicitacao(id: string): Promise<Solicitacao | undefined> {
  const res = await fetchNoCache(`/api/solicitacoes/${id}`)
  if (!res.ok) return undefined
  return res.json()
}

export async function updateSolicitacao(id: string, data: Partial<Solicitacao>): Promise<Solicitacao> {
  const res = await fetchNoCache(`/api/solicitacoes/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    throw new Error("Erro ao atualizar solicitação")
  }
  return res.json()
}

export async function deleteSolicitacao(id: string): Promise<void> {
  await fetchNoCache(`/api/solicitacoes/${id}`, { method: "DELETE" })
}

export interface SolicitacaoStats {
  porStatus: Record<string, number>
  porTecnico: {
    nome: string
    em_progresso: number
    finalizada: number
    cancelada: number
    total: number
  }[]
  total: number
}

export async function getSolicitacoesStats(): Promise<SolicitacaoStats | null> {
  const res = await fetchNoCache("/api/solicitacoes/stats")
  if (!res.ok) return null
  return res.json()
}

// Helper para criar OS inicial
// Departamentos
export interface Departamento {
  id: string
  nome: string
  descricao: string | null
  cor: string
  icone: string
  ativo: boolean
  createdAt: string
}

export interface UsuarioDepartamento {
  id: string
  usuarioId: string
  departamentoId: string
  usuario?: {
    id: string
    nome: string
    email: string
    cargo: string
  }
  departamento?: Departamento
}

export interface ClienteDepartamento {
  id: string
  clienteId: string
  departamentoId: string
  usuarioResponsavelId: string | null
  cliente?: Cliente
  departamento?: Departamento
  usuarioResponsavel?: {
    id: string
    nome: string
    email: string
  }
}

export async function getDepartamentos(): Promise<Departamento[]> {
  const res = await fetchNoCache("/api/departamentos")
  if (!res.ok) return []
  return res.json()
}

export async function getDepartamento(id: string): Promise<Departamento | undefined> {
  const res = await fetchNoCache(`/api/departamentos/${id}`)
  if (!res.ok) return undefined
  return res.json()
}

export async function saveDepartamento(
  departamento: Omit<Departamento, "id" | "createdAt"> & { id?: string }
): Promise<Departamento> {
  if (departamento.id) {
    const res = await fetchNoCache(`/api/departamentos/${departamento.id}`, {
      method: "PUT",
      body: JSON.stringify(departamento),
    })
    if (!res.ok) {
      const errorData = await res.json()
      throw new Error(errorData.message || errorData.error || "Erro ao atualizar departamento")
    }
    return res.json()
  } else {
    const res = await fetchNoCache("/api/departamentos", {
      method: "POST",
      body: JSON.stringify(departamento),
    })
    if (!res.ok) {
      const errorData = await res.json()
      throw new Error(errorData.message || errorData.error || "Erro ao criar departamento")
    }
    return res.json()
  }
}

export async function deleteDepartamento(id: string): Promise<void> {
  await fetchNoCache(`/api/departamentos/${id}`, { method: "DELETE" })
}

// Usuario-Departamento
export async function getUsuariosDepartamento(departamentoId: string): Promise<UsuarioDepartamento[]> {
  const res = await fetchNoCache(`/api/departamentos/${departamentoId}/usuarios`)
  if (!res.ok) return []
  return res.json()
}

export async function addUsuarioToDepartamento(
  departamentoId: string,
  usuarioId: string
): Promise<UsuarioDepartamento> {
  const res = await fetchNoCache(`/api/departamentos/${departamentoId}/usuarios`, {
    method: "POST",
    body: JSON.stringify({ usuarioId }),
  })
  if (!res.ok) {
    const errorData = await res.json()
    throw new Error(errorData.message || errorData.error || "Erro ao adicionar usuario")
  }
  return res.json()
}

export async function removeUsuarioFromDepartamento(
  departamentoId: string,
  usuarioId: string
): Promise<void> {
  await fetchNoCache(`/api/departamentos/${departamentoId}/usuarios/${usuarioId}`, {
    method: "DELETE",
  })
}

// Cliente-Departamento
export async function getClientesDepartamento(departamentoId: string): Promise<ClienteDepartamento[]> {
  const res = await fetchNoCache(`/api/departamentos/${departamentoId}/clientes`)
  if (!res.ok) return []
  return res.json()
}

export async function addClienteToDepartamento(
  departamentoId: string,
  clienteId: string,
  usuarioResponsavelId?: string
): Promise<ClienteDepartamento> {
  const res = await fetchNoCache(`/api/departamentos/${departamentoId}/clientes`, {
    method: "POST",
    body: JSON.stringify({ clienteId, usuarioResponsavelId }),
  })
  if (!res.ok) {
    const errorData = await res.json()
    throw new Error(errorData.message || errorData.error || "Erro ao adicionar cliente")
  }
  return res.json()
}

export async function removeClienteFromDepartamento(
  departamentoId: string,
  clienteId: string
): Promise<void> {
  await fetchNoCache(`/api/departamentos/${departamentoId}/clientes/${clienteId}`, {
    method: "DELETE",
  })
}

export async function updateClienteResponsavel(
  departamentoId: string,
  clienteId: string,
  usuarioResponsavelId: string | null
): Promise<ClienteDepartamento> {
  const res = await fetchNoCache(`/api/departamentos/${departamentoId}/clientes/${clienteId}`, {
    method: "PUT",
    body: JSON.stringify({ usuarioResponsavelId }),
  })
  if (!res.ok) {
    const errorData = await res.json()
    throw new Error(errorData.message || errorData.error || "Erro ao atualizar responsavel")
  }
  return res.json()
}

export async function getDepartamentosComDetalhes(): Promise<{
  departamentos: Departamento[]
  usuariosPorDepartamento: Record<string, UsuarioDepartamento[]>
  clientesPorDepartamento: Record<string, ClienteDepartamento[]>
}> {
  const res = await fetchNoCache("/api/departamentos/detalhes")
  if (!res.ok) {
    return { departamentos: [], usuariosPorDepartamento: {}, clientesPorDepartamento: {} }
  }
  return res.json()
}

export function createNovaOS(): Omit<OrdemServico, "id"> & { id?: string } {
  return {
    numero: "",
    status: "rascunho",
    currentStep: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    empresa: {
      razaoSocial: "",
      nomeFantasia: "",
      cnpj: "",
      cidade: "",
      uf: "",
      telefone: "",
      email: "",
      emails: [],
      responsavel: "",
    },
    motivo: {
      motivacaoServico: "",
      eventosRelevantes: "",
    },
    intervencao: {
      tipo: "",
      descricaoServicos: "",
    },
    pecas: [],
    maoDeObra: [],
    pendencias: {
      medicalSpin: "",
      cliente: "",
    },
    estadoEquipamento: {
      estadoInicial: "",
      estadoFinal: "",
    },
    finalizacao: {
      cidade: "",
      uf: "",
      nomeEngenheiro: "",
      cftEngenheiro: "",
      nomeRecebedor: "",
    },
    midias: {
      arquivos: [],
    },
  }
}
