"use client";

import { useEffect, useState } from "react";
import { Home, LogIn, LogOut, QrCode, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function Dashboard() {
  const [userType, setUserType] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const type = localStorage.getItem("type");

    if (!token) {
      window.location.href = "/login";
      return;
    }

    setUserType(type);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  const goToScan = (type_s: string) => {
    localStorage.setItem("type_s", type_s);
    window.location.href = "/post";
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="fixed top-0 w-full bg-white shadow-sm p-4 flex justify-between items-center">
        <div className="flex items-center">
          <Home className="w-5 h-5 text-blue-600 mr-2" />
          <span className="font-semibold">Système de pointage</span>
        </div>
        <Button onClick={handleLogout} className="bg-gray-500 hover:bg-gray-600 text-white">
          Déconnexion
        </Button>
      </div>

      <div className="w-full max-w-lg bg-white p-6 mt-16 rounded-lg shadow-lg border">
        <div className="flex justify-center mb-4">
          <Image src="/logo-djamiaya.png" alt="Logo" width={240} height={120} />
        </div>

        <div className="space-y-4">
          {userType === "2" && (
            <>
              <Button onClick={() => goToScan("1")} className="w-full bg-blue-500 hover:bg-blue-600 flex justify-between px-4 py-6 text-white">
                <LogIn /> <span>Scanner Entrée Bus</span> <ArrowRight />
              </Button>
              <Button onClick={() => goToScan("0")} className="w-full bg-red-500 hover:bg-red-600 flex justify-between px-4 py-6 text-white">
                <LogOut /> <span>Scanner Sortie Bus</span> <ArrowRight />
              </Button>
            </>
          )}

          {userType === "3" && (
            <>
              <Button onClick={() => goToScan("4")} className="w-full bg-green-500 hover:bg-green-600 flex justify-between px-4 py-6 text-white">
                <LogIn /> <span>Entrée spéciale (type 4)</span> <ArrowRight />
              </Button>
              <Button onClick={() => goToScan("3")} className="w-full bg-orange-500 hover:bg-orange-600 flex justify-between px-4 py-6 text-white">
                <LogOut /> <span>Sortie spéciale (type 3)</span> <ArrowRight />
              </Button>
            </>
          )}

          {["0", "1"].includes(userType || "") && (
            <Button onClick={() => goToScan("bus")} className="w-full bg-green-500 hover:bg-green-600 flex justify-between px-4 py-6 text-white">
              <QrCode /> <span>Scanner Bus</span> <ArrowRight />
            </Button>
          )}
        </div>

        <p className="text-center text-gray-400 text-xs mt-6">Version 1.1.0</p>
      </div>
    </div>
  );
}
