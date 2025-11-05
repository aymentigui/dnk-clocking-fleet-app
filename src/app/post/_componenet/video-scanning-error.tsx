import { Button } from '@/components/ui/button'
import { XCircle } from 'lucide-react'
import React from 'react'

const VideoScanError = ({
    cameraError,
    startScan
}: {
    cameraError: string
    startScan: () => void
}) => {
    return (
        <div className="text-center p-4 bg-red-50 rounded-lg">
            <XCircle className="w-12 h-12 mx-auto text-red-500 mb-2" />
            <p className="text-red-600 font-medium">{cameraError}</p>
            <Button
                onClick={startScan}
                className="mt-3 bg-blue-600 hover:bg-blue-700 text-white"
            >
                Réessayer
            </Button>
        </div>
    )
}

export default VideoScanError
