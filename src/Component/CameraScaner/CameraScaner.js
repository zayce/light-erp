import { Html5QrcodeScanner } from "html5-qrcode";
import { useEffect } from "react";
import { useApp } from "../../AppContext"; // путь поправь

export const CameraScanner = () => {
  const { dispatch } = useApp();

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "reader",
      {
        fps: 10,
        qrbox: { width: 250, height: 150 },
      },
      false,
    );

    scanner.render(
      (decodedText) => {
        // 🔥 вот здесь скан → отправка в reducer
        dispatch({ type: "SCAN_PRODUCT", payload: decodedText });

        // 🔊 звук (по желанию)
        new Audio("/beep.mp3").play();
      },
      () => {},
    );

    return () => {
      scanner.clear().catch(() => {});
    };
  }, []);

  return <div id="reader"></div>;
};
