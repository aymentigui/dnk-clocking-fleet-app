import React from 'react'

const VideoScan = ({
    videoRef
}: {
    videoRef: React.RefObject<HTMLVideoElement | null>
}) => {
    return (
        <div className="relative">
            <video
                ref={videoRef}
                className="w-full h-64 border-4 border-orange-400 rounded-lg bg-black"
                autoPlay
                muted
                playsInline
            />
            {/* Overlay pour aider au cadrage */}
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="border-2 border-white border-dashed w-48 h-48 rounded-lg opacity-70"></div>
            </div>
        </div>
    )
}

export default VideoScan
