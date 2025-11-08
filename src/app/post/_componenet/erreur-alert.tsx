import { Button } from '@/components/ui/button'
import { XCircle } from 'lucide-react'
import React from 'react'

const ErreurAlert = ({
    message,
    handleNewScan,
    goToDashboard
}: {
    message: string;
    handleNewScan: () => void;
    goToDashboard: () => void;
}) => {
    return (
        <div className="text-center space-y-6">
            <XCircle className="w-24 h-24 mx-auto text-red-500" />
            <h3 className="text-2xl font-bold text-red-600">❌ خطأ</h3>
            <p className="text-gray-700">{message}</p>
            <div className="space-y-3">
                <Button
                    onClick={handleNewScan}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4"
                >
                    إعادة المحاولة 🔄
                </Button>
                <Button
                    onClick={goToDashboard}
                    variant="outline"
                    className="w-full py-4"
                >
                    العودة إلى لوحة التحكم 🏠
                </Button>
            </div>
        </div>
    )
}

export default ErreurAlert
