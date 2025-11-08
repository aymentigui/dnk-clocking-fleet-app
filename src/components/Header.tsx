import { Home } from 'lucide-react'
import Link from 'next/link'
import React, { useEffect } from 'react'
import { Button } from './ui/button'

const Header = ({
    stopCamera
}: any) => {

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


    return (
        <>
            <div className="fixed top-0 w-full bg-white shadow-md p-4 flex justify-between items-center z-10">
                <Link href="/dashboard">
                    <div className="flex items-center">
                        <Home className="w-5 h-5 text-blue-600 ml-2" />
                        <span className="font-semibold text-gray-800">نظام التوقيت</span>
                    </div>
                </Link>
                <Button
                    onClick={handleLogout}
                    variant="outline"
                    className="text-gray-700 hover:bg-gray-100"
                >
                    تسجيل الخروج
                </Button>
            </div>
        </>
    )
}

export default Header
