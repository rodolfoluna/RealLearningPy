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

const PARAMETROS_SCRYPT = {N: 2 ** 15, r: 8, p: 1};
const INFO_PROFESOR = utf8ToBytes("reallearningpy-profesor-v1");

export class ArchivoAlterado extends Error {
  constructor() {
    super("El archivo fue modificado fuera de la aplicación o está dañado. No se puede confiar en su contenido.");
    this.name = "ArchivoAlterado";
  }
}

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

// "aad" son datos adicionales que no se cifran pero quedan sellados: si cambian, el descifrado falla
function cifrar(clave, bytes, aad) {
  const nonce = randomBytes(24);
  const datos = xchacha20poly1305(clave, nonce, aad).encrypt(bytes);
  return {nonce: aBase64(nonce), datos: aBase64(datos)};
}

function descifrar(clave, {nonce, datos}, aad, ErrorAlFallar = ContrasenaIncorrecta) {
  try {
    return xchacha20poly1305(clave, deBase64(nonce), aad).decrypt(deBase64(datos));
  } catch (e) {
    throw new ErrorAlFallar();
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

// Versión 2: además del contenido, se sella la cabecera del archivo (fecha, parámetros y
// datos del profesor), de modo que cualquier cambio en cualquier parte del archivo se detecta.
const VERSION_AVANCE = 2;

function cabeceraSellada(archivo) {
  const {formato, version, creado, kdf, profesor} = archivo;
  return codificador.encode(JSON.stringify([
    formato, version, creado, kdf.alg, kdf.N, kdf.r, kdf.p, kdf.sal,
    profesor ? profesor.huella : null, profesor ? profesor.efimera : null,
  ]));
}

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
    version: VERSION_AVANCE,
    creado: new Date().toISOString(),
    kdf,
    profesor: clavePublicaProfesor ? envolverParaProfesor(claveDatos, clavePublicaProfesor) : null,
    alumno: cifrar(claveAlumno, claveDatos),
  };
  archivo.datos = cifrar(claveDatos, codificador.encode(JSON.stringify(datos)), cabeceraSellada(archivo));
  return archivo;
}

export function validarArchivoAvance(archivo) {
  if (!archivo || archivo.formato !== FORMATO_AVANCE || !archivo.datos || !archivo.alumno || !archivo.kdf) {
    throw new Error("Este archivo no es un archivo de avance de RealLearningPy, o fue modificado.");
  }
  if (archivo.version > VERSION_AVANCE) {
    throw new Error("Este archivo fue creado con una versión más nueva de la aplicación. Actualiza la aplicación.");
  }
}

function descifrarDatos(archivo, claveDatos) {
  // Los archivos de la versión 1 no sellaban la cabecera
  const aad = archivo.version >= 2 ? cabeceraSellada(archivo) : undefined;
  const bytes = descifrar(claveDatos, archivo.datos, aad, ArchivoAlterado);
  try {
    return JSON.parse(decodificador.decode(bytes));
  } catch (e) {
    throw new ArchivoAlterado();
  }
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
  let claveDatos;
  try {
    claveDatos = desenvolverProfesor(archivo.profesor, clavePrivadaProfesor);
  } catch (e) {
    throw new ArchivoAlterado();
  }
  return descifrarDatos(archivo, claveDatos);
}

// ---------- Llave del profesor derivada de una frase secreta ----------
//
// La llave privada del profesor no se guarda en ningún archivo: se calcula cada vez a partir
// de su frase secreta. Así no hay nada que descargar, copiar o perder; basta con recordar la frase.
// La frase se normaliza (minúsculas y espacios simples) para evitar errores al escribirla.

const KDF_PROFESOR = {N: 2 ** 16, r: 8, p: 1, sal: "RealLearningPy/llave-profesor/v1"};
export const MIN_CARACTERES_FRASE = 20;
export const MIN_PALABRAS_FRASE = 4;

export function normalizarFrase(frase) {
  return frase.normalize("NFC").trim().replace(/\s+/g, " ").toLocaleLowerCase("es");
}

/** Devuelve un mensaje de error si la frase es demasiado débil, o null si es aceptable. */
export function problemaConFrase(frase) {
  const normal = normalizarFrase(frase);
  if (normal.split(" ").length < MIN_PALABRAS_FRASE) {
    return `Usa una frase de al menos ${MIN_PALABRAS_FRASE} palabras.`;
  }
  if (normal.length < MIN_CARACTERES_FRASE) {
    return `Usa una frase de al menos ${MIN_CARACTERES_FRASE} caracteres.`;
  }
  return null;
}

export async function llaveDesdeFrase(frase) {
  const {N, r, p, sal} = KDF_PROFESOR;
  const privada = await scryptAsync(
    codificador.encode(normalizarFrase(frase)),
    utf8ToBytes(sal),
    {N, r, p, dkLen: 32, asyncTick: 20},
  );
  const publica = x25519.getPublicKey(privada);
  return {privada, clavePublica: aBase64(publica), huella: huella(publica)};
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
