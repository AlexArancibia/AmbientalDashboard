import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const equipment = await prisma.equipment.findUnique({
      where: { id: params.id },
    })

    if (!equipment || equipment.deletedAt) {
      return NextResponse.json({ error: "Equipment not found" }, { status: 404 })
    }

    return NextResponse.json(equipment)
  } catch (error) {
    console.error(`Error fetching equipment ${params.id}:`, error)
    return NextResponse.json({ error: "Failed to fetch equipment" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data = await request.json()

    // Check if equipment exists
    const existingEquipment = await prisma.equipment.findUnique({
      where: { id: params.id },
    })

    if (!existingEquipment || existingEquipment.deletedAt) {
      return NextResponse.json({ error: "Equipment not found" }, { status: 404 })
    }

    // Process the calibrationDate field
    let calibrationDate = undefined
    if (data.calibrationDate) {
      calibrationDate = new Date(data.calibrationDate)
    }

    const equipment = await prisma.equipment.update({
      where: { id: params.id },
      data: {
        name: data.name,
        type: data.type,
        code: data.code,
        description: data.description,
        components: data.components || existingEquipment.components,
        status: data.status,
        isCalibrated: data.isCalibrated,
        calibrationDate: calibrationDate,
        serialNumber: data.serialNumber,
        observations: data.observations,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json(equipment)
  } catch (error) {
    console.error(`Error updating equipment ${params.id}:`, error)
    return NextResponse.json({ error: "Failed to update equipment" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Soft delete - update the deletedAt field instead of actually deleting
    const equipment = await prisma.equipment.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    })

    if (!equipment) {
      return NextResponse.json({ error: "Equipment not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(`Error deleting equipment ${params.id}:`, error)
    return NextResponse.json({ error: "Failed to delete equipment" }, { status: 500 })
  }
}

