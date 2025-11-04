"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Home, LogIn, LogOut } from "lucide-react"
import Image from "next/image"

export default function DashboardPage() {
  const router = useRouter()
  const [selectedType, setSelectedType] = useState<"entrer" | "sortir" | null>(null)

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      window.location.href = "/login"
      return
    }

    // Vérifier s il y a des messages de scan précédents
    const successMessage = localStorage.getItem("scan_success_message")
    const errorMessage = localStorage.getItem("scan_error_message")

    if (successMessage) {
      alert(successMessage)
      localStorage.removeItem("scan_success_message")
    }

    if (errorMessage) {
      alert(errorMessage)
      localStorage.removeItem("scan_error_message")
    }
  }, [])

  const handleTypeSelect = (type: "entrer" | "sortir") => {
    setSelectedType(type)
    localStorage.setItem("type_s", type)
    router.push("/post")
  }

  const handleLogout = () => {
    localStorage.clear()
    window.location.href = "/login"
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      {/* Header */}
      <div className="fixed top-0 w-full bg-white shadow-sm p-4 flex justify-between items-center">
        <div className="flex items-center">
          <Home className="w-5 h-5 text-blue-600 mr-2" />
          <span className="font-semibold text-gray-800">Système de pointage</span>
        </div>
        <Button onClick={handleLogout} className="bg-gray-500 hover:bg-gray-600 text-white">
          Déconnexion
        </Button>
      </div>

      {/* Contenu principal */}
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6 mt-16 space-y-6">
        <div className="flex justify-center">
          <Image
            src="/logo-djamiaya.png"
            alt="Logo"
            width={240}
            height={120}
            priority
          />
        </div>

        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Dashboard</h1>
          <p className="text-gray-600">Choisissez le type de pointage</p>
        </div>

        <div className="space-y-4">
          <Button
            onClick={() => handleTypeSelect("entrer")}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg"
          >
            <LogIn className="w-5 h-5 mr-2" />
            Pointage d Entrée
          </Button>

          <Button
            onClick={() => handleTypeSelect("sortir")}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-6 text-lg"
          >
            <LogOut className="w-5 h-5 mr-2" />
            Pointage de Sortie
          </Button>
        </div>

        <div className="text-center text-xs text-gray-400 border-t pt-4">
          Système de contrôle d accès • Version 2.0.0
        </div>
      </div>
    </div>
  )
}