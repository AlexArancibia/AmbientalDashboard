import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import type { ServiceOrder } from "@/types"
import { format } from "date-fns"

// Define colors as RGB arrays
const DARK_BLUE_COLOR: [number, number, number] = [0, 40, 102] // RGB for dark navy blue
const WHITE_COLOR: [number, number, number] = [255, 255, 255]
const BLACK_COLOR: [number, number, number] = [0, 0, 0]

export function generateServiceOrderPDF(serviceOrder: ServiceOrder) {
  const doc = new jsPDF()

  // Configuration
  const margin = 15
  const pageWidth = doc.internal.pageSize.width

  // Add logo
  const logoUrl = "/logo.png"
  try {
    doc.addImage(logoUrl, "PNG", margin, margin, 60, 30)
  } catch (error) {
    console.error("Error loading logo:", error)
    // Continue without logo if there's an error
  }

  // Add service order header
  doc.setFontSize(16)
  doc.setTextColor(...BLACK_COLOR)
  doc.setFont("helvetica", "bold")

  // Company header - right aligned
  doc.text(`ORDEN DE SERVICIO Nº ${serviceOrder.number}`, pageWidth - margin, 20, { align: "right" })
  doc.setFontSize(9)
  doc.setFont("helvetica", "normal")
  doc.text("SOCIEDAD GENERAL AMBIENTAL E INGENIEROS SAC-20608328786", pageWidth - margin, 28, { align: "right" })
  doc.text("Jr. San Martin 1582 - PN", pageWidth - margin, 34, { align: "right" })
  doc.text("ventas@ambientalpe.com", pageWidth - margin, 40, { align: "right" })
  doc.text("Tf:019004785 Cel. 921899874", pageWidth - margin, 46, { align: "right" })

  // Client Information
  autoTable(doc, {
    startY: 55,
    head: [["DETALLES", "", "", ""]],
    body: [
      ["Número", serviceOrder.number, "Fecha", format(new Date(serviceOrder.date), "dd/MM/yyyy")],
      ["Cliente", serviceOrder.client.name, "RUC", serviceOrder.client.ruc],
      ["Dirección", serviceOrder.client.address, "Email", serviceOrder.client.email],
      ["Atención", serviceOrder.attendantName || "-", "Moneda", serviceOrder.currency],
      ["Gestor", serviceOrder.gestor.name || "-", "Términos de Pago", serviceOrder.paymentTerms || "-"],
 
    ],
    theme: "grid",
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: DARK_BLUE_COLOR,
      textColor: WHITE_COLOR,
      fontStyle: "bold",
    },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 80 },
      2: { cellWidth: 30 },
      3: { cellWidth: 50 },
    },
  })

  // Add description if available
  if (serviceOrder.description) {
    const descriptionY = (doc as any).lastAutoTable.finalY + 5
    doc.setFontSize(10)
    doc.setFont("helvetica", "bold")
    doc.text("Descripción:", margin, descriptionY)
    doc.setFont("helvetica", "normal")
    doc.text(serviceOrder.description, margin, descriptionY + 6, { maxWidth: 180 })
  }

  // Service information
  const serviceStartY = serviceOrder.description
    ? (doc as any).lastAutoTable.finalY + 15
    : (doc as any).lastAutoTable.finalY + 5
  autoTable(doc, {
    startY: serviceStartY,
    head: [["CÓDIGO", "DESCRIPCIÓN", "NOMBRE", "CANTIDAD", "DÍAS", "PRECIO UNIT.", "TOTAL"]],
    body: serviceOrder.items.map((item) => [
      item.code,
      item.description,
      item.name,
      item.quantity,
      item.days || 1,
      formatCurrency(item.unitPrice, serviceOrder.currency),
      formatCurrency(item.total || item.quantity * item.unitPrice * (item.days || 1), serviceOrder.currency),
    ]),
    theme: "grid",
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: DARK_BLUE_COLOR,
      textColor: WHITE_COLOR,
      fontStyle: "bold",
    },
  })

  // Add totals
  const finalY = (doc as any).lastAutoTable.finalY + 5
  doc.setFontSize(9)
  doc.setFont("helvetica", "normal")
  doc.text("Subtotal:", 140, finalY + 5)
  doc.text(formatCurrency(serviceOrder.subtotal, serviceOrder.currency), 190, finalY + 5, { align: "right" })
  doc.text("IGV (18%):", 140, finalY + 10)
  doc.text(formatCurrency(serviceOrder.igv, serviceOrder.currency), 190, finalY + 10, { align: "right" })
  doc.setFont("helvetica", "bold")
  doc.text("Total:", 140, finalY + 15)
  doc.text(formatCurrency(serviceOrder.total, serviceOrder.currency), 190, finalY + 15, { align: "right" })

  // Add comments if available
  if (serviceOrder.comments) {
    doc.setFontSize(8)
    doc.setFont("helvetica", "normal")
    doc.text("Comentarios:", margin, finalY + 25)
    doc.text(serviceOrder.comments, margin, finalY + 30, { maxWidth: 180 })
  }

  // Add footer
  const pageCount = (doc.internal as any).getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    doc.text(
      `Página ${i} de ${pageCount} - Generado el ${format(new Date(), "dd/MM/yyyy HH:mm")}`,
      pageWidth / 2,
      doc.internal.pageSize.height - 10,
      { align: "center" },
    )
  }

  return doc
}

// Helper function to format currency
function formatCurrency(amount: number, currency: string): string {
  const symbol = currency === "PEN" ? "S/. " : "$ "
  return symbol + amount.toFixed(2)
}

