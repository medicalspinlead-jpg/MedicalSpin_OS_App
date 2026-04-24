import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

// Exportar dados selecionados (exceto mídias)
export async function GET(request: NextRequest) {
  try {
    const usuario = await getCurrentUser()
    if (!usuario) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Apenas admins podem fazer backup
    if (usuario.cargo !== "admin") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    // Obter opções de exportação da query string
    const { searchParams } = new URL(request.url)
    const options = {
      clientes: searchParams.get("clientes") === "true",
      equipamentos: searchParams.get("equipamentos") === "true",
      ordensServico: searchParams.get("ordensServico") === "true",
      pecas: searchParams.get("pecas") === "true",
      maoObra: searchParams.get("maoObra") === "true",
      usuarios: searchParams.get("usuarios") === "true",
      configuracoes: searchParams.get("configuracoes") === "true",
      solicitacoes: searchParams.get("solicitacoes") === "true",
      departamentos: searchParams.get("departamentos") === "true",
    }

    // Se nenhuma opção foi passada, exportar tudo
    const exportarTudo = !Object.values(options).some(v => v)
    
    // Buscar dados conforme seleção
    const clientes = (options.clientes || exportarTudo) ? await prisma.cliente.findMany() : []
    const equipamentos = (options.equipamentos || exportarTudo) ? await prisma.equipamento.findMany() : []
    const ordensServico = (options.ordensServico || exportarTudo) ? await prisma.ordemServico.findMany() : []
    const pecas = (options.pecas || exportarTudo) ? await prisma.peca.findMany() : []
    const maoDeObra = (options.maoObra || exportarTudo) ? await prisma.maoDeObra.findMany() : []
    const usuarios = (options.usuarios || exportarTudo) ? await prisma.usuario.findMany({
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        senha: true, // Incluir senha hash para restauração
        cargo: true,
        ativo: true,
        aprovado: true,
        clienteId: true,
        notifEmail: true,
        notifWhatsapp: true,
        createdAt: true,
        updatedAt: true,
      }
    }) : []
    const configuracoes = (options.configuracoes || exportarTudo) ? await prisma.configuracao.findMany() : []
    const solicitacoes = (options.solicitacoes || exportarTudo) ? await prisma.solicitacao.findMany() : []
    const historicoStatusSolicitacao = (options.solicitacoes || exportarTudo) ? await prisma.historicoStatusSolicitacao.findMany() : []
    const departamentos = (options.departamentos || exportarTudo) ? await prisma.departamento.findMany() : []
    const usuariosDepartamentos = (options.departamentos || exportarTudo) ? await prisma.usuarioDepartamento.findMany() : []
    const clientesDepartamentos = (options.departamentos || exportarTudo) ? await prisma.clienteDepartamento.findMany() : []

    // Limpar mídias das OS e solicitações para o backup
    const ordensServicoSemMidias = ordensServico.map(os => ({
      ...os,
      midias: {}, // Limpar mídias
    }))

    const solicitacoesSemMidias = solicitacoes.map(sol => ({
      ...sol,
      midias: {}, // Limpar mídias
    }))

    // Construir objeto de dados apenas com itens selecionados
    const dados: Record<string, unknown> = {}
    const estatisticas: Record<string, number> = {}

    if (clientes.length > 0 || options.clientes || exportarTudo) {
      dados.clientes = clientes
      estatisticas.clientes = clientes.length
    }
    if (equipamentos.length > 0 || options.equipamentos || exportarTudo) {
      dados.equipamentos = equipamentos
      estatisticas.equipamentos = equipamentos.length
    }
    if (ordensServico.length > 0 || options.ordensServico || exportarTudo) {
      dados.ordensServico = ordensServicoSemMidias
      dados.pecas = pecas
      dados.maoDeObra = maoDeObra
      estatisticas.ordensServico = ordensServico.length
      estatisticas.pecas = pecas.length
      estatisticas.maoDeObra = maoDeObra.length
    }
    if (usuarios.length > 0 || options.usuarios || exportarTudo) {
      dados.usuarios = usuarios
      estatisticas.usuarios = usuarios.length
    }
    if (configuracoes.length > 0 || options.configuracoes || exportarTudo) {
      dados.configuracoes = configuracoes
      estatisticas.configuracoes = configuracoes.length
    }
    if (solicitacoes.length > 0 || options.solicitacoes || exportarTudo) {
      dados.solicitacoes = solicitacoesSemMidias
      dados.historicoStatusSolicitacao = historicoStatusSolicitacao
      estatisticas.solicitacoes = solicitacoes.length
      estatisticas.historicoStatusSolicitacao = historicoStatusSolicitacao.length
    }
    if (departamentos.length > 0 || options.departamentos || exportarTudo) {
      dados.departamentos = departamentos
      dados.usuariosDepartamentos = usuariosDepartamentos
      dados.clientesDepartamentos = clientesDepartamentos
      estatisticas.departamentos = departamentos.length
    }

    const backup = {
      versao: "1.0",
      dataExportacao: new Date().toISOString(),
      exportadoPor: usuario.nome,
      opcoesSelecionadas: options,
      dados,
      estatisticas,
    }

    // Retornar como arquivo JSON
    const jsonStr = JSON.stringify(backup, null, 2)
    const dataFormatada = new Date().toISOString().split('T')[0]
    
    return new NextResponse(jsonStr, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="backup-msp-${dataFormatada}.json"`,
      },
    })
  } catch (error) {
    console.error("Erro ao exportar backup:", error)
    return NextResponse.json(
      { error: "Erro ao exportar backup" },
      { status: 500 }
    )
  }
}

// Importar dados do backup
export async function POST(request: Request) {
  try {
    const usuario = await getCurrentUser()
    if (!usuario) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Apenas admins podem restaurar backup
    if (usuario.cargo !== "admin") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    const backup = await request.json()

    // Validar estrutura do backup
    if (!backup.versao || !backup.dados) {
      return NextResponse.json(
        { error: "Arquivo de backup inválido" },
        { status: 400 }
      )
    }

    const { dados } = backup

    // Estatísticas de importação
    const estatisticas = {
      clientes: { importados: 0, erros: 0 },
      equipamentos: { importados: 0, erros: 0 },
      ordensServico: { importados: 0, erros: 0 },
      pecas: { importados: 0, erros: 0 },
      maoDeObra: { importados: 0, erros: 0 },
      usuarios: { importados: 0, erros: 0 },
      configuracoes: { importados: 0, erros: 0 },
      solicitacoes: { importados: 0, erros: 0 },
      historicoStatusSolicitacao: { importados: 0, erros: 0 },
      departamentos: { importados: 0, erros: 0 },
      usuariosDepartamentos: { importados: 0, erros: 0 },
      clientesDepartamentos: { importados: 0, erros: 0 },
    }

    // Importar na ordem correta (respeitando dependências)
    
    // 1. Clientes (não tem dependências)
    if (dados.clientes?.length > 0) {
      for (const cliente of dados.clientes) {
        try {
          await prisma.cliente.upsert({
            where: { id: cliente.id },
            update: {
              razaoSocial: cliente.razaoSocial,
              nomeFantasia: cliente.nomeFantasia,
              cnpj: cliente.cnpj,
              cidade: cliente.cidade,
              uf: cliente.uf,
              telefone: cliente.telefone,
              email: cliente.email,
              responsavel: cliente.responsavel,
              notifEmail: cliente.notifEmail ?? false,
              notifWhatsapp: cliente.notifWhatsapp ?? false,
              createdAt: new Date(cliente.createdAt),
              updatedAt: new Date(cliente.updatedAt),
            },
            create: {
              id: cliente.id,
              razaoSocial: cliente.razaoSocial,
              nomeFantasia: cliente.nomeFantasia,
              cnpj: cliente.cnpj,
              cidade: cliente.cidade,
              uf: cliente.uf,
              telefone: cliente.telefone,
              email: cliente.email,
              responsavel: cliente.responsavel,
              notifEmail: cliente.notifEmail ?? false,
              notifWhatsapp: cliente.notifWhatsapp ?? false,
              createdAt: new Date(cliente.createdAt),
              updatedAt: new Date(cliente.updatedAt),
            },
          })
          estatisticas.clientes.importados++
        } catch (e) {
          console.error("Erro ao importar cliente:", e)
          estatisticas.clientes.erros++
        }
      }
    }

    // 2. Equipamentos (depende de clientes)
    if (dados.equipamentos?.length > 0) {
      for (const equip of dados.equipamentos) {
        try {
          await prisma.equipamento.upsert({
            where: { id: equip.id },
            update: {
              clienteId: equip.clienteId,
              tipo: equip.tipo,
              fabricante: equip.fabricante,
              modelo: equip.modelo,
              numeroSerie: equip.numeroSerie,
              ativo: equip.ativo ?? true,
              createdAt: new Date(equip.createdAt),
              updatedAt: new Date(equip.updatedAt),
            },
            create: {
              id: equip.id,
              clienteId: equip.clienteId,
              tipo: equip.tipo,
              fabricante: equip.fabricante,
              modelo: equip.modelo,
              numeroSerie: equip.numeroSerie,
              ativo: equip.ativo ?? true,
              createdAt: new Date(equip.createdAt),
              updatedAt: new Date(equip.updatedAt),
            },
          })
          estatisticas.equipamentos.importados++
        } catch (e) {
          console.error("Erro ao importar equipamento:", e)
          estatisticas.equipamentos.erros++
        }
      }
    }

    // 3. Departamentos (não tem dependências)
    if (dados.departamentos?.length > 0) {
      for (const dept of dados.departamentos) {
        try {
          await prisma.departamento.upsert({
            where: { id: dept.id },
            update: {
              nome: dept.nome,
              descricao: dept.descricao,
              cor: dept.cor,
              icone: dept.icone,
              ativo: dept.ativo ?? true,
              createdAt: new Date(dept.createdAt),
              updatedAt: new Date(dept.updatedAt),
            },
            create: {
              id: dept.id,
              nome: dept.nome,
              descricao: dept.descricao,
              cor: dept.cor,
              icone: dept.icone,
              ativo: dept.ativo ?? true,
              createdAt: new Date(dept.createdAt),
              updatedAt: new Date(dept.updatedAt),
            },
          })
          estatisticas.departamentos.importados++
        } catch (e) {
          console.error("Erro ao importar departamento:", e)
          estatisticas.departamentos.erros++
        }
      }
    }

    // 4. Usuários (depende de clientes)
    if (dados.usuarios?.length > 0) {
      for (const usuario of dados.usuarios) {
        try {
          await prisma.usuario.upsert({
            where: { id: usuario.id },
            update: {
              nome: usuario.nome,
              email: usuario.email,
              telefone: usuario.telefone,
              senha: usuario.senha,
              cargo: usuario.cargo,
              ativo: usuario.ativo ?? true,
              aprovado: usuario.aprovado ?? true,
              clienteId: usuario.clienteId,
              notifEmail: usuario.notifEmail ?? false,
              notifWhatsapp: usuario.notifWhatsapp ?? false,
              createdAt: new Date(usuario.createdAt),
              updatedAt: new Date(usuario.updatedAt),
            },
            create: {
              id: usuario.id,
              nome: usuario.nome,
              email: usuario.email,
              telefone: usuario.telefone,
              senha: usuario.senha,
              cargo: usuario.cargo,
              ativo: usuario.ativo ?? true,
              aprovado: usuario.aprovado ?? true,
              clienteId: usuario.clienteId,
              notifEmail: usuario.notifEmail ?? false,
              notifWhatsapp: usuario.notifWhatsapp ?? false,
              createdAt: new Date(usuario.createdAt),
              updatedAt: new Date(usuario.updatedAt),
            },
          })
          estatisticas.usuarios.importados++
        } catch (e) {
          console.error("Erro ao importar usuario:", e)
          estatisticas.usuarios.erros++
        }
      }
    }

    // 5. Ordens de Serviço (depende de clientes, equipamentos, usuários)
    if (dados.ordensServico?.length > 0) {
      for (const os of dados.ordensServico) {
        try {
          await prisma.ordemServico.upsert({
            where: { id: os.id },
            update: {
              numero: os.numero,
              status: os.status,
              currentStep: os.currentStep,
              usuarioId: os.usuarioId,
              empresa: os.empresa,
              clienteId: os.clienteId,
              equipamentoId: os.equipamentoId,
              motivo: os.motivo,
              intervencao: os.intervencao,
              pendencias: os.pendencias,
              estadoEquipamento: os.estadoEquipamento,
              finalizacao: os.finalizacao,
              midias: os.midias || {},
              finalizedAt: os.finalizedAt ? new Date(os.finalizedAt) : null,
              createdAt: new Date(os.createdAt),
              updatedAt: new Date(os.updatedAt),
            },
            create: {
              id: os.id,
              numero: os.numero,
              status: os.status,
              currentStep: os.currentStep,
              usuarioId: os.usuarioId,
              empresa: os.empresa,
              clienteId: os.clienteId,
              equipamentoId: os.equipamentoId,
              motivo: os.motivo,
              intervencao: os.intervencao,
              pendencias: os.pendencias,
              estadoEquipamento: os.estadoEquipamento,
              finalizacao: os.finalizacao,
              midias: os.midias || {},
              finalizedAt: os.finalizedAt ? new Date(os.finalizedAt) : null,
              createdAt: new Date(os.createdAt),
              updatedAt: new Date(os.updatedAt),
            },
          })
          estatisticas.ordensServico.importados++
        } catch (e) {
          console.error("Erro ao importar OS:", e)
          estatisticas.ordensServico.erros++
        }
      }
    }

    // 6. Peças (depende de OS)
    if (dados.pecas?.length > 0) {
      for (const peca of dados.pecas) {
        try {
          await prisma.peca.upsert({
            where: { id: peca.id },
            update: {
              osId: peca.osId,
              nome: peca.nome,
              modeloRef: peca.modeloRef,
              numeroSerie: peca.numeroSerie,
              observacoes: peca.observacoes,
              quantidade: peca.quantidade,
              categoria: peca.categoria,
              tipo: peca.tipo,
              createdAt: new Date(peca.createdAt),
            },
            create: {
              id: peca.id,
              osId: peca.osId,
              nome: peca.nome,
              modeloRef: peca.modeloRef,
              numeroSerie: peca.numeroSerie,
              observacoes: peca.observacoes,
              quantidade: peca.quantidade,
              categoria: peca.categoria,
              tipo: peca.tipo,
              createdAt: new Date(peca.createdAt),
            },
          })
          estatisticas.pecas.importados++
        } catch (e) {
          console.error("Erro ao importar peça:", e)
          estatisticas.pecas.erros++
        }
      }
    }

    // 7. Mão de Obra (depende de OS)
    if (dados.maoDeObra?.length > 0) {
      for (const mdo of dados.maoDeObra) {
        try {
          await prisma.maoDeObra.upsert({
            where: { id: mdo.id },
            update: {
              osId: mdo.osId,
              data: mdo.data,
              descricao: mdo.descricao,
              horas: mdo.horas,
              createdAt: new Date(mdo.createdAt),
            },
            create: {
              id: mdo.id,
              osId: mdo.osId,
              data: mdo.data,
              descricao: mdo.descricao,
              horas: mdo.horas,
              createdAt: new Date(mdo.createdAt),
            },
          })
          estatisticas.maoDeObra.importados++
        } catch (e) {
          console.error("Erro ao importar mão de obra:", e)
          estatisticas.maoDeObra.erros++
        }
      }
    }

    // 8. Solicitações (depende de clientes)
    if (dados.solicitacoes?.length > 0) {
      for (const sol of dados.solicitacoes) {
        try {
          await prisma.solicitacao.upsert({
            where: { id: sol.id },
            update: {
              protocolo: sol.protocolo,
              status: sol.status,
              nomeEmpresa: sol.nomeEmpresa,
              cnpj: sol.cnpj,
              nomeContato: sol.nomeContato,
              telefone: sol.telefone,
              email: sol.email,
              cidade: sol.cidade,
              uf: sol.uf,
              tipoEquipamento: sol.tipoEquipamento,
              fabricante: sol.fabricante,
              modelo: sol.modelo,
              numeroSerie: sol.numeroSerie,
              descricaoProblema: sol.descricaoProblema,
              urgencia: sol.urgencia,
              midias: sol.midias || {},
              motivoCancelamento: sol.motivoCancelamento,
              ordemServicoId: sol.ordemServicoId,
              clienteId: sol.clienteId,
              createdAt: new Date(sol.createdAt),
              updatedAt: new Date(sol.updatedAt),
            },
            create: {
              id: sol.id,
              protocolo: sol.protocolo,
              status: sol.status,
              nomeEmpresa: sol.nomeEmpresa,
              cnpj: sol.cnpj,
              nomeContato: sol.nomeContato,
              telefone: sol.telefone,
              email: sol.email,
              cidade: sol.cidade,
              uf: sol.uf,
              tipoEquipamento: sol.tipoEquipamento,
              fabricante: sol.fabricante,
              modelo: sol.modelo,
              numeroSerie: sol.numeroSerie,
              descricaoProblema: sol.descricaoProblema,
              urgencia: sol.urgencia,
              midias: sol.midias || {},
              motivoCancelamento: sol.motivoCancelamento,
              ordemServicoId: sol.ordemServicoId,
              clienteId: sol.clienteId,
              createdAt: new Date(sol.createdAt),
              updatedAt: new Date(sol.updatedAt),
            },
          })
          estatisticas.solicitacoes.importados++
        } catch (e) {
          console.error("Erro ao importar solicitação:", e)
          estatisticas.solicitacoes.erros++
        }
      }
    }

    // 9. Histórico de Status (depende de solicitações)
    if (dados.historicoStatusSolicitacao?.length > 0) {
      for (const hist of dados.historicoStatusSolicitacao) {
        try {
          await prisma.historicoStatusSolicitacao.upsert({
            where: { id: hist.id },
            update: {
              solicitacaoId: hist.solicitacaoId,
              status: hist.status,
              observacao: hist.observacao,
              usuarioNome: hist.usuarioNome,
              criadoEm: new Date(hist.criadoEm),
            },
            create: {
              id: hist.id,
              solicitacaoId: hist.solicitacaoId,
              status: hist.status,
              observacao: hist.observacao,
              usuarioNome: hist.usuarioNome,
              criadoEm: new Date(hist.criadoEm),
            },
          })
          estatisticas.historicoStatusSolicitacao.importados++
        } catch (e) {
          console.error("Erro ao importar histórico:", e)
          estatisticas.historicoStatusSolicitacao.erros++
        }
      }
    }

    // 10. Configurações
    if (dados.configuracoes?.length > 0) {
      for (const config of dados.configuracoes) {
        try {
          await prisma.configuracao.upsert({
            where: { id: config.id },
            update: {
              emailHabilitado: config.emailHabilitado,
              createdAt: new Date(config.createdAt),
              updatedAt: new Date(config.updatedAt),
            },
            create: {
              id: config.id,
              emailHabilitado: config.emailHabilitado,
              createdAt: new Date(config.createdAt),
              updatedAt: new Date(config.updatedAt),
            },
          })
          estatisticas.configuracoes.importados++
        } catch (e) {
          console.error("Erro ao importar configuração:", e)
          estatisticas.configuracoes.erros++
        }
      }
    }

    // 11. Usuários-Departamentos (depende de usuários e departamentos)
    if (dados.usuariosDepartamentos?.length > 0) {
      for (const ud of dados.usuariosDepartamentos) {
        try {
          await prisma.usuarioDepartamento.upsert({
            where: { id: ud.id },
            update: {
              usuarioId: ud.usuarioId,
              departamentoId: ud.departamentoId,
              createdAt: new Date(ud.createdAt),
            },
            create: {
              id: ud.id,
              usuarioId: ud.usuarioId,
              departamentoId: ud.departamentoId,
              createdAt: new Date(ud.createdAt),
            },
          })
          estatisticas.usuariosDepartamentos.importados++
        } catch (e) {
          console.error("Erro ao importar usuário-departamento:", e)
          estatisticas.usuariosDepartamentos.erros++
        }
      }
    }

    // 12. Clientes-Departamentos (depende de clientes, departamentos, usuários)
    if (dados.clientesDepartamentos?.length > 0) {
      for (const cd of dados.clientesDepartamentos) {
        try {
          await prisma.clienteDepartamento.upsert({
            where: { id: cd.id },
            update: {
              clienteId: cd.clienteId,
              departamentoId: cd.departamentoId,
              usuarioResponsavelId: cd.usuarioResponsavelId,
              createdAt: new Date(cd.createdAt),
            },
            create: {
              id: cd.id,
              clienteId: cd.clienteId,
              departamentoId: cd.departamentoId,
              usuarioResponsavelId: cd.usuarioResponsavelId,
              createdAt: new Date(cd.createdAt),
            },
          })
          estatisticas.clientesDepartamentos.importados++
        } catch (e) {
          console.error("Erro ao importar cliente-departamento:", e)
          estatisticas.clientesDepartamentos.erros++
        }
      }
    }

    return NextResponse.json({
      sucesso: true,
      mensagem: "Backup importado com sucesso",
      dataImportacao: new Date().toISOString(),
      estatisticas,
    })
  } catch (error) {
    console.error("Erro ao importar backup:", error)
    return NextResponse.json(
      { error: "Erro ao importar backup" },
      { status: 500 }
    )
  }
}
