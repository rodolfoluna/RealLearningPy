import React, {useState} from "react";
import _ from "lodash";
import Popup from "reactjs-popup";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faFileCsv,
  faFolderOpen,
  faKey,
  faLock,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import {
  abrirClavePrivadaProfesor,
  abrirComoProfesor,
  crearArchivoAvance,
  derivarClave,
  generarClavesProfesor,
  nuevoKdf,
} from "./cripto";
import {x25519} from "@noble/curves/ed25519";
import {bookState} from "../book/store";
import {descargarBlob, huellaProfesor, leerArchivoJson, NOMBRE_APP, nombreArchivo} from "./perfil";
import {BotonTrabajando, Campo, Mensaje} from "./componentes";

// La clave privada del profesor sólo se guarda en memoria mientras el panel está abierto
let clavePrivadaEnMemoria = null;

function formatoFecha(iso) {
  if (!iso) {
    return "—";
  }
  const fecha = new Date(iso);
  return fecha.toLocaleString("es-MX", {dateStyle: "short", timeStyle: "short"});
}

function Barra({porcentaje}) {
  return <div className="progress barra-avance" title={`${porcentaje}%`}>
    <div className="progress-bar bg-success" role="progressbar" style={{width: `${porcentaje}%`}}
         aria-valuenow={porcentaje} aria-valuemin="0" aria-valuemax="100">
      {porcentaje}%
    </div>
  </div>;
}

function volverAlCurso() {
  const pagina = bookState.user?.pageSlug;
  window.location.hash = pagina && pagina !== "loading_placeholder" ? pagina : "";
}

function descargarJson(objeto, nombre) {
  descargarBlob(new Blob([JSON.stringify(objeto, null, 2)], {type: "application/json"}), nombre);
}

// ---------- Clave del profesor ----------

function AbrirClave({alAbrir}) {
  const [archivo, setArchivo] = useState(null);
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState(null);
  const [trabajando, setTrabajando] = useState(false);

  const enviar = async (e) => {
    e.preventDefault();
    setError(null);
    if (!archivo) {
      setError("Elige el archivo de tu clave privada.");
      return;
    }
    setTrabajando(true);
    try {
      const clave = await abrirClavePrivadaProfesor(await leerArchivoJson(archivo), contrasena);
      clavePrivadaEnMemoria = clave;
      alAbrir(clave);
    } catch (e) {
      setError(e);
    }
    setTrabajando(false);
  };

  return <form onSubmit={enviar} className="seccion-panel">
    <h2><FontAwesomeIcon icon={faKey}/> Abrir mi clave de profesor</h2>
    <p>
      Para ver los archivos de avance de tus alumnos, abre tu archivo de <b>clave privada</b>{" "}
      (<code>clave_privada_profesor.json</code>) y escribe su contraseña.
    </p>
    <div className="form-group">
      <label htmlFor="archivo-clave">Archivo de clave privada</label>
      <input type="file" className="form-control-file" id="archivo-clave"
             onChange={e => setArchivo(e.target.files[0] || null)}/>
    </div>
    <Campo etiqueta="Contraseña de la clave" name="contrasena-clave" type="password" value={contrasena}
           onChange={e => setContrasena(e.target.value)} required autoComplete="current-password"/>
    <Mensaje error={error}/>
    <BotonTrabajando type="submit" className="btn btn-primary" trabajando={trabajando} textoTrabajando="Abriendo...">
      Abrir clave
    </BotonTrabajando>
  </form>;
}

