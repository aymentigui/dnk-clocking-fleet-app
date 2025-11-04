"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { LogOut, Plus, History } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"

interface ScanRecord {
  id: string
  bus: string
  driver: string
  timestamp: string
}

export default function Dashboard() {
  const router = useRouter()
  const [userName, setUserName] = useState<string>("")
  const [scans, setScans] = useState<ScanRecord[]>([])
  const [successMessage, setSuccessMessage] = useState<string>("")
  const [errorMessage, setErrorMessage] = useState<string>("")

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      window.location.href = "/login"
      return
    }

    const name = localStorage.getItem("user_name") || "Utilisateur"
    setUserName(name)

    const successMsg = localStorage.getItem("scan_success_message")
    const errorMsg = localStorage.getItem("scan_error_message")

    if (successMsg) {
      setSuccessMessage(successMsg)
      localStorage.removeItem("scan_success_message")
      setTimeout(() => setSuccessMessage(""), 5000)
    }

    if (errorMsg) {
      setErrorMessage(errorMsg)
      localStorage.removeItem("scan_error_message")
      setTimeout(() => setErrorMessage(""), 5000)
    }

    const recentScans = localStorage.getItem("recent_scans")
    if (recentScans) {
      try {
        setScans(JSON.parse(recentScans).slice(0, 5))
      } catch (e) {
        console.error("Erreur lors du chargement des scans:", e)
      }
    }
  }, [])

  const handleStartScan = () => {
    router.push("/post")
  }

  const handleLogout = () => {
    localStorage.clear()
    window.location.href = "/login"
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <div className="fixed top-0 w-full bg-white shadow-md z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Image src="/logo-djamiaya.png" alt="Logo" width={120} height={60} priority />
            <h1 className="text-xl font-bold text-gray-800">Système de Pointage</h1>
          </div>
          <Button onClick={handleLogout} variant="outline" className="gap-2 bg-transparent">
            <LogOut className="w-4 h-4" />
            Déconnexion
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 pt-24 pb-12">
        {/* Welcome Section */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Bienvenue, {userName}!</h2>
          <p className="text-gray-600">Gérez vos pointages de bus et chauffeurs</p>
        </div>

        {/* Messages */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 text-green-700">{successMessage}</div>
        )}
        {errorMessage && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700">{errorMessage}</div>
        )}

        {/* Action Buttons */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <button
            onClick={handleStartScan}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg p-8 shadow-md hover:shadow-lg transition-all"
          >
            <Plus className="w-8 h-8 mx-auto mb-4" />
            <h3 className="text-xl font-bold">Nouvelle Scan</h3>
            <p className="text-sm mt-2 opacity-90">Scanner un bus et un chauffeur</p>
          </button>

          <div className="bg-white rounded-lg shadow-md p-8 flex flex-col justify-center">
            <History className="w-8 h-8 mx-auto mb-4 text-indigo-600" />
            <h3 className="text-xl font-bold text-center text-gray-800">Historique</h3>
            <p className="text-sm text-center text-gray-600 mt-2">Consultez vos scans récents</p>
          </div>
        </div>

        {/* Recent Scans */}
        {scans.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Scans Récents</h3>
            <div className="space-y-3">
              {scans.map((scan) => (
                <div
                  key={scan.id}
                  className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div>
                    <p className="font-semibold text-gray-800">Bus: {scan.bus}</p>
                    <p className="text-sm text-gray-600">Chauffeur: {scan.driver}</p>
                  </div>
                  <p className="text-xs text-gray-500">{scan.timestamp}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
