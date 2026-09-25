/*
Código compartido por la app del alumno y la app del profesor.
No debe importar nada del curso (páginas, store), para que la app del profesor sea ligera.
*/

import configProfesor from "../config/profesor.json";
import {huella, leerClavePublica} from "./cripto";

export const NOMBRE_APP = "RealLearningPy";
export const EXTENSION = ".rlpy";

// Clave pública del profesor: la variable de entorno tiene prioridad sobre el archivo de configuración
export const clavePublicaProfesor = leerClavePublica(
  process.env.REACT_APP_CLAVE_PUBLICA_PROFESOR || configProfesor.clavePublica
);
export const huellaProfesor = clavePublicaProfesor ? huella(clavePublicaProfesor) : null;

function fechaParaArchivo(fecha = new Date()) {
  const dos = n => String(n).padStart(2, "0");
  return `${fecha.getFullYear()}-${dos(fecha.getMonth() + 1)}-${dos(fecha.getDate())}_${dos(fecha.getHours())}${dos(fecha.getMinutes())}`;
}

function nombreSeguro(texto) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
}

export function nombreArchivo(numeroControl, nombre) {
  return `avance_${nombreSeguro(numeroControl)}_${nombreSeguro(nombre)}_${fechaParaArchivo()}${EXTENSION}`;
}

export function descargarBlob(blob, nombre) {
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombre;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

export async function leerArchivoJson(file) {
  const texto = await file.text();
  try {
    return JSON.parse(texto);
  } catch (e) {
    throw new Error(`El archivo "${file.name}" no es válido o está dañado.`);
  }
}