function GenerarClaves() {
  const [contrasena, setContrasena] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [error, setError] = useState(null);
  const [trabajando, setTrabajando] = useState(false);
  const [resultado, setResultado] = useState(null);

  const enviar = async (e) => {
    e.preventDefault();
    setError(null);
    if (contrasena.length < 8) {
      setError("Usa una contraseña de al menos 8 caracteres.");
      return;
    }
    if (contrasena !== confirmacion) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setTrabajando(true);
    try {
      const claves = await generarClavesProfesor(contrasena);
      descargarJson(claves.archivoPrivado, "clave_privada_profesor.json");
      setResultado(claves);
    } catch (e) {
      setError(e);
    }
    setTrabajando(false);
  };

  if (resultado) {
    const {archivoPublico, archivoPrivado} = resultado;
    return <div>
      <div className="alert alert-success">
        Se descargó <b>clave_privada_profesor.json</b> (huella <b>{archivoPublico.huella}</b>).
        Guárdalo en un lugar seguro junto con su contraseña y <b>no lo compartas con los alumnos</b>.
        Si lo pierdes, no podrás abrir los archivos creados para esta clave.
      </div>
      <p>
        Para que los archivos de avance de los alumnos se puedan abrir con esta clave, la aplicación debe
        incluir tu <b>clave pública</b>. Cópiala en el archivo <code>frontend/src/config/profesor.json</code> del
        proyecto (campo <code>clavePublica</code>) o en la variable <code>REACT_APP_CLAVE_PUBLICA_PROFESOR</code> y
        vuelve a publicar la aplicación:
      </p>
      <pre className="clave-publica">{archivoPublico.clavePublica}</pre>
      <p>
        <button className="btn btn-outline-primary btn-sm"
                onClick={() => navigator.clipboard?.writeText(archivoPublico.clavePublica)}>
          Copiar clave pública
        </button>{" "}
        <button className="btn btn-outline-primary btn-sm"
                onClick={() => descargarJson(archivoPublico, "clave_publica_profesor.json")}>
          Descargar clave pública
        </button>{" "}
        <button className="btn btn-outline-secondary btn-sm"
                onClick={() => descargarJson(archivoPrivado, "clave_privada_profesor.json")}>
          Descargar otra vez la clave privada
        </button>
      </p>
      <p className="text-muted">
        La clave pública no es secreta: sólo sirve para cifrar archivos que únicamente tu clave privada puede abrir.
      </p>
    </div>;
  }

  return <form onSubmit={enviar}>
    <p>
      Genera un par de claves nuevo. Sólo necesitas hacerlo <b>una vez</b> (por ejemplo, al inicio del curso).
    </p>
    <Campo etiqueta="Contraseña para proteger tu clave privada" name="nueva-contrasena-profesor" type="password"
           value={contrasena} onChange={e => setContrasena(e.target.value)} autoComplete="new-password"/>
    <Campo etiqueta="Repite la contraseña" name="confirmar-contrasena-profesor" type="password"
           value={confirmacion} onChange={e => setConfirmacion(e.target.value)} autoComplete="new-password"/>
    <Mensaje error={error}/>
    <BotonTrabajando type="submit" className="btn btn-secondary" trabajando={trabajando} textoTrabajando="Generando...">
      Generar claves
    </BotonTrabajando>
  </form>;
}

// ---------- Archivos de alumnos ----------

async function abrirArchivos(files, clave) {
  return await Promise.all(Array.from(files).map(async (file) => {
    try {
      const contenido = await leerArchivoJson(file);
      const datos = abrirComoProfesor(contenido, clave.privada);
      return {id: _.uniqueId("archivo"), nombreArchivo: file.name, datos};
    } catch (e) {
      return {id: _.uniqueId("archivo"), nombreArchivo: file.name, error: e.message || String(e)};
    }
  }));
}

/** Si hay varios archivos del mismo alumno, se muestra el exportado más recientemente. */
function agruparPorAlumno(archivos) {
  const grupos = _.groupBy(archivos.filter(a => a.datos), a => a.datos.alumno.numeroControl);
  return _.sortBy(
    Object.values(grupos).map(grupo => {
      const ordenados = _.sortBy(grupo, a => a.datos.exportado).reverse();
      return {...ordenados[0], cantidad: grupo.length};
    }),
    a => a.datos.alumno.numeroControl,
  );
}

