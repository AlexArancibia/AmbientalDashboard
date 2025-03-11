import jsPDF from "jspdf"
import autoTable, { type FontStyle } from "jspdf-autotable"
import type { Quotation, QuotationItem } from "@/types"

// Define interface for jsPDF with previousAutoTable
interface JsPDFWithAutoTable extends jsPDF {
  previousAutoTable?: {
    finalY: number
  }
}

// Define colors - Using dark blue (tuplas exactas de 3 elementos)
const DARK_BLUE_COLOR: [number, number, number] = [0, 51, 102] // RGB for dark blue
const WHITE_COLOR: [number, number, number] = [255, 255, 255]
const BLACK_COLOR: [number, number, number] = [0, 0, 0]

// Default notes text
export const DEFAULT_NOTES = `Una vez aceptada la cotización envienos su confirmación por vía mail,
para iniciar con las coordinaciones del presente servicio. E-mail:
ventas@ambientalpe.com N.CUENTA. BBVA SOLES:
0011039694020045050 CCI:01139600020045050694 (B.NACIÓN) CTA.
DE DETRACCIÓN : 00591113992 Nº DE CCI: 018591000591113992`

export function generateQuotationPDF(quotation: Quotation) {
  // Validar que la cotización tenga todos los datos necesarios
  if (!quotation || !quotation.client) {
    console.error("Cotización inválida o incompleta", quotation)
    throw new Error("Cotización inválida o incompleta")
  }

  const doc = new jsPDF() as JsPDFWithAutoTable
  const pageWidth = doc.internal.pageSize.width

  try {
    // ===== LOGO =====
    // Para entornos de servidor, usar la ruta del sistema de archivos
    // En entornos de navegador, usar una URL base64 o una URL pública
    const logoUrl =
      process.env.NODE_ENV === "production"
        ? "/logo.png" // En producción, usar la URL relativa
        : "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo1_Mesa%20de%20trabajo%201-0ISshlwxkIt1PkYdW8uhLYlrEyn5P6.png" // URL de respaldo

    // Agregar logo
    doc.addImage(logoUrl, "PNG", 15, 15, 60, 25)

    // ===== HEADER =====
    // Título centrado
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.text(`COTIZACIÓN Nº ${quotation.number || "SN"}`, pageWidth / 2, 20, { align: "center" })

    // Información de la empresa alineada a la derecha
    doc.setFontSize(9)
    doc.setFont("helvetica", "normal")
    doc.text("SOCIEDAD GENERAL AMBIENTAL E INGENIEROS SAC-20608328786", pageWidth - 15, 30, { align: "right" })
    doc.text("Jr. San Martin 1582 - PN", pageWidth - 15, 35, { align: "right" })
    doc.text("ventas@ambientalpe.com", pageWidth - 15, 40, { align: "right" })
    doc.text("Tf:019004785 Cel. 921899874", pageWidth - 15, 45, { align: "right" })

    // ===== CLIENT INFORMATION =====
    autoTable(doc, {
      startY: 55,
      head: [["CLIENTE", "RUC", "", ""]],
      body: [
        [quotation.client.name, quotation.client.ruc, "RUC", quotation.client.ruc],
        ["Dirección", quotation.client.address || "-", "Email", quotation.client.email || "-"],
        [
          "Atención",
          quotation.client.contactPerson || "-",
          "F. inicio",
          quotation.equipmentReleaseDate
            ? new Date(quotation.equipmentReleaseDate).toLocaleDateString()
            : new Date().toLocaleDateString(),
        ],
      ],
      theme: "grid",
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: DARK_BLUE_COLOR,
        textColor: WHITE_COLOR,
        fontStyle: "bold" as FontStyle,
      },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 80 },
        2: { cellWidth: 30 },
        3: { cellWidth: 50 },
      },
    })

    // ===== PAYMENT INFORMATION =====
    autoTable(doc, {
      startY: doc.previousAutoTable?.finalY ? doc.previousAutoTable.finalY + 5 : 85,
      head: [["FORMA DE PAGO", "LUGAR DE MONITOREO", "Moneda utilizada"]],
      body: [
        [
          "CONTADO",
          quotation.monitoringLocation || "-", // Ahora obtenemos monitoringLocation de quotation
          quotation.currency === "PEN" ? "S/ soles" : "USD dólares",
        ],
      ],
      theme: "grid",
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: DARK_BLUE_COLOR,
        textColor: WHITE_COLOR,
        fontStyle: "bold" as FontStyle,
      },
    })

    // ===== ITEMS TABLE =====
    const items = quotation.items || []
    autoTable(doc, {
      startY: doc.previousAutoTable?.finalY ? doc.previousAutoTable.finalY + 5 : 100,
      head: [["CANT", "DIAS", "SERVICIO", "DESCRIPCIÓN", "P.UNI", "IMPORTE"]],
      body: items.map((item: QuotationItem) => [
        item.quantity,
        item.days,
        item.name,
        item.description || `${item.quantity} ${item.name} POR ${item.days} DIA`,
        item.unitPrice.toFixed(2),
        (item.quantity * item.days * item.unitPrice).toFixed(2),
      ]),
      theme: "grid",
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: DARK_BLUE_COLOR,
        textColor: WHITE_COLOR,
        fontStyle: "bold" as FontStyle,
      },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 20 },
        2: { cellWidth: 40 },
        3: { cellWidth: 60 },
        4: { cellWidth: 25 },
        5: { cellWidth: 25 },
      },
    })

    // ===== TOTALS =====
    const finalY = doc.previousAutoTable?.finalY ? doc.previousAutoTable.finalY + 5 : 130

    doc.setFontSize(9)
    doc.setFont("helvetica", "normal")
    doc.text("Sub total", 150, finalY + 5)
    doc.text(`S/ ${(quotation.subtotal || 0).toFixed(2)}`, 200, finalY + 5, { align: "right" })

    doc.text("IGV 18%", 150, finalY + 10)
    doc.text(`S/ ${(quotation.igv || 0).toFixed(2)}`, 200, finalY + 10, { align: "right" })

    doc.setFont("helvetica", "bold")
    doc.text("Total con IGV", 150, finalY + 15)
    doc.text(`S/ ${(quotation.total || 0).toFixed(2)}`, 200, finalY + 15, { align: "right" })

    // Agregar línea de crédito si existe
    // if (quotation.creditLine) {
    //   doc.setFont("helvetica", "normal")
    //   doc.text("Línea de crédito", 150, finalY + 20)
    //   doc.text(`S/ ${quotation.creditLine.toFixed(2)}`, 200, finalY + 20, { align: "right" })
    // }

    // ===== VALIDITY =====
    doc.setFont("helvetica", "normal")
    doc.text("V. DE COTIZACION  ", 150, finalY + 25)
    doc.setFont("helvetica", "bold")
    doc.text(`${quotation.validityDays || 30} DÍAS`, 200, finalY + 25, { align: "right" })

    // ===== NOTES =====
    doc.setFontSize(8)
    doc.setFont("helvetica", "normal")
    const notesText = quotation.notes || DEFAULT_NOTES
    const notesLines = doc.splitTextToSize(notesText, 180)
    doc.text(notesLines, 15, finalY + 40)

    // ===== TRACKING INFORMATION =====
    let expiryDate = new Date()
    if (quotation.equipmentReleaseDate) {
      expiryDate = new Date(quotation.equipmentReleaseDate)
    }
    doc.text(`SALIO : ${expiryDate.toLocaleDateString()}`, 15, finalY + 70)

    // ===== FINAL SECTION =====
    doc.setFontSize(10)
    doc.setFont("helvetica", "bold")

    // SE CONSIDERA
    doc.text("SE CONSIDERA", 15, finalY + 80)
    doc.text(`${quotation.considerDays || 1} DIA${(quotation.considerDays || 1) > 1 ? "S" : ""}`, 15, finalY + 85)

    // DEBE VOLVER
    if (quotation.returnDate) {
      doc.text("DEBE VOLVER", 80, finalY + 80)
      doc.text(`${new Date(quotation.returnDate).toLocaleDateString()}`, 80, finalY + 85)
    }

    // VOLVIO
    doc.text("VOLVIO", 140, finalY + 80)
    doc.setFont("helvetica", "normal")
    // Línea para llenado manual
    doc.line(140, finalY + 85, 190, finalY + 85)

    return doc
  } catch (error) {
    console.error("Error generando PDF:", error)
    throw new Error("Error generando PDF: " + (error as Error).message)
  }
}

