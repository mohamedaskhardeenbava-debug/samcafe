import { useNavigate } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import { useEffect, useRef, useState } from "react";
import "./TableScanner.css";

const TableScanner = () => {
    const navigate = useNavigate();
    const qrRef = useRef(null);
    const scannerRef = useRef(null);
    const [showSuccess, setShowSuccess] = useState(false);
    const [cameraStarted, setCameraStarted] = useState(false);

    const startScanner = async () => {
        if (!qrRef.current) return;

        const html5QrCode = new Html5Qrcode("qr-reader");
        scannerRef.current = html5QrCode;

        try {
            const cameras = await Html5Qrcode.getCameras();
            if (cameras && cameras.length) {
                await html5QrCode.start(
                    cameras[cameras.length - 1].id,
                    {
                        fps: 10,
                        qrbox: 250,
                    },
                    async (decodedText) => {
                        const match = decodedText.match(/\d+/);
                        if (!match) return;

                        const tableNo = match[0];
                        localStorage.setItem("tableNo", tableNo);

                        setShowSuccess(true);

                        try {
                            await html5QrCode.stop();
                        } catch (err) { }

                        setTimeout(() => {
                            navigate("/categories");
                        }, 500);
                    }
                );

                setCameraStarted(true);
            }
        } catch (err) {
            console.error("Camera start failed:", err);
        }
    };

    return (
        <div className="table-scanner-page">
            <div className="table-scanner-card">
                <div className="table-scanner-title">
                    Scan Your Table QR
                </div>

                <div className="table-scanner-subtitle">
                    Tap below to start camera
                </div>

                {!cameraStarted && (
                    <button className="start-camera-btn" onClick={startScanner}>
                        Start Camera
                    </button>
                )}

                <div id="qr-reader" ref={qrRef} />
            </div>

            {showSuccess && (
                <div className="success-overlay">
                    <div className="success-circle">
                        <div className="success-check" />
                    </div>
                </div>
            )}
        </div>
    );
};

export default TableScanner;