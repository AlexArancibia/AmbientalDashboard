import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import type { ServiceOrder } from "@/types"

// Define colors - Using dark blue to match the logo
const DARK_BLUE_COLOR = [0, 20, 53] // RGB for dark navy blue
const WHITE_COLOR = [255, 255, 255]
const BLACK_COLOR = [0, 0, 0]

// Define table styles
const tableStyles = {
  headStyles: { fillColor: DARK_BLUE_COLOR, textColor: WHITE_COLOR, fontStyle: "bold" },
  bodyStyles: { textColor: BLACK_COLOR },
  alternateRowStyles: { fillColor: [245, 250, 254] },
}

export function generateServiceOrderPDF(serviceOrder: ServiceOrder) {
  const doc = new jsPDF()

  // Add logo
  const logoUrl =
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo2_Mesa%20de%20trabajo%201-Y3RMoVqUhv2ero4F7JkGrWrVSbBqAb.png"
  doc.addImage(logoUrl, "PNG", 15, 15, 60, 30)

  // Add service order header
  doc.setFontSize(16)
  doc.setTextColor(...BLACK_COLOR)
  doc.setFont("helvetica", "bold")

  // Company header - right aligned
  doc.text(`ORDEN DE SERVICIO Nº ${serviceOrder.number}`, 195, 20, { align: "right" })
  doc.setFontSize(9)
  doc.setFont("helvetica", "normal")
  doc.text("SOCIEDAD GENERAL AMBIENTAL E INGENIEROS SAC-20608328786", 195, 28, { align: "right" })
  doc.text("Jr. San Martin 1582 - PN", 195, 34, { align: "right" })
  doc.text("ventas@ambientalpe.com", 195, 40, { align: "right" })
  doc.text("Tf:019004785 Cel. 921899874", 195, 46, { align: "right" })

  // Client Information
  autoTable(doc, {
    startY: 55,
    head: [["DETALLES DE LA ORDEN DE SERVICIO", "", "", ""]],
    body: [
      ["Número", serviceOrder.number, "Fecha", serviceOrder.date.toLocaleDateString()],
      ["Cliente", serviceOrder.client.name, "RUC", serviceOrder.client.ruc],
      ["Dirección", serviceOrder.client.address, "Email", serviceOrder.client.email],
      ["Atención", serviceOrder.client.contactPerson || "-", "Moneda", serviceOrder.currency],
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

  // Service information
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 5,
    head: [["CÓDIGO", "DESCRIPCIÓN", "CANTIDAD", "PRECIO UNIT.", "TOTAL"]],
    body: serviceOrder.items.map((item) => [
      item.code,
      item.description,
      item.quantity,
      item.unitPrice.toFixed(2),
      (item.quantity * item.unitPrice).toFixed(2),
    ]),
    theme: "grid",
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    ...tableStyles,
  })

  // Add totals
  const finalY = doc.lastAutoTable.finalY + 5
  doc.setFontSize(9)
  doc.setFont("helvetica", "normal")
  doc.text("Subtotal:", 140, finalY + 5)
  doc.text(`${serviceOrder.currency} ${serviceOrder.subtotal.toFixed(2)}`, 190, finalY + 5, { align: "right" })
  doc.text("IGV (18%):", 140, finalY + 10)
  doc.text(`${serviceOrder.currency} ${serviceOrder.igv.toFixed(2)}`, 190, finalY + 10, { align: "right" })
  doc.setFont("helvetica", "bold")
  doc.text("Total:", 140, finalY + 15)
  doc.text(`${serviceOrder.currency} ${serviceOrder.total.toFixed(2)}`, 190, finalY + 15, { align: "right" })

  // Add notes
  if (serviceOrder.notes) {
    doc.setFontSize(8)
    doc.setFont("helvetica", "normal")
    doc.text("Notas:", 15, finalY + 25)
    doc.text(serviceOrder.notes, 15, finalY + 30)
  }

  // Add footer
  doc.setFontSize(8)
  doc.text("Esta orden de servicio está sujeta a nuestros términos y condiciones.", 15, 280)

  return doc
}

