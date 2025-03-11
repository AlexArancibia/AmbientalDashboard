import { DashboardShell } from "@/components/dashboard-shell"
import { DashboardHeader } from "@/components/dashboard-header"
import { EquipmentDetail } from "@/components/equipment/equipment-detail"
import { notFound } from "next/navigation"
import prisma from "@/lib/prisma"
import type { Equipment, EquipmentStatus } from "@/types"
import { use } from "react"

export default function EquipmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // Resolve the params Promise outside of try/catch
  const resolvedParams = use(params)
  const id = resolvedParams.id

  if (!id) {
    notFound()
  }

  // Fetch equipment data from Prisma and handle with .catch
  const prismaEquipmentPromise = prisma.equipment
    .findUnique({
      where: { id },
    })
    .catch((error) => {
      console.error("Error fetching equipment:", error)
      return null
    })

  // Use the 'use' hook to resolve the Promise outside of try/catch
  const prismaEquipment = use(prismaEquipmentPromise)

  if (!prismaEquipment) {
    notFound()
  }

  // Transform Prisma data to match our Equipment interface
  const equipmentItem: Equipment = {
    id: prismaEquipment.id,
    name: prismaEquipment.name,
    type: prismaEquipment.type,
    code: prismaEquipment.code,
    description: prismaEquipment.description,
    // Convert JSON components to EquipmentComponents
    components: (prismaEquipment.components as Record<string, string>) || undefined,
    // Ensure status is a valid EquipmentStatus enum value
    status: prismaEquipment.status as EquipmentStatus,
    isCalibrated: prismaEquipment.isCalibrated || false,
    calibrationDate: prismaEquipment.calibrationDate || undefined,
    serialNumber: prismaEquipment.serialNumber || undefined,
    observations: prismaEquipment.observations || undefined,
    createdAt: prismaEquipment.createdAt,
    updatedAt: prismaEquipment.updatedAt,
    deletedAt: prismaEquipment.deletedAt || undefined,
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading={equipmentItem.name}
        text={`Código: ${equipmentItem.code} | Tipo: ${equipmentItem.type}`}
      />
      <EquipmentDetail equipment={equipmentItem} />
    </DashboardShell>
  )
}

