import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

interface Params {
  params: {
    id: string
  }
}

export async function GET(request: Request, { params }: Params) {
  try {
    const quotation = await prisma.quotation.findUnique({
      where: {
        id: params.id,
      },
      include: {
        client: true,
        items: true,
      },
    })

    if (!quotation) {
      return NextResponse.json({ error: "Cotización no encontrada" }, { status: 404 })
    }

    return NextResponse.json(quotation)
  } catch (error) {
    console.error("Error al obtener cotización:", error instanceof Error ? error.message : "Error desconocido")
    return NextResponse.json({ error: "Error al obtener cotización" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const body = await request.json()
    const { id } = params

    // Verificar si la cotización existe
    const existingQuotation = await prisma.quotation.findUnique({
      where: { id },
      include: { items: true },
    })

    if (!existingQuotation) {
      return NextResponse.json({ error: "Cotización no encontrada" }, { status: 404 })
    }

    // Iniciar una transacción para actualizar la cotización y sus ítems
    const updatedQuotation = await prisma.$transaction(async (tx) => {
      // Actualizar datos básicos de la cotización
      const quotation = await tx.quotation.update({
        where: { id },
        data: {
          number: body.number,
          date: body.date ? new Date(body.date) : undefined,
          clientId: body.clientId,
          currency: body.currency,
          equipmentReleaseDate: body.equipmentReleaseDate ? new Date(body.equipmentReleaseDate) : undefined,
          validityDays: body.validityDays,
          subtotal: body.subtotal,
          igv: body.igv,
          total: body.total,
          status: body.status,
          notes: body.notes,
          considerDays: body.considerDays,
          returnDate: body.returnDate ? new Date(body.returnDate) : null,
          monitoringLocation: body.monitoringLocation, // Ahora desde quotation
          creditLine: body.creditLine, // Nuevo campo
        },
      })

      // Si se proporcionan ítems, actualizarlos
      if (body.items && Array.isArray(body.items)) {
        // Eliminar ítems existentes
        await tx.quotationItem.deleteMany({
          where: { quotationId: id },
        })

        // Crear nuevos ítems
        await tx.quotationItem.createMany({
          data: body.items.map((item: any) => ({
            quotationId: id,
            description: item.description,
            code: item.code,
            quantity: item.quantity,
            days: item.days,
            unitPrice: item.unitPrice,
            name: item.name,
          })),
        })
      }

      // Devolver la cotización actualizada con ítems
      return tx.quotation.findUnique({
        where: { id },
        include: {
          client: true,
          items: true,
        },
      })
    })

    return NextResponse.json(updatedQuotation)
  } catch (error) {
    console.error("Error al actualizar cotización:", error instanceof Error ? error.message : "Error desconocido")
    return NextResponse.json({ error: "Error al actualizar cotización" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    const { id } = params

    // Check if quotation exists
    const existingQuotation = await prisma.quotation.findUnique({
      where: { id },
    })

    if (!existingQuotation) {
      return NextResponse.json({ error: "Cotización no encontrada" }, { status: 404 })
    }

    // Soft delete by updating deletedAt field
    await prisma.quotation.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error al eliminar cotización:", error instanceof Error ? error.message : "Error desconocido")
    return NextResponse.json({ error: "Error al eliminar cotización" }, { status: 500 })
  }
}

