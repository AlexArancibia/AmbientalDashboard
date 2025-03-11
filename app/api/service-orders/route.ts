import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET() {
  try {
    const serviceOrders = await prisma.serviceOrder.findMany({
      where: { deletedAt: null },
      include: {
        client: true,
        gestor: {
          select: {
            id: true,
            name: true,
            email: true,
            position: true,
            department: true,
            role: true,
            createdAt: true,
            updatedAt: true,
            deletedAt: true,
          },
        },
        items: true,
      },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(serviceOrders)
  } catch (error) {
    console.error("Error fetching service orders:", error)
    return NextResponse.json({ error: "Failed to fetch service orders" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    // Validate client and gestor exist
    const client = await prisma.client.findUnique({
      where: { id: data.clientId },
    })

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    const gestor = await prisma.user.findUnique({
      where: { id: data.gestorId },
    })

    if (!gestor) {
      return NextResponse.json({ error: "Gestor not found" }, { status: 404 })
    }

    // Create service order with items
    const serviceOrder = await prisma.serviceOrder.create({
      data: {
        number: data.number,
        date: new Date(data.date),
        clientId: data.clientId,
        description: data.description,
        currency: data.currency,
        paymentTerms: data.paymentTerms,
        gestorId: data.gestorId,
        attendantName: data.attendantName,
        subtotal: data.subtotal,
        igv: data.igv,
        total: data.total,
        comments: data.comments,
        status: data.status,
        items: {
          create: data.items.map((item: any) => ({
            code: item.code,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            days: item.days,
            name: item.name || item.description,
          })),
        },
      },
      include: {
        client: true,
        gestor: {
          select: {
            id: true,
            name: true,
            email: true,
            position: true,
            department: true,
            role: true,
            createdAt: true,
            updatedAt: true,
            deletedAt: true,
          },
        },
        items: true,
      },
    })

    return NextResponse.json(serviceOrder, { status: 201 })
  } catch (error) {
    console.error("Error creating service order:", error)
    return NextResponse.json({ error: "Failed to create service order" }, { status: 500 })
  }
}

