import { useState, useRef } from "react";

function base64ToFile(base64, fileName) {
  // Añadimos una validación simple por seguridad
  if (!base64 || typeof base64 !== 'string' || !base64.includes(",")) return null;
  
  const arr = base64.split(",");
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  return new File([u8arr], fileName, { type: mime });
}

export default function CuestionarioFoto({ onNext, disabled }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [camaraActiva, setCamaraActiva] = useState(false);

  const iniciarCamara = async () => {
    try {
      setCamaraActiva(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error al acceder a la cámara:", err);
      alert("No se pudo acceder a la cámara.");
      setCamaraActiva(false);
    }
  };

  const capturarFoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);

    const imagenBase64 = canvas.toDataURL("image/jpeg");
    setFotoPreview(imagenBase64);
    
    const stream = video.srcObject;
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    
    setCamaraActiva(false);

    // 1. Convertimos el Base64 a un archivo REAL antes de enviarlo
    const archivoFile = base64ToFile(imagenBase64, `evidencia_${Date.now()}.jpg`);
    
    // 2. Enviamos el ARCHIVO al padre (SurveyView) para que se suba al Bucket
    if (archivoFile) {
      onNext(archivoFile); 
      console.log("Archivo generado exitosamente para el Bucket");
    } else {
      console.error("No se pudo generar el archivo desde el Base64");
    }
  };

  const reintentar = () => {
    setFotoPreview(null);
    iniciarCamara();
  };

  return (
    <div className="foto-container">
      {!fotoPreview ? (
        <div className="camara-wrapper">
          {camaraActiva ? (
            <>
              <video ref={videoRef} autoPlay playsInline className="video-preview" style={{width: '100%', borderRadius: '8px'}}></video>
              <button className="opcion-card activa" onClick={capturarFoto} disabled={disabled} style={{width: '100%', marginTop: '10px'}}>
                📸 CAPTURAR AHORA
              </button>
            </>
          ) : (
            <button className="opcion-card" onClick={iniciarCamara} disabled={disabled} style={{width: '100%'}}>
              📷 ACTIVAR CÁMARA
            </button>
          )}
        </div>
      ) : (
        <div className="preview-wrapper">
          <img src={fotoPreview} alt="Vista previa" className="foto-preview-img" style={{width: '100%', borderRadius: '8px'}} />
          {!disabled && (
            <button className="btn-reintentar-text" onClick={reintentar} style={{marginTop: '10px', display: 'block'}}>
              🔄 Reintentar fotografía
            </button>
          )}
        </div>
      )}
      <canvas ref={canvasRef} style={{ display: "none" }}></canvas>
    </div>
  );
}