import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import type { Quotation, QuotationItem } from "@/types"

// Define colors
const BLUE_COLOR = [135, 206, 250]
const WHITE_COLOR = [255, 255, 255]
const BLACK_COLOR = [0, 0, 0]

// Define table styles
const tableStyles = {
  headStyles: { fillColor: BLUE_COLOR, textColor: BLACK_COLOR, fontStyle: "bold" },
  bodyStyles: { textColor: BLACK_COLOR },
  alternateRowStyles: { fillColor: [245, 250, 254] },
}

export function generateQuotationPDF(quotation: Quotation) {
  const doc = new jsPDF()

  // Add logo
  // Note: Replace with actual logo URL
  const logoUrl = "https://your-logo-url.com/logo.png"
  doc.addImage(logoUrl, "PNG", 15, 15, 60, 25)

  // Add quotation header
  doc.setFontSize(16)
  doc.setTextColor(...BLACK_COLOR)
  doc.setFont("helvetica", "bold")

  // Company header - right aligned
  doc.text(`COTIZACION Nº ${quotation.number}`, 195, 20, { align: "right" })
  doc.setFontSize(9)
  doc.setFont("helvetica", "normal")
  doc.text("SOCIEDAD GENERAL AMBIENTAL E INGENIEROS SAC-20608328786", 195, 28, { align: "right" })
  doc.text("Jr. San Martin 1582 - PN", 195, 34, { align: "right" })
  doc.text("ventas@ambientalpe.com", 195, 40, { align: "right" })
  doc.text("Tf:019004785 Cel. 921899874", 195, 46, { align: "right" })

  // Client information table
  autoTable(doc, {
    startY: 55,
    head: [["CLIENTE", "RUC", "", ""]],
    body: [
      [quotation.client.name, quotation.client.ruc, "Línea de crédito", quotation.client.creditLine?.toString() || "-"],
      ["Dirección", quotation.client.address, "Email", quotation.client.email],
      [
        "Atención",
        quotation.client.contactPerson || "-",
        "F. inicio",
        new Date(quotation.equipmentReleaseDate).toLocaleDateString(),
      ],
    ],
    theme: "grid",
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: BLUE_COLOR,
      textColor: BLACK_COLOR,
      fontStyle: "bold",
    },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 80 },
      2: { cellWidth: 30 },
      3: { cellWidth: 50 },
    },
  })

  // Payment information
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 5,
    head: [["FORMA DE PAGO", "LUGAR DE MONITOREO", "Moneda utilizada"]],
    body: [
      [
        "CONTADO",
        quotation.client.monitoringLocation || "-",
        quotation.currency === "PEN" ? "S/ soles" : "USD dólares",
      ],
    ],
    theme: "grid",
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: BLUE_COLOR,
      textColor: BLACK_COLOR,
      fontStyle: "bold",
    },
  })

  // Items table
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 5,
    head: [["CANT", "DIAS", "EQUIPO", "MODELO", "P.UNI S/", "IMPORTE S/"]],
    body: quotation.items.map((item: QuotationItem) => [
      item.quantity,
      item.days,
      item.equipment.name,
      `${item.quantity} ${item.equipment.name} POR ${item.days} DIA`,
      item.unitPrice.toFixed(2),
      (item.quantity * item.days * item.unitPrice).toFixed(2),
    ]),
    theme: "grid",
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    ...tableStyles,
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 20 },
      2: { cellWidth: 40 },
      3: { cellWidth: 60 },
      4: { cellWidth: 25 },
      5: { cellWidth: 25 },
    },
  })

  // Add totals
  const finalY = doc.lastAutoTable.finalY + 5
  doc.setFontSize(9)
  doc.setFont("helvetica", "normal")
  doc.text("Sub total", 150, finalY + 5)
  doc.text(`S/ ${quotation.subtotal.toFixed(2)}`, 190, finalY + 5, { align: "right" })
  doc.text("IGV 18%", 150, finalY + 10)
  doc.text(`S/ ${quotation.igv.toFixed(2)}`, 190, finalY + 10, { align: "right" })
  doc.setFont("helvetica", "bold")
  doc.text("Total con IGV", 150, finalY + 15)
  doc.text(`S/ ${quotation.total.toFixed(2)}`, 190, finalY + 15, { align: "right" })

  // Add validity
  doc.setFont("helvetica", "normal")
  doc.text("V. DE COTIZACION", 150, finalY + 25)
  doc.setFont("helvetica", "bold")
  doc.text(`${quotation.validityDays} DÍAS`, 190, finalY + 25, { align: "right" })

  // Add footer text
  doc.setFontSize(8)
  doc.setFont("helvetica", "normal")
  const footerText = [
    "Una vez aceptada la cotización envienos su confirmación por vía mail,",
    "para iniciar con las coordinaciones del presente servicio. E-mail:",
    "ventas@ambientalpe.com N.CUENTA. BBVA SOLES:",
    "0011039694020045050 CCI:01139600020045050694 (B.NACIÓN) CTA.",
    "DE DETRACCIÓN : 00591113992 Nº DE CCI: 018591000591113992",
  ]

  footerText.forEach((line, index) => {
    doc.text(line, 15, finalY + 40 + index * 5)
  })

  // Add expiry date
  const expiryDate = new Date(quotation.equipmentReleaseDate)
  expiryDate.setDate(expiryDate.getDate() + quotation.validityDays)
  doc.text(`SALIO : ${expiryDate.toLocaleDateString()}`, 15, finalY + 70)

  // Add "SE CONSIDERA" text
  doc.setFontSize(10)
  doc.setFont("helvetica", "bold")
  doc.text("SE CONSIDERA", 15, finalY + 80)
  doc.text(`${quotation.considerDays || 1} DIA${quotation.considerDays > 1 ? "S" : ""}`, 15, finalY + 85)

  // Add "DEBE VOLVER" text
  if (quotation.returnDate) {
    doc.text("DEBE VOLVER", 80, finalY + 80)
    doc.text(`${new Date(quotation.returnDate).toLocaleDateString()}`, 80, finalY + 85)
  }

  // Add "VOLVIO" field with blank space for manual filling
  doc.text("VOLVIO", 140, finalY + 80)
  doc.setFont("helvetica", "normal")
  // Draw a line for manual filling
  doc.line(140, finalY + 85, 190, finalY + 85)

  return doc
}

