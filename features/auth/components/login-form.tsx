"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch("https://libreconsulting.pythonanywhere.com/api/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }), // username ve password gönderiliyor
      });

      if (!response.ok) {
        throw new Error("Giriş başarısız. Kullanıcı adı veya şifre hatalı.");
      }

      const data = await response.json();
      localStorage.setItem("token", data.token); // Token'ı localStorage'a kaydet
      console.log("Token kaydedildi:", localStorage.getItem("token")); // Token'ı kontrol et
      router.push("/"); // Giriş başarılıysa ana sayfaya yönlendir
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <Card className="mx-auto max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Giriş Yap</CardTitle>
        <CardDescription>
          Hesabınıza giriş yapmak için aşağıya kullanıcı adınızı ve şifrenizi giriniz.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4">
          {error && <p className="text-red-500">{error}</p>}

          <div className="grid gap-2">
            <Label htmlFor="username">Kullanıcı Adı</Label>
            <Input
              id="username"
              type="text"
              placeholder="kullanıcı adınız"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <div className="flex items-center">
              <Label htmlFor="password">Şifre</Label>
              <Link href="#" className="ml-auto inline-block text-sm underline">
                Şifrenizi mi unuttunuz?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="parolanız"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full">
            Giriş
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
