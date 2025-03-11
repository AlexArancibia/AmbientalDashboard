import { DashboardShell } from "@/components/dashboard-shell"
import { DashboardHeader } from "@/components/dashboard-header"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { UsersTable } from "@/components/users/users-table"
import Link from "next/link"
import { UserDialog } from "@/components/users/user-dialog"

export default function UsersPage() {
  return (
    <DashboardShell>
      <DashboardHeader heading="Users" text="Manage system users">
   
      </DashboardHeader>
      <UsersTable />
    </DashboardShell>
  )
}

