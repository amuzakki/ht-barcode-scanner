import { useEffect, useRef, useState } from 'react';
import {
  Html5Qrcode,
  Html5QrcodeSupportedFormats
} from 'html5-qrcode';

const GAS_URL = import.meta.env.VITE_GAS_URL;
const EVENT_KEY = import.meta.env.VITE_EVENT_KEY;

export default function BarcodeScanner() {
  const scannerRef = useRef(null);
  const lockRef = useRef(false);

  const [message, setMessage] = useState('Arahkan kamera ke barcode');
  const [type, setType] = useState('idle'); 
  // idle | success | warning | error

  useEffect(() => {
    const scanner = new Html5Qrcode('reader');
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: 250,
          formatsToSupport: [
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E
          ]
        },
        handleScanSuccess,
        () => {}
      )
      .catch(err => {
        console.error('Gagal start kamera:', err);
        setType('error');
        setMessage('Gagal mengakses kamera');
      });

    return () => {
      scanner.stop().catch(() => {});
    };
  }, []);

  const handleScanSuccess = async (barcode) => {
    // LOG WAJIB UNTUK DEBUG
    console.log('SCANNED BARCODE:', barcode);

    if (lockRef.current) return;
    lockRef.current = true;

    setType('idle');
    setMessage('Memproses barcode...');

    try {
      const response = await fetch(GAS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          barcode,
          eventKey: EVENT_KEY
        })
      });

      const data = await response.json();
      console.log('RESPONSE FROM GAS:', data);

      if (data.status === 'success') {
        setType('success');
        setMessage(
          `BERHASIL\n${data.data?.nama || ''}`
        );
      } 
      else if (data.status === 'warning') {
        setType('warning');
        setMessage(
          `SUDAH DIGUNAKAN\n${data.data?.nama || ''}`
        );
      } 
      else {
        setType('error');
        setMessage(data.message || 'Barcode tidak valid');
      }

    } catch (error) {
      console.error('FETCH ERROR:', error);
      setType('error');
      setMessage('Gagal menghubungi server');
    }

    // Delay sebelum bisa scan lagi
    setTimeout(() => {
      lockRef.current = false;
      setType('idle');
      setMessage('Arahkan kamera ke barcode');
    }, 2000);
  };

  return (
    <div style={styles.container}>
      <h2>Scan Barcode Anda</h2>

      <div id="reader" style={styles.camera} />

      <div style={{ ...styles.status, ...styles[type] }}>
        {message.split('\n').map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: 420,
    margin: '0 auto',
    textAlign: 'center',
    fontFamily: 'sans-serif'
  },
  camera: {
    border: '2px solid #ddd',
    borderRadius: 8,
    marginBottom: 12
  },
  status: {
    marginTop: 16,
    padding: 12,
    borderRadius: 6,
    fontWeight: 'bold',
    minHeight: 50
  },
  idle: {
    background: '#f5f5f5',
    color: '#333'
  },
  success: {
    background: '#d4edda',
    color: '#155724'
  },
  warning: {
    background: '#fff3cd',
    color: '#856404'
  },
  error: {
    background: '#f8d7da',
    color: '#721c24'
  }
};
