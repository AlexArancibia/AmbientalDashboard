import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET() {
  try {
    const equipment = await prisma.equipment.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(equipment)
  } catch (error) {
    console.error("Error fetching equipment:", error)
    return NextResponse.json({ error: "Failed to fetch equipment" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    // Process the calibrationDate field
    let calibrationDate = undefined
    if (data.calibrationDate) {
      calibrationDate = new Date(data.calibrationDate)
    }

    const equipment = await prisma.equipment.create({
      data: {
        name: data.name,
        type: data.type,
        code: data.code,
        description: data.description,
        components: data.components || {},
        status: data.status,
        isCalibrated: data.isCalibrated,
        calibrationDate: calibrationDate,
        serialNumber: data.serialNumber,
        observations: data.observations,
      },
    })

    return NextResponse.json(equipment, { status: 201 })
  } catch (error) {
    console.error("Error creating equipment:", error)
    return NextResponse.json({ error: "Failed to create equipment" }, { status: 500 })
  }
}

