import { Button } from '@/components/ui/button'
import { CheckCircle } from 'lucide-react'
import React from 'react'

const SuccessAlert = ({
    message,
    busName,
    conducteurName,
    handleNewScan,
    goToDashboard
}: {
    message: string;
    busName: string;
    conducteurName: string;
    handleNewScan: () => void;
    goToDashboard: () => void;
}) => {
    return (
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
                <Button
                    onClick={goToDashboard}
                    variant="outline"
                    className="w-full py-4"
                >
                    Retour au tableau de bord 🏠
                </Button>
            </div>
        </div>
    )
}

export default SuccessAlert
