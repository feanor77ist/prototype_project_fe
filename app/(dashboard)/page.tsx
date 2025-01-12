"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ChatLayout } from "@/components/chatLayout";
import { Loader } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [isAuthChecked, setIsAuthChecked] = useState(false); // Token kontrol durumu
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Kullanıcı giriş durumu

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsLoggedIn(true); // Token varsa giriş başarılı
    } else {
      router.push("/login"); // Token yoksa login sayfasına yönlendir
    }
    setIsAuthChecked(true); // Token kontrolü tamamlandı
  }, [router]);

  // Token kontrolü tamamlanana kadar hiçbir şey render etme
  if (!isAuthChecked) {
    return <div className="flex h-screen items-center justify-center"><Loader className="h-5 w-5 animate-spin" /></div>;
  }

  return isLoggedIn ? <ChatLayout /> : null;
}
