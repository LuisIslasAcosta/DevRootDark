// Almacén local (IndexedDB) para trabajar sin conexión.
// - paquetes:   examen descargado (preguntas sin respuestas) por examen_id
// - progreso:   respuestas y tiempo del examen en curso por intento_id
// - pendientes: exámenes terminados y lecciones vistas que faltan por enviar
// - cursos:     cursos descargados para ver sin conexión

const NOMBRE = "devrootdark-offline";
const VERSION = 1;
const TIENDAS = ["paquetes", "progreso", "pendientes", "cursos"];

let conexion = null;

function abrir() {
  if (conexion) return conexion;
  conexion = new Promise((resolver, rechazar) => {
    const peticion = indexedDB.open(NOMBRE, VERSION);
    peticion.onupgradeneeded = () => {
      const db = peticion.result;
      TIENDAS.forEach((t) => {
        if (!db.objectStoreNames.contains(t)) db.createObjectStore(t);
      });
    };
    peticion.onsuccess = () => resolver(peticion.result);
    peticion.onerror = () => {
      conexion = null;
      rechazar(peticion.error);
    };
  });
  return conexion;
}

async function operar(tienda, modo, accion) {
  const db = await abrir();
  return new Promise((resolver, rechazar) => {
    const tx = db.transaction(tienda, modo);
    const peticion = accion(tx.objectStore(tienda));
    tx.oncomplete = () => resolver(peticion?.result);
    tx.onerror = () => rechazar(tx.error);
    tx.onabort = () => rechazar(tx.error);
  });
}

export const leer = (tienda, clave) => operar(tienda, "readonly", (s) => s.get(clave));
export const guardar = (tienda, clave, valor) => operar(tienda, "readwrite", (s) => s.put(valor, clave));
export const borrar = (tienda, clave) => operar(tienda, "readwrite", (s) => s.delete(clave));
export const todos = (tienda) => operar(tienda, "readonly", (s) => s.getAll());
export const claves = (tienda) => operar(tienda, "readonly", (s) => s.getAllKeys());

// Pide al navegador que no borre lo descargado cuando haya poco espacio
export const pedirAlmacenamientoPersistente = async () => {
  try {
    if (navigator.storage?.persist && !(await navigator.storage.persisted())) await navigator.storage.persist();
  } catch {
    /* no todos los navegadores lo permiten */
  }
};
