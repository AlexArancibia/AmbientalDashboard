import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET() {
  try {
    const lastServiceOrder = await prisma.serviceOrder.findFirst({
      orderBy: { number: "desc" },
    })

    let nextNumber = "OS-001"
    if (lastServiceOrder) {
      const lastNumber = Number.parseInt(lastServiceOrder.number.split("-")[1])
      nextNumber = `OS-${(lastNumber + 1).toString().padStart(3, "0")}`
    }

    return NextResponse.json({ nextNumber })
  } catch (error) {
    console.error("Error generating next service order number:", error)
    return NextResponse.json({ error: "Failed to generate next service order number" }, { status: 500 })
  }
}

