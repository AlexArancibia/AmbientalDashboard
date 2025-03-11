import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: {
        id: params.id,
        deletedAt: null,
      },
      include: {
        client: true,
        gestor: true,
        items: true,
      },
    })

    if (!purchaseOrder) {
      return NextResponse.json({ error: "Purchase order not found" }, { status: 404 })
    }

    return NextResponse.json(purchaseOrder)
  } catch (error) {
    console.error(`Error fetching purchase order ${params.id}:`, error)
    return NextResponse.json({ error: "Failed to fetch purchase order" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data = await request.json()

    // Verificar si la orden de compra existe
    const existingOrder = await prisma.purchaseOrder.findUnique({
      where: { id: params.id },
      include: { items: true },
    })

    if (!existingOrder) {
      return NextResponse.json({ error: "Purchase order not found" }, { status: 404 })
    }

    // Actualizar la orden de compra con sus items en una transacción
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // Actualizar la orden de compra
      const updated = await tx.purchaseOrder.update({
        where: { id: params.id },
        data: {
          number: data.number,
          date: new Date(data.date),
          clientId: data.clientId,
          description: data.description,
          currency: data.currency,
          paymentTerms: data.paymentTerms,
          gestorId: data.gestorId,
          attendantName: data.attendantName,
          subtotal: data.subtotal || 0,
          igv: data.igv || 0,
          total: data.total || 0,
          comments: data.comments,
          status: data.status,
          updatedAt: new Date(),
        },
      })

      // Eliminar los items existentes
      await tx.purchaseOrderItem.deleteMany({
        where: { purchaseOrderId: params.id },
      })

      // Crear los nuevos items
      if (data.items && data.items.length > 0) {
        await Promise.all(
          data.items.map((item: any) =>
            tx.purchaseOrderItem.create({
              data: {
                purchaseOrderId: params.id,
                code: item.code || `ITEM-${Math.random().toString(36).substring(7)}`,
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                name: item.name || item.description,
              },
            }),
          ),
        )
      }

      // Retornar la orden de compra actualizada con sus items
      return await tx.purchaseOrder.findUnique({
        where: { id: params.id },
        include: {
          client: true,
          gestor: true,
          items: true,
        },
      })
    })

    return NextResponse.json(updatedOrder)
  } catch (error) {
    console.error(`Error updating purchase order ${params.id}:`, error)
    return NextResponse.json({ error: "Failed to update purchase order" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Verificar si la orden de compra existe
    const existingOrder = await prisma.purchaseOrder.findUnique({
      where: { id: params.id },
    })

    if (!existingOrder) {
      return NextResponse.json({ error: "Purchase order not found" }, { status: 404 })
    }

    // Soft delete (marcar como eliminado)
    await prisma.purchaseOrder.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    })

    return NextResponse.json({ success: true, message: "Purchase order deleted successfully" })
  } catch (error) {
    console.error(`Error deleting purchase order ${params.id}:`, error)
    return NextResponse.json({ error: "Failed to delete purchase order" }, { status: 500 })
  }
}

