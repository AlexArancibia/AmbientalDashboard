import type { User } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

interface UserDetailProps {
  user: User
}

export function UserDetail({ user }: UserDetailProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-4">
          <Avatar className="h-12 w-12">
            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-2xl font-bold">{user.name}</h2>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {user.role && (
            <div>
              <h3 className="text-lg font-semibold">Rol</h3>
              <Badge>{user.role}</Badge>
            </div>
          )}
          {user.position && (
            <div>
              <h3 className="text-lg font-semibold">Cargo</h3>
              <p>{user.position}</p>
            </div>
          )}
          {user.department && (
            <div>
              <h3 className="text-lg font-semibold">Departamento</h3>
              <p>{user.department}</p>
            </div>
          )}
          <div>
            <h3 className="text-lg font-semibold">Miembro desde</h3>
            <p>{user.createdAt.toLocaleDateString()}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

