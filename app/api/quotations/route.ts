import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { QuotationStatus, Currency } from "@/types"

export async function GET() {
  try {
    const quotations = await prisma.quotation.findMany({
      include: {
        client: true,
        items: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(quotations)
  } catch (error) {
    console.error("Error fetching quotations:", error instanceof Error ? error.message : "Unknown error")
    return NextResponse.json({ error: "Error fetching quotations" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validar campos requeridos
    if (!body.number || !body.clientId || !body.items || body.items.length === 0) {
      return NextResponse.json({ error: "Faltan campos requeridos: number, clientId, items" }, { status: 400 })
    }

    // Crear la cotización con sus ítems
    const quotation = await prisma.quotation.create({
      data: {
        number: body.number,
        date: body.date ? new Date(body.date) : new Date(),
        clientId: body.clientId,
        currency: body.currency || Currency.PEN,
        equipmentReleaseDate: body.equipmentReleaseDate ? new Date(body.equipmentReleaseDate) : new Date(),
        validityDays: body.validityDays || 15,
        subtotal: body.subtotal || 0,
        igv: body.igv || 0,
        total: body.total || 0,
        status: body.status || QuotationStatus.DRAFT,
        notes: body.notes,
        considerDays: body.considerDays || 1,
        returnDate: body.returnDate ? new Date(body.returnDate) : null,
        monitoringLocation: body.monitoringLocation, // Ahora desde quotation
        creditLine: body.creditLine, // Nuevo campo
        items: {
          create: body.items.map((item: any) => ({
            description: item.description,
            code: item.code,
            quantity: item.quantity,
            days: item.days,
            unitPrice: item.unitPrice,
            name: item.name,
          })),
        },
      },
      include: {
        client: true,
        items: true,
      },
    })

    return NextResponse.json(quotation)
  } catch (error) {
    console.error("Error al crear cotización:", error instanceof Error ? error.message : "Error desconocido")
    return NextResponse.json({ error: "Error al crear cotización" }, { status: 500 })
  }
}

