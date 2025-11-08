import React from 'react'
import { User } from 'lucide-react'
import ButtonScan from './buttons-scan';
import VideoScan from './video-scanning';
import VideoScanError from './video-scanning-error';

const ScanningDriver = ({
    videoRef,
    busCode,
    scanningStatus,
    cameraError,
    startDriverScan,
    forceScanDetection,
    stopCamera
}: {
    videoRef: React.RefObject<HTMLVideoElement | null>;
    busCode: string | null;
    scanningStatus: string;
    cameraError: string | null;
    startDriverScan: () => void;
    forceScanDetection: () => void;
    stopCamera: () => void;
}) => {
    return (
        <div className="space-y-4">
            <div className="text-center">
                <User className="w-16 h-16 mx-auto text-orange-500 animate-pulse" />
                <h3 className="mt-3 text-xl font-semibold text-gray-800">امسح السائق 👷‍♂️</h3>
                <p className="text-sm text-gray-500 mt-1">ضع رمز QR أمام الكاميرا</p>
                <div className="mt-2 bg-blue-50 border border-blue-200 rounded p-2">
                    <p className="text-xs text-gray-600">الحافلة: <span className="font-bold text-blue-600">{busCode}</span></p>
                </div>
                <div className="mt-2 p-2 bg-orange-50 rounded">
                    <p className="text-xs text-orange-600 font-medium">{scanningStatus}</p>
                </div>
            </div>

            {cameraError ? (
                <VideoScanError
                    cameraError={cameraError}
                    startScan={startDriverScan}
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

export default ScanningDriver
