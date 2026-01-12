import { useEffect, useRef, useState } from "react";
import QrScanner from "qr-scanner";

QrScanner.WORKER_PATH = "/qr-scanner-worker.min.js";

export default function BarcodeScanner() {
  const videoRef = useRef(null);
  const scannerRef = useRef(null);

  const [result, setResult] = useState("");
  const [status, setStatus] = useState(null);

  const GAS_URL = import.meta.env.VITE_GAS_URL;

  useEffect(() => {
    startScanner();
    return () => stopScanner();
  }, []);

  const startScanner = () => {
    setResult("");
    setStatus(null);

    scannerRef.current = new QrScanner(
      videoRef.current,
      handleScan,
      { preferredCamera: "environment" }
    );

    scannerRef.current.start();
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      await scannerRef.current.stop();
      scannerRef.current.destroy();
      scannerRef.current = null;
    }
  };

  const handleScan = async (result) => {
    console.log("SCAN:", result.data);
    setResult(result.data);

    await stopScanner();

    try {
      const res = await fetch(GAS_URL, {
        method: "POST",
        body: JSON.stringify({ code: result.data })
      });

      const data = await res.json();
      console.log("GAS:", data);
      setStatus(data);

    } catch {
      setStatus({ status: "error" });
    }
  };

  return (
    <div style={{ textAlign: "center" }}>
      <h2>Scan QR Code</h2>

      {!status && <video ref={videoRef} style={{ width: "100%", maxWidth: 400 }} />}

      {result && <p><b>QR:</b> {result}</p>}

      {status && (
        <div>
          {status.status === "success" && <p style={{ color: "green" }}>Berhasil — {status.nama}</p>}
          {status.status === "used" && <p style={{ color: "orange" }}>Sudah dipakai — {status.nama}</p>}
          {status.status === "not_found" && <p style={{ color: "red" }}>QR tidak terdaftar</p>}
          {status.status === "error" && <p style={{ color: "red" }}>Gagal koneksi</p>}

          <button onClick={startScanner}>Reset</button>
        </div>
      )}
    </div>
  );
}
