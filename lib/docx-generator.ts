// Gerador de documentos Word (.docx) para Ordens de Servico

import {
  Document,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  HeadingLevel,
  Header,
  ImageRun,
  Packer,
  ShadingType,
  VerticalAlign,
  PageBreak,
} from "docx"
import type { OrdemServico } from "./storage"

// Cores do tema
const COLORS = {
  primary: "1A5276", // Azul escuro
  white: "FFFFFF",
  gray: "555555",
  lightGray: "F5F5F5",
  black: "000000",
}

// Helper para criar celula de tabela com estilo de cabecalho
function createHeaderCell(text: string, width?: number): TableCell {
  return new TableCell({
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text,
            bold: true,
            color: COLORS.white,
            size: 18,
          }),
        ],
      }),
    ],
    shading: {
      fill: COLORS.primary,
      type: ShadingType.CLEAR,
    },
    verticalAlign: VerticalAlign.CENTER,
    width: width ? { size: width, type: WidthType.PERCENTAGE } : undefined,
  })
}

// Helper para criar celula de tabela normal
function createCell(text: string, bold = false, width?: number): TableCell {
  return new TableCell({
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text,
            bold,
            size: 18,
            color: COLORS.black,
          }),
        ],
      }),
    ],
    verticalAlign: VerticalAlign.CENTER,
    width: width ? { size: width, type: WidthType.PERCENTAGE } : undefined,
  })
}

// Helper para criar titulo de secao
function createSectionTitle(text: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        bold: true,
        color: COLORS.white,
        size: 22,
      }),
    ],
    shading: {
      fill: COLORS.primary,
      type: ShadingType.CLEAR,
    },
    spacing: { before: 200, after: 100 },
  })
}

// Helper para criar campo com label e valor
function createField(label: string, value: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text: `${label}: `,
        bold: true,
        color: COLORS.gray,
        size: 18,
      }),
      new TextRun({
        text: value || "N/A",
        size: 18,
        color: COLORS.black,
      }),
    ],
    spacing: { before: 50, after: 50 },
  })
}

