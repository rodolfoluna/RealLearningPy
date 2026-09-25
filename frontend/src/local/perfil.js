/*
Perfil local del alumno: número de control, nombre, contraseña y avance.

Todo se guarda únicamente en el dispositivo (IndexedDB mediante localforage).
No hay servidor ni cuentas: el avance se lleva de un dispositivo a otro,
o se entrega al profesor, mediante un archivo cifrado (.rlpy).
*/

import localforage from "localforage";
import _ from "lodash";
import chapters from "../chapters.json";
import {bookState, localStore} from "../book/store";
import configProfesor from "../config/profesor.json";
import {
  aBase64,
  deBase64,
  abrirComoAlumno,
  crearArchivoAvance,
  derivarClave,
  huella,
  leerClavePublica,
  nuevoKdf,
  verificador,
  ContrasenaIncorrecta,
} from "./cripto";

export const NOMBRE_APP = "RealLearningPy";
export const EXTENSION = ".rlpy";

export const almacen = localforage.createInstance({name: "reallearningpy"});

// Clave pública del profesor: la variable de entorno tiene prioridad sobre el archivo de configuración
export const clavePublicaProfesor = leerClavePublica(
  process.env.REACT_APP_CLAVE_PUBLICA_PROFESOR || configProfesor.clavePublica
);
export const huellaProfesor = clavePublicaProfesor ? huella(clavePublicaProfesor) : null;

// La clave derivada de la contraseña sólo vive en memoria mientras la app está abierta
const sesion = {
  claveAlumno: null,
};

// Mientras se reemplazan los datos locales (importar archivo, cambiar de alumno)
// no se debe volver a guardar el estado actual del curso.
export const bloqueoGuardado = {activo: false};

export async function cargarPerfil() {
  return await almacen.getItem("perfil");
}

export function sesionIniciada() {
  return !!sesion.claveAlumno;
}

// Al crear un perfil o cargar un archivo la página se recarga; para no pedir otra vez
// la contraseña, la clave se pasa a la nueva carga mediante sessionStorage (sólo esta pestaña)
// y se borra inmediatamente al leerla.
const CLAVE_TEMPORAL = "reallearningpy-sesion";

function guardarSesionTemporal() {
  try {
    sessionStorage.setItem(CLAVE_TEMPORAL, aBase64(sesion.claveAlumno));
  } catch (e) {
  }
}

export async function recuperarSesionTemporal() {
  let valor = null;
  try {
    valor = sessionStorage.getItem(CLAVE_TEMPORAL);
    sessionStorage.removeItem(CLAVE_TEMPORAL);
  } catch (e) {
  }
  const perfil = await cargarPerfil();
  if (!valor || !perfil) {
    return null;
  }
  const clave = deBase64(valor);
  if (verificador(clave) !== perfil.verificador) {
    return null;
  }
  sesion.claveAlumno = clave;
  return perfil;
}

export function cerrarSesion() {
  sesion.claveAlumno = null;
}

export async function desbloquear(contrasena) {
  const perfil = await cargarPerfil();
  const clave = await derivarClave(contrasena, perfil.kdf);
  if (verificador(clave) !== perfil.verificador) {
    throw new ContrasenaIncorrecta("La contraseña es incorrecta.");
  }
  sesion.claveAlumno = clave;
  return perfil;
}

async function reiniciarDatosLocales() {
  bloqueoGuardado.activo = true;
  await localStore.removeItem("user");
  await almacen.removeItem("actividad");
  await almacen.removeItem("estado");
}

function recargar(pagina = "") {
  window.location.hash = pagina;
  window.location.reload();
}

export async function crearPerfil({numeroControl, nombre, contrasena}) {
  const kdf = nuevoKdf();
  const clave = await derivarClave(contrasena, kdf);
  await reiniciarDatosLocales();
  await almacen.setItem("perfil", {
    numeroControl: numeroControl.trim(),
    nombre: nombre.trim(),
    kdf,
    verificador: verificador(clave),
    creado: new Date().toISOString(),
  });
  sesion.claveAlumno = clave;
  guardarSesionTemporal();
  recargar();
}

export async function borrarAlumnoDeEsteDispositivo() {
  await reiniciarDatosLocales();
  await almacen.removeItem("perfil");
  recargar();
}

// ---------- Actividad (fechas en que se avanza o completa cada lección) ----------

export async function cargarActividad() {
  return (await almacen.getItem("actividad")) || {};
}

export async function cargarEstado() {
  return (await almacen.getItem("estado")) || {};
}

export async function actualizarEstado(cambios) {
  if (bloqueoGuardado.activo) {
    return;
  }
  const estado = await cargarEstado();
  await almacen.setItem("estado", {...estado, ...cambios});
  window.dispatchEvent(new Event(EVENTO_ESTADO));
}

export const EVENTO_ESTADO = "reallearningpy-estado";

function textoPlano(html) {
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent || "";
}

