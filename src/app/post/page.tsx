"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { BrowserMultiFormatReader } from "@zxing/library";
import { getCookie } from "cookies-next";
import Image from "next/image"; // Import the Image component
import { Home } from "lucide-react";

const PostPage = () => {
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<
    "submitting" | "success" | "error" | null
  >(null);
  const [isScanningEnabled, setIsScanningEnabled] = useState(true);
  const [isScanning, setIsScanning] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const videoRef = useRef(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();
    codeReaderRef.current = codeReader;

    const startScanner = async () => {
      if (videoRef.current && isScanning) {
        try {
          await codeReader.decodeFromVideoDevice(
            null,
            videoRef.current,
            (result, error) => {
              if (!isScanningEnabled) return;

              if (result) {
                const scannedData = result.getText();
                console.log("QR Code Detected:", scannedData);
                setQrCodeData(scannedData);
                setMessage("Success! QR code data: " + scannedData);

                // Send data to API after successful scan
                sendDataToAPI(scannedData);

                // Disable scanning for 10 seconds after successful scan
                setIsScanningEnabled(false);

                setTimeout(() => {
                  console.log("Re-enabling scanning after delay");
                  setIsScanningEnabled(true);
                }, 10000);
              }

              if (error && error.name !== "NotFoundException") {
                console.error("Error while scanning QR code:", error);
                setMessage("Error: " + error.message);
              }
            }
          );
        } catch (err) {
          console.error("Failed to start scanner:", err);
          setMessage(
            "Failed to access camera: " +
              (err instanceof Error ? err.message : "Unknown error")
          );
        }
      }
    };

    startScanner();

    return () => {
      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
      }
    };
  }, [isScanningEnabled, isScanning]);

  const sendDataToAPI = async (matricule: string) => {
    try {
      setIsSubmitting(true);
      setApiStatus("submitting");

      const typeFromStorage = localStorage.getItem("type_s");
      let parsedType = 0;

      if (typeFromStorage !== null) {
        parsedType = parseInt(typeFromStorage, 10);
        console.log("Using type_something:", parsedType);
      } else {
        // Fallback to type if type_something is not in localStorage
        const typeFromCookie = localStorage.getItem("type");
        parsedType = typeFromCookie ? parseInt(typeFromCookie, 10) : 0;
        console.log("Using fallback type:", parsedType);
      }
      console.log("Sending to API:", { matricule, type: parsedType });

      const token = localStorage.getItem("token");
      // Use the same origin for the API request (not cross-origin)
      // This assumes your Next.js app is serving both the frontend and API
      const response = await fetch(
        "https://dnk-clocking-fleet.vercel.app/api/admin/clocking",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ matricule, type: parsedType }),
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to send clocking data");
      }

      setApiStatus("success");
      setMessage(`Clocking successful for matricule: ${matricule}`);
      console.log("API response:", data);
    } catch (error) {
      console.error("API error:", error);
      setApiStatus("error");
      if (error instanceof Error) {
        setMessage(`Error: ${error.message}`);
      } else {
        setMessage("Error: An unknown error occurred");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setMessage(null);
    setQrCodeData(null);
    setApiStatus(null);
    setIsScanningEnabled(true);
  };

  const toggleScanning = () => {
    if (isScanning) {
      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
      }
      setIsScanning(false);
    } else {
      setIsScanning(true);
    }
  };

  // Logout function: Clear localStorage and redirect to login page
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("type");
    localStorage.removeItem("type_s");
    window.location.href = "/login"; // Redirect to the login page
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="fixed top-0 w-full bg-white shadow-sm p-4 flex justify-between items-center">
        <div className="flex items-center">
          <Home className="w-5 h-5 text-blue-600 mr-2" />
          <span className="font-semibold text-gray-800">Access System</span>
        </div>
        <Button
          onClick={handleLogout}
          className="text-sm text-white bg-gray-500 hover:bg-gray-600"
        >
          Logout
        </Button>
      </div>
      <div className="w-full max-w-md p-6 space-y-6 bg-white rounded-lg shadow-md">
        <h1 className="text-3xl font-semibold text-center text-gray-900">
          Scan QR Code
        </h1>

        <div className="flex justify-center">
          <Image
            src="/logo-djamiaya.png" // Path to your logo in the public folder
            alt="Logo"
            width={240} // Adjust width as needed
            height={120} // Adjust height as needed
          />
        </div>

        {/* Display the video stream */}
        <div className="flex justify-center">
          <video
            ref={videoRef}
            width="100%"
            height="auto"
            className="border border-gray-300 rounded"
          />
        </div>

        {/* Display scanning status */}
        <div className="text-center">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
              isScanning && isScanningEnabled
                ? "bg-green-100 text-green-800"
                : "bg-yellow-100 text-yellow-800"
            }`}
          >
            {isScanning
              ? isScanningEnabled
                ? "Ready to scan QR Code"
                : "Paused for 10 seconds"
              : "Scanner stopped"}
          </span>
        </div>

        {/* Display scanned QR code data */}
        {qrCodeData && (
          <div className="text-center p-3 bg-green-50 rounded">
            <p className="text-green-700 font-medium">Scanned QR Code:</p>
            <p className="text-green-600 break-all">{qrCodeData}</p>

            {apiStatus === "submitting" && (
              <div className="mt-2 text-blue-600">
                <p>Scanning attendance...</p>
              </div>
            )}

            {apiStatus === "success" && (
              <div className="mt-2 text-green-600">
                <p>✓ Attendance registered successfully!</p>
              </div>
            )}

            {apiStatus === "error" && (
              <div className="mt-2 text-red-600">
                <p>× Failed to register attendance</p>
              </div>
            )}
          </div>
        )}

        {/* Display message */}
        {message && !qrCodeData && (
          <div
            className={`text-center p-3 rounded ${
              message.includes("Error")
                ? "bg-red-50 text-red-600"
                : "bg-blue-50 text-blue-600"
            }`}
          >
            <p>{message}</p>
          </div>
        )}

        {/* Control buttons */}
        <div className="flex space-x-3">
          <Button
            onClick={handleReset}
            className="flex-1 py-3 text-white bg-blue-500 hover:bg-blue-600"
            disabled={isSubmitting}
          >
            Reset
          </Button>

          <Button
            onClick={toggleScanning}
            className={`flex-1 py-3 text-white ${
              isScanning
                ? "bg-red-500 hover:bg-red-600"
                : "bg-green-500 hover:bg-green-600"
            }`}
            disabled={isSubmitting}
          >
            {isScanning ? "Stop Scanner" : "Start Scanner"}
          </Button>
        </div>

        {/* Footer with Arabic text */}
        <div className="pt-4 pb-2 mt-2 border-t border-gray-200">
          <p className="text-xs text-center text-gray-400 w-full">
            Access control system • Version 1.0.0
          </p>
          <p
            className="text-sm text-center font-medium mt-2 text-gray-600 w-full"
            dir="rtl"
          >
            الجامعية للنقل و الخدمات
          </p>
        </div>
      </div>
    </div>
  );
};

export default PostPage;
