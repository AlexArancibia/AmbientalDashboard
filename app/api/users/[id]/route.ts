import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: params.id },
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
    })

    if (!user || user.deletedAt) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error(`Error fetching user ${params.id}:`, error)
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data = await request.json()

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: params.id },
    })

    if (!existingUser || existingUser.deletedAt) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Prepare update data
    const updateData: any = {
      name: data.name,
      email: data.email,
      position: data.position,
      department: data.department,
      role: data.role,
      updatedAt: new Date(),
    }

    // If password is provided, hash it
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10)
    }

    // Update user
    const user = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
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
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error(`Error updating user ${params.id}:`, error)
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Soft delete - update the deletedAt field instead of actually deleting
    const user = await prisma.user.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(`Error deleting user ${params.id}:`, error)
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
  }
}

