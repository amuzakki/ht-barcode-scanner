import { useEffect, useRef, useState } from "react";
import QrScanner from "qr-scanner";
import "./styles.css";

QrScanner.WORKER_PATH = "/qr-scanner-worker.min.js";

export default function BarcodeScanner() {
  const videoRef = useRef(null);
  const scannerRef = useRef(null);

  const [qrValue, setQrValue] = useState("");
  const [status, setStatus] = useState(null);
  const [scanning, setScanning] = useState(false);

  const GAS_URL = import.meta.env.VITE_GAS_URL;

  useEffect(() => {
    startScanner();
    return () => stopScanner();
  }, []);

  const startScanner = async () => {
    setQrValue("");
    setStatus(null);
    setScanning(true);

    scannerRef.current = new QrScanner(
      videoRef.current,
      onScanSuccess,
      {
        preferredCamera: "environment",
        highlightScanRegion: true,
        highlightCodeOutline: true
      }
    );

    await scannerRef.current.start();
    console.log("Scanner started");
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      await scannerRef.current.stop();
      scannerRef.current.destroy();
      scannerRef.current = null;
      setScanning(false);
      console.log("Scanner stopped");
    }
  };

  const onScanSuccess = async (result) => {
    console.log("SCAN RESULT:", result.data);
    setQrValue(result.data);

    await stopScanner(); // ⛔ stop kamera

    try {
      const res = await fetch(GAS_URL, {
        method: "POST",
        body: JSON.stringify({ code: result.data })
      });

      const data = await res.json();
      console.log("GAS RESPONSE:", data);
      setStatus(data);

    } catch (err) {
      console.error(err);
      setStatus({ status: "error" });
    }
  };

  return (
    <div>
      <h2>Scan QR Code</h2>

      {scanning && (
        <video ref={videoRef} />
      )}

      <div id="result">
        {qrValue ? `QR: ${qrValue}` : "Arahkan kamera ke QR Code"}
      </div>

      {status && (
        <div
          id="status"
          className={
            status.status === "success"
              ? "success"
              : status.status === "used"
              ? "used"
              : "error"
          }
        >
          {status.status === "success" && `✅ Berhasil — ${status.nama}`}
          {status.status === "used" && `⚠️ Sudah dipakai — ${status.nama}`}
          {status.status === "not_found" && "❌ QR Code tidak terdaftar"}
          {status.status === "error" && "❌ Gagal koneksi ke server"}
        </div>
      )}

      {status && (
        <button onClick={startScanner}>
          Reset Scan
        </button>
      )}
    </div>
  );
}
