"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { BrowserMultiFormatReader } from "@zxing/library";
import { Home, Bus, User, Camera, SwitchCamera } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function PostPage() {
  const router = useRouter();
  const [step, setStep] = useState<"bus" | "driver">("bus");
  const [busCode, setBusCode] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>("Scannez un bus 🚍");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [cameraId, setCameraId] = useState<string | null>(null);
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [isCameraLoading, setIsCameraLoading] = useState(true);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);

  /** ✅ Obtenir la liste des caméras disponibles */
  const getCameras = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setAvailableCameras(videoDevices);
      
      // Préférer la caméra arrière (généralement celle qui n'est pas "front")
      const backCamera = videoDevices.find(device => 
        device.label.toLowerCase().includes('back') || 
        device.label.toLowerCase().includes('arrière') ||
        !device.label.toLowerCase().includes('front')
      );
      
      return backCamera?.deviceId || videoDevices[0]?.deviceId || null;
    } catch (error) {
      console.error("Erreur lors de la récupération des caméras:", error);
      return null;
    }
  };

  /** ✅ Fonction de scan stabilisée */
  const handleScan = useCallback(
    (code: string) => {
      if (step === "bus") {
        setBusCode(code);
        setStep("driver");
        setMessage("✅ Bus scanné ! Maintenant scannez le chauffeur 👷‍♂️");
      } else if (busCode) {
        sendData(busCode, code);
      }
    },
    [step, busCode]
  );

  /** ✅ Initialisation du scanner vidéo */
  const initializeScanner = async (deviceId: string | null = null) => {
    setIsCameraLoading(true);
    
    try {
      const reader = new BrowserMultiFormatReader();
      readerRef.current = reader;

      // Arrêter le scanner précédent
      reader.reset();

      // Démarrer avec la caméra spécifiée
      await reader.decodeFromVideoDevice(
        deviceId, 
        videoRef.current!, 
        (result) => {
          if (result) handleScan(result.getText());
        }
      );
    } catch (error) {
      console.error("Erreur d'initialisation du scanner:", error);
      setMessage("❌ Erreur de caméra");
    } finally {
      setIsCameraLoading(false);
    }
  };

  /** ✅ Changer de caméra */
  const switchCamera = async () => {
    if (availableCameras.length <= 1) return;
    
    const currentIndex = availableCameras.findIndex(cam => cam.deviceId === cameraId);
    const nextIndex = (currentIndex + 1) % availableCameras.length;
    const nextCamera = availableCameras[nextIndex];
    
    setCameraId(nextCamera.deviceId);
    await initializeScanner(nextCamera.deviceId);
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/login";
      return;
    }

    const init = async () => {
      const preferredCameraId = await getCameras();
      setCameraId(preferredCameraId);
      await initializeScanner(preferredCameraId);
    };

    init();

    return () => {
      if (readerRef.current) {
        readerRef.current.reset();
      }
    };
  }, [handleScan]);

  /** ✅ Envoi des données au backend */
  const sendData = async (bus: string, conducteur: string) => {
    setStatus("sending");
    const token = localStorage.getItem("token");
    const type = localStorage.getItem("type_s");

    try {
      const res = await fetch("https://dnk-clocking-fleet.vercel.app/api/admin/clocking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          matricule: bus,
          conducteur_id: conducteur,
          type,
        }),
      });

      if (!res.ok) throw new Error("Erreur d'envoi");
      
      setStatus("success");
      setMessage("✅ Données envoyées avec succès !");
      
      localStorage.setItem("scan_success_message", "✅ Pointage effectué avec succès !");
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
      
    } catch {
      setStatus("error");
      setMessage("❌ Échec de l'envoi !");
      
      localStorage.setItem("scan_error_message", "❌ Erreur lors du pointage !");
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    }
  };

  /** ✅ Déconnexion propre */
  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      {/* Header */}
      <div className="fixed top-0 w-full bg-white shadow-sm p-4 flex justify-between items-center">
        <div className="flex items-center">
          <Home className="w-5 h-5 text-blue-600 mr-2" />
          <span className="font-semibold text-gray-800">Système de pointage</span>
        </div>
        <Button
          onClick={handleLogout}
          className="bg-gray-500 hover:bg-gray-600 text-white"
        >
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
          {step === "bus" ? (
            <Bus className="w-16 h-16 mx-auto text-blue-500" />
          ) : (
            <User className="w-16 h-16 mx-auto text-orange-500" />
          )}
          <p className="mt-2 text-lg font-semibold">
            {step === "bus" ? "Scannez le bus 🚍" : "Scannez le chauffeur 👷‍♂️"}
          </p>
          {message && <p className="text-sm text-gray-500 mt-1">{message}</p>}
        </div>

        {/* Contrôles de caméra */}
        <div className="flex justify-between items-center">
          <div className="flex items-center text-sm text-gray-600">
            <Camera className="w-4 h-4 mr-2" />
            {availableCameras.find(cam => cam.deviceId === cameraId)?.label || "Caméra"}
          </div>
          
          {availableCameras.length > 1 && (
            <Button
              onClick={switchCamera}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <SwitchCamera className="w-4 h-4" />
              Changer
            </Button>
          )}
        </div>

        {/* Zone vidéo */}
        <div className="relative">
          <video
            ref={videoRef}
            className="w-full border border-gray-300 rounded"
            autoPlay
            muted
            playsInline
          />
          
          {isCameraLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded">
              <div className="text-center">
                <Camera className="w-8 h-8 animate-pulse mx-auto text-gray-400" />
                <p className="text-sm text-gray-500 mt-2">Initialisation de la caméra...</p>
              </div>
            </div>
          )}
        </div>

        {status === "sending" && (
          <p className="text-blue-500 text-center">⏳ Envoi en cours...</p>
        )}
        {status === "success" && (
          <p className="text-green-500 text-center">✅ Envoi réussi - Redirection...</p>
        )}
        {status === "error" && (
          <p className="text-red-500 text-center">❌ Erreur d'envoi - Redirection...</p>
        )}

        {/* Bouton de retour manuel */}
        <Button
          onClick={() => router.push("/dashboard")}
          variant="outline"
          className="w-full"
        >
          Retour au Dashboard
        </Button>

        <div className="text-center text-xs text-gray-400 border-t pt-4 mt-4">
          Système de contrôle d'accès • Version 1.1.0
        </div>
      </div>
    </div>
  );
}