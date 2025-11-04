"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { BrowserMultiFormatReader } from "@zxing/library"
import { Home, Bus, User, Camera, SwitchCamera, Play, RotateCcw } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"

export default function PostPage() {
  const router = useRouter()
  const [step, setStep] = useState<"idle" | "bus" | "driver" | "sending" | "complete">("idle")
  const [busCode, setBusCode] = useState<string | null>(null)
  const [driverCode, setDriverCode] = useState<string | null>(null)
  const [message, setMessage] = useState<string>("Cliquez sur  Démarrer le scan  pour commencer")
  const [status, setStatus] = useState<"idle" | "scanning" | "locked" | "sending" | "success" | "error">("idle")
  const [cameraId, setCameraId] = useState<string | null>(null)
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([])
  const [isCameraLoading, setIsCameraLoading] = useState(false)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const readerRef = useRef<BrowserMultiFormatReader | null>(null)

  // Obtenir la liste des caméras disponibles
  const getCameras = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter((device) => device.kind === "videoinput")
      setAvailableCameras(videoDevices)

      const backCamera = videoDevices.find(
        (device) =>
          device.label.toLowerCase().includes("back") ||
          device.label.toLowerCase().includes("arrière") ||
          !device.label.toLowerCase().includes("front"),
      )

      return backCamera?.deviceId || videoDevices[0]?.deviceId || null
    } catch (error) {
      console.error("Erreur lors de la récupération des caméras:", error)
      return null
    }
  }

  const handleScan = useCallback(
    (code: string) => {
      if (step === "bus" && status === "scanning") {
        setBusCode(code)
        setStatus("locked")
        setMessage(`✅ Bus scanné: ${code}\n\nCliquez sur "Continuer" pour scanner le chauffeur`)
        if (readerRef.current) {
          readerRef.current.reset()
        }
      } else if (step === "driver" && status === "scanning") {
        setDriverCode(code)
        setStatus("locked")
        setMessage(`✅ Chauffeur scanné: ${code}\n\nDonnées prêtes à envoyer`)
        if (readerRef.current) {
          readerRef.current.reset()
        }
      }
    },
    [step, status],
  )

  // Initialisation du scanner vidéo
  const initializeScanner = async (deviceId: string | null = null) => {
    setIsCameraLoading(true)
    setStatus("scanning")

    try {
      const reader = new BrowserMultiFormatReader()
      readerRef.current = reader

      reader.reset()

      await reader.decodeFromVideoDevice(deviceId, videoRef.current!, (result) => {
        if (result) handleScan(result.getText())
      })
    } catch (error) {
      console.error("Erreur d initialisation du scanner:", error)
      setMessage("❌ Erreur de caméra")
      setStatus("idle")
    } finally {
      setIsCameraLoading(false)
    }
  }

  // Arrêter le scanner
  const stopScanner = () => {
    if (readerRef.current) {
      readerRef.current.reset()
    }
    setStatus("idle")
  }

  const startBusScan = async () => {
    setStep("bus")
    setMessage("📷 Scannez le bus...")
    const preferredCameraId = cameraId || (await getCameras())
    setCameraId(preferredCameraId)
    await initializeScanner(preferredCameraId)
  }

  const continueToDriver = async () => {
    setStep("driver")
    setDriverCode(null)
    setMessage("📷 Scannez le chauffeur...")
    const preferredCameraId = cameraId || (await getCameras())
    await initializeScanner(preferredCameraId)
  }

  const submitScan = async () => {
    if (!busCode || !driverCode) {
      setMessage("❌ Les deux codes sont nécessaires")
      return
    }

    setStep("sending")
    setStatus("sending")
    setMessage("⏳ Envoi des données...")
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
      setMessage(`✅ Pointage réussi!\n\n${data?.message || "Les données ont été enregistrées"}`)
      localStorage.setItem("scan_success_message", `✅ Pointage effectué avec succès! ${data?.message || ""}`)
    } catch (error) {
      setStep("complete")
      setStatus("error")
      setMessage("❌ Erreur lors de l envoi des données")
      localStorage.setItem("scan_error_message", "❌ Erreur lors du pointage!")
    }
  }

  const startNewScan = () => {
    setBusCode(null)
    setDriverCode(null)
    setStep("idle")
    setStatus("idle")
    setMessage("Cliquez sur  Démarrer le scan  pour commencer une nouvelle scan")
    stopScanner()
  }

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      window.location.href = "/login"
      return
    }

    // Vérifier si le type a été choisi
    const type = localStorage.getItem("type_s")
    if (!type) {
      // Rediriger vers le dashboard si le type n est pas défini
      router.push("/dashboard")
      return
    }

    const init = async () => {
      const preferredCameraId = await getCameras()
      setCameraId(preferredCameraId)
    }

    init()

    return () => {
      if (readerRef.current) {
        readerRef.current.reset()
      }
    }
  }, [router])

  const handleLogout = () => {
    localStorage.clear()
    if (readerRef.current) {
      readerRef.current.reset()
    }
    window.location.href = "/login"
  }

  const switchCamera = async () => {
    if (availableCameras.length <= 1) return

    const currentIndex = availableCameras.findIndex((cam) => cam.deviceId === cameraId)
    const nextIndex = (currentIndex + 1) % availableCameras.length
    const nextCamera = availableCameras[nextIndex]

    setCameraId(nextCamera.deviceId)

    if (status === "scanning") {
      await initializeScanner(nextCamera.deviceId)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      {/* Header */}
      <div className="fixed top-0 w-full bg-white shadow-sm p-4 flex justify-between items-center z-50">
        <div className="flex items-center">
          <Home className="w-5 h-5 text-blue-600 mr-2" />
          <span className="font-semibold text-gray-800">Système de pointage</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">
            Type: {localStorage.getItem("type_s") === "entrer" ? "Entrée" : "Sortie"}
          </span>
          <Button onClick={handleLogout} className="bg-gray-500 hover:bg-gray-600 text-white">
            Déconnexion
          </Button>
        </div>
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
                <div className="animate-spin">⏳</div>
              </div>
              <p className="text-lg font-semibold">Envoi en cours...</p>
            </>
          )}
          {step === "complete" && (
            <>
              {status === "success" ? <div className="text-4xl">✅</div> : <div className="text-4xl">❌</div>}
              <p className="text-lg font-semibold">{status === "success" ? "Pointage réussi" : "Erreur"}</p>
            </>
          )}

          <p className="text-sm text-gray-600 whitespace-pre-line mt-4">{message}</p>
        </div>

        {/* Zone vidéo - visible seulement si scan actif */}
        {(step === "bus" || step === "driver") && (
          <>
            <div className="flex justify-between items-center">
              <div className="flex items-center text-sm text-gray-600">
                <Camera className="w-4 h-4 mr-2" />
                {availableCameras.find((cam) => cam.deviceId === cameraId)?.label || "Caméra"}
              </div>

              {availableCameras.length > 1 && (
                <Button
                  onClick={switchCamera}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 bg-transparent"
                  disabled={isCameraLoading}
                >
                  <SwitchCamera className="w-4 h-4" />
                  Changer
                </Button>
              )}
            </div>

            <div className="relative">
              <video ref={videoRef} className="w-full border-2 border-gray-300 rounded" autoPlay muted playsInline />

              {isCameraLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded">
                  <div className="text-center">
                    <Camera className="w-8 h-8 animate-pulse mx-auto text-gray-400" />
                    <p className="text-sm text-gray-500 mt-2">Initialisation...</p>
                  </div>
                </div>
              )}

              {status === "locked" && (
                <div className="absolute inset-0 flex items-center justify-center bg-green-100 rounded opacity-80">
                  <div className="text-center">
                    <div className="text-5xl">✅</div>
                    <p className="text-sm font-semibold text-green-700 mt-2">Scanné!</p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Codes scannés affichés */}
        {busCode && (
          <div className="bg-blue-50 p-3 rounded border border-blue-200">
            <p className="text-sm text-gray-600">🚍 Bus scanné:</p>
            <p className="text-lg font-bold text-blue-600">{busCode}</p>
          </div>
        )}

        {driverCode && (
          <div className="bg-orange-50 p-3 rounded border border-orange-200">
            <p className="text-sm text-gray-600">👷 Chauffeur scanné:</p>
            <p className="text-lg font-bold text-orange-600">{driverCode}</p>
          </div>
        )}

        {/* Boutons d action */}
        <div className="space-y-3">
          {step === "idle" && (
            <Button onClick={startBusScan} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
              <Play className="w-4 h-4 mr-2" />
              Démarrer le scan
            </Button>
          )}

          {step === "bus" && status === "locked" && (
            <Button onClick={continueToDriver} className="w-full bg-green-600 hover:bg-green-700 text-white">
              Continuer →
            </Button>
          )}

          {step === "driver" && status === "locked" && (
            <Button onClick={submitScan} className="w-full bg-green-600 hover:bg-green-700 text-white">
              Envoyer les données
            </Button>
          )}

          {step === "complete" && (
            <>
              <Button onClick={startNewScan} variant="outline" className="w-full bg-transparent">
                <RotateCcw className="w-4 h-4 mr-2" />
                Nouvelle scan
              </Button>
              <Button
                onClick={() => router.push("/dashboard")}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                Retour au Dashboard
              </Button>
            </>
          )}

          {(step === "bus" || step === "driver") && status === "scanning" && (
            <Button onClick={stopScanner} variant="destructive" className="w-full">
              Annuler
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