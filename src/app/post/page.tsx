"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { BrowserMultiFormatReader } from "@zxing/library";
import { Home, Bus, User } from "lucide-react";
import Image from "next/image";

export default function PostPage() {
  const [step, setStep] = useState<"bus" | "driver">("bus");
  const [busCode, setBusCode] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) window.location.href = "/login";

    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;

    reader.decodeFromVideoDevice(null, videoRef.current!, (result, error) => {
      if (result) handleScan(result.getText());
    });

    return () => reader.reset();
  }, []);

  const handleScan = (code: string) => {
    if (step === "bus") {
      setBusCode(code);
      setStep("driver");
      setMessage("✅ Bus scanné ! Maintenant scannez le chauffeur 👷‍♂️");
    } else {
      sendData(busCode!, code);
    }
  };

  const sendData = async (bus: string, conducteur: string) => {
    setStatus("sending");
    const token = localStorage.getItem("token");
    const type = localStorage.getItem("type_s");

    try {
      const res = await fetch("https://dnk-clocking-fleet.vercel.app/api/admin/clocking", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ matricule: bus, conducteur_id: conducteur, type }),
      });

      if (!res.ok) throw new Error("Erreur d'envoi");
      setStatus("success");
      setMessage("✅ Données envoyées avec succès !");
      setTimeout(() => {
        setStep("bus");
        setBusCode(null);
        setStatus("idle");
        setMessage("Scannez un bus 🚍");
      }, 5000);
    } catch {
      setStatus("error");
      setMessage("❌ Échec de l’envoi !");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="fixed top-0 w-full bg-white shadow-sm p-4 flex justify-between items-center">
        <div className="flex items-center">
          <Home className="w-5 h-5 text-blue-600 mr-2" />
          <span className="font-semibold text-gray-800">Système de pointage</span>
        </div>
        <Button onClick={handleLogout} className="bg-gray-500 hover:bg-gray-600 text-white">
          Déconnexion
        </Button>
      </div>

      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6 mt-16 space-y-6">
        <div className="flex justify-center">
          <Image src="/logo-djamiaya.png" alt="Logo" width={240} height={120} />
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
          <p className="text-sm text-gray-500 mt-1">{message}</p>
        </div>

        <video ref={videoRef} className="w-full border border-gray-300 rounded" />

        {status === "sending" && <p className="text-blue-500 text-center">⏳ Envoi en cours...</p>}
        {status === "success" && <p className="text-green-500 text-center">✅ Envoi réussi</p>}
        {status === "error" && <p className="text-red-500 text-center">❌ Erreur d envoi</p>}

        <div className="text-center text-xs text-gray-400 border-t pt-4 mt-4">
          Système de contrôle d'accès • Version 1.1.0
        </div>
      </div>
    </div>
  );
}
