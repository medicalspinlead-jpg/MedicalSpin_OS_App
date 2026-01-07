// Tipos para o sistema de OS

const API_KEY = "medicalspin2026"

function getHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
    "x-api-key": API_KEY,
  }
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
  createdAt: string
}

export interface Peca {
  id: string
  nome: string
  modeloRef: string
  numeroSerie: string
  observacoes: string
  quantidade: number
  categoria: "cliente" | "medical-spin"
}

export interface MaoDeObra {
  id: string
  data: string
  descricao: string
  horas: number
}

export interface OrdemServico {
  id: string
  numero: string
  status: "rascunho" | "finalizada"
  currentStep: number
  createdAt: string
  updatedAt: string
  finalizedAt?: string

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
  const res = await fetch("/api/clientes", { headers: getHeaders() })
  if (!res.ok) return []
  return res.json()
}

export async function saveCliente(
  cliente: Omit<Cliente, "id" | "createdAt"> & {
    id?: string
    equipamentos?: { tipo: string; fabricante: string; modelo: string; numeroSerie: string }[]
  },
): Promise<Cliente> {
  if (cliente.id) {
    const res = await fetch(`/api/clientes/${cliente.id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(cliente),
    })
    if (!res.ok) {
      const errorData = await res.json()
      throw new Error(errorData.message || errorData.error || "Erro ao atualizar cliente")
    }
    return res.json()
  } else {
    const res = await fetch("/api/clientes", {
      method: "POST",
      headers: getHeaders(),
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
  await fetch(`/api/clientes/${id}`, { method: "DELETE", headers: getHeaders() })
}

export async function getCliente(id: string): Promise<Cliente | undefined> {
  const res = await fetch(`/api/clientes/${id}`, { headers: getHeaders() })
  if (!res.ok) return undefined
  return res.json()
}

// Equipamentos
export async function getEquipamentos(): Promise<Equipamento[]> {
  const res = await fetch("/api/equipamentos", { headers: getHeaders() })
  if (!res.ok) return []
  return res.json()
}

export async function getEquipamentosByCliente(clienteId: string): Promise<Equipamento[]> {
  const res = await fetch(`/api/equipamentos?clienteId=${clienteId}`, { headers: getHeaders() })
  if (!res.ok) return []
  return res.json()
}

export async function saveEquipamento(
  equipamento: Omit<Equipamento, "id" | "createdAt"> & { id?: string },
): Promise<Equipamento> {
  if (equipamento.id) {
    const res = await fetch(`/api/equipamentos/${equipamento.id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(equipamento),
    })
    return res.json()
  } else {
    const res = await fetch("/api/equipamentos", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(equipamento),
    })
    return res.json()
  }
}

export async function deleteEquipamento(id: string): Promise<void> {
  await fetch(`/api/equipamentos/${id}`, { method: "DELETE", headers: getHeaders() })
}

// Ordens de Serviço
export async function getOrdensServico(): Promise<OrdemServico[]> {
  const res = await fetch("/api/os", { headers: getHeaders() })
  if (!res.ok) return []
  return res.json()
}

export async function getRascunhos(): Promise<OrdemServico[]> {
  const res = await fetch("/api/os?status=rascunho", { headers: getHeaders() })
  if (!res.ok) return []
  return res.json()
}

export async function getOSFinalizadas(): Promise<OrdemServico[]> {
  const res = await fetch("/api/os?status=finalizada", { headers: getHeaders() })
  if (!res.ok) return []
  return res.json()
}

export async function saveOrdemServico(os: Partial<OrdemServico> & { id?: string }): Promise<OrdemServico> {
  if (os.id) {
    const res = await fetch(`/api/os/${os.id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(os),
    })
    if (!res.ok) {
      throw new Error("Erro ao atualizar OS")
    }
    return res.json()
  } else {
    const res = await fetch("/api/os", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(os),
    })
    if (!res.ok) {
      throw new Error("Erro ao criar OS")
    }
    return res.json()
  }
}

export async function getOrdemServico(id: string): Promise<OrdemServico | undefined> {
  const res = await fetch(`/api/os/${id}`, { headers: getHeaders() })
  if (!res.ok) return undefined
  return res.json()
}

export async function deleteOrdemServico(id: string): Promise<void> {
  await fetch(`/api/os/${id}`, { method: "DELETE", headers: getHeaders() })
}

export async function finalizarOrdemServico(id: string): Promise<void> {
  const os = await getOrdemServico(id)
  if (os) {
    os.status = "finalizada"
    os.finalizedAt = new Date().toISOString()
    await saveOrdemServico(os)
  }
}

// Helper para criar OS inicial
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
