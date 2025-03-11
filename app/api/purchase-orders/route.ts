import { type NextRequest, NextResponse } from "next/server"
import  prisma from "@/lib/prisma"

export async function GET() {
  try {
    const purchaseOrders = await prisma.purchaseOrder.findMany({
      where: { deletedAt: null },
      include: {
        client: true,
        gestor: true,
        items: true,
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(purchaseOrders)
  } catch (error) {
    console.error("Error fetching purchase orders:", error)
    return NextResponse.json({ error: "Failed to fetch purchase orders" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    // Validar datos requeridos
    if (
      !data.number ||
      !data.clientId ||
      !data.date ||
      !data.currency ||
      !data.gestorId ||
      !data.items ||
      !data.status
    ) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Crear la orden de compra con sus items en una transacción
    const purchaseOrder = await prisma.$transaction(async (tx) => {
      // Crear la orden de compra
      const newPurchaseOrder = await tx.purchaseOrder.create({
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
        },
      })

      // Crear los items de la orden de compra
      if (data.items && data.items.length > 0) {
        await Promise.all(
          data.items.map((item: any) =>
            tx.purchaseOrderItem.create({
              data: {
                purchaseOrderId: newPurchaseOrder.id,
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

      // Retornar la orden de compra con sus items
      return await tx.purchaseOrder.findUnique({
        where: { id: newPurchaseOrder.id },
        include: {
          client: true,
          gestor: true,
          items: true,
        },
      })
    })

    return NextResponse.json(purchaseOrder, { status: 201 })
  } catch (error) {
    console.error("Error creating purchase order:", error)
    return NextResponse.json({ error: "Failed to create purchase order" }, { status: 500 })
  }
}

