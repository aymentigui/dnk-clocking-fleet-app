"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { BrowserMultiFormatReader, DecodeHintType, BarcodeFormat } from "@zxing/library";
import { Bus } from "lucide-react";
import Header from "@/components/Header";
import ErreurAlert from "./_componenet/erreur-alert";
import SuccessAlert from "./_componenet/succes-alert";
import Footer from "@/components/footer";
import BusScanned from "./_componenet/bus-scanned";
import ScanningBus from "./_componenet/scanning-bus";
import ScanningDriver from "./_componenet/scanning-driver";

export default function PostPage() {
  const [step, setStep] = useState<"idle" | "scanning-bus" | "bus-scanned" | "scanning-driver" | "sending" | "success" | "error">("idle");
  const [busCode, setBusCode] = useState<string | null>(null);
  const [driverCode, setDriverCode] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("");
  const [cameraError, setCameraError] = useState<string>("");
  const [scanningStatus, setScanningStatus] = useState<string>("Prêt à scanner...");
  const [conducteurName, setConducteurName] = useState<string>("");
  const [busName, setBusName] = useState<string>("");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /** ✅ Configuration du lecteur QR code */
  const initializeReader = () => {
    // Configurer les hints pour améliorer la détection
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE]);
    hints.set(DecodeHintType.TRY_HARDER, true);

    const reader = new BrowserMultiFormatReader(hints);
    readerRef.current = reader;
    return reader;
  };

  useEffect(() => {
    if (step === "scanning-bus") {
      const start = async () => {
        setBusCode(null);
        setDriverCode(null);
        setMessage("");
        setCameraError("");
        setScanningStatus("Recherche de QR code...");
        await startCamera();
      }
      start();
    } else if (step === "scanning-driver") {
      const start = async () => {
        setMessage("");
        setCameraError("");
        setScanningStatus("Recherche de QR code...");
        await startCamera();
      }
      start();
    }

    return () => {
      // Nettoyage si le step change
      stopCamera();
    }
  }, [step]);

  /** ✅ Démarrer le scan du bus */
  const startBusScan = async () => {
    setStep("scanning-bus");
  };

  /** ✅ Démarrer le scan du chauffeur */
  const startDriverScan = async () => {
    setStep("scanning-driver");
  };

  /** ✅ Démarrer la caméra */
  const startCamera = async () => {
    try {
      // Arrêter la caméra existante
      stopCamera();

      // Vérifier si les APIs sont supportées
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Votre navigateur ne supporte pas l accès à la caméra");
      }

      // Demander la permission d accéder à la caméra
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment", // Préférer la caméra arrière
          width: { ideal: 1280 },
          height: { ideal: 720 },
          aspectRatio: { ideal: 1.7777777778 }
        }
      });

      streamRef.current = stream;

      // S assurer que la vidéo est prête
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");

        // Attendre que la vidéo soit chargée
        await new Promise((resolve, reject) => {
          if (!videoRef.current) {
            reject(new Error("Élément vidéo non trouvé"));
            return;
          }

          videoRef.current.onloadedmetadata = () => {
            resolve(true);
          };

          videoRef.current.onerror = () => {
            reject(new Error("Erreur lors du chargement de la vidéo"));
          };

          // Timeout de sécurité
          setTimeout(() => {
            resolve(true); // Forcer la résolution même si loadedmetadata ne se déclenche pas
          }, 2000);
        });

        // Démarrer la lecture
        try {
          await videoRef.current.play();
        } catch (playError) {
          console.warn("Erreur play:", playError);
          // Continuer malgré l erreur de play
        }

        // Initialiser le lecteur QR code
        const reader = initializeReader();
        setScanningStatus("Scan en cours... Placez le QR code dans le cadre");

        // Démarrer la détection de QR codes avec gestion d erreur améliorée
        const startDecoding = () => {
          try {
            reader.decodeFromVideoDevice(
              null,
              videoRef.current!,
              (result, error) => {
                if (result) {
                  console.log("QR code détecté:", result.getText());
                  const code = result.getText();
                  handleScan(code);
                }

                if (error) {
                  // Ignorer les erreurs de décodage normales (pas de QR code visible)
                  if (!error.message?.includes("NotFound")) {
                    console.log("Décodage en cours...", error.message);
                  }
                }
              }
            );
          } catch (decodeError) {
            console.error("Erreur décodage:", decodeError);
            setScanningStatus("Erreur de scan - Réessayez");
          }
        };

        // Démarrer le décodage après un petit délai pour laisser la caméra s initialiser
        setTimeout(startDecoding, 1000);

      }

    } catch (error) {
      console.error("Erreur caméra:", error);
      const errorMessage = error instanceof Error
        ? error.message
        : "Impossible d accéder à la caméra. Vérifiez les permissions.";

      setCameraError(errorMessage);
      setMessage(`❌ ${errorMessage}`);
      setStep("error");
      stopCamera();
    }
  };

  /** ✅ Arrêter la caméra */
  const stopCamera = () => {
    // Arrêter le scan
    if (readerRef.current) {
      try {
        readerRef.current.reset();
        readerRef.current.stopContinuousDecode();
      } catch (error) {
        console.log("Arrêt du lecteur QR");
      }
      readerRef.current = null;
    }

    // Arrêter le stream vidéo
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks();
      tracks.forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }

    // Nettoyer la vidéo
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    // Nettoyer les timeouts
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
    }

    setScanningStatus("Caméra arrêtée");
  };

  /** ✅ Gérer le scan */
  const handleScan = (code: string) => {
    // Validation basique du code
    if (!code || code.trim().length === 0) {
      setScanningStatus("QR code invalide - Réessayez");
      return;
    }

    setScanningStatus("QR code détecté !");

    if (step === "scanning-bus") {
      setBusCode(code);
      setStep("bus-scanned");
      stopCamera();
    } else if (step === "scanning-driver") {
      setDriverCode(code);
      stopCamera();
      sendData(busCode!, code);
    } else if (step === "idle") {
      setBusCode(null);
      setDriverCode(null);
      setMessage("");
      setCameraError("");
      setScanningStatus("Prêt à scanner...");
    }
  };

  /** ✅ Forcer la détection manuellement (fallback) */
  const forceScanDetection = () => {
    if (!readerRef.current || !videoRef.current) return;

    try {
      readerRef.current.decodeFromVideoDevice(
        null,
        videoRef.current,
        (result, error) => {
          if (result) {
            const code = result.getText();
            handleScan(code);
          }
        }
      );
    } catch (error) {
      console.error("Erreur scan manuel:", error);
    }
  };

  /** ✅ Envoi des données au backend */
  const sendData = async (bus: string, conducteur: string) => {
    setStep("sending");
    const token = localStorage.getItem("token");
    const type = localStorage.getItem("type_s");

    try {
      const res = await fetch("https://dnk.aimen-blog.com/api/admin/clocking", {
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
        setMessage(data.data.message || "Erreur lors de l envoi des données");
      } else {
        setConducteurName(data.data.conducteur_name || "");
        setBusName(data.data.vehicle || "");
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
    stopCamera();
    setStep("idle");
  };

  /** ✅ Retour au dashboard */
  const goToDashboard = () => {
    stopCamera();
    window.location.href = "/dashboard";
  };

  /** ✅ Nettoyage lors du démontage */
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-gray-100">

      <Header stopCamera={stopCamera} />

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
          <ScanningBus
            cameraError={cameraError}
            forceScanDetection={forceScanDetection}
            scanningStatus={scanningStatus}
            startBusScan={startBusScan}
            stopCamera={stopCamera}
            videoRef={videoRef}
          />
        )}

        {/* État: Bus scanné */}
        {step === "bus-scanned" && (
          <BusScanned busCode={busCode} startDriverScan={startDriverScan} />
        )}

        {/* État: Scan du chauffeur en cours */}
        {step === "scanning-driver" && (
          <ScanningDriver
            busCode={busCode}
            cameraError={cameraError}
            forceScanDetection={forceScanDetection}
            scanningStatus={scanningStatus}
            startDriverScan={startDriverScan}
            stopCamera={stopCamera}
            videoRef={videoRef}
          />
        )}

        {/* Les autres états restent similaires */}
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
          <SuccessAlert
            busName={busName}
            conducteurName={conducteurName}
            goToDashboard={goToDashboard}
            handleNewScan={handleNewScan}
            message={message} />
        )}

        {/* État: Erreur */}
        {step === "error" && (
          <ErreurAlert message={message} goToDashboard={goToDashboard} handleNewScan={handleNewScan} />
        )}

        <Footer />
      </div>
    </div>
  );
}