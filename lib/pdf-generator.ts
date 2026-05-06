"use client"

import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import type { OrdemServico } from "./storage"

// Extende jsPDF para incluir lastAutoTable
interface jsPDFWithAutoTable extends jsPDF {
  lastAutoTable?: { finalY: number }
}

// Logo MedicalSpin URL
const LOGO_URL = "/images/medicalspin-logo.png"

// Cores do tema
const COLORS = {
  primary: [26, 82, 118] as [number, number, number],    // #1A5276
  white: [255, 255, 255] as [number, number, number],
  black: [33, 37, 41] as [number, number, number],
  gray: [108, 117, 125] as [number, number, number],
  lightGray: [248, 249, 250] as [number, number, number],
  border: [222, 226, 230] as [number, number, number],
}

// Informacoes fixas da MedicalSpin
const MEDICALSPIN_INFO = {
  nome: "Medical Spin Equipamentos de Ressonância Magnética",
  razaoSocial: "Scientee Medical Business Group - Equipamentos E Servicos De Radiologia Ltda",
  cnpj: "55.534.724/0001-07",
  email: "contato@medicalspin.com.br",
  site: "https://medicalspin.com.br",
  cidade: "Novo Hamburgo",
  uf: "RS",
  telefone: "(11) 99807-0104"
}

// Carrega imagem como base64
async function loadImageAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url)
    const blob = await response.blob()
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

