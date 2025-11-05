import { Button } from '@/components/ui/button'
import { CheckCircle } from 'lucide-react'
import React from 'react'

const BusScanned = ({
  busCode,
  startDriverScan,
}: {
  busCode: string | null
  startDriverScan: () => void
}) => {
  return (
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
  )
}

export default BusScanned
