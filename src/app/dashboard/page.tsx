"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Home, LogOut, QrCode } from "lucide-react"
import Image from "next/image"

export default function DashboardPage() {
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      window.location.href = "/login"
    }
  }, [])

  const handleLogout = () => {
    localStorage.clear()
    window.location.href = "/login"
  }

  const goToScan = () => {
    router.push("/post")
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      {/* Header */}
      <div className="fixed top-0 w-full bg-white shadow-sm p-4 flex justify-between items-center z-50">
        <div className="flex items-center">
          <Home className="w-5 h-5 text-blue-600 mr-2" />
          <span className="font-semibold text-gray-800">Dashboard</span>
        </div>
        <Button onClick={handleLogout} className="bg-gray-500 hover:bg-gray-600 text-white">
          <LogOut className="w-4 h-4 mr-2" />
          Déconnexion
        </Button>
      </div>

      {/* Contenu principal */}
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8 mt-16 space-y-8">
        <div className="flex justify-center">
          <Image src="/logo-djamiaya.png" alt="Logo" width={240} height={120} priority />
        </div>

        <div className="text-center space-y-4">
          <div className="bg-blue-50 p-6 rounded-lg">
            <QrCode className="w-20 h-20 mx-auto text-blue-600 mb-4" />
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Bienvenue</h1>
            <p className="text-gray-600">Système de pointage Bus & Chauffeurs</p>
          </div>

          <div className="pt-4">
            <Button onClick={goToScan} className="w-full bg-blue-600 hover:bg-blue-700 text-white h-14 text-lg">
              <QrCode className="w-6 h-6 mr-2" />
              Commencer un scan
            </Button>
          </div>
        </div>

        <div className="text-center text-xs text-gray-400 border-t pt-4">
          Système de contrôle d accès • Version 2.0.0
        </div>
      </div>
    </div>
  )
}