function celdaCsv(valor) {
  const texto = valor === null || valor === undefined ? "" : String(valor);
  return /[";\n\r]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}

function descargarCsv(alumnos) {
  const lecciones = alumnos[0]?.datos.resumen.porLeccion || [];
  const encabezados = [
    "Número de control", "Nombre", "Avance (%)", "Lecciones completadas", "Lecciones totales",
    "Pasos completados", "Pasos totales", "Lección actual", "Archivo exportado el",
    ...lecciones.map(l => `${l.capitulo} / ${l.titulo}`),
  ];
  const filas = alumnos.map(({datos: {alumno, resumen, progreso, exportado}}) => {
    const porSlug = _.keyBy(resumen.porLeccion, "slug");
    return [
      alumno.numeroControl, alumno.nombre, resumen.porcentaje, resumen.leccionesCompletadas,
      resumen.leccionesTotales, resumen.pasosCompletados, resumen.pasosTotales, progreso.paginaActual,
      formatoFecha(exportado),
      ...lecciones.map(l => {
        const leccion = porSlug[l.slug];
        if (!leccion) {
          return "";
        }
        if (leccion.soloLectura) {
          return "Lectura";
        }
        return leccion.completada ? "Completada" : `${leccion.pasosCompletados}/${leccion.pasosTotales}`;
      }),
    ];
  });
  // Separador ";" y BOM para que Excel en español lo abra correctamente
  const csv = "﻿" + [encabezados, ...filas].map(fila => fila.map(celdaCsv).join(";")).join("\r\n");
  const fecha = new Date().toISOString().slice(0, 10);
  descargarBlob(new Blob([csv], {type: "text/csv;charset=utf-8"}), `reporte_avance_${fecha}.csv`);
}

function DetalleAlumno({datos, cerrar}) {
  const {alumno, resumen, progreso, exportado} = datos;
  const capitulos = _.groupBy(resumen.porLeccion, "capitulo");
  return <div className="modal-local">
    <button className="close" onClick={cerrar} aria-label="Cerrar">&times;</button>
    <h3>{alumno.nombre}</h3>
    <p>
      Número de control: <b>{alumno.numeroControl}</b><br/>
      Archivo exportado el: <b>{formatoFecha(exportado)}</b><br/>
      Lección actual: <b>{progreso.paginaActual || "—"}</b>
    </p>
    <Barra porcentaje={resumen.porcentaje}/>
    <p className="mt-2">
      {resumen.leccionesCompletadas} de {resumen.leccionesTotales} lecciones completadas
      ({resumen.pasosCompletados} de {resumen.pasosTotales} pasos).
    </p>
    {Object.entries(capitulos).map(([capitulo, lecciones]) =>
      <div key={capitulo}>
        <h5 className="mt-3">{capitulo}</h5>
        <div className="table-responsive">
          <table className="table table-sm tabla-lecciones">
            <thead>
            <tr><th>Lección</th><th>Pasos</th><th>Completada el</th><th>Última actividad</th></tr>
            </thead>
            <tbody>
            {lecciones.map(l =>
              <tr key={l.slug} className={l.completada ? "table-success" : l.pasosCompletados ? "table-warning" : ""}>
                <td>{l.titulo}</td>
                <td>{l.soloLectura ? "Lectura" : `${l.pasosCompletados}/${l.pasosTotales}`}</td>
                <td>{formatoFecha(l.completadaEl)}</td>
                <td>{formatoFecha(l.ultimaActividad)}</td>
              </tr>
            )}
            </tbody>
          </table>
        </div>
      </div>
    )}
    {progreso.editorContent &&
      <>
        <h5 className="mt-3">Código en el editor</h5>
        <pre className="codigo-alumno">{progreso.editorContent}</pre>
      </>
    }
  </div>;
}

function RestablecerContrasena({archivo, clave, cerrar}) {
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState(null);
  const [trabajando, setTrabajando] = useState(false);
  const [listo, setListo] = useState(null);
  const {alumno} = archivo.datos;

  const enviar = async (e) => {
    e.preventDefault();
    setError(null);
    if (contrasena.length < 4) {
      setError("La contraseña debe tener al menos 4 caracteres.");
      return;
    }
    setTrabajando(true);
    try {
      const kdf = nuevoKdf();
      const claveAlumno = await derivarClave(contrasena, kdf);
      const publica = x25519.getPublicKey(clave.privada);
      const nuevo = crearArchivoAvance(archivo.datos, claveAlumno, kdf, publica);
      const nombre = nombreArchivo(alumno.numeroControl, alumno.nombre).replace(".rlpy", "_nueva_contrasena.rlpy");
      descargarBlob(new Blob([JSON.stringify(nuevo)], {type: "application/octet-stream"}), nombre);
      setListo(nombre);
    } catch (e) {
      setError(e);
    }
    setTrabajando(false);
  };

  return <div className="modal-local">
    <button className="close" onClick={cerrar} aria-label="Cerrar">&times;</button>
    <h3>Restablecer contraseña</h3>
    <p>
      Se creará una copia del archivo de <b>{alumno.nombre}</b> ({alumno.numeroControl}) que se abre con
      una contraseña nueva. Entrega el archivo nuevo al alumno para que lo cargue en su dispositivo con
      <em> Ya tengo mi archivo de avance</em>.
    </p>
    {listo ?
      <div className="alert alert-success">Se descargó <b>{listo}</b>.</div> :
      <form onSubmit={enviar}>
        <Campo etiqueta="Contraseña nueva para el alumno" name="contrasena-restablecida" type="text"
               value={contrasena} onChange={e => setContrasena(e.target.value)} autoComplete="off"/>
        <Mensaje error={error}/>
        <BotonTrabajando type="submit" className="btn btn-primary" trabajando={trabajando}>
          Crear archivo con contraseña nueva
        </BotonTrabajando>
      </form>
    }
  </div>;
}

function ArchivosAlumnos({clave}) {
  const [archivos, setArchivos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [arrastrando, setArrastrando] = useState(false);
  const [detalle, setDetalle] = useState(null);
  const [restablecer, setRestablecer] = useState(null);

  const agregar = async (files) => {
    if (!files?.length) {
      return;
    }
    setCargando(true);
    const nuevos = await abrirArchivos(files, clave);
    setArchivos(anteriores => [...anteriores, ...nuevos]);
    setCargando(false);
  };

  const alumnos = agruparPorAlumno(archivos);
  const errores = archivos.filter(a => a.error);

  return <div className="seccion-panel">
    <h2><FontAwesomeIcon icon={faFolderOpen}/> Archivos de avance de los alumnos</h2>
    <div
      className={"zona-archivos" + (arrastrando ? " arrastrando" : "")}
      onDragOver={e => {
        e.preventDefault();
        setArrastrando(true);
      }}
      onDragLeave={() => setArrastrando(false)}
      onDrop={e => {
        e.preventDefault();
        setArrastrando(false);
        agregar(e.dataTransfer.files);
      }}
    >
      <p>Elige uno o varios archivos <code>.rlpy</code> (o arrástralos aquí).</p>
      <input type="file" multiple className="form-control-file" id="archivos-alumnos"
             onChange={e => {
               agregar(e.target.files);
               e.target.value = "";
             }}/>
      {cargando && <p className="mt-2">Abriendo archivos...</p>}
    </div>

    {errores.length > 0 &&
      <div className="alert alert-danger mt-3">
        <b>No se pudieron abrir {errores.length} archivo(s):</b>
        <ul className="mb-0">
          {errores.map(a => <li key={a.id}><code>{a.nombreArchivo}</code>: {a.error}</li>)}
        </ul>
      </div>
    }

    {alumnos.length > 0 && <>
      <div className="acciones-tabla">
        <span>{alumnos.length} alumno(s)</span>
        <button className="btn btn-success btn-sm" onClick={() => descargarCsv(alumnos)}>
          <FontAwesomeIcon icon={faFileCsv}/> Descargar reporte (CSV/Excel)
        </button>
        <button className="btn btn-outline-secondary btn-sm" onClick={() => setArchivos([])}>
          <FontAwesomeIcon icon={faTrash}/> Limpiar lista
        </button>
      </div>
      <div className="table-responsive">
        <table className="table table-striped table-hover tabla-alumnos">
          <thead>
          <tr>
            <th>No. de control</th>
            <th>Nombre</th>
            <th>Avance</th>
            <th>Lecciones</th>
            <th>Lección actual</th>
            <th>Exportado</th>
            <th/>
          </tr>
          </thead>
          <tbody>
          {alumnos.map(a => {
            const {alumno, resumen, progreso, exportado} = a.datos;
            return <tr key={a.id}>
              <td>{alumno.numeroControl}</td>
              <td>{alumno.nombre}</td>
              <td style={{minWidth: "8em"}}><Barra porcentaje={resumen.porcentaje}/></td>
              <td>{resumen.leccionesCompletadas}/{resumen.leccionesTotales}</td>
              <td>{progreso.paginaActual}</td>
              <td>
                {formatoFecha(exportado)}
                {a.cantidad > 1 && <div className="text-muted small">({a.cantidad} archivos; se muestra el más reciente)</div>}
              </td>
              <td className="text-nowrap">
                <button className="btn btn-primary btn-sm" onClick={() => setDetalle(a)}>Ver detalle</button>{" "}
                <button className="btn btn-outline-secondary btn-sm" onClick={() => setRestablecer(a)}>
                  Restablecer contraseña
                </button>
              </td>
            </tr>;
          })}
          </tbody>
        </table>
      </div>
    </>}

    <Popup open={!!detalle} onClose={() => setDetalle(null)} modal nested className="rlpy">
      {detalle && <DetalleAlumno datos={detalle.datos} cerrar={() => setDetalle(null)}/>}
    </Popup>
    <Popup open={!!restablecer} onClose={() => setRestablecer(null)} modal nested className="rlpy">
      {restablecer && <RestablecerContrasena archivo={restablecer} clave={clave} cerrar={() => setRestablecer(null)}/>}
    </Popup>
  </div>;
}

export function PanelProfesor() {
  const [clave, setClave] = useState(clavePrivadaEnMemoria);

  return <div className="panel-profesor">
    <nav className="navbar navbar-dark bg-dark">
      <span className="navbar-brand">{NOMBRE_APP} · Panel del profesor</span>
      <button className="btn btn-outline-light btn-sm" onClick={volverAlCurso}>
        <FontAwesomeIcon icon={faArrowLeft}/> Volver
      </button>
    </nav>
    <div className="container contenido-panel">
      {huellaProfesor ?
        <p className="text-muted">
          Esta aplicación cifra los archivos de avance para la clave de profesor con huella <b>{huellaProfesor}</b>.
        </p> :
        <div className="alert alert-warning">
          <b>Esta aplicación aún no tiene configurada una clave de profesor.</b> Los archivos de avance que
          descarguen los alumnos sólo podrán abrirlos ellos mismos. Genera tus claves más abajo y configura la
          clave pública antes de que los alumnos empiecen a usar la aplicación.
        </div>
      }

      {clave ?
        <div className="seccion-panel">
          <p>
            <FontAwesomeIcon icon={faKey}/> Clave abierta (huella <b>{clave.huella}</b>).{" "}
            <button className="btn btn-link btn-sm" onClick={() => {
              clavePrivadaEnMemoria = null;
              setClave(null);
            }}>
              <FontAwesomeIcon icon={faLock}/> Cerrar clave
            </button>
          </p>
          {huellaProfesor && clave.huella !== huellaProfesor &&
            <div className="alert alert-warning">
              Esta clave no es la que tiene configurada la aplicación ({huellaProfesor}), así que no podrás abrir
              los archivos nuevos de los alumnos con ella.
            </div>
          }
        </div> :
        <AbrirClave alAbrir={setClave}/>
      }

      {clave && <ArchivosAlumnos clave={clave}/>}

      <details className="seccion-panel" open={!huellaProfesor}>
        <summary><h2 className="d-inline">Generar claves del profesor</h2></summary>
        <div className="mt-3"><GenerarClaves/></div>
      </details>
    </div>
  </div>;
}
