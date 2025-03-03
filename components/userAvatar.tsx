"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Settings, LogOut } from "lucide-react";

export const UserAvatar = () => {
  const router = useRouter();
  const [user, setUser] = useState<{ first_name: string; last_name: string; email: string } | null>(null);

  useEffect(() => {
    // Kullanıcı bilgilerini localStorage'dan çek
    const storedUser = JSON.parse(localStorage.getItem("user") || "null");
    setUser(storedUser);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token"); // Token'ı temizle
    localStorage.removeItem("user"); // Kullanıcı bilgilerini temizle
    localStorage.removeItem("permissions"); // Yetkileri temizle
    router.push("/login"); // Login sayfasına yönlendir
  };

  // Kullanıcı yoksa varsayılan "AA" göster
  const initials = user
    ? `${user.first_name?.charAt(0) || ""}${user.last_name?.charAt(0) || ""}`.toUpperCase()
    : "AA";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src="/placeholder.svg?height=32&width=32" alt={`${user?.first_name || "User"}`} />
            <AvatarFallback className="hover:bg-gray-300 dark:hover:bg-slate-500 bg-slate-200 dark:bg-slate-400">{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user ? `${user.first_name} ${user.last_name}` : "Kullanıcı"}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user ? user.email : "example@example.com"}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Settings className="mr-2 h-4 w-4" />
          <span>Ayarlar</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Çıkış</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
