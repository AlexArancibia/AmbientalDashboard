import { DashboardShell } from "@/components/dashboard-shell"
import { DashboardHeader } from "@/components/dashboard-header"
import { UserDetail } from "@/components/users/user-detail"
import { notFound } from "next/navigation"
import prisma from "@/lib/prisma"
import type { User } from "@/types"
import { use } from "react"

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const id = resolvedParams.id

  if (!id) {
    notFound()
  }

  const prismaUserPromise = prisma.user
    .findUnique({
      where: { id },
    })
    .catch((error) => {
      console.error("Error al obtener el usuario:", error)
      return null
    })

  const prismaUser = use(prismaUserPromise)

  if (!prismaUser) {
    notFound()
  }

  const user: User = {
    id: prismaUser.id,
    name: prismaUser.name,
    email: prismaUser.email,
    role: prismaUser.role || undefined,
    position: prismaUser.position || undefined,
    department: prismaUser.department || undefined,
    createdAt: prismaUser.createdAt,
    updatedAt: prismaUser.updatedAt,
  }

  return (
    <DashboardShell>
      <DashboardHeader heading={user.name} text={`Correo: ${user.email}${user.role ? ` | Rol: ${user.role}` : ""}`} />
      <UserDetail user={user} />
    </DashboardShell>
  )
}

