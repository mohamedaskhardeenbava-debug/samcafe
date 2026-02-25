import { useNavigate } from "react-router-dom";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useEffect, useState } from "react";
import "./TableScanner.css";

const TableScanner = () => {
    const navigate = useNavigate();
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        const scanner = new Html5QrcodeScanner(
            "qr-reader",
            {
                fps: 10,
                qrbox: { width: 250, height: 250 }
            },
            false
        );

        scanner.render(
            (decodedText) => {
                /**
                 * Accept formats:
                 *  table=1
                 *  TABLE:1
                 *  1
                 */
                const match = decodedText.match(/\d+/);
                if (!match) return;

                const tableNo = match[0];

                localStorage.setItem("tableNo", tableNo);

                setShowSuccess(true);

                scanner.clear().catch(() => { });

                setTimeout(() => {
                    navigate("/categories");
                }, 800);
            },
            (error) => {
                // ignore scan errors
            }
        );

        return () => {
            scanner.clear().catch(() => { });
        };
    }, [navigate]);

    return (
        <div className="table-scanner-page">
            <div className="table-scanner-card">
                <div className="table-scanner-title">
                    Scan Your Table QR
                </div>

                <div className="table-scanner-subtitle">
                    Point your camera at the QR code on your table
                </div>

                <div id="qr-reader" />
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