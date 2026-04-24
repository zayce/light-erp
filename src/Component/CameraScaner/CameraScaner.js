import { useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

export const CameraScanner = ({ onScan }) => {
  const scannerRef = useRef(null);
  const [isRunning, setIsRunning] = useState(false);

  const startScanner = async () => {
    const scanner = new Html5Qrcode("reader");
    scannerRef.current = scanner;

    try {
      await scanner.start(
        { facingMode: "environment" }, // 🔥 главное изменение
        {
          fps: 10,
          qrbox: 250,
        },
        (decodedText) => {
          onScan?.(decodedText);

          // 🔊 звук
          new Audio("/beep.mp3").play();
        },
      );

      setIsRunning(true);
    } catch (err) {
      console.error("START ERROR:", err);
    }
  };

  const stopScanner = async () => {
    if (!scannerRef.current) return;

    try {
      await scannerRef.current.stop();
      await scannerRef.current.clear();
      setIsRunning(false);
    } catch (err) {
      console.log("STOP ERROR:", err);
    }
  };

  return (
    <div>
      <div
        id="reader"
        style={{
          width: "100%",
          height: "300px",
          background: "#000",
          borderRadius: "12px",
          overflow: "hidden",
        }}
      />

      {!isRunning ? (
        <button onClick={startScanner}>Kamera icazə ver / Start</button>
      ) : (
        <button onClick={stopScanner}>Stop Kamera</button>
      )}
    </div>
  );
};
