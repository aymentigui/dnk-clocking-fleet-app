"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Html5Qrcode } from "html5-qrcode"
import { Home, Bus, User, Camera, SwitchCamera, Play, RotateCcw } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"

export default function PostPage() {
  const router = useRouter()
  const [step, setStep] = useState<"idle" | "bus" | "driver" | "sending" | "complete">("idle")
  const [busCode, setBusCode] = useState<string | null>(null)
  const [driverCode, setDriverCode] = useState<string | null>(null)
  const [message, setMessage] = useState<string>("Cliquez sur  Démarrer le scan du bus  pour commencer")
  const [status, setStatus] = useState<"idle" | "scanning" | "locked" | "sending" | "success" | "error">("idle")
  const [cameraId, setCameraId] = useState<string | null>(null)
  const [availableCameras, setAvailableCameras] = useState<{ id: string; label: string }[]>([])
  const [isScanning, setIsScanning] = useState(false)

  const scannerRef = useRef<Html5Qrcode | null>(null)

  // Obtenir la liste des caméras disponibles
  const getCameras = async () => {
    try {
      const cameras = await Html5Qrcode.getCameras()
      const formattedCameras = cameras.map((cam) => ({
        id: cam.id,
        label: cam.label || `Caméra ${cam.id}`,
      }))
      setAvailableCameras(formattedCameras)

      const backCamera = formattedCameras.find(
        (cam) =>
          cam.label.toLowerCase().includes("back") ||
          cam.label.toLowerCase().includes("arrière") ||
          cam.label.toLowerCase().includes("rear") ||
          (!cam.label.toLowerCase().includes("front") && formattedCameras.length > 1)
      )

      return backCamera?.id || formattedCameras[0]?.id || null
    } catch (error) {
      console.error("Erreur lors de la récupération des caméras:", error)
      return null
    }
  }

  // Démarrer le scan
  const startScanning = async (deviceId: string) => {
    try {
      const scanner = new Html5Qrcode("qr-reader")
      scannerRef.current = scanner

      await scanner.start(
        deviceId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          handleScanSuccess(decodedText)
        },
        () => {
          // Erreur de scan silencieuse (normal pendant le scan)
        }
      )

      setIsScanning(true)
      setStatus("scanning")
    } catch (error) {
      console.error("Erreur de démarrage du scanner:", error)
      setMessage("❌ Erreur de caméra. Veuillez réessayer.")
      setStatus("idle")
    }
  }

  // Arrêter le scan
  const stopScanning = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop()
        scannerRef.current.clear()
        scannerRef.current = null
      } catch (error) {
        console.error("Erreur lors de l arrêt du scanner:", error)
      }
      setIsScanning(false)
    }
  }

  // Gérer le succès du scan
  const handleScanSuccess = async (code: string) => {
    if (step === "bus" && status === "scanning") {
      await stopScanning()
      setBusCode(code)
      setStatus("locked")
      setMessage(`✅ Bus scanné: ${code}\n\nCliquez sur "Continuer" pour scanner le chauffeur`)
    } else if (step === "driver" && status === "scanning") {
      await stopScanning()
      setDriverCode(code)
      setStatus("locked")
      setMessage(`✅ Chauffeur scanné: ${code}\n\nCliquez sur "Envoyer" pour valider le pointage`)
    }
  }

  // Démarrer le scan du bus
  const startBusScan = async () => {
    setStep("bus")
    setMessage("📷 Positionnez le QR code du bus devant la caméra...")
    const preferredCameraId = cameraId || (await getCameras())
    if (preferredCameraId) {
      setCameraId(preferredCameraId)
      await startScanning(preferredCameraId)
    }
  }

  // Continuer vers le scan du chauffeur
  const continueToDriver = async () => {
    setStep("driver")
    setDriverCode(null)
    setStatus("idle")
    setMessage("Cliquez sur  Démarrer le scan du chauffeur  pour continuer")
  }

  // Démarrer le scan du chauffeur
  const startDriverScan = async () => {
    setMessage("📷 Positionnez le QR code du chauffeur devant la caméra...")
    const preferredCameraId = cameraId
    if (preferredCameraId) {
      await startScanning(preferredCameraId)
    }
  }

  // Envoyer les données au serveur
  const submitScan = async () => {
    if (!busCode || !driverCode) {
      setMessage("❌ Les deux codes sont nécessaires")
      return
    }

    setStep("sending")
    setStatus("sending")
    setMessage("⏳ Envoi des données au serveur...")
    const token = localStorage.getItem("token")
    const type = localStorage.getItem("type_s")

    try {
      const res = await fetch("https://dnk-clocking-fleet.vercel.app/api/admin/clocking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          matricule: busCode,
          conducteur_matricule: driverCode,
          type,
        }),
      })

      if (!res.ok) throw new Error("Erreur d envoi")

      const data = await res.json()
      setStep("complete")
      setStatus("success")
      setMessage(`✅ Pointage réussi!\n\n${data?.message || "Les données ont été enregistrées avec succès"}`)
    } catch (error) {
      console.error("Erreur lors de l envoi:", error)
      setStep("complete")
      setStatus("error")
      setMessage("❌ Erreur lors de l envoi des données au serveur")
    }
  }

  // Recommencer un nouveau scan
  const startNewScan = () => {
    setBusCode(null)
    setDriverCode(null)
    setStep("idle")
    setStatus("idle")
    setMessage("Cliquez sur  Démarrer le scan du bus  pour commencer un nouveau scan")
  }

  // Changer de caméra
  const switchCamera = async () => {
    if (availableCameras.length <= 1) return

    const currentIndex = availableCameras.findIndex((cam) => cam.id === cameraId)
    const nextIndex = (currentIndex + 1) % availableCameras.length
    const nextCamera = availableCameras[nextIndex]

    setCameraId(nextCamera.id)

    if (isScanning) {
      await stopScanning()
      await startScanning(nextCamera.id)
    }
  }

  // Déconnexion
  const handleLogout = async () => {
    await stopScanning()
    localStorage.clear()
    window.location.href = "/login"
  }

  // Initialisation
  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      window.location.href = "/login"
      return
    }

    const init = async () => {
      const preferredCameraId = await getCameras()
      setCameraId(preferredCameraId)
    }

    init()

    return () => {
      stopScanning()
    }
  }, [])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      {/* Header */}
      <div className="fixed top-0 w-full bg-white shadow-sm p-4 flex justify-between items-center z-50">
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
          <Image src="/logo-djamiaya.png" alt="Logo" width={240} height={120} priority />
        </div>

        {/* Affichage du statut */}
        <div className="text-center space-y-3">
          {step === "idle" && (
            <>
              <Play className="w-16 h-16 mx-auto text-blue-500" />
              <p className="text-lg font-semibold">Prêt à scanner</p>
            </>
          )}
          {step === "bus" && (
            <>
              <Bus className="w-16 h-16 mx-auto text-blue-500" />
              <p className="text-lg font-semibold">Scan du Bus</p>
            </>
          )}
          {step === "driver" && (
            <>
              <User className="w-16 h-16 mx-auto text-orange-500" />
              <p className="text-lg font-semibold">Scan du Chauffeur</p>
            </>
          )}
          {step === "sending" && (
            <>
              <div className="w-16 h-16 mx-auto flex items-center justify-center">
                <div className="animate-spin text-4xl">⏳</div>
              </div>
              <p className="text-lg font-semibold">Envoi en cours...</p>
            </>
          )}
          {step === "complete" && (
            <>
              {status === "success" ? <div className="text-6xl">✅</div> : <div className="text-6xl">❌</div>}
              <p className="text-lg font-semibold">{status === "success" ? "Pointage réussi" : "Erreur"}</p>
            </>
          )}

          <p className="text-sm text-gray-600 whitespace-pre-line mt-4">{message}</p>
        </div>

        {/* Zone de scan - visible seulement si scan actif */}
        {(step === "bus" || step === "driver") && (
          <>
            <div className="flex justify-between items-center">
              <div className="flex items-center text-sm text-gray-600">
                <Camera className="w-4 h-4 mr-2" />
                {availableCameras.find((cam) => cam.id === cameraId)?.label || "Caméra"}
              </div>

              {availableCameras.length > 1 && (
                <Button
                  onClick={switchCamera}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                  disabled={!isScanning}
                >
                  <SwitchCamera className="w-4 h-4" />
                  Changer
                </Button>
              )}
            </div>

            <div className="relative">
              <div id="qr-reader" className="w-full rounded border-2 border-gray-300"></div>

              {status === "locked" && (
                <div className="mt-4 p-4 bg-green-50 rounded-lg border-2 border-green-200">
                  <div className="text-center">
                    <div className="text-5xl mb-2">✅</div>
                    <p className="text-sm font-semibold text-green-700">Code scanné avec succès!</p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Codes scannés affichés */}
        {busCode && (
          <div className="bg-blue-50 p-3 rounded-lg border-2 border-blue-200">
            <p className="text-sm text-gray-600 font-medium">🚍 Bus scanné:</p>
            <p className="text-xl font-bold text-blue-600 mt-1">{busCode}</p>
          </div>
        )}

        {driverCode && (
          <div className="bg-orange-50 p-3 rounded-lg border-2 border-orange-200">
            <p className="text-sm text-gray-600 font-medium">👷 Chauffeur scanné:</p>
            <p className="text-xl font-bold text-orange-600 mt-1">{driverCode}</p>
          </div>
        )}

        {/* Boutons d action */}
        <div className="space-y-3">
          {step === "idle" && (
            <Button onClick={startBusScan} className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12">
              <Play className="w-5 h-5 mr-2" />
              Démarrer le scan du bus
            </Button>
          )}

          {step === "bus" && status === "locked" && (
            <Button onClick={continueToDriver} className="w-full bg-green-600 hover:bg-green-700 text-white h-12">
              Continuer vers le chauffeur →
            </Button>
          )}

          {step === "driver" && status === "idle" && (
            <Button
              onClick={startDriverScan}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white h-12"
            >
              <Play className="w-5 h-5 mr-2" />
              Démarrer le scan du chauffeur
            </Button>
          )}

          {step === "driver" && status === "locked" && (
            <Button onClick={submitScan} className="w-full bg-green-600 hover:bg-green-700 text-white h-12">
              Envoyer les données
            </Button>
          )}

          {step === "complete" && (
            <>
              <Button onClick={startNewScan} variant="outline" className="w-full h-12">
                <RotateCcw className="w-5 h-5 mr-2" />
                Nouveau scan
              </Button>
              <Button
                onClick={() => router.push("/dashboard")}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12"
              >
                Retour au Dashboard
              </Button>
            </>
          )}

          {(step === "bus" || step === "driver") && status === "scanning" && (
            <Button onClick={stopScanning} variant="destructive" className="w-full h-12">
              Annuler le scan
            </Button>
          )}
        </div>

        <div className="text-center text-xs text-gray-400 border-t pt-4">
          Système de contrôle d accès • Version 2.0.0
        </div>
      </div>
    </div>
  )
}