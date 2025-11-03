"use client";
import { useState, useEffect } from "react";
import { Home, Shield, ArrowRight, LogIn, LogOut, QrCode } from "lucide-react";
import Image from "next/image"; // Import the Next.js Image component
import { Button } from "@/components/ui/button";

const Dashboard = () => {
  const [userType, setUserType] = useState<string | null>(null);

  useEffect(() => {
    // Simple function to get cookie value
    const getCookie = (name: string) => {
      const cookies = document.cookie.split(";");
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.startsWith(name + "=")) {
          return cookie.substring(name.length + 1);
        }
      }
      return null;
    };

    // Get only the type from cookies
    const typeFromCookie = localStorage.getItem("type");
    if (typeFromCookie) {
      setUserType(typeFromCookie);
    }
  }, []);

  const goToPostPage = () => {
    window.location.href = "/post";
  };

  const goToEntree = () => {
    window.location.href = "/post";
    localStorage.setItem("type_s", "1");
  };

  const goToSortie = () => {
    window.location.href = "/post";
    localStorage.setItem("type_s", "0");
  };

  // Logout function: Clear localStorage and redirect to login page
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("type");
    localStorage.removeItem("type_s");
    window.location.href = "/login"; // Redirect to the login page
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      {/* Top Navigation Bar */}
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

      <div className="w-full max-w-lg p-6 bg-white rounded-lg shadow-lg mt-16 border border-gray-200">
        <div className="pb-4">
          <div className="flex items-center justify-center mb-2">
            <Image
              src="/logo-djamiaya.png" // Path to your logo in the public folder
              alt="Logo"
              width={240} // Adjust width as needed
              height={120} // Adjust height as needed
            />
          </div>
        </div>

        <div className="space-y-4 pt-4">
          {userType === "2" ? (
            <>
              <button
                onClick={goToEntree}
                className="w-full py-6 text-white bg-blue-500 hover:bg-blue-600 transition rounded-lg flex items-center justify-between px-4"
              >
                <LogIn className="w-6 h-6 mr-3" />
                <span className="text-lg flex-grow text-left">
                  Scan Entrance
                </span>
                <ArrowRight className="w-5 h-5" />
              </button>

              <button
                onClick={goToSortie}
                className="w-full py-6 text-white bg-red-500 hover:bg-red-600 transition rounded-lg flex items-center justify-between px-4"
              >
                <LogOut className="w-6 h-6 mr-3" />
                <span className="text-lg flex-grow text-left">Scan Exit</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </>
          ) : (
            <button
              onClick={goToPostPage}
              className="w-full py-6 text-white bg-green-500 hover:bg-green-600 transition rounded-lg flex items-center justify-between px-4"
            >
              <QrCode className="w-6 h-6 mr-3" />
              <span className="text-lg flex-grow text-left">Scan QR Code</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="pt-6 pb-2">
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

export default Dashboard;
