import { useState, useRef } from "react";

export default function CuestionarioFoto({ onNext }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [foto, setFoto] = useState(null);

  const iniciarCamara = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
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

          <button
            style={{ marginTop: 10 }}
            onClick={() => onNext(foto)}
          >
            Guardar y continuar
          </button>
        </>
      )}

      <canvas ref={canvasRef} style={{ display: "none" }}></canvas>
    </div>
  );
}
