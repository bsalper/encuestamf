import { useState, useRef } from "react";

function base64ToFile(base64, fileName) {
  const arr = base64.split(",");
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) u8arr[n] = bstr.charCodeAt(n);

  return new File([u8arr], fileName, { type: mime });
}

export default function CuestionarioFoto({ onNext }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [foto, setFoto] = useState(null);

  const iniciarCamara = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { exact: "environment" } }
    });

    videoRef.current.srcObject = stream;
  };

  const capturarFoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);

    const imagen = canvas.toDataURL("image/jpeg");
    setFoto(imagen);
  };

  const guardar = () => {
    const file = base64ToFile(foto, "foto.jpg");
    onNext(file); // ← AHORA SÍ ENVÍA UN FILE REAL
  };

  return (
    <div style={{ padding: 20 }}>
      <h3>Toma una fotografía</h3>

      {!foto && (
        <>
          <video
            ref={videoRef}
            autoPlay
            style={{ width: "100%", borderRadius: 10, marginTop: 10 }}
          ></video>

          <button onClick={iniciarCamara} style={{ marginTop: 10 }}>
            Activar cámara
          </button>

          <button onClick={capturarFoto} style={{ marginTop: 10 }}>
            Capturar foto
          </button>
        </>
      )}

      {foto && (
        <>
          <img
            src={foto}
            alt="captura"
            style={{
              width: "100%",
              borderRadius: 10,
              marginTop: 10,
              border: "2px solid #4caf50",
            }}
          />

          <button style={{ marginTop: 10 }} onClick={guardar}>
            Guardar y continuar
          </button>
        </>
      )}

      <canvas ref={canvasRef} style={{ display: "none" }}></canvas>
    </div>
  );
}
