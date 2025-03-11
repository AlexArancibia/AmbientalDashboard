import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { Currency, type PurchaseOrder } from "@/types"
import { format } from "date-fns"

export function generatePurchaseOrderPDF(purchaseOrder: PurchaseOrder) {
  const doc = new jsPDF()

  // Configuración de márgenes y tamaños
  const margin = 15
  const pageWidth = doc.internal.pageSize.width

  // Añadir logo
  try {
    doc.addImage("/public/logo.png", "PNG", margin, margin, 60, 25)
  } catch (error) {
    console.error("Error al cargar el logo:", error)
    // Continuar sin logo si hay error
  }

  // Añadir encabezado de la orden de compra
  doc.setFontSize(16)
  doc.setTextColor(0, 0, 0)
  doc.setFont("helvetica", "bold")

  // Número de orden - alineado a la derecha
  doc.text(`ORDEN DE COMPRA Nº ${purchaseOrder.number}`, pageWidth - margin, 20, { align: "right" })

  // Información de la empresa - alineado a la derecha
  doc.setFontSize(9)
  doc.setFont("helvetica", "normal")
  doc.text("SOCIEDAD GENERAL AMBIENTAL E INGENIEROS SAC-20608328786", pageWidth - margin, 28, { align: "right" })
  doc.text("Jr. San Martin 1582 - PN", pageWidth - margin, 34, { align: "right" })
  doc.text("ventas@ambientalpe.com", pageWidth - margin, 40, { align: "right" })
  doc.text("Tf:019004785 Cel. 921899874", pageWidth - margin, 46, { align: "right" })

  // Información del cliente y detalles de la orden
  autoTable(doc, {
    startY: 55,
    head: [["DETALLES DE LA ORDEN DE COMPRA", "", "", ""]],
    body: [
      ["Número", purchaseOrder.number, "Fecha", format(new Date(purchaseOrder.date), "dd/MM/yyyy")],
      ["Cliente", purchaseOrder.client.name, "RUC", purchaseOrder.client.ruc],
      [
        "Moneda",
        purchaseOrder.currency === Currency.PEN ? "Soles (PEN)" : "Dólares (USD)",
        "Estado",
        purchaseOrder.status,
      ],
      ["Gestor", purchaseOrder.gestor.name, "Atendido por", purchaseOrder.attendantName || "-"],
      ["Términos de Pago", purchaseOrder.paymentTerms || "-", "Descripción", purchaseOrder.description || "-"],
    ],
    theme: "grid",
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [23, 74, 160],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 80 },
      2: { cellWidth: 30 },
      3: { cellWidth: 50 },
    },
  })

  // Tabla de items
  const itemsTableY = (doc as any).lastAutoTable.finalY + 10
  autoTable(doc, {
    startY: itemsTableY,
    head: [["CÓDIGO", "DESCRIPCIÓN", "NOMBRE", "CANTIDAD", "PRECIO UNIT.", "TOTAL"]],
    body: purchaseOrder.items.map((item) => [
      item.code,
      item.description,
      item.name,
      item.quantity,
      formatCurrency(item.unitPrice, purchaseOrder.currency),
      formatCurrency(item.quantity * item.unitPrice, purchaseOrder.currency),
    ]),
    theme: "grid",
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [23, 74, 160],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
  })

  // Totales
  const finalY = (doc as any).lastAutoTable.finalY + 10
  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.text("Subtotal:", 140, finalY)
  doc.text(formatCurrency(purchaseOrder.subtotal, purchaseOrder.currency), 190, finalY, {
    align: "right",
  })
  doc.text("IGV (18%):", 140, finalY + 6)
  doc.text(formatCurrency(purchaseOrder.igv, purchaseOrder.currency), 190, finalY + 6, {
    align: "right",
  })
  doc.setFont("helvetica", "bold")
  doc.text("Total:", 140, finalY + 12)
  doc.text(formatCurrency(purchaseOrder.total, purchaseOrder.currency), 190, finalY + 12, {
    align: "right",
  })

  // Comentarios
  if (purchaseOrder.comments) {
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)
    doc.text("Comentarios:", margin, finalY + 20)
    doc.text(purchaseOrder.comments, margin, finalY + 26)
  }

  // Añadir pie de página
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

// Función auxiliar para formatear moneda
function formatCurrency(amount: number, currency: Currency): string {
  const symbol = currency === Currency.PEN ? "S/. " : "$ "
  return symbol + amount.toFixed(2)
}

