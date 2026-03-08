import React, { useState } from "react";
import axios from "axios";

function ImportarExcelPreguntas({ examenId }) {
  const [archivo, setArchivo] = useState(null);

  const subir = async () => {
    const formData = new FormData();
    formData.append("archivo", archivo);
    formData.append("examen_id", examenId);

    await axios.post("http://127.0.0.1:5000/api/preguntas/importar_excel", formData);
    alert("Preguntas importadas ");
  };

  return (
    <div>
      <h3>Importar Preguntas (Excel)</h3>

      <input type="file" accept=".xlsx" onChange={e => setArchivo(e.target.files[0])} />

      <button onClick={subir}>Subir Excel</button>
    </div>
  );
}

export default ImportarExcelPreguntas;
