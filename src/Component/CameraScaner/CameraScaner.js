import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import toast from "react-hot-toast";

// The camera reports the same code on every frame (~10 fps). Ignore repeats
// of the same code inside this window so one scan adds exactly one unit.
const SCAN_COOLDOWN_MS = 1500;

const beep = () => {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.value = 880;
    gain.gain.value = 0.05;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.onended = () => ctx.close();
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch {
    // sound is optional
  }
};

export const CameraScanner = ({ onScan }) => {
  const scannerRef = useRef(null);
  const lastScanRef = useRef({ code: "", time: 0 });
  // Always call the latest onScan, not the one captured when the camera started.
  const onScanRef = useRef(onScan);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  // Release the camera when the component unmounts.
  useEffect(() => {
    return () => {
      const scanner = scannerRef.current;
      if (!scanner) return;
      Promise.resolve()
        .then(() => scanner.stop())
        .then(() => scanner.clear())
        .catch(() => {});
    };
  }, []);

  const handleDecoded = (decodedText) => {
    const now = Date.now();
    const last = lastScanRef.current;

    if (decodedText === last.code && now - last.time < SCAN_COOLDOWN_MS) {
      return;
    }

    lastScanRef.current = { code: decodedText, time: now };
    onScanRef.current?.(decodedText);
    beep();
  };

  const startScanner = async () => {
    if (isRunning) return;

    const scanner = new Html5Qrcode("reader");
    scannerRef.current = scanner;

    try {
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        handleDecoded,
      );
      setIsRunning(true);
    } catch (err) {
      console.error("START ERROR:", err);
      toast.error("Kameranı açmaq mümkün olmadı. İcazəni yoxlayın.", {
        id: "camera-error",
      });
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
        <button type="button" onClick={startScanner}>
          Kamera icazə ver / Start
        </button>
      ) : (
        <button type="button" onClick={stopScanner}>
          Stop Kamera
        </button>
      )}
    </div>
  );
};
