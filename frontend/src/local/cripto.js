/*
Cifrado de los archivos de avance.

Todo funciona sin conexión y sin servidor, usando las librerías @noble (JavaScript puro),
que funcionan en cualquier navegador aunque la página no se sirva por HTTPS.

Esquema de un archivo de avance (.rlpy):

- Los datos del alumno (nombre, número de control y progreso) se cifran con una clave aleatoria K
  usando XChaCha20-Poly1305 (cifrado autenticado: si alguien modifica el archivo, no se podrá abrir).
- K se guarda dos veces dentro del archivo, también cifrada:
  1. Con una clave derivada de la contraseña del alumno (scrypt). Así sólo el alumno puede abrirlo.
  2. Con la clave pública del profesor (X25519). Así el profesor, con su clave privada,
     puede abrir los archivos de todos sus alumnos.
*/

import {xchacha20poly1305} from "@noble/ciphers/chacha";
import {randomBytes} from "@noble/ciphers/webcrypto";
import {scryptAsync} from "@noble/hashes/scrypt";
import {sha256} from "@noble/hashes/sha256";
import {hkdf} from "@noble/hashes/hkdf";
import {concatBytes, utf8ToBytes} from "@noble/hashes/utils";
import {x25519} from "@noble/curves/ed25519";

export const FORMATO_AVANCE = "reallearningpy-avance";
export const FORMATO_CLAVE_PRIVADA = "reallearningpy-clave-privada-profesor";
export const FORMATO_CLAVE_PUBLICA = "reallearningpy-clave-publica-profesor";

const PARAMETROS_SCRYPT = {N: 2 ** 15, r: 8, p: 1};
const INFO_PROFESOR = utf8ToBytes("reallearningpy-profesor-v1");

export class ContrasenaIncorrecta extends Error {
  constructor(message = "La contraseña es incorrecta o el archivo está dañado.") {
    super(message);
    this.name = "ContrasenaIncorrecta";
  }
}

// ---------- Utilidades ----------

export function aBase64(bytes) {
  let binario = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binario += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  }
  return btoa(binario);
}

export function deBase64(texto) {
  const binario = atob(texto);
  const bytes = new Uint8Array(binario.length);
  for (let i = 0; i < binario.length; i++) {
    bytes[i] = binario.charCodeAt(i);
  }
  return bytes;
}

const codificador = new TextEncoder();
const decodificador = new TextDecoder();

export function huella(clavePublica) {
  // Identificador corto y legible de una clave pública, p. ej. "3F2A-91C0-77DE"
  const hex = Array.from(sha256(clavePublica).slice(0, 6))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
  return hex.match(/.{4}/g).join("-");
}

// ---------- Primitivas ----------

export function nuevaSal() {
  return aBase64(randomBytes(16));
}

export async function derivarClave(contrasena, kdf) {
  const {N, r, p, sal} = kdf;
  return await scryptAsync(
    codificador.encode(contrasena.normalize("NFC")),
    deBase64(sal),
    {N, r, p, dkLen: 32, asyncTick: 20},
  );
}

export function nuevoKdf() {
  return {alg: "scrypt", ...PARAMETROS_SCRYPT, sal: nuevaSal()};
}

export function verificador(clave) {
  // Permite comprobar una contraseña sin guardar la contraseña ni la clave
  return aBase64(sha256(concatBytes(utf8ToBytes("reallearningpy-verificador"), clave)));
}

function cifrar(clave, bytes) {
  const nonce = randomBytes(24);
  const datos = xchacha20poly1305(clave, nonce).encrypt(bytes);
  return {nonce: aBase64(nonce), datos: aBase64(datos)};
}

function descifrar(clave, {nonce, datos}) {
  try {
    return xchacha20poly1305(clave, deBase64(nonce)).decrypt(deBase64(datos));
  } catch (e) {
    throw new ContrasenaIncorrecta();
  }
}

function clavePuenteProfesor(secretoCompartido, clavePublicaEfimera, clavePublicaProfesor) {
  return hkdf(sha256, secretoCompartido, concatBytes(clavePublicaEfimera, clavePublicaProfesor), INFO_PROFESOR, 32);
}

function envolverParaProfesor(claveDatos, clavePublicaProfesor) {
  const privadaEfimera = x25519.utils.randomPrivateKey();
  const publicaEfimera = x25519.getPublicKey(privadaEfimera);
  const compartido = x25519.getSharedSecret(privadaEfimera, clavePublicaProfesor);
  const puente = clavePuenteProfesor(compartido, publicaEfimera, clavePublicaProfesor);
  return {
    huella: huella(clavePublicaProfesor),
    efimera: aBase64(publicaEfimera),
    ...cifrar(puente, claveDatos),
  };
}