/** Resumen legible del avance, calculado con las páginas del curso cargadas en la app. */
export function calcularResumen(pages, pagesProgress, actividad = {}) {
  const porLeccion = [];
  let pasosCompletados = 0;
  let pasosTotales = 0;
  let leccionesCompletadas = 0;

  chapters.forEach((capitulo, indiceCapitulo) => {
    capitulo.pages.forEach(({slug, title}) => {
      const pagina = pages[slug];
      if (!pagina) {
        return;
      }
      // El último "paso" de cada página es sólo el texto final, no requiere ejecutar código
      const total = pagina.steps.length - 1;
      const nombrePaso = pagesProgress?.[slug]?.step_name;
      const indice = Math.max(0, _.findIndex(pagina.steps, {name: nombrePaso}));
      const hechos = Math.min(indice, total);
      // Algunas páginas son sólo de lectura (no tienen pasos con código)
      const soloLectura = total === 0;
      const completada = !soloLectura && hechos >= total;
      pasosCompletados += hechos;
      pasosTotales += total;
      if (completada) {
        leccionesCompletadas++;
      }
      porLeccion.push({
        slug,
        titulo: textoPlano(title),
        capitulo: `${indiceCapitulo + 1}. ${textoPlano(capitulo.title)}`,
        pasosCompletados: hechos,
        pasosTotales: total,
        completada,
        soloLectura,
        ultimaActividad: actividad[slug]?.ultima || null,
        completadaEl: actividad[slug]?.completada || null,
      });
    });
  });

  return {
    pasosCompletados,
    pasosTotales,
    porcentaje: pasosTotales ? Math.round(1000 * pasosCompletados / pasosTotales) / 10 : 0,
    leccionesCompletadas,
    leccionesTotales: porLeccion.filter(l => l.pasosTotales > 0).length,
    porLeccion,
  };
}

export function resumenActual(actividad) {
  return calcularResumen(bookState.pages, bookState.user.pagesProgress, actividad);
}

function paginaActualLegible() {
  const pagina = bookState.pages[bookState.user.pageSlug];
  return pagina ? textoPlano(pagina.title) : "";
}

// ---------- Exportar / importar el archivo de avance ----------

function fechaParaArchivo(fecha = new Date()) {
  const dos = n => String(n).padStart(2, "0");
  return `${fecha.getFullYear()}-${dos(fecha.getMonth() + 1)}-${dos(fecha.getDate())}_${dos(fecha.getHours())}${dos(fecha.getMinutes())}`;
}

function nombreSeguro(texto) {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
}

export function nombreArchivo(numeroControl, nombre) {
  return `avance_${nombreSeguro(numeroControl)}_${nombreSeguro(nombre)}_${fechaParaArchivo()}${EXTENSION}`;
}

export async function crearArchivoDelAlumno() {
  if (!sesion.claveAlumno) {
    throw new Error("Primero debes ingresar tu contraseña.");
  }
  const perfil = await cargarPerfil();
  const actividad = await cargarActividad();
  const {pagesProgress, pageSlug} = bookState.user;
  const datos = {
    alumno: {numeroControl: perfil.numeroControl, nombre: perfil.nombre},
    exportado: new Date().toISOString(),
    perfilCreado: perfil.creado,
    progreso: {
      pagesProgress,
      pageSlug,
      paginaActual: paginaActualLegible(),
      editorContent: bookState.editorContent,
    },
    actividad,
    resumen: resumenActual(actividad),
  };
  const archivo = crearArchivoAvance(datos, sesion.claveAlumno, perfil.kdf, clavePublicaProfesor);
  const blob = new Blob([JSON.stringify(archivo)], {type: "application/octet-stream"});
  return {blob, nombre: nombreArchivo(perfil.numeroControl, perfil.nombre), perfil};
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

export function puedeCompartirArchivos() {
  try {
    const prueba = new File(["x"], "prueba" + EXTENSION, {type: "application/octet-stream"});
    return !!(navigator.canShare && navigator.canShare({files: [prueba]}));
  } catch (e) {
    return false;
  }
}

export async function descargarAvance() {
  const {blob, nombre} = await crearArchivoDelAlumno();
  descargarBlob(blob, nombre);
  await actualizarEstado({ultimaExportacion: new Date().toISOString()});
  return nombre;
}

export async function compartirAvance() {
  const {blob, nombre, perfil} = await crearArchivoDelAlumno();
  const archivo = new File([blob], nombre, {type: "application/octet-stream"});
  await navigator.share({
    files: [archivo],
    title: `Avance de ${perfil.nombre} (${perfil.numeroControl})`,
  });
  await actualizarEstado({ultimaExportacion: new Date().toISOString()});
  return nombre;
}

export async function leerArchivoJson(file) {
  const texto = await file.text();
  try {
    return JSON.parse(texto);
  } catch (e) {
    throw new Error(`El archivo "${file.name}" no es válido o está dañado.`);
  }
}

/** Abre un archivo de avance con la contraseña del alumno y lo carga en este dispositivo. */
export async function cargarArchivoDelAlumno(archivo, contrasena) {
  const {datos, claveAlumno, kdf} = await abrirComoAlumno(archivo, contrasena);
  const {alumno, progreso, actividad} = datos;
  bloqueoGuardado.activo = true;
  await localStore.setItem("user", {
    uid: "__futurecoder_offline__",
    developerMode: false,
    pagesProgress: progreso.pagesProgress,
    pageSlug: progreso.pageSlug,
    editorContent: progreso.editorContent || "",
  });
  await almacen.setItem("actividad", actividad || {});
  await almacen.setItem("estado", {ultimaExportacion: datos.exportado, ultimoCambio: datos.exportado});
  await almacen.setItem("perfil", {
    numeroControl: alumno.numeroControl,
    nombre: alumno.nombre,
    kdf,
    verificador: verificador(claveAlumno),
    creado: datos.perfilCreado || datos.exportado,
  });
  sesion.claveAlumno = claveAlumno;
  guardarSesionTemporal();
  recargar(progreso.pageSlug || "");
}
