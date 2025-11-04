"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { BrowserMultiFormatReader } from "@zxing/library";
import { Home, Bus, User, CheckCircle, XCircle } from "lucide-react";

export default function PostPage() {
  const [step, setStep] = useState<"idle" | "scanning-bus" | "bus-scanned" | "scanning-driver" | "sending" | "success" | "error">("idle");
  const [busCode, setBusCode] = useState<string | null>(null);
  const [driverCode, setDriverCode] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("");
  const [isScanning, setIsScanning] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);

  /** ✅ Démarrer le scan du bus */
  const startBusScan = () => {
    setStep("scanning-bus");
    setBusCode(null);
    setDriverCode(null);
    setMessage("");
    startCamera();
  };

  /** ✅ Démarrer le scan du chauffeur */
  const startDriverScan = () => {
    setStep("scanning-driver");
    setMessage("");
    startCamera();
  };

  /** ✅ Démarrer la caméra */
  const startCamera = () => {
    if (readerRef.current) {
      readerRef.current.reset();
    }

    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;
    setIsScanning(true);

    reader.decodeFromVideoDevice(null, videoRef.current!, (result) => {
      if (result) {
        const code = result.getText();
        handleScan(code);
      }
    }).catch((err) => {
      console.error("Erreur caméra:", err);
      setMessage("❌ Impossible d accéder à la caméra");
    });
  };

  /** ✅ Arrêter la caméra */
  const stopCamera = () => {
    if (readerRef.current) {
      readerRef.current.reset();
      setIsScanning(false);
    }
  };

  /** ✅ Gérer le scan */
  const handleScan = (code: string) => {
    if (step === "scanning-bus") {
      setBusCode(code);
      setStep("bus-scanned");
      stopCamera();
    } else if (step === "scanning-driver") {
      setDriverCode(code);
      stopCamera();
      sendData(busCode!, code);
    }
  };

  /** ✅ Envoi des données au backend */
  const sendData = async (bus: string, conducteur: string) => {
    setStep("sending");
    const token = localStorage.getItem("token");
    const typeS = localStorage.getItem("type_s");
    const type = typeS ? typeS : localStorage.getItem("type");

    try {
      const res = await fetch("https://dnk-clocking-fleet.vercel.app/api/admin/clocking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          matricule: bus,
          conducteur_matricule: conducteur,
          type,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStep("error");
        setMessage(data.message || "Erreur lors de l envoi des données");
      } else {
        setStep("success");
        setMessage(data.message || "Données envoyées avec succès !");
      }
    } catch (error) {
      setStep("error");
      setMessage("❌ Erreur de connexion au serveur");
    }
  };

  /** ✅ Nouveau scan */
  const handleNewScan = () => {
    setStep("idle");
    setBusCode(null);
    setDriverCode(null);
    setMessage("");
  };

  /** ✅ Retour au dashboard */
  const goToDashboard = () => {
    window.location.href = "/dashboard";
  };

  /** ✅ Déconnexion */
  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  /** ✅ Vérification de l authentification */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/login";
    }
  }, []);

  /** ✅ Nettoyage lors du démontage */
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-gray-100">
      {/* Header */}
      <div className="fixed top-0 w-full bg-white shadow-md p-4 flex justify-between items-center z-10">
        <div className="flex items-center">
          <Home className="w-5 h-5 text-blue-600 mr-2" />
          <span className="font-semibold text-gray-800">Système de pointage</span>
        </div>
        <Button
          onClick={handleLogout}
          variant="outline"
          className="text-gray-700 hover:bg-gray-100"
        >
          Déconnexion
        </Button>
      </div>

      {/* Contenu principal */}
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-6 mt-20 mb-6 space-y-6">
        
        {/* État: Idle - Démarrer le scan */}
        {step === "idle" && (
          <div className="text-center space-y-6">
            <Bus className="w-20 h-20 mx-auto text-blue-500" />
            <h2 className="text-2xl font-bold text-gray-800">Pointage Bus</h2>
            <p className="text-gray-600">Commencez par scanner le QR code du bus</p>
            <Button
              onClick={startBusScan}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg"
            >
              Démarrer le scan 🚍
            </Button>
          </div>
        )}

        {/* État: Scan du bus en cours */}
        {step === "scanning-bus" && (
          <div className="space-y-4">
            <div className="text-center">
              <Bus className="w-16 h-16 mx-auto text-blue-500 animate-pulse" />
              <h3 className="mt-3 text-xl font-semibold text-gray-800">Scannez le bus 🚍</h3>
              <p className="text-sm text-gray-500 mt-1">Placez le QR code devant la caméra</p>
            </div>
            <video
              ref={videoRef}
              className="w-full border-4 border-blue-400 rounded-lg"
              autoPlay
              muted
            />
          </div>
        )}

        {/* État: Bus scanné */}
        {step === "bus-scanned" && (
          <div className="text-center space-y-6">
            <CheckCircle className="w-20 h-20 mx-auto text-green-500" />
            <h3 className="text-xl font-bold text-gray-800">✅ Bus scanné avec succès !</h3>
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
              <p className="text-sm text-gray-600">Matricule du bus</p>
              <p className="text-2xl font-bold text-blue-600">{busCode}</p>
            </div>
            <p className="text-gray-600">Maintenant, scannez le QR code du chauffeur</p>
            <Button
              onClick={startDriverScan}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white py-6 text-lg"
            >
              Scanner le chauffeur 👷‍♂️
            </Button>
          </div>
        )}

        {/* État: Scan du chauffeur en cours */}
        {step === "scanning-driver" && (
          <div className="space-y-4">
            <div className="text-center">
              <User className="w-16 h-16 mx-auto text-orange-500 animate-pulse" />
              <h3 className="mt-3 text-xl font-semibold text-gray-800">Scannez le chauffeur 👷‍♂️</h3>
              <p className="text-sm text-gray-500 mt-1">Placez le QR code devant la caméra</p>
              <div className="mt-2 bg-blue-50 border border-blue-200 rounded p-2">
                <p className="text-xs text-gray-600">Bus: <span className="font-bold text-blue-600">{busCode}</span></p>
              </div>
            </div>
            <video
              ref={videoRef}
              className="w-full border-4 border-orange-400 rounded-lg"
              autoPlay
              muted
            />
          </div>
        )}

        {/* État: Envoi en cours */}
        {step === "sending" && (
          <div className="text-center space-y-6 py-8">
            <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-blue-600 mx-auto"></div>
            <h3 className="text-xl font-semibold text-gray-800">Envoi en cours...</h3>
            <p className="text-gray-600">Veuillez patienter</p>
          </div>
        )}

        {/* État: Succès */}
        {step === "success" && (
          <div className="text-center space-y-6">
            <CheckCircle className="w-24 h-24 mx-auto text-green-500" />
            <h3 className="text-2xl font-bold text-green-600">✅ Succès !</h3>
            <p className="text-gray-700">{message}</p>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Bus:</span>
                <span className="font-bold text-gray-800">{busCode}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Chauffeur:</span>
                <span className="font-bold text-gray-800">{driverCode}</span>
              </div>
            </div>
            <div className="space-y-3">
              <Button
                onClick={handleNewScan}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4"
              >
                Nouveau scan 🔄
              </Button>
              <Button
                onClick={goToDashboard}
                variant="outline"
                className="w-full py-4"
              >
                Retour au tableau de bord 🏠
              </Button>
            </div>
          </div>
        )}

        {/* État: Erreur */}
        {step === "error" && (
          <div className="text-center space-y-6">
            <XCircle className="w-24 h-24 mx-auto text-red-500" />
            <h3 className="text-2xl font-bold text-red-600">❌ Erreur</h3>
            <p className="text-gray-700">{message}</p>
            <div className="space-y-3">
              <Button
                onClick={handleNewScan}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4"
              >
                Réessayer 🔄
              </Button>
              <Button
                onClick={goToDashboard}
                variant="outline"
                className="w-full py-4"
              >
                Retour au tableau de bord 🏠
              </Button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-gray-400 border-t pt-4 mt-6">
          Système de contrôle d accès • Version 2.0.0
        </div>
      </div>
    </div>
  );
}