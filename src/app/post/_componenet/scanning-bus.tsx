import { Bus } from 'lucide-react'
import React from 'react'
import ButtonScan from './buttons-scan'
import VideoScan from './video-scanning'
import VideoScanError from './video-scanning-error'

const ScanningBus = ({
    videoRef,
    scanningStatus,
    cameraError,
    startBusScan,
    forceScanDetection,
    stopCamera,
}: {
    videoRef: React.RefObject<HTMLVideoElement | null>
    scanningStatus: string
    cameraError: string | null
    startBusScan: () => void
    forceScanDetection: () => void
    stopCamera: () => void
}) => {
    return (
        <div className="space-y-4">
            <div className="text-center">
                <Bus className="w-16 h-16 mx-auto text-blue-500 animate-pulse" />
                <h3 className="mt-3 text-xl font-semibold text-gray-800">Scannez le bus 🚍</h3>
                <p className="text-sm text-gray-500 mt-1">Placez le QR code devant la caméra</p>
                <div className="mt-2 p-2 bg-blue-50 rounded">
                    <p className="text-xs text-blue-600 font-medium">{scanningStatus}</p>
                </div>
            </div>

            {cameraError ? (
                <VideoScanError
                    cameraError={cameraError}
                    startScan={startBusScan}
                />
            ) : (
                <>
                    <VideoScan videoRef={videoRef} />

                    <ButtonScan
                        forceScanDetection={forceScanDetection}
                        stopCamera={stopCamera}
                    />
                </>
            )}
        </div>
    )
}

export default ScanningBus
