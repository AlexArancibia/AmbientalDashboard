import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET() {
  try {
    // Obtener todos los servicios (QuotationItems sin quotationId o con quotationId pero sin deletedAt)
    const services = await prisma.quotationItem.findMany({
      where: {
        OR: [
          { quotationId: null },
          {
            quotationId: { not: null },
            deletedAt: null,
          },
        ],
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    // Agrupar servicios por código para evitar duplicados
    const uniqueServices = Array.from(new Map(services.map((item) => [item.code, item])).values())

    return NextResponse.json(uniqueServices)
  } catch (error) {
    console.error("Error al obtener servicios:", error instanceof Error ? error.message : "Error desconocido")
    return NextResponse.json({ error: "Error al obtener servicios" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validar campos requeridos
    if (!body.description || !body.code || !body.unitPrice) {
      return NextResponse.json({ error: "Faltan campos requeridos: description, code, unitPrice" }, { status: 400 })
    }

    // Crear un nuevo servicio (QuotationItem sin quotationId)
    const service = await prisma.quotationItem.create({
      data: {
        name: body.name,
        description: body.description,
        code: body.code,
        quantity: body.quantity || 1,
        days: body.days || 1,
        unitPrice: body.unitPrice,
      },
    })

    return NextResponse.json(service)
  } catch (error) {
    console.error("Error al crear servicio:", error instanceof Error ? error.message : "Error desconocido")
    return NextResponse.json({ error: "Error al crear servicio" }, { status: 500 })
  }
}

