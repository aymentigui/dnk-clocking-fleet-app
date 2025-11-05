"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  BrowserMultiFormatReader,
  DecodeHintType,
  BarcodeFormat,
  NotFoundException,
} from "@zxing/library";
import {
  Home,
  Bus,
  User,
  CheckCircle,
  XCircle,
  Camera,
  CameraOff,
} from "lucide-react";

export default function PostPage() {
  const [step, setStep] = useState<
    | "idle"
    | "scanning-bus"
    | "bus-scanned"
    | "scanning-driver"
    | "sending"
    | "success"
    | "error"
  >("idle");
  const [busCode, setBusCode] = useState<string | null>(null);
  const [driverCode, setDriverCode] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("");
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string>("");
  const [scanningStatus, setScanningStatus] = useState<string>(
    "Prêt à scanner..."
  );
  const [conducteurName, setConducteurName] = useState<string>("");
  const [busName, setBusName] = useState<string>("");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const scanTimeoutRef = useRef<number | null>(null);
  const hasHandledScanRef = useRef<boolean>(false); // ✅ évite les scans multiples

  /** ✅ Configuration du lecteur QR code */
  const initializeReader = () => {
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE]);
    hints.set(DecodeHintType.TRY_HARDER, true);

    const reader = new BrowserMultiFormatReader(hints as any);
    readerRef.current = reader;
    return reader;
  };

  /** ✅ Démarrer le scan du bus */
  const startBusScan = async () => {
    setStep("scanning-bus");
    setBusCode(null);
    setDriverCode(null);
    setMessage("");
    setCameraError("");
    setScanningStatus("Recherche de QR code...");
    hasHandledScanRef.current = false;
    await startCamera();
  };

  /** ✅ Démarrer le scan du chauffeur */
  const startDriverScan = async () => {
    setStep("scanning-driver");
    setMessage("");
    setCameraError("");
    setScanningStatus("Recherche de QR code...");
    hasHandledScanRef.current = false;
    await startCamera();
  };

  /** ✅ Démarrer la caméra + décodage continu */
  const startCamera = async () => {
    try {
      stopCamera(); // nettoie proprement avant de redémarrer

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Votre navigateur ne supporte pas l accès à la caméra");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" }, // caméra arrière si dispo
          width: { ideal: 1280 },
          height: { ideal: 720 },
          aspectRatio: { ideal: 1.7777777778 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");

        await new Promise<void>((resolve, reject) => {
          if (!videoRef.current) return reject(new Error("Élément vidéo absent"));
          const v = videoRef.current;

          const onLoaded = () => {
            v.removeEventListener("loadedmetadata", onLoaded);
            resolve();
          };
          const onError = () => {
            v.removeEventListener("error", onError);
            reject(new Error("Erreur lors du chargement de la vidéo"));
          };
          v.addEventListener("loadedmetadata", onLoaded);
          v.addEventListener("error", onError);

          // Sécurité si loadedmetadata ne se déclenche pas
          scanTimeoutRef.current = window.setTimeout(() => resolve(), 1500);
        });

        try {
          await videoRef.current.play();
        } catch (playError) {
          // Certaines plateformes bloquent play() sans interaction; on continue quand même
          console.warn("Erreur play():", playError);
        }

        // ✅ Démarrer le décodage continu *SUR L ÉLÉMENT VIDÉO EXISTANT*
        const reader = initializeReader();
        setIsScanning(true);
        setScanningStatus("Scan en cours... Placez le QR code dans le cadre");

        // Important : on n utilise PAS decodeFromVideoDevice ici pour éviter le conflit
        // avec notre getUserMedia. On utilise decodeFromVideoElementContinuously.
        try {
          reader.decodeFromVideoElementContinuously(
            videoRef.current!,
            (result, err) => {
              if (result && !hasHandledScanRef.current) {
                hasHandledScanRef.current = true; // antibounce
                const code = result.getText?.() ?? "";
                if (code) {
                  setScanningStatus("QR code détecté !");
                  handleScan(code);
                }
              } else if (err) {
                // Erreurs attendues quand aucun code n est visible : NotFoundException
                if (!(err instanceof NotFoundException)) {
                  // on log seulement sans afficher d erreur bloquante
                  // eslint-disable-next-line no-console
                  console.debug("Décodage en cours...", err?.message ?? err);
                }
              }
            }
          );
        } catch (decodeError) {
          console.error("Erreur de décodage continu:", decodeError);
          setScanningStatus("Erreur de scan - Réessayez");
        }
      }
    } catch (error) {
      console.error("Erreur caméra:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Impossible d accéder à la caméra. Vérifiez les permissions.";

      setCameraError(errorMessage);
      setMessage(`❌ ${errorMessage}`);
      setStep("error");
      stopCamera();
    }
  };

  /** ✅ Arrêter la caméra + décodage continu */
  const stopCamera = () => {
    // Arrêter le lecteur
    if (readerRef.current) {
      try {
        // stopContinuousDecode n existe pas sur toutes les versions; reset suffit
        (readerRef.current as any).stopContinuousDecode?.();
      } catch (e) {
        // ignore
      }
      try {
        readerRef.current.reset();
      } catch (e) {
        // ignore
      }
      readerRef.current = null;
    }

    // Arrêter le stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    // Nettoyer la vidéo
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    // Nettoyer le timeout
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
      scanTimeoutRef.current = null;
    }

    setIsScanning(false);
    setScanningStatus("Caméra arrêtée");
  };

  /** ✅ Gérer un résultat de scan (antidoublon inclus) */
  const handleScan = (code: string) => {
    if (!code || !code.trim()) {
      // ne pas casser le flux, on garde le continu
      setScanningStatus("QR code invalide - Réessayez");
      hasHandledScanRef.current = false; // autoriser un prochain essai
      return;
    }

    if (step === "scanning-bus") {
      setBusCode(code);
      setStep("bus-scanned");
      stopCamera(); // on arrête la caméra avant l étape suivante
    } else if (step === "scanning-driver") {
      setDriverCode(code);
      stopCamera();
      // busCode est non nul à cette étape (bus-scanned => scanning-driver)
      sendData(busCode!, code);
    }
  };

  /** ✅ Fallback: tentative de scan "one-shot" sur l image courante */
  const forceScanDetection = async () => {
    if (!readerRef.current || !videoRef.current) return;
    try {
      const res = await readerRef.current.decodeFromVideoElement(
        videoRef.current
      );
      const code = res.getText?.() ?? "";
      if (code) {
        hasHandledScanRef.current = true;
        handleScan(code);
      } else {
        setScanningStatus("Aucun QR détecté - Réessayez");
      }
    } catch (err) {
      // NotFound = pas de code sur cette frame; on ne remonte pas d erreur bloquante
      if (!(err instanceof NotFoundException)) {
        console.error("Erreur scan manuel:", err);
      }
      setScanningStatus("Aucun QR détecté - Réessayez");
    }
  };

  /** ✅ Envoi des données au backend */
  const sendData = async (bus: string, conducteur: string) => {
    setStep("sending");
    const token = localStorage.getItem("token");
    const type = localStorage.getItem("type_s");

    try {
      const res = await fetch(
        "https://dnk.aimen-blog.com/api/admin/clocking",
        {
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
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setStep("error");
        setMessage(
          data?.data?.message || data?.message || "Erreur lors de l envoi des données"
        );
      } else {
        setConducteurName(data?.data?.conducteur_name || "");
        setBusName(data?.data?.vehicle || "");
        setStep("success");
        setMessage(data?.message || "Données envoyées avec succès !");
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
    setBusCode(null);
    setDriverCode(null);
    setMessage("");
    setCameraError("");
    setScanningStatus("Prêt à scanner...");
    hasHandledScanRef.current = false;
  };

  /** ✅ Retour au dashboard */
  const goToDashboard = () => {
    stopCamera();
    window.location.href = "/dashboard";
  };

  /** ✅ Déconnexion */
  const handleLogout = () => {
    stopCamera();
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
          <span className="font-semibold text-gray-800">
            Système de pointage
          </span>
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
            <p className="text-gray-600">
              Commencez par scanner le QR code du bus
            </p>
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
              <h3 className="mt-3 text-xl font-semibold text-gray-800">
                Scannez le bus 🚍
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Placez le QR code devant la caméra
              </p>
              <div className="mt-2 p-2 bg-blue-50 rounded">
                <p className="text-xs text-blue-600 font-medium">
                  {scanningStatus}
                </p>
              </div>
            </div>

            {cameraError ? (
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <XCircle className="w-12 h-12 mx-auto text-red-500 mb-2" />
                <p className="text-red-600 font-medium">{cameraError}</p>
                <Button
                  onClick={startBusScan}
                  className="mt-3 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Réessayer
                </Button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <video
                    ref={videoRef}
                    className="w-full h-64 border-4 border-blue-400 rounded-lg bg-black"
                    autoPlay
                    muted
                    playsInline
                  />
                  {/* Overlay pour aider au cadrage */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="border-2 border-white border-dashed w-48 h-48 rounded-lg opacity-70"></div>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button onClick={forceScanDetection} variant="outline" className="flex-1">
                    <Camera className="w-4 h-4 mr-2" />
                    Forcer la détection
                  </Button>
                  <Button onClick={stopCamera} variant="outline" className="flex-1">
                    <CameraOff className="w-4 h-4 mr-2" />
                    Arrêter
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {/* État: Bus scanné */}
        {step === "bus-scanned" && (
          <div className="text-center space-y-6">
            <CheckCircle className="w-20 h-20 mx-auto text-green-500" />
            <h3 className="text-xl font-bold text-gray-800">
              ✅ Bus scanné avec succès !
            </h3>
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
              <p className="text-sm text-gray-600">Matricule du bus</p>
              <p className="text-2xl font-bold text-blue-600">{busCode}</p>
            </div>
            <p className="text-gray-600">
              Maintenant, scannez le QR code du chauffeur
            </p>
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
              <h3 className="mt-3 text-xl font-semibold text-gray-800">
                Scannez le chauffeur 👷‍♂️
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Placez le QR code devant la caméra
              </p>
              <div className="mt-2 bg-blue-50 border border-blue-200 rounded p-2">
                <p className="text-xs text-gray-600">
                  Bus:{" "}
                  <span className="font-bold text-blue-600">{busCode}</span>
                </p>
              </div>
              <div className="mt-2 p-2 bg-orange-50 rounded">
                <p className="text-xs text-orange-600 font-medium">
                  {scanningStatus}
                </p>
              </div>
            </div>

            {cameraError ? (
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <XCircle className="w-12 h-12 mx-auto text-red-500 mb-2" />
                <p className="text-red-600 font-medium">{cameraError}</p>
                <Button
                  onClick={startDriverScan}
                  className="mt-3 bg-orange-500 hover:bg-orange-600 text-white"
                >
                  Réessayer
                </Button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <video
                    ref={videoRef}
                    className="w-full h-64 border-4 border-orange-400 rounded-lg bg-black"
                    autoPlay
                    muted
                    playsInline
                  />
                  {/* Overlay pour aider au cadrage */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="border-2 border-white border-dashed w-48 h-48 rounded-lg opacity-70"></div>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button onClick={forceScanDetection} variant="outline" className="flex-1">
                    <Camera className="w-4 h-4 mr-2" />
                    Forcer la détection
                  </Button>
                  <Button onClick={stopCamera} variant="outline" className="flex-1">
                    <CameraOff className="w-4 h-4 mr-2" />
                    Arrêter
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {/* État: Envoi en cours */}
        {step === "sending" && (
          <div className="text-center space-y-6 py-8">
            <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-blue-600 mx-auto"></div>
            <h3 className="text-xl font-semibold text-gray-800">
              Envoi en cours...
            </h3>
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
                <span className="font-bold text-gray-800">{busName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Chauffeur:</span>
                <span className="font-bold text-gray-800">{conducteurName}</span>
              </div>
            </div>
            <div className="space-y-3">
              <Button
                onClick={handleNewScan}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4"
              >
                Nouveau scan 🔄
              </Button>
              <Button onClick={goToDashboard} variant="outline" className="w-full py-4">
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
              <Button onClick={goToDashboard} variant="outline" className="w-full py-4">
                Retour au tableau de bord 🏠
              </Button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-gray-400 border-t pt-4 mt-6">
          Système de contrôle d accès • Version 2.0.1
        </div>
      </div>
    </div>
  );
}