export async function gerarPdfOS(os: OrdemServico): Promise<Blob> {
  const doc = new jsPDF() as jsPDFWithAutoTable
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 10
  const contentWidth = pageWidth - margin * 2

  // Carrega logo
  let logoBase64: string | null = null
  try {
    logoBase64 = await loadImageAsBase64(LOGO_URL)
  } catch { /* ignore */ }

  // Carrega imagens da OS
  const imagensCarregadas: string[] = []
  
  // Imagens do campo midias
  if (os.midias?.arquivos && Array.isArray(os.midias.arquivos)) {
    for (const arquivo of os.midias.arquivos) {
      if (typeof arquivo === "string") {
        if (arquivo.startsWith("data:image")) {
          imagensCarregadas.push(arquivo)
        } else if (arquivo.startsWith("http")) {
          const base64 = await loadImageAsBase64(arquivo)
          if (base64) imagensCarregadas.push(base64)
        }
      }
    }
  }
  
  // Imagens da finalizacao
  if (os.finalizacao?.imagens && Array.isArray(os.finalizacao.imagens)) {
    for (const img of os.finalizacao.imagens) {
      if (typeof img === "string" && img.startsWith("data:image")) {
        imagensCarregadas.push(img)
      }
    }
  }

  // Helper para desenhar header de secao
  const drawSectionTitle = (title: string, y: number): number => {
    doc.setFillColor(...COLORS.primary)
    doc.roundedRect(margin, y, contentWidth, 7, 1, 1, "F")
    doc.setTextColor(...COLORS.white)
    doc.setFontSize(9)
    doc.setFont("helvetica", "bold")
    doc.text(title, margin + 3, y + 5)
    doc.setTextColor(...COLORS.black)
    return y + 9
  }

  // Helper para desenhar campo com label e valor
  const drawField = (label: string, value: string, x: number, y: number, labelWidth: number = 35): number => {
    doc.setFontSize(8)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(...COLORS.gray)
    const labelText = `${label}:`
    doc.text(labelText, x, y)

    doc.setFont("helvetica", "normal")
    doc.setTextColor(...COLORS.black)
    const val = value || "N/A"
    const computedLabelWidth = Math.max(doc.getTextWidth(labelText) + 2, labelWidth)
    const availableWidth = Math.max(20, pageWidth - x - computedLabelWidth - margin)
    const valueLines = doc.splitTextToSize(val, availableWidth)
    doc.text(valueLines, x + computedLabelWidth, y)
    return Math.max(5, valueLines.length * 3.5)
  }

  // Helper para desenhar box com borda
  const drawBox = (x: number, y: number, w: number, h: number) => {
    doc.setDrawColor(...COLORS.border)
    doc.setLineWidth(0.3)
    doc.roundedRect(x, y, w, h, 1, 1, "S")
  }

  // Helper para verificar e adicionar nova pagina
  const topContentOffset = 18
  const checkNewPage = (currentY: number, neededHeight: number): number => {
    if (currentY + neededHeight > pageHeight - 15) {
      doc.addPage()
      return margin + topContentOffset
    }
    return currentY
  }

  let y = margin

  // ==================== HEADER COM LOGO E INFO DA OS ====================
  // Logo MedicalSpin
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, "PNG", margin, y, 45, 14)
    } catch {
      doc.setFontSize(14)
      doc.setTextColor(...COLORS.primary)
      doc.setFont("helvetica", "bold")
      doc.text("MedicalSpin", margin, y + 9)
    }
  }

  // Box ORDEM DE SERVICO
  const headerBoxX = margin + 60
  const headerBoxW = 85
  doc.setFillColor(...COLORS.primary)
  doc.roundedRect(headerBoxX, y, headerBoxW, 15, 1.5, 1.5, "F")
  
  doc.setTextColor(...COLORS.white)
  doc.setFontSize(11)
  doc.setFont("helvetica", "bold")
  doc.text("ORDEM DE SERVICO", headerBoxX + headerBoxW / 2, y + 5.5, { align: "center" })
  
  doc.setFontSize(7)
  doc.setFont("helvetica", "normal")
  const osNome = os.nome || os.numero || "OS"
  doc.text(osNome.substring(0, 50), headerBoxX + headerBoxW / 2, y + 10, { align: "center" })
  
  const cnpjCliente = os.cliente?.cnpj || os.empresa?.cnpj || ""
  if (cnpjCliente) {
    doc.text(cnpjCliente, headerBoxX + headerBoxW / 2, y + 13.5, { align: "center" })
  }

  // Data box
  const dataX = pageWidth - margin - 28
  doc.setDrawColor(...COLORS.primary)
  doc.setLineWidth(0.5)
  doc.roundedRect(dataX, y, 28, 10, 1, 1, "S")
  doc.setTextColor(...COLORS.black)
  doc.setFontSize(8)
  doc.setFont("helvetica", "bold")
  const dataFormatada = os.finalizedAt 
    ? new Date(os.finalizedAt).toLocaleDateString("pt-BR")
    : new Date().toLocaleDateString("pt-BR")
  doc.text(dataFormatada, dataX + 14, y + 6.5, { align: "center" })

  y += 18

  // ==================== INFO MEDICALSPIN (topo) ====================
  doc.setFillColor(...COLORS.lightGray)
  doc.roundedRect(margin, y, contentWidth, 18, 1, 1, "F")
  
  let infoY = y + 4
  doc.setFontSize(7)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(...COLORS.primary)
  doc.text(MEDICALSPIN_INFO.nome, margin + 3, infoY)
  
  infoY += 4
  doc.setFont("helvetica", "normal")
  doc.setTextColor(...COLORS.black)
  doc.text(`Razao Social: ${MEDICALSPIN_INFO.razaoSocial}`, margin + 3, infoY)
  
  infoY += 3.5
  doc.text(`CNPJ: ${MEDICALSPIN_INFO.cnpj} | E-mail: ${MEDICALSPIN_INFO.email} | Site: ${MEDICALSPIN_INFO.site}`, margin + 3, infoY)
  
  infoY += 3.5
  doc.text(`Cidade: ${MEDICALSPIN_INFO.cidade} | UF: ${MEDICALSPIN_INFO.uf} | Tel: ${MEDICALSPIN_INFO.telefone}`, margin + 3, infoY)
  
  y += 22

  // ==================== 1. DADOS DA EMPRESA (Cliente) ====================
  y = drawSectionTitle("1. DADOS DA EMPRESA", y)
  
  const empresaBoxH = 35
  drawBox(margin, y, contentWidth, empresaBoxH)
  
  let fieldY = y + 5
  fieldY += drawField("Razao Social", os.cliente?.razaoSocial || os.empresa?.razaoSocial || os.empresa?.nomeFantasia || "N/A", margin + 3, fieldY, 19.5)
  fieldY += drawField("Nome Fantasia", os.cliente?.nomeFantasia || os.empresa?.nomeFantasia || "N/A", margin + 3, fieldY, 22)
  fieldY += drawField("CNPJ", os.cliente?.cnpj || os.empresa?.cnpj || "N/A", margin + 3, fieldY, 10)
  fieldY += drawField("Cidade", os.empresa?.cidade || "N/A", margin + 3, fieldY, 11.5)
  fieldY += drawField("UF", os.empresa?.uf || "N/A", margin + 3, fieldY, 5.5)
  fieldY += drawField("Responsavel", (os.empresa?.responsavel || "N/A").substring(0, 20), margin + 3, fieldY, 19.5)
  
  y += empresaBoxH + 3

  // ==================== 2. EQUIPAMENTO ====================
  y = checkNewPage(y, 30)
  y = drawSectionTitle("2. EQUIPAMENTO", y)
  
  const equipBoxH = 18
  drawBox(margin, y, contentWidth, equipBoxH)
  
  fieldY = y + 5
  // Linha 1: Tipo e Fabricante
  doc.setFontSize(7)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(...COLORS.gray)
  doc.text("Tipo:", margin + 3, fieldY)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(...COLORS.black)
  doc.text(os.equipamento?.tipo || "N/A", margin + 10, fieldY)
  
  doc.setFont("helvetica", "bold")
  doc.setTextColor(...COLORS.gray)
  doc.text("Fabricante:", margin + 80, fieldY)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(...COLORS.black)
  doc.text(os.equipamento?.fabricante || "N/A", margin + 94.5, fieldY)
  
  fieldY += 5
  // Linha 2: Modelo e N. Serie
  doc.setFont("helvetica", "bold")
  doc.setTextColor(...COLORS.gray)
  doc.text("Modelo:", margin + 3, fieldY)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(...COLORS.black)
  doc.text(os.equipamento?.modelo || "N/A", margin + 13.5, fieldY)
  
  doc.setFont("helvetica", "bold")
  doc.setTextColor(...COLORS.gray)
  doc.text("N. de Serie:", margin + 80, fieldY)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(...COLORS.black)
  doc.text(os.equipamento?.numeroSerie || "N/A", margin + 94.5, fieldY)
  
  y += equipBoxH + 3

  // ==================== 3. MOTIVO E EVENTOS ====================
  y = checkNewPage(y, 25)
  y = drawSectionTitle("3. MOTIVO E EVENTOS", y)
  
  const motivoBoxH = 16
  drawBox(margin, y, contentWidth, motivoBoxH)
  
  fieldY = y + 5
  const motivacao = os.motivo?.motivacaoServico || os.motivo?.motivoServico || "N/A"
  fieldY += drawField("Motivacao do Servico", motivacao.substring(0, 80), margin + 3, fieldY, 31)
  
  const eventos = os.motivo?.eventosRelevantes || "N/A"
  doc.setFontSize(7)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(...COLORS.gray)
  doc.text("Eventos Relevantes:", margin + 3, fieldY)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(...COLORS.black)
  doc.text(eventos.substring(0, 80), margin + 28, fieldY)
  
  y += motivoBoxH + 3

  // ==================== 4. TIPO DE INTERVENCAO ====================
  y = checkNewPage(y, 35)
  y = drawSectionTitle("4. TIPO DE INTERVENCAO", y)
  
  const descServicos = os.intervencao?.descricaoServicos || os.intervencao?.descricao || "N/A"
  const descLines = doc.splitTextToSize(descServicos, contentWidth - 10)
  const intervBoxH = 14 + Math.min(descLines.length, 4) * 3.5
  drawBox(margin, y, contentWidth, intervBoxH)
  
  fieldY = y + 5
  fieldY += drawField("Tipo de Intervencao", os.intervencao?.tipo || "N/A", margin + 3, fieldY, 29)
  
  doc.setFontSize(7)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(...COLORS.gray)
  doc.text("Descricao dos Servicos:", margin + 3, fieldY)
  fieldY += 4
  
  doc.setFont("helvetica", "normal")
  doc.setTextColor(...COLORS.black)
  doc.text(descLines.slice(0, 4), margin + 3, fieldY)
  
  y += intervBoxH + 3

  // ==================== 5. PECAS UTILIZADAS ====================
  y = checkNewPage(y, 40)
  y = drawSectionTitle("5. PECAS UTILIZADAS", y)
  
  const pecas = os.pecas || []
  if (pecas.length > 0) {
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [["Descricao", "Qtd", "Tipo", "Em Posse de", "Observacoes"]],
      body: pecas.map((p: any) => {
        // Tipo: removida ou inclusa
        const tipo = p.tipo === "removida" ? "Removida" : p.tipo === "inclusa" ? "Inclusa" : "N/A"
        // Em posse de: cliente ou medical-spin
        const posse = p.categoria === "cliente" ? "Cliente" : p.categoria === "medical-spin" ? "MedicalSpin" : "N/A"
        // Observacoes (com 's' no final)
        const obs = p.observacoes || "N/A"
        
        return [
          p.nome || p.descricao || "N/A",
          String(p.quantidade || 1),
          tipo,
          posse,
          obs
        ]
      }),
      styles: { fontSize: 7, cellPadding: 1.5 },
      headStyles: { fillColor: COLORS.primary, textColor: COLORS.white, fontStyle: "bold" },
      alternateRowStyles: { fillColor: COLORS.lightGray },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 12, halign: "center" },
        2: { cellWidth: 22 },
        3: { cellWidth: 28 },
        4: { cellWidth: "auto" }
      }
    })
    y = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 3 : y + 15
  } else {
    const pecasBoxH = 10
    drawBox(margin, y, contentWidth, pecasBoxH)
    doc.setFontSize(7)
    doc.setTextColor(...COLORS.gray)
    doc.text("N/A", margin + 3, y + 6)
    y += pecasBoxH + 3
  }

  // ==================== 6. MAO DE OBRA ====================
  y = checkNewPage(y, 35)
  y = drawSectionTitle("6. MAO DE OBRA", y)
  
  const maoObra = os.maoDeObra || []
  if (maoObra.length > 0) {
    // Calcular total de horas
    let totalHoras = 0
    maoObra.forEach((m: any) => totalHoras += Number(m.horas) || 0)
    
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [["Data", "Horas", "Descricao do Trabalho"]],
      body: [
        ...maoObra.map((m: any) => [
          m.data ? new Date(m.data).toLocaleDateString("pt-BR") : "N/A",
          String(m.horas || 0) + "h",
          m.descricao || m.trabalhoRealizado || "N/A"
        ]),
        [{ content: "TOTAL", styles: { fontStyle: "bold" } }, { content: `${totalHoras}h`, styles: { fontStyle: "bold" } }, ""]
      ],
      styles: { fontSize: 7, cellPadding: 1.5 },
      headStyles: { fillColor: COLORS.primary, textColor: COLORS.white, fontStyle: "bold" },
      alternateRowStyles: { fillColor: COLORS.lightGray },
      columnStyles: {
        0: { cellWidth: 28 },
        1: { cellWidth: 18, halign: "center" },
        2: { cellWidth: "auto" }
      }
    })
    y = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 3 : y + 15
  } else {
    const maoObraBoxH = 10
    drawBox(margin, y, contentWidth, maoObraBoxH)
    doc.setFontSize(7)
    doc.setTextColor(...COLORS.gray)
    doc.text("N/A", margin + 3, y + 6)
    y += maoObraBoxH + 3
  }

  // ==================== 7. PENDENCIAS ====================
  y = checkNewPage(y, 22)
  y = drawSectionTitle("7. PENDENCIAS", y)
  
  const pendBoxH = 14
  drawBox(margin, y, contentWidth, pendBoxH)
  
  fieldY = y + 5
  fieldY += drawField("Medical Spin", os.pendencias?.medicalSpin || os.pendencias?.empresa || "N/A", margin + 3, fieldY, 18)
  doc.setFontSize(7)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(...COLORS.gray)
  doc.text("Cliente:", margin + 3, fieldY)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(...COLORS.black)
  doc.text(os.pendencias?.cliente || "N/A", margin + 13, fieldY)
  
  y += pendBoxH + 3

  // ==================== 8. ESTADO DO EQUIPAMENTO ====================
  y = checkNewPage(y, 22)
  y = drawSectionTitle("8. ESTADO DO EQUIPAMENTO", y)
  
  const estadoBoxH = 14
  drawBox(margin, y, contentWidth, estadoBoxH)
  
  fieldY = y + 5
  fieldY += drawField("Antes da Intervencao", os.estadoEquipamento?.estadoInicial || os.estado?.estadoInicial || "N/A", margin + 3, fieldY, 30.5)
  doc.setFontSize(7)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(...COLORS.gray)
  doc.text("Apos a Intervencao:", margin + 3, fieldY)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(...COLORS.black)
  doc.text(os.estadoEquipamento?.estadoFinal || os.estado?.estadoFinal || "N/A", margin + 28, fieldY)
  
  y += estadoBoxH + 3

  // ==================== REGISTROS FOTOGRAFICOS (antes das assinaturas) ====================
  y = checkNewPage(y, 50)
  y = drawSectionTitle("REGISTROS FOTOGRAFICOS", y)
  
  if (imagensCarregadas.length > 0) {
    const fotosPerRow = 3
    const fotoWidth = (contentWidth - 8) / fotosPerRow
    const fotoHeight = 35
    
    let fotoX = margin + 2
    let fotoY = y + 2
    
    for (let i = 0; i < imagensCarregadas.length; i++) {
      // Verifica se precisa de nova pagina
      if (fotoY + fotoHeight > pageHeight - 20) {
        doc.addPage()
        fotoY = margin
        fotoX = margin + 2
      }
      
      if (i > 0 && i % fotosPerRow === 0) {
        fotoX = margin + 2
        fotoY += fotoHeight + 3
      }
      
      try {
        const imgData = imagensCarregadas[i]
        const format = imgData.includes("image/png") ? "PNG" : "JPEG"
        
        // Desenha borda
        doc.setDrawColor(...COLORS.border)
        doc.setLineWidth(0.3)
        doc.rect(fotoX, fotoY, fotoWidth - 2, fotoHeight, "S")
        
        doc.addImage(imgData, format, fotoX + 1, fotoY + 1, fotoWidth - 4, fotoHeight - 2)
      } catch {
        doc.setFillColor(...COLORS.lightGray)
        doc.rect(fotoX, fotoY, fotoWidth - 2, fotoHeight, "F")
        doc.setFontSize(6)
        doc.setTextColor(...COLORS.gray)
        doc.text("Imagem indisponivel", fotoX + (fotoWidth - 2) / 2, fotoY + fotoHeight / 2, { align: "center" })
      }
      
      fotoX += fotoWidth + 2
    }
    
    const lastRowIndex = Math.floor((imagensCarregadas.length - 1) / fotosPerRow)
    y = fotoY + fotoHeight + 5
  } else {
    const fotoBoxH = 10
    drawBox(margin, y, contentWidth, fotoBoxH)
    doc.setFontSize(7)
    doc.setTextColor(...COLORS.gray)
    doc.text("N/A", margin + 3, y + 6)
    y += fotoBoxH + 3
  }

  // ==================== 9. LOCAL E ASSINATURAS ====================
  y = checkNewPage(y, 45)
  y = drawSectionTitle("9. LOCAL E ASSINATURAS", y)
  
  const assBoxH = 40
  drawBox(margin, y, contentWidth, assBoxH)
  
  // Local
  const cidade = os.empresa?.cidade || os.finalizacao?.cidade || "N/A"
  const uf = os.empresa?.uf || os.finalizacao?.uf || ""
  doc.setFontSize(8)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(...COLORS.black)
  doc.text(`Em ${cidade}${uf ? ", " + uf : ""}.`, margin + 4, y + 7)
  
  // Linhas de assinatura
  const assinaturaWidth = (contentWidth - 24) / 2
  const assY = y + 14
  
  // Assinatura Engenheiro
  doc.setDrawColor(...COLORS.black)
  doc.setLineWidth(0.4)
  doc.line(margin + 8, assY + 12, margin + 8 + assinaturaWidth, assY + 12)
  
  doc.setFontSize(8)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(...COLORS.primary)
  const nomeEng = os.finalizacao?.nomeEngenheiro || "N/A"
  doc.text(nomeEng, margin + 8 + assinaturaWidth / 2, assY + 17, { align: "center" })
  
  doc.setFontSize(6)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(...COLORS.gray)
  const cftEng = os.finalizacao?.cftEngenheiro || ""
  if (cftEng) {
    doc.text(`CFT: ${cftEng}`, margin + 8 + assinaturaWidth / 2, assY + 20, { align: "center" })
  }
  doc.text("Engenheiro Responsavel", margin + 8 + assinaturaWidth / 2, assY + 23, { align: "center" })
  
  // Assinatura Cliente
  const assClienteX = margin + assinaturaWidth + 16
  doc.setDrawColor(...COLORS.black)
  doc.line(assClienteX, assY + 12, assClienteX + assinaturaWidth, assY + 12)
  
  doc.setFontSize(8)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(...COLORS.primary)
  const nomeCliente = os.finalizacao?.nomeResponsavel || os.empresa?.responsavel || "N/A"
  doc.text(nomeCliente, assClienteX + assinaturaWidth / 2, assY + 17, { align: "center" })
  
  doc.setFontSize(6)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(...COLORS.gray)
  doc.text("Responsavel pelo Recebimento do Servico", assClienteX + assinaturaWidth / 2, assY + 20, { align: "center" })

  // ==================== FOOTER ====================
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)

    if (logoBase64) {
      try {
        doc.addImage(logoBase64, "PNG", margin, margin, 45, 14)
      } catch {
        // ignore image errors
      }
    } else {
      doc.setFontSize(10)
      doc.setTextColor(...COLORS.primary)
      doc.setFont("helvetica", "bold")
      doc.text("MedicalSpin", margin, margin + 8)
    }

    doc.setFontSize(6)
    doc.setTextColor(...COLORS.gray)
    doc.text(
      `${MEDICALSPIN_INFO.nome}  |  ${MEDICALSPIN_INFO.telefone}  |  ${MEDICALSPIN_INFO.email}`,
      pageWidth / 2,
      pageHeight - 5,
      { align: "center" }
    )
    doc.text(
      `Pagina ${i} de ${totalPages}`,
      pageWidth - margin,
      pageHeight - 5,
      { align: "right" }
    )
  }

  return doc.output("blob")
}

export async function gerarPdfUrl(os: OrdemServico): Promise<string> {
  const blob = await gerarPdfOS(os)
  return URL.createObjectURL(blob)
}

export async function baixarPdfOS(os: OrdemServico): Promise<void> {
  const blob = await gerarPdfOS(os)
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `OS-${os.numero || os.id}.pdf`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