function desenvolverProfesor(sobre, clavePrivadaProfesor) {
  const publicaProfesor = x25519.getPublicKey(clavePrivadaProfesor);
  const publicaEfimera = deBase64(sobre.efimera);
  const compartido = x25519.getSharedSecret(clavePrivadaProfesor, publicaEfimera);
  const puente = clavePuenteProfesor(compartido, publicaEfimera, publicaProfesor);
  return descifrar(puente, sobre);
}

// ---------- Archivos de avance ----------

/**
 * Crea el contenido (objeto JSON) de un archivo de avance.
 * @param datos objeto con la información del alumno y su progreso
 * @param claveAlumno clave de 32 bytes derivada de la contraseña del alumno
 * @param kdf parámetros usados para derivar claveAlumno (incluida la sal)
 * @param clavePublicaProfesor Uint8Array o null si aún no se ha configurado
 */
export function crearArchivoAvance(datos, claveAlumno, kdf, clavePublicaProfesor) {
  const claveDatos = randomBytes(32);
  const archivo = {
    formato: FORMATO_AVANCE,
    version: 1,
    creado: new Date().toISOString(),
    kdf,
    datos: cifrar(claveDatos, codificador.encode(JSON.stringify(datos))),
    alumno: cifrar(claveAlumno, claveDatos),
    profesor: clavePublicaProfesor ? envolverParaProfesor(claveDatos, clavePublicaProfesor) : null,
  };
  return archivo;
}

export function validarArchivoAvance(archivo) {
  if (!archivo || archivo.formato !== FORMATO_AVANCE || !archivo.datos || !archivo.alumno) {
    throw new Error("Este archivo no es un archivo de avance de RealLearningPy.");
  }
  if (archivo.version > 1) {
    throw new Error("Este archivo fue creado con una versión más nueva de la aplicación. Actualiza la aplicación.");
  }
}

function descifrarDatos(archivo, claveDatos) {
  return JSON.parse(decodificador.decode(descifrar(claveDatos, archivo.datos)));
}

/** Abre un archivo de avance con la contraseña del alumno. */
export async function abrirComoAlumno(archivo, contrasena) {
  validarArchivoAvance(archivo);
  const claveAlumno = await derivarClave(contrasena, archivo.kdf);
  const claveDatos = descifrar(claveAlumno, archivo.alumno);
  return {datos: descifrarDatos(archivo, claveDatos), claveAlumno, kdf: archivo.kdf};
}

/** Abre un archivo de avance con la clave privada del profesor. */
export function abrirComoProfesor(archivo, clavePrivadaProfesor) {
  validarArchivoAvance(archivo);
  if (!archivo.profesor) {
    throw new Error(
      "Este archivo se creó cuando la aplicación aún no tenía configurada la clave del profesor, " +
      "así que sólo el alumno puede abrirlo. Pide al alumno que abra su archivo y lo vuelva a descargar."
    );
  }
  const publica = x25519.getPublicKey(clavePrivadaProfesor);
  if (archivo.profesor.huella !== huella(publica)) {
    throw new Error(
      `Este archivo se creó para otra clave de profesor (huella ${archivo.profesor.huella}).`
    );
  }
  const claveDatos = desenvolverProfesor(archivo.profesor, clavePrivadaProfesor);
  return descifrarDatos(archivo, claveDatos);
}

// ---------- Claves del profesor ----------

export async function generarClavesProfesor(contrasena) {
  const privada = x25519.utils.randomPrivateKey();
  const publica = x25519.getPublicKey(privada);
  const kdf = nuevoKdf();
  const claveContrasena = await derivarClave(contrasena, kdf);
  const huellaPublica = huella(publica);
  return {
    archivoPrivado: {
      formato: FORMATO_CLAVE_PRIVADA,
      version: 1,
      creado: new Date().toISOString(),
      huella: huellaPublica,
      clavePublica: aBase64(publica),
      kdf,
      clave: cifrar(claveContrasena, privada),
    },
    archivoPublico: {
      formato: FORMATO_CLAVE_PUBLICA,
      version: 1,
      huella: huellaPublica,
      clavePublica: aBase64(publica),
    },
  };
}

export async function abrirClavePrivadaProfesor(archivo, contrasena) {
  if (!archivo || archivo.formato !== FORMATO_CLAVE_PRIVADA) {
    throw new Error("Este archivo no es una clave privada de profesor de RealLearningPy.");
  }
  const claveContrasena = await derivarClave(contrasena, archivo.kdf);
  const privada = descifrar(claveContrasena, archivo.clave);
  return {privada, huella: huella(x25519.getPublicKey(privada))};
}

export function leerClavePublica(texto) {
  if (!texto) {
    return null;
  }
  try {
    const bytes = deBase64(texto.trim());
    return bytes.length === 32 ? bytes : null;
  } catch (e) {
    return null;
  }
}
