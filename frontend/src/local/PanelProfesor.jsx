import React, {useState} from "react";
import _ from "lodash";
import Popup from "reactjs-popup";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {
  faBookOpen,
  faEye,
  faEyeSlash,
  faFileCsv,
  faFolderOpen,
  faKey,
  faLock,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import {
  abrirComoProfesor,
  crearArchivoAvance,
  derivarClave,
  llaveDesdeFrase,
  MIN_PALABRAS_FRASE,
  nuevoKdf,
  problemaConFrase,
} from "./cripto";
import {x25519} from "@noble/curves/ed25519";
import {descargarBlob, huellaProfesor, leerArchivoJson, NOMBRE_APP, nombreArchivo} from "./comun";
import {BotonTrabajando, Campo, Mensaje} from "./componentes";

// La llave privada del profesor sólo existe en memoria mientras el panel está abierto:
// se calcula a partir de la frase secreta y nunca se guarda ni se descarga.
let llaveEnMemoria = null;

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

// ---------- Llave del profesor (frase secreta) ----------

function CampoFrase({etiqueta, id, value, onChange, visible, autoFocus}) {
  return <div className="form-group">
    <label htmlFor={id}>{etiqueta}</label>
    <input className="form-control" id={id} type={visible ? "text" : "password"} value={value}
           onChange={e => onChange(e.target.value)} autoComplete="off" autoCapitalize="none"
           spellCheck={false} autoFocus={autoFocus}/>
  </div>;
}

function LlavePublica({llave}) {
  return <div className="mt-3">
    <p>
      Configura esta <b>llave pública</b> en la app de los alumnos. En GitHub: <em>Settings → Secrets and
      variables → Actions → Variables</em>, crea la variable <code>CLAVE_PUBLICA_PROFESOR</code> con este valor
      y vuelve a publicar la app:
    </p>
    <pre className="clave-publica">{llave.clavePublica}</pre>
    <button className="btn btn-outline-primary btn-sm"
            onClick={() => navigator.clipboard?.writeText(llave.clavePublica)}>
      Copiar llave pública
    </button>
    <p className="text-muted mt-2 mb-0">
      La llave pública no es secreta: sólo sirve para cifrar archivos que únicamente tu frase puede abrir.
      Su huella es <b>{llave.huella}</b>.
    </p>
  </div>;
}

function AbrirConFrase({alAbrir}) {
  const primeraVez = !huellaProfesor;
  const [frase, setFrase] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState(null);
  const [trabajando, setTrabajando] = useState(false);
  const [noCoincide, setNoCoincide] = useState(null);

  const enviar = async (e) => {
    e.preventDefault();
    setError(null);
    setNoCoincide(null);
    if (primeraVez) {
      const problema = problemaConFrase(frase);
      if (problema) {
        setError(problema);
        return;
      }
      if (frase !== confirmacion) {
        setError("Las frases no coinciden.");
        return;
      }
    }
    setTrabajando(true);
    try {
      const llave = await llaveDesdeFrase(frase);
      if (!primeraVez && llave.huella !== huellaProfesor) {
        setNoCoincide(llave);
      } else {
        llaveEnMemoria = llave;
        alAbrir(llave);
      }
    } catch (e) {
      setError(e);
    }
    setTrabajando(false);
  };

  return <form onSubmit={enviar} className="seccion-panel">
    <h2><FontAwesomeIcon icon={faKey}/> {primeraVez ? "Crea tu frase secreta" : "Escribe tu frase secreta"}</h2>
    {primeraVez ?
      <>
        <div className="alert alert-warning">
          <b>La app de los alumnos aún no tiene configurada tu llave.</b> Elige una frase secreta: de ella se
          calcula tu llave de profesor. No se guarda ni se descarga en ningún lugar, así que <b>memorízala o
          guárdala en un lugar seguro</b>. Si la olvidas, no podrás abrir los archivos de los alumnos.
        </div>
        <p>
          Usa al menos {MIN_PALABRAS_FRASE} palabras que no tengan relación entre sí, por ejemplo:
          <em> «nopal bicicleta lunes marimba ventana»</em>. No distingue mayúsculas de minúsculas.
        </p>
      </>
      :
      <p>
        Para ver los archivos de avance de tus alumnos escribe tu frase secreta
        (llave con huella <b>{huellaProfesor}</b>). No distingue mayúsculas de minúsculas.
      </p>
    }
    <CampoFrase etiqueta="Frase secreta" id="frase-profesor" value={frase} onChange={setFrase}
                visible={visible} autoFocus/>
    {primeraVez &&
      <CampoFrase etiqueta="Repite la frase" id="confirmar-frase-profesor" value={confirmacion}
                  onChange={setConfirmacion} visible={visible}/>
    }
    <div className="form-group">
      <button type="button" className="btn btn-link btn-sm p-0" onClick={() => setVisible(!visible)}>
        <FontAwesomeIcon icon={visible ? faEyeSlash : faEye}/> {visible ? "Ocultar" : "Mostrar"} frase
      </button>
    </div>
    <Mensaje error={error}/>
    {noCoincide &&
      <div className="alert alert-danger">
        Esta frase no corresponde a la llave configurada en la app de los alumnos (huella {huellaProfesor}).
        Revisa que la escribiste igual que la primera vez.
        <details className="mt-2">
          <summary>Quiero cambiar mi frase secreta</summary>
          <p className="mt-2">
            Si configuras una frase nueva, <b>los archivos que los alumnos descarguen a partir de entonces</b> sólo
            se abrirán con la frase nueva; los anteriores seguirán necesitando la frase anterior.
          </p>
          <LlavePublica llave={noCoincide}/>
        </details>
      </div>
    }
    <BotonTrabajando type="submit" className="btn btn-primary" trabajando={trabajando} textoTrabajando="Calculando llave...">
      {primeraVez ? "Crear mi llave" : "Abrir"}
    </BotonTrabajando>
  </form>;
}

// ---------- Archivos de alumnos ----------

const MARGEN = 5 * 60 * 1000;  // tolerancia para pequeñas diferencias de reloj

/**
 * Revisa que el contenido del archivo sea coherente. El sello criptográfico ya garantiza que el archivo
 * no se editó; estas revisiones ayudan a detectar un archivo fabricado fuera de la app con un programa.
 */
function revisarArchivo({datos, version}) {
  const observaciones = [];
  const {resumen, evidencias, actividad = {}, exportado, perfilCreado} = datos;
  const fechaExportado = Date.parse(exportado);
  const posterior = (iso) => Date.parse(iso) > fechaExportado + MARGEN;

  if (version < 2) {
    observaciones.push("Formato antiguo: la cabecera del archivo no está sellada. Pide al alumno que lo vuelva a descargar.");
  }
  if (!(fechaExportado <= Date.now() + MARGEN)) {
    observaciones.push("La fecha de exportación está en el futuro (reloj del dispositivo incorrecto o archivo manipulado).");
  }
  if (_.sumBy(resumen.porLeccion, "pasosCompletados") !== resumen.pasosCompletados) {
    observaciones.push("El resumen del avance no coincide con el detalle por lección.");
  }
  if (Object.values(actividad).some(a => a.completada && posterior(a.completada))) {
    observaciones.push("Hay lecciones completadas con fecha posterior a la exportación del archivo.");
  }
  if (!evidencias) {
    observaciones.push("El archivo no incluye el código de los pasos superados (fue creado con una versión anterior de la app).");
  } else {
    const porLeccion = _.countBy(Object.keys(evidencias), clave => clave.split("/")[0]);
    const sinCodigo = _.sumBy(resumen.porLeccion, l => Math.max(0, l.pasosCompletados - (porLeccion[l.slug] || 0)));
    if (sinCodigo > 0) {
      observaciones.push(`${sinCodigo} paso(s) completado(s) sin registro del código con que se superaron.`);
    }
    const fechas = Object.values(evidencias).map(e => e.fecha);
    if (fechas.some(posterior)) {
      observaciones.push("Hay pasos superados con fecha posterior a la exportación del archivo.");
    }
    if (perfilCreado && fechas.some(f => Date.parse(f) < Date.parse(perfilCreado) - MARGEN)) {
      observaciones.push("Hay pasos superados con fecha anterior al registro del alumno.");
    }
  }
  return observaciones;
}

function Verificacion({observaciones}) {
  if (!observaciones.length) {
    return <span className="text-success" title="Archivo sellado por la app, sin modificaciones y con contenido coherente">
      ✔ Íntegro
    </span>;
  }
  return <span className="text-warning font-weight-bold" title={observaciones.join("\n")}>
    ⚠ Revisar ({observaciones.length})
  </span>;
}

async function abrirArchivos(files, clave) {
  return await Promise.all(Array.from(files).map(async (file) => {
    try {
      const contenido = await leerArchivoJson(file);
      const datos = abrirComoProfesor(contenido, clave.privada);
      const archivo = {id: _.uniqueId("archivo"), nombreArchivo: file.name, datos, version: contenido.version};
      return {...archivo, observaciones: revisarArchivo(archivo)};
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
    "Pasos completados", "Pasos totales", "Lección actual", "Archivo exportado el", "Verificación",
    ...lecciones.map(l => `${l.capitulo} / ${l.titulo}`),
  ];
  const filas = alumnos.map(({datos: {alumno, resumen, progreso, exportado}, observaciones}) => {
    const porSlug = _.keyBy(resumen.porLeccion, "slug");
    return [
      alumno.numeroControl, alumno.nombre, resumen.porcentaje, resumen.leccionesCompletadas,
      resumen.leccionesTotales, resumen.pasosCompletados, resumen.pasosTotales, progreso.paginaActual,
      formatoFecha(exportado),
      observaciones.length ? `Revisar: ${observaciones.join(" | ")}` : "Íntegro",
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

function CodigoDeLeccion({evidencias, slug}) {
  const pasos = _.sortBy(
    Object.entries(evidencias || {}).filter(([clave]) => clave.split("/")[0] === slug),
    ([, e]) => e.fecha,
  );
  if (!pasos.length) {
    return null;
  }
  return <details>
    <summary className="small">Ver código ({pasos.length})</summary>
    {pasos.map(([clave, e]) =>
      <div key={clave} className="mt-1">
        <div className="small text-muted">{clave.split("/")[1]} · {formatoFecha(e.fecha)}</div>
        <pre className="codigo-alumno mb-1">{e.codigo}</pre>
      </div>
    )}
  </details>;
}

function DetalleAlumno({archivo, cerrar}) {
  const {datos, observaciones} = archivo;
  const {alumno, resumen, progreso, exportado, evidencias} = datos;
  const capitulos = _.groupBy(resumen.porLeccion, "capitulo");
  return <div className="modal-local">
    <button className="close" onClick={cerrar} aria-label="Cerrar">&times;</button>
    <h3>{alumno.nombre}</h3>
    <p>
      Número de control: <b>{alumno.numeroControl}</b><br/>
      Archivo exportado el: <b>{formatoFecha(exportado)}</b><br/>
      Lección actual: <b>{progreso.paginaActual || "—"}</b>
    </p>
    {observaciones.length ?
      <div className="alert alert-warning">
        <b>Revisa este archivo:</b>
        <ul className="mb-0">{observaciones.map(o => <li key={o}>{o}</li>)}</ul>
      </div> :
      <div className="alert alert-success py-2">
        ✔ Archivo sellado por la app, sin modificaciones y con contenido coherente.
      </div>
    }
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
                <td>{l.titulo}<CodigoDeLeccion evidencias={evidencias} slug={l.slug}/></td>
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
        <b>No se pudieron abrir {errores.length} archivo(s) (dañados, modificados fuera de la app o de otra llave):</b>
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
            <th>Verificación</th>
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
              <td><Verificacion observaciones={a.observaciones}/></td>
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
      {detalle && <DetalleAlumno archivo={detalle} cerrar={() => setDetalle(null)}/>}
    </Popup>
    <Popup open={!!restablecer} onClose={() => setRestablecer(null)} modal nested className="rlpy">
      {restablecer && <RestablecerContrasena archivo={restablecer} clave={clave} cerrar={() => setRestablecer(null)}/>}
    </Popup>
  </div>;
}

export function PanelProfesor() {
  const [llave, setLlave] = useState(llaveEnMemoria);

  return <div className="panel-profesor">
    <nav className="navbar navbar-dark bg-dark">
      <span className="navbar-brand">{NOMBRE_APP} · Profesor</span>
      <a className="btn btn-outline-light btn-sm" href="../" target="_blank" rel="noreferrer">
        <FontAwesomeIcon icon={faBookOpen}/> App del alumno
      </a>
    </nav>
    <div className="container contenido-panel">
      {llave ?
        <div className="seccion-panel">
          <p className="mb-0">
            <FontAwesomeIcon icon={faKey}/> Llave abierta (huella <b>{llave.huella}</b>).{" "}
            <button className="btn btn-link btn-sm" onClick={() => {
              llaveEnMemoria = null;
              setLlave(null);
            }}>
              <FontAwesomeIcon icon={faLock}/> Cerrar
            </button>
          </p>
          {!huellaProfesor && <LlavePublica llave={llave}/>}
        </div> :
        <AbrirConFrase alAbrir={setLlave}/>
      }

      {llave && <ArchivosAlumnos clave={llave}/>}
    </div>
  </div>;
}
