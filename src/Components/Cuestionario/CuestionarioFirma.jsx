import { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";

// --- FUNCIÓN DE UTILIDAD (LA RECETA) ---
// Debe estar FUERA del componente o definida de esta forma
const dataURLtoBlob = (dataurl) => {
  let arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
      bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
  while(n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], {type:mime});
}

export default function CuestionarioFirma({ onNext, isProcessing }) {
  const sigCanvas = useRef({});
  const [error, setError] = useState(null);

  const limpiar = () => {
    sigCanvas.current.clear();
    setError(null);
  };

  const guardar = () => {
    setError(null);
    if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
        // 1. OBTENEMOS EL CANVAS (Método estándar, evita el error de trim_canvas)
        const canvas = sigCanvas.current.getCanvas();
        
        // 2. EXTRAEMOS LA IMAGEN COMO DATAURL
        // Mantenemos PNG para que respete la transparencia si la hay
        const dataURL = canvas.toDataURL('image/png');
        
        // 3. CONVERTIMOS A BLOB (Usando la función dataURLtoBlob que ya tienes)
        const imagenBlob = dataURLtoBlob(dataURL);
        
        // 4. ENVIAMOS AL PADRE
        onNext({
        base64: dataURL,
        blob: imagenBlob
        });
        
        console.log("Firma fijada correctamente");
    } else {
        setError("Por favor, firma antes de continuar.");
    }
    };

  return (
    <div className="firma-container" style={{ textAlign: 'center' }}>
      <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '10px' }}>
        Firme dentro del recuadro
      </p>
      
      <div className="canvas-wrapper">
        <SignatureCanvas 
          ref={sigCanvas}
          canvasProps={{ 
            width: 320, // Un poco más ancho para móviles
            height: 200, 
            className: 'sigCanvas' 
          }}
          backgroundColor="#ffffff" // Fondo blanco explícito
          penColor="#004d40" // Color verde corporativo
        />
      </div>
      
      {error && (
        <p className="error-message">{error}</p>
      )}

      <div className="botones-firma">
        <button 
          className="btn-limpiar" 
          onClick={limpiar} 
          disabled={isProcessing}
        >
          Limpiar
        </button>
        <button 
          className="btn-guardar" 
          onClick={guardar} 
          disabled={isProcessing}
        >
          {isProcessing ? "Procesando..." : "Fijar Firma"}
        </button>
      </div>

      <style jsx>{`
        .canvas-wrapper {
          border: 2px dashed #004d40;
          border-radius: 12px;
          display: inline-block;
          overflow: hidden;
          background: white;
          box-shadow: 0 4px 10px rgba(0,0,0,0.05);
        }
        
        .botones-firma {
          margin-top: 20px;
          display: flex;
          gap: 15px;
          justify-content: center;
        }

        button {
          padding: 12px 24px;
          border-radius: 8px;
          border: none;
          font-weight: 600;
          cursor: pointer;
          transition: 0.2s;
        }

        .btn-limpiar {
          background-color: #f5f5f5;
          color: #666;
        }
        .btn-limpiar:hover { background-color: #e0e0e0; }

        .btn-guardar {
          background-color: #004d40;
          color: white;
        }
        .btn-guardar:hover { background-color: #00332a; }
        
        button:disabled { opacity: 0.5; cursor: not-allowed; }
        
        .error-message { color: #e74c3c; font-size: 0.85rem; margin-top: 10px; }
      `}</style>
    </div>
  );
}