// Funcao principal para gerar o documento Word
export async function gerarDocxOS(os: OrdemServico): Promise<Buffer> {
  const sections: any[] = []

  // ==================== CABECALHO ====================
  sections.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "ORDEM DE SERVICO",
          bold: true,
          size: 32,
          color: COLORS.primary,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    })
  )

  // Numero da OS e Data
  sections.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `OS: ${os.numero || os.id}`,
          bold: true,
          size: 24,
          color: COLORS.primary,
        }),
        new TextRun({
          text: `    Data: ${os.createdAt ? new Date(os.createdAt).toLocaleDateString("pt-BR") : "N/A"}`,
          size: 20,
          color: COLORS.gray,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    })
  )

  // ==================== 1. DADOS DA EMPRESA ====================
  sections.push(createSectionTitle("1. DADOS DA EMPRESA"))
  sections.push(createField("Razao Social", os.cliente?.razaoSocial || os.empresa?.razaoSocial || os.empresa?.nomeFantasia || "N/A"))
  sections.push(createField("Nome Fantasia", os.cliente?.nomeFantasia || os.empresa?.nomeFantasia || "N/A"))
  sections.push(createField("CNPJ", os.cliente?.cnpj || os.empresa?.cnpj || "N/A"))
  sections.push(createField("Cidade", os.empresa?.cidade || "N/A"))
  sections.push(createField("UF", os.empresa?.uf || "N/A"))
  sections.push(createField("Responsavel", os.empresa?.responsavel || "N/A"))

  // ==================== 2. EQUIPAMENTO ====================
  sections.push(createSectionTitle("2. EQUIPAMENTO"))
  if (os.equipamento) {
    sections.push(createField("Tipo", os.equipamento.tipo || "N/A"))
    sections.push(createField("Fabricante", os.equipamento.fabricante || "N/A"))
    sections.push(createField("Modelo", os.equipamento.modelo || "N/A"))
    sections.push(createField("Numero de Serie", os.equipamento.numeroSerie || "N/A"))
  } else {
    sections.push(new Paragraph({
      children: [new TextRun({ text: "Nenhum equipamento registrado", italics: true, size: 18 })],
    }))
  }

  // ==================== 3. MOTIVO E EVENTOS ====================
  sections.push(createSectionTitle("3. MOTIVO E EVENTOS"))
  sections.push(createField("Motivacao do Servico", os.motivo?.motivacaoServico || os.motivo?.motivoServico || "N/A"))
  sections.push(createField("Eventos Relevantes", os.motivo?.eventosRelevantes || "N/A"))

  // ==================== 4. TIPO DE INTERVENCAO ====================
  sections.push(createSectionTitle("4. TIPO DE INTERVENCAO"))
  sections.push(createField("Tipo de Intervencao", os.intervencao?.tipo || "N/A"))
  sections.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "Descricao dos Servicos:",
          bold: true,
          color: COLORS.gray,
          size: 18,
        }),
      ],
      spacing: { before: 50 },
    })
  )
  sections.push(
    new Paragraph({
      children: [
        new TextRun({
          text: os.intervencao?.descricaoServicos || os.intervencao?.descricao || "N/A",
          size: 18,
          color: COLORS.black,
        }),
      ],
      spacing: { after: 100 },
    })
  )

  // ==================== 5. PECAS UTILIZADAS ====================
  sections.push(createSectionTitle("5. PECAS UTILIZADAS"))
  
  const pecas = os.pecas || []
  if (pecas.length > 0) {
    const pecasTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        // Cabecalho
        new TableRow({
          children: [
            createHeaderCell("Descricao", 30),
            createHeaderCell("Qtd", 10),
            createHeaderCell("Tipo", 15),
            createHeaderCell("Em Posse de", 20),
            createHeaderCell("Observacoes", 25),
          ],
        }),
        // Dados
        ...pecas.map((p: any) => {
          const tipo = p.tipo === "removida" ? "Removida" : p.tipo === "inclusa" ? "Inclusa" : "N/A"
          const posse = p.categoria === "cliente" ? "Cliente" : p.categoria === "medical-spin" ? "MedicalSpin" : "N/A"
          return new TableRow({
            children: [
              createCell(p.nome || p.descricao || "N/A", false, 30),
              createCell(String(p.quantidade || 1), false, 10),
              createCell(tipo, false, 15),
              createCell(posse, false, 20),
              createCell(p.observacoes || "N/A", false, 25),
            ],
          })
        }),
      ],
    })
    sections.push(pecasTable)
  } else {
    sections.push(new Paragraph({
      children: [new TextRun({ text: "Nenhuma peca registrada", italics: true, size: 18 })],
    }))
  }

  // ==================== 6. MAO DE OBRA ====================
  sections.push(createSectionTitle("6. MAO DE OBRA"))
  
  const maoObra = os.maoDeObra || []
  if (maoObra.length > 0) {
    const totalHoras = maoObra.reduce((acc: number, m: any) => acc + (m.horas || 0), 0)
    
    const maoObraTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        // Cabecalho
        new TableRow({
          children: [
            createHeaderCell("Data", 20),
            createHeaderCell("Horas", 15),
            createHeaderCell("Descricao do Trabalho", 65),
          ],
        }),
        // Dados
        ...maoObra.map((m: any) => {
          return new TableRow({
            children: [
              createCell(m.data ? new Date(m.data).toLocaleDateString("pt-BR") : "N/A", false, 20),
              createCell(`${m.horas || 0}h`, false, 15),
              createCell(m.descricao || m.trabalhoRealizado || "N/A", false, 65),
            ],
          })
        }),
        // Total
        new TableRow({
          children: [
            createCell("TOTAL", true, 20),
            createCell(`${totalHoras}h`, true, 15),
            createCell("", false, 65),
          ],
        }),
      ],
    })
    sections.push(maoObraTable)
  } else {
    sections.push(new Paragraph({
      children: [new TextRun({ text: "Nenhuma mao de obra registrada", italics: true, size: 18 })],
    }))
  }

  // ==================== 7. PENDENCIAS ====================
  sections.push(createSectionTitle("7. PENDENCIAS"))
  sections.push(createField("Medical Spin", os.pendencias?.medicalSpin || os.pendencias?.empresa || "N/A"))
  sections.push(createField("Cliente", os.pendencias?.cliente || "N/A"))

  // ==================== 8. ESTADO DO EQUIPAMENTO ====================
  sections.push(createSectionTitle("8. ESTADO DO EQUIPAMENTO"))
  sections.push(createField("Antes da Intervencao", os.estadoEquipamento?.estadoInicial || os.estado?.estadoInicial || "N/A"))
  sections.push(createField("Apos a Intervencao", os.estadoEquipamento?.estadoFinal || os.estado?.estadoFinal || "N/A"))

  // ==================== 9. FINALIZACAO ====================
  sections.push(createSectionTitle("9. FINALIZACAO"))
  
  const dataFinalizacao = os.finalizedAt 
    ? new Date(os.finalizedAt).toLocaleDateString("pt-BR") 
    : new Date().toLocaleDateString("pt-BR")
  
  sections.push(createField("Data de Finalizacao", dataFinalizacao))
  sections.push(createField("Cidade", os.finalizacao?.cidade || "N/A"))
  sections.push(createField("UF", os.finalizacao?.uf || "N/A"))
  sections.push(createField("Nome do Engenheiro", os.finalizacao?.nomeEngenheiro || "N/A"))
  sections.push(createField("CFT do Engenheiro", os.finalizacao?.cftEngenheiro || "N/A"))
  sections.push(createField("Nome do Recebedor", os.finalizacao?.nomeRecebedor || os.finalizacao?.responsavel || "N/A"))

  // ==================== RODAPE ====================
  sections.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "Medical Spin Equipamentos de Ressonancia Magnetica | (11) 99807-0104 | contato@medicalspin.com.br",
          size: 16,
          color: COLORS.gray,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 400 },
    })
  )

  // Criar o documento
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: sections,
      },
    ],
  })

  // Gerar o buffer
  const buffer = await Packer.toBuffer(doc)
  return buffer
}
