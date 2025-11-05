import { Button } from '@/components/ui/button'
import { Camera, CameraOff } from 'lucide-react'
import React from 'react'

const ButtonScan = ({
    forceScanDetection,
    stopCamera
}: {
    forceScanDetection: () => void;
    stopCamera: () => void;
}) => {
    return (
        <div className="flex space-x-2">
            <Button
                onClick={forceScanDetection}
                variant="outline"
                className="flex-1"
            >
                <Camera className="w-4 h-4 mr-2" />
                Forcer la détection
            </Button>
            <Button
                onClick={stopCamera}
                variant="outline"
                className="flex-1"
            >
                <CameraOff className="w-4 h-4 mr-2" />
                Arrêter
            </Button>
        </div>
    )
}

export default ButtonScan
