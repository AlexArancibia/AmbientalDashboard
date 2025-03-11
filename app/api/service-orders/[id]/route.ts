import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const serviceOrder = await prisma.serviceOrder.findUnique({
      where: { id: params.id },
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

    if (!serviceOrder || serviceOrder.deletedAt) {
      return NextResponse.json({ error: "Service order not found" }, { status: 404 })
    }

    return NextResponse.json(serviceOrder)
  } catch (error) {
    console.error(`Error fetching service order ${params.id}:`, error)
    return NextResponse.json({ error: "Failed to fetch service order" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data = await request.json()

    // Check if service order exists
    const existingServiceOrder = await prisma.serviceOrder.findUnique({
      where: { id: params.id },
      include: { items: true },
    })

    if (!existingServiceOrder || existingServiceOrder.deletedAt) {
      return NextResponse.json({ error: "Service order not found" }, { status: 404 })
    }

    // Update basic service order data
    const serviceOrder = await prisma.serviceOrder.update({
      where: { id: params.id },
      data: {
        number: data.number,
        date: data.date ? new Date(data.date) : undefined,
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
        updatedAt: new Date(),
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

    // If items are provided, update them
    if (data.items) {
      // Delete existing items
      await prisma.serviceOrderItem.deleteMany({
        where: { serviceOrderId: params.id },
      })

      // Create new items
      for (const item of data.items) {
        await prisma.serviceOrderItem.create({
          data: {
            serviceOrderId: params.id,
            code: item.code,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            days: item.days,
            name: item.name || item.description,
          },
        })
      }

      // Fetch updated service order with items
      const updatedServiceOrder = await prisma.serviceOrder.findUnique({
        where: { id: params.id },
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

      return NextResponse.json(updatedServiceOrder)
    }

    return NextResponse.json(serviceOrder)
  } catch (error) {
    console.error(`Error updating service order ${params.id}:`, error)
    return NextResponse.json({ error: "Failed to update service order" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Soft delete - update the deletedAt field instead of actually deleting
    const serviceOrder = await prisma.serviceOrder.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    })

    if (!serviceOrder) {
      return NextResponse.json({ error: "Service order not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(`Error deleting service order ${params.id}:`, error)
    return NextResponse.json({ error: "Failed to delete service order" }, { status: 500 })
  }
}

