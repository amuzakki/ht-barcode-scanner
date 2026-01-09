import { useEffect, useRef, useState } from "react";
import {
  Html5Qrcode,
  Html5QrcodeSupportedFormats
} from "html5-qrcode";

export default function BarcodeScanner() {
  const scannerRef = useRef(null);
  const [message, setMessage] = useState("Arahkan kamera ke QR Code");
  const [isScanning, setIsScanning] = useState(false);
  const lastScanRef = useRef(0);

  useEffect(() => {
    const scanner = new Html5Qrcode("reader");
    scannerRef.current = scanner;

    const startScanner = async () => {
      try {
        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: 250,
            formatsToSupport: [
              Html5QrcodeSupportedFormats.QR_CODE
            ]
          },
          onScanSuccess,
          () => {}
        );

        console.log("Scanner started");
        setIsScanning(true);
      } catch (err) {
        console.error("Scanner error:", err);
        setMessage("Gagal mengakses kamera");
      }
    };

    startScanner();

    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current
          .stop()
          .then(() => scannerRef.current.clear())
          .catch(() => {});
      }
    };
  }, []);

  const onScanSuccess = async (decodedText) => {
    const now = Date.now();

    // Anti double scan (2 detik)
    if (now - lastScanRef.current < 2000) return;
    lastScanRef.current = now;

    console.log("SCANNED RESULT:", decodedText);

    setMessage(`Hasil Scan: ${decodedText}`);

    // === OPTIONAL: kirim ke GAS ===
    /*
    try {
      const res = await fetch(import.meta.env.VITE_GAS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: decodedText })
      });
      const data = await res.json();
      console.log("GAS RESPONSE:", data);
    } catch (err) {
      console.error("GAS ERROR:", err);
    }
    */
  };

  return (
    <div
      style={{
        maxWidth: 420,
        margin: "0 auto",
        textAlign: "center",
        fontFamily: "sans-serif"
      }}
    >
      <h2>Scan QR Code</h2>

      <div
        id="reader"
        style={{
          width: "100%",
          border: "2px solid #ddd",
          borderRadius: 8
        }}
      />

      <div
        style={{
          marginTop: 16,
          padding: 12,
          borderRadius: 6,
          background: "#f5f5f5",
          fontWeight: "bold"
        }}
      >
        {message}
      </div>

      {!isScanning && (
        <div style={{ marginTop: 10, color: "red" }}>
          Scanner belum aktif
        </div>
      )}
    </div>
  );
}
