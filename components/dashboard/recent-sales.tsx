import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function RecentSales() {
  return (
    <div className="space-y-8">
      <div className="flex items-center">
        <Avatar className="h-9 w-9">
          <AvatarImage src="/placeholder-user.jpg" alt="Avatar" />
          <AvatarFallback>AC</AvatarFallback>
        </Avatar>
        <div className="ml-4 space-y-1">
          <p className="text-sm font-medium leading-none">Acme Corp</p>
          <p className="text-sm text-muted-foreground">Equipment rental for construction project</p>
        </div>
        <div className="ml-auto font-medium">+S/. 1,999.00</div>
      </div>
      <div className="flex items-center">
        <Avatar className="h-9 w-9">
          <AvatarImage src="/placeholder-user.jpg" alt="Avatar" />
          <AvatarFallback>BT</AvatarFallback>
        </Avatar>
        <div className="ml-4 space-y-1">
          <p className="text-sm font-medium leading-none">BuildTech Inc.</p>
          <p className="text-sm text-muted-foreground">Monthly equipment service</p>
        </div>
        <div className="ml-auto font-medium">+S/. 3,499.00</div>
      </div>
      <div className="flex items-center">
        <Avatar className="h-9 w-9">
          <AvatarImage src="/placeholder-user.jpg" alt="Avatar" />
          <AvatarFallback>CM</AvatarFallback>
        </Avatar>
        <div className="ml-4 space-y-1">
          <p className="text-sm font-medium leading-none">Construct Masters</p>
          <p className="text-sm text-muted-foreground">Heavy machinery rental</p>
        </div>
        <div className="ml-auto font-medium">+S/. 2,699.00</div>
      </div>
      <div className="flex items-center">
        <Avatar className="h-9 w-9">
          <AvatarImage src="/placeholder-user.jpg" alt="Avatar" />
          <AvatarFallback>DE</AvatarFallback>
        </Avatar>
        <div className="ml-4 space-y-1">
          <p className="text-sm font-medium leading-none">Diggers Enterprises</p>
          <p className="text-sm text-muted-foreground">Excavation equipment</p>
        </div>
        <div className="ml-auto font-medium">+S/. 4,999.00</div>
      </div>
      <div className="flex items-center">
        <Avatar className="h-9 w-9">
          <AvatarImage src="/placeholder-user.jpg" alt="Avatar" />
          <AvatarFallback>ES</AvatarFallback>
        </Avatar>
        <div className="ml-4 space-y-1">
          <p className="text-sm font-medium leading-none">Engineering Solutions</p>
          <p className="text-sm text-muted-foreground">Specialized equipment rental</p>
        </div>
        <div className="ml-auto font-medium">+S/. 5,999.00</div>
      </div>
    </div>
  )
}

