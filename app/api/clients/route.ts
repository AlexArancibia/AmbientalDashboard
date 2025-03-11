import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET() {
  try {
    const clients = await prisma.client.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(clients)
  } catch (error) {
    console.error("Error fetching clients:", error)
    return NextResponse.json({ error: "Failed to fetch clients" }, { status: 500 })
  }
}

// Modificar la función POST para eliminar monitoringLocation
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const client = await prisma.client.create({
      data: {
        name: data.name,
        ruc: data.ruc,
        address: data.address,
        email: data.email,
        contactPerson: data.contactPerson,
        creditLine: data.creditLine,
        paymentMethod: data.paymentMethod,
        startDate: data.startDate ? new Date(data.startDate) : null,
        // Eliminamos monitoringLocation ya que ahora pertenece a quotation
      },
    })
    return NextResponse.json(client, { status: 201 })
  } catch (error) {
    console.error("Error creating client:", error instanceof Error ? error.message : "Unknown error")
    return NextResponse.json({ error: "Failed to create client" }, { status: 500 })
  }
}

