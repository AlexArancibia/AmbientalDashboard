import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const client = await prisma.client.findUnique({
      where: { id: params.id },
    })

    if (!client || client.deletedAt) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    return NextResponse.json(client)
  } catch (error) {
    console.error(`Error fetching client ${params.id}:`, error)
    return NextResponse.json({ error: "Failed to fetch client" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data = await request.json()

    // Check if client exists
    const existingClient = await prisma.client.findUnique({
      where: { id: params.id },
    })

    if (!existingClient || existingClient.deletedAt) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    const client = await prisma.client.update({
      where: { id: params.id },
      data: {
        name: data.name,
        ruc: data.ruc,
        address: data.address,
        type: data.type,
        email: data.email,
        contactPerson: data.contactPerson,
        creditLine: data.creditLine,
        paymentMethod: data.paymentMethod,
        startDate: data.startDate ? new Date(data.startDate) : existingClient.startDate,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json(client)
  } catch (error) {
    console.error(`Error updating client ${params.id}:`, error)
    return NextResponse.json({ error: "Failed to update client" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Soft delete - update the deletedAt field instead of actually deleting
    const client = await prisma.client.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    })

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(`Error deleting client ${params.id}:`, error)
    return NextResponse.json({ error: "Failed to delete client" }, { status: 500 })
  }
}

