import React, {useContext, useEffect, useState} from "react";
import _ from "lodash";
import Popup from "reactjs-popup";
import {useSelector} from "react-redux";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {
  faChalkboardTeacher,
  faDownload,
  faExclamationCircle,
  faLock,
  faShareAlt,
  faUserCircle,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import {
  borrarAlumnoDeEsteDispositivo,
  cargarActividad,
  cargarEstado,
  compartirAvance,
  descargarAvance,
  EVENTO_ESTADO,
  huellaProfesor,
  puedeCompartirArchivos,
  resumenActual,
} from "./perfil";
import {PerfilContext} from "./Acceso";
import {Mensaje} from "./componentes";

function formatoFecha(iso) {
  return iso ? new Date(iso).toLocaleString("es-MX", {dateStyle: "medium", timeStyle: "short"}) : null;
}

/** Estado de guardado: si hay avance que todavía no se ha descargado en un archivo. */
export function useEstadoGuardado() {
  const [estado, setEstado] = useState({});
  const pagesProgress = useSelector(state => state.book.user.pagesProgress);
  useEffect(() => {
    let activo = true;
    const leer = () => cargarEstado().then(e => activo && setEstado(e));
    // La actividad se guarda de forma asíncrona, así que se vuelve a leer un momento después
    leer();
    const temporizador = setTimeout(leer, 1500);
    const intervalo = setInterval(leer, 15000);
    window.addEventListener(EVENTO_ESTADO, leer);
    return () => {
      activo = false;
      clearTimeout(temporizador);
      clearInterval(intervalo);
      window.removeEventListener(EVENTO_ESTADO, leer);
    };
  }, [pagesProgress]);
  const sinGuardar = !!estado.ultimoCambio && (!estado.ultimaExportacion || estado.ultimoCambio > estado.ultimaExportacion);
  return {...estado, sinGuardar, recargar: () => cargarEstado().then(setEstado)};
}

function ContenidoMiAvance({cerrar}) {
  const {perfil, bloquear} = useContext(PerfilContext);
  const estado = useEstadoGuardado();
  const [actividad, setActividad] = useState({});
  const [mensaje, setMensaje] = useState(null);
  const [error, setError] = useState(null);
  const [trabajando, setTrabajando] = useState(false);
  const [confirmarCambio, setConfirmarCambio] = useState(false);
  useSelector(state => state.book.user.pagesProgress);  // volver a calcular cuando haya avance

  useEffect(() => {
    cargarActividad().then(setActividad);
  }, []);

  const resumen = resumenActual(actividad);
  const capitulos = _.groupBy(resumen.porLeccion, "capitulo");

  const ejecutar = async (accion) => {
    setError(null);
    setMensaje(null);
    setTrabajando(true);
    try {
      const nombre = await accion();
      setMensaje(`Listo: ${nombre}`);
      estado.recargar();
    } catch (e) {
      if (e.name !== "AbortError") {
        setError(e);
      }
    }
    setTrabajando(false);
  };

  return <div className="modal-local mi-avance">
    <button className="close" onClick={cerrar} aria-label="Cerrar">&times;</button>
    <h3><FontAwesomeIcon icon={faUserCircle}/> {perfil.nombre}</h3>
    <p className="text-muted mb-2">Número de control: <b>{perfil.numeroControl}</b></p>

    <div className="progress barra-avance">
      <div className="progress-bar bg-success" style={{width: `${resumen.porcentaje}%`}}>{resumen.porcentaje}%</div>
    </div>
    <p className="mt-2">
      Has completado <b>{resumen.leccionesCompletadas}</b> de {resumen.leccionesTotales} lecciones
      ({resumen.pasosCompletados} de {resumen.pasosTotales} pasos).
    </p>

    <h4>Mi archivo de avance</h4>
    <p>
      Tu avance se guarda automáticamente <b>en este dispositivo</b>. Descarga tu archivo de avance para
      <b> entregarlo a tu profesor</b> o para <b>continuar en otro dispositivo</b>.
      El archivo está protegido con tu contraseña: sólo tú y tu profesor pueden abrirlo.
    </p>
    {estado.sinGuardar &&
      <div className="alert alert-warning py-2">
        <FontAwesomeIcon icon={faExclamationCircle}/> Tienes avance que aún no está en tu archivo.
      </div>
    }
    {estado.ultimaExportacion &&
      <p className="text-muted small">Última descarga: {formatoFecha(estado.ultimaExportacion)}</p>
    }
    {!huellaProfesor &&
      <p className="text-muted small">
        Nota: esta aplicación aún no tiene configurada la clave del profesor; por ahora sólo tú podrás abrir el archivo.
      </p>
    }
    <div className="botones-formulario">
      <button className="btn btn-primary" disabled={trabajando} onClick={() => ejecutar(descargarAvance)}>
        <FontAwesomeIcon icon={faDownload}/> Descargar mi archivo de avance
      </button>
      {puedeCompartirArchivos() &&
        <button className="btn btn-outline-primary" disabled={trabajando} onClick={() => ejecutar(compartirAvance)}>
          <FontAwesomeIcon icon={faShareAlt}/> Compartir / enviar
        </button>
      }
    </div>
    <Mensaje tipo="success">{mensaje}</Mensaje>
    <Mensaje error={error}/>

    <details className="mt-3">
      <summary>Ver mi avance por lección</summary>
      {Object.entries(capitulos).map(([capitulo, lecciones]) =>
        <div key={capitulo} className="mt-2">
          <b>{capitulo}</b>
          <ul className="lista-lecciones">
            {lecciones.map(l =>
              <li key={l.slug} className={l.completada ? "completada" : ""}>
                <a href={"#" + l.slug} onClick={cerrar}>{l.titulo}</a>{" "}
                <span className="text-muted">
                  {l.soloLectura ? "(lectura)" : l.completada ? "✔" : `${l.pasosCompletados}/${l.pasosTotales}`}
                </span>
              </li>
            )}
          </ul>
        </div>
      )}
    </details>

    <hr/>
    <div className="enlaces-secundarios">
      <button className="btn btn-outline-secondary btn-sm" onClick={() => {
        cerrar();
        bloquear();
      }}>
        <FontAwesomeIcon icon={faLock}/> Bloquear
      </button>
      <button className="btn btn-outline-danger btn-sm" onClick={() => setConfirmarCambio(true)}>
        <FontAwesomeIcon icon={faUsers}/> Cambiar de alumno
      </button>
      <a className="btn btn-outline-secondary btn-sm" href="#profesor" onClick={cerrar}>
        <FontAwesomeIcon icon={faChalkboardTeacher}/> Panel del profesor
      </a>
    </div>
    {confirmarCambio &&
      <div className="alert alert-danger mt-3">
        <p>
          Se borrará de este dispositivo el avance de <b>{perfil.nombre}</b>.
          {estado.sinGuardar ? " ¡Tienes avance sin descargar! Descarga primero tu archivo." : ""}
        </p>
        <div className="botones-formulario">
          <button className="btn btn-primary btn-sm" disabled={trabajando} onClick={() => ejecutar(descargarAvance)}>
            <FontAwesomeIcon icon={faDownload}/> Descargar mi archivo
          </button>
          <button className="btn btn-danger btn-sm" onClick={() => borrarAlumnoDeEsteDispositivo()}>
            Borrar y cambiar de alumno
          </button>
          <button className="btn btn-link btn-sm" onClick={() => setConfirmarCambio(false)}>Cancelar</button>
        </div>
      </div>
    }
  </div>;
}

export function BotonMiAvance() {
  const {perfil} = useContext(PerfilContext);
  const {sinGuardar} = useEstadoGuardado();
  const primerNombre = (perfil?.nombre || "").split(" ")[0];
  return <Popup
    trigger={
      <button className="btn btn-sm btn-outline-primary boton-mi-avance" title="Mi avance">
        <FontAwesomeIcon icon={faUserCircle}/>{" "}
        <span className="nombre-alumno">{primerNombre}</span>
        {sinGuardar && <span className="badge badge-pill badge-warning ml-1" title="Avance sin descargar">!</span>}
      </button>
    }
    modal
    nested
    className="rlpy"
  >
    {cerrar => <ContenidoMiAvance cerrar={cerrar}/>}
  </Popup>;
}
