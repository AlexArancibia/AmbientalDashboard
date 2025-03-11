import jsPDF from "jspdf"
import "jspdf-autotable"
import type { Quotation } from "@/types"

export function generateQuotationPDF(quotation: Quotation) {
  const doc = new jsPDF()

  // Add company logo
  // doc.addImage('path_to_logo.png', 'PNG', 10, 10, 50, 20)

  // Add company info
  doc.setFontSize(10)
  doc.text("Your Company Name", 10, 40)
  doc.text("123 Company Street, City, Country", 10, 45)
  doc.text("Phone: +1 234 567 890", 10, 50)

  // Add quotation details
  doc.setFontSize(16)
  doc.text(`Quotation #${quotation.number}`, 10, 70)

  doc.setFontSize(10)
  doc.text(`Date: ${new Date(quotation.date).toLocaleDateString()}`, 10, 80)
  doc.text(`Client: ${quotation.client.name}`, 10, 85)
  doc.text(`Address: ${quotation.client.address}`, 10, 90)

  // Add items table
  const tableColumn = ["Item", "Quantity", "Days", "Unit Price", "Total"]
  const tableRows = quotation.items.map((item) => [
    item.equipment.name,
    item.quantity,
    item.days,
    item.unitPrice.toFixed(2),
    (item.quantity * item.days * item.unitPrice).toFixed(2),
  ])

  doc.autoTable({
    startY: 100,
    head: [tableColumn],
    body: tableRows,
  })

  // Add totals
  const finalY = (doc as any).lastAutoTable.finalY + 10
  doc.text(`Subtotal: ${quotation.subtotal.toFixed(2)}`, 140, finalY)
  doc.text(`IGV (18%): ${quotation.igv.toFixed(2)}`, 140, finalY + 5)
  doc.text(`Total: ${quotation.total.toFixed(2)}`, 140, finalY + 10)

  // Save the PDF
  doc.save(`quotation_${quotation.number}.pdf`)
}

