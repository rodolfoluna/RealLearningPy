import React, {useCallback, useEffect, useState} from "react";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {
  faChalkboardTeacher,
  faFileUpload,
  faLock,
  faUserPlus,
} from "@fortawesome/free-solid-svg-icons";
import {
  borrarAlumnoDeEsteDispositivo,
  cargarArchivoDelAlumno,
  cargarPerfil,
  cerrarSesion,
  crearPerfil,
  desbloquear,
  leerArchivoJson,
  NOMBRE_APP,
  recuperarSesionTemporal,
} from "./perfil";
import {PanelProfesor} from "./PanelProfesor";
import {BotonTrabajando, Campo, Mensaje} from "./componentes";
import "./local.scss";

export const PerfilContext = React.createContext({perfil: null, bloquear: () => {}});

const MIN_CONTRASENA = 4;

function useHash() {
  const [hash, setHash] = useState(window.location.hash.substring(1));
  useEffect(() => {
    const alCambiar = () => setHash(window.location.hash.substring(1));
    window.addEventListener("hashchange", alCambiar);
    return () => window.removeEventListener("hashchange", alCambiar);
  }, []);
  return hash;
}

function FormularioNuevo({alCancelar}) {
  const [datos, setDatos] = useState({numeroControl: "", nombre: "", contrasena: "", confirmacion: ""});
  const [error, setError] = useState(null);
  const [trabajando, setTrabajando] = useState(false);
  const cambiar = (e) => setDatos({...datos, [e.target.name]: e.target.value});

  const enviar = async (e) => {
    e.preventDefault();
    setError(null);
    if (!datos.numeroControl.trim() || !datos.nombre.trim()) {
      setError("Escribe tu número de control y tu nombre.");
      return;
    }
    if (datos.contrasena.length < MIN_CONTRASENA) {
      setError(`La contraseña debe tener al menos ${MIN_CONTRASENA} caracteres.`);
      return;
    }
    if (datos.contrasena !== datos.confirmacion) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setTrabajando(true);
    try {
      await crearPerfil(datos);
    } catch (e) {
      setError(e);
      setTrabajando(false);
    }
  };

  return <form onSubmit={enviar} autoComplete="off">
    <h2>Soy alumno nuevo</h2>
    <Campo etiqueta="Número de control" name="numeroControl" value={datos.numeroControl} onChange={cambiar}
           autoFocus required maxLength={30}/>
    <Campo etiqueta="Nombre completo" name="nombre" value={datos.nombre} onChange={cambiar}
           required maxLength={80}/>
    <Campo etiqueta="Crea una contraseña" name="contrasena" type="password" value={datos.contrasena}
           onChange={cambiar} required autoComplete="new-password"
           ayuda="Protege tu archivo de avance: nadie más que tú (y tu profesor) podrá abrirlo."/>
    <Campo etiqueta="Repite la contraseña" name="confirmacion" type="password" value={datos.confirmacion}
           onChange={cambiar} required autoComplete="new-password"/>
    <div className="alert alert-warning">
      <b>¡No olvides tu contraseña!</b> La necesitarás para abrir tu avance en otro dispositivo.
      Si la olvidas, tu profesor puede restablecerla a partir de tu último archivo de avance.
    </div>
    <Mensaje error={error}/>
    <div className="botones-formulario">
      <BotonTrabajando type="submit" className="btn btn-primary" trabajando={trabajando}>
        Comenzar el curso
      </BotonTrabajando>
      <button type="button" className="btn btn-link" onClick={alCancelar} disabled={trabajando}>Volver</button>
    </div>
  </form>;
}

function FormularioCargar({alCancelar}) {
  const [archivo, setArchivo] = useState(null);
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState(null);
  const [trabajando, setTrabajando] = useState(false);

  const enviar = async (e) => {
    e.preventDefault();
    setError(null);
    if (!archivo) {
      setError("Elige tu archivo de avance.");
      return;
    }
    setTrabajando(true);
    try {
      const contenido = await leerArchivoJson(archivo);
      await cargarArchivoDelAlumno(contenido, contrasena);
    } catch (e) {
      setError(e);
      setTrabajando(false);
    }
  };

  return <form onSubmit={enviar}>
    <h2>Continuar con mi archivo de avance</h2>
    <p>
      Elige el archivo de avance que descargaste antes (termina en <code>.rlpy</code>),
      por ejemplo desde tu carpeta de <em>Descargas</em>.
    </p>
    <div className="form-group">
      <label htmlFor="archivo-avance">Archivo de avance</label>
      <input type="file" className="form-control-file" id="archivo-avance"
             onChange={e => setArchivo(e.target.files[0] || null)}/>
    </div>
    <Campo etiqueta="Contraseña" name="contrasena-archivo" type="password" value={contrasena}
           onChange={e => setContrasena(e.target.value)} required autoComplete="current-password"/>
    <Mensaje error={error}/>
    <div className="botones-formulario">
      <BotonTrabajando type="submit" className="btn btn-primary" trabajando={trabajando} textoTrabajando="Abriendo...">
        Abrir mi avance
      </BotonTrabajando>
      <button type="button" className="btn btn-link" onClick={alCancelar} disabled={trabajando}>Volver</button>
    </div>
  </form>;
}

function Bienvenida() {
  const [vista, setVista] = useState(null);
  if (vista === "nuevo") {
    return <FormularioNuevo alCancelar={() => setVista(null)}/>;
  }
  if (vista === "cargar") {
    return <FormularioCargar alCancelar={() => setVista(null)}/>;
  }
  return <>
    <p className="lead">
      Curso interactivo de Python para principiantes.
      Funciona en computadoras, tabletas y celulares, <b>sin necesidad de internet</b>.
    </p>
    <div className="opciones-acceso">
      <button className="btn btn-primary btn-lg" onClick={() => setVista("nuevo")}>
        <FontAwesomeIcon icon={faUserPlus}/> Soy alumno nuevo
      </button>
      <button className="btn btn-outline-primary btn-lg" onClick={() => setVista("cargar")}>
        <FontAwesomeIcon icon={faFileUpload}/> Ya tengo mi archivo de avance
      </button>
    </div>
  </>;
}

function Desbloqueo({perfil, alDesbloquear}) {
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState(null);
  const [trabajando, setTrabajando] = useState(false);
  const [vista, setVista] = useState(null);

  const enviar = async (e) => {
    e.preventDefault();
    setError(null);
    setTrabajando(true);
    try {
      alDesbloquear(await desbloquear(contrasena));
    } catch (e) {
      setError(e);
      setTrabajando(false);
    }
  };

  if (vista === "cambiar") {
    return <>
      <h2>Cambiar de alumno</h2>
      <p>
        Este dispositivo tiene guardado el avance de <b>{perfil.nombre}</b> ({perfil.numeroControl}).
        Si continúas, ese avance <b>se borrará de este dispositivo</b>. Lo que ya esté guardado en
        su archivo de avance no se pierde.
      </p>
      <p>
        Si eres {perfil.nombre}, vuelve atrás, entra con tu contraseña y descarga primero tu archivo
        desde el botón <em>Mi avance</em>.
      </p>
      <div className="botones-formulario">
        <button className="btn btn-danger" onClick={() => borrarAlumnoDeEsteDispositivo()}>
          Borrar y cambiar de alumno
        </button>
        <button className="btn btn-link" onClick={() => setVista(null)}>Volver</button>
      </div>
    </>;
  }

  if (vista === "olvide") {
    return <>
      <h2>¿Olvidaste tu contraseña?</h2>
      <ol>
        <li>Entrega a tu profesor tu archivo de avance más reciente (el que termina en <code>.rlpy</code>).</li>
        <li>Tu profesor puede crear una copia del archivo con una contraseña nueva.</li>
        <li>Aquí elige <em>No soy {perfil.nombre}</em> → <em>Ya tengo mi archivo de avance</em> y
          abre el archivo nuevo con la contraseña nueva.</li>
      </ol>
      <p className="text-muted">
        El avance que hayas hecho en este dispositivo después de descargar ese archivo no se puede recuperar
        sin la contraseña.
      </p>
      <button className="btn btn-link" onClick={() => setVista(null)}>Volver</button>
    </>;
  }

  return <form onSubmit={enviar}>
    <h2><FontAwesomeIcon icon={faLock}/> Hola, {perfil.nombre}</h2>
    <p className="text-muted">Número de control: <b>{perfil.numeroControl}</b></p>
    <Campo etiqueta="Contraseña" name="contrasena-desbloqueo" type="password" value={contrasena}
           onChange={e => setContrasena(e.target.value)} autoFocus required autoComplete="current-password"/>
    <Mensaje error={error}/>
    <div className="botones-formulario">
      <BotonTrabajando type="submit" className="btn btn-primary btn-lg" trabajando={trabajando}
                       textoTrabajando="Comprobando...">
        Continuar
      </BotonTrabajando>
    </div>
    <hr/>
    <div className="enlaces-secundarios">
      <button type="button" className="btn btn-link" onClick={() => setVista("olvide")}>
        Olvidé mi contraseña
      </button>
      <button type="button" className="btn btn-link" onClick={() => setVista("cambiar")}>
        No soy {perfil.nombre}
      </button>
    </div>
  </form>;
}

function PantallaAcceso({children}) {
  return <div className="pantalla-acceso">
    <div className="tarjeta-acceso card">
      <div className="card-body">
        <h1 className="titulo-app">{NOMBRE_APP}</h1>
        {children}
        <hr/>
        <a href="#profesor" className="btn btn-sm btn-outline-secondary">
          <FontAwesomeIcon icon={faChalkboardTeacher}/> Soy profesor
        </a>
      </div>
    </div>
  </div>;
}

/**
 * Muestra la pantalla de bienvenida o de contraseña antes de dejar usar el curso.
 * Con #profesor en la URL muestra el panel del profesor.
 */
export function Acceso({children}) {
  const [fase, setFase] = useState("cargando");
  const [perfil, setPerfil] = useState(null);
  const hash = useHash();

  useEffect(() => {
    (async () => {
      const recuperado = await recuperarSesionTemporal();
      if (recuperado) {
        setPerfil(recuperado);
        setFase("listo");
        return;
      }
      const guardado = await cargarPerfil();
      setPerfil(guardado);
      setFase(guardado ? "bloqueado" : "bienvenida");
    })().catch(e => {
      console.error(e);
      setFase("bienvenida");
    });
  }, []);

  const bloquear = useCallback(() => {
    cerrarSesion();
    setFase("bloqueado");
  }, []);

  if (hash === "profesor") {
    return <PanelProfesor/>;
  }

  if (fase === "cargando") {
    return <PantallaAcceso><p>Cargando...</p></PantallaAcceso>;
  }

  if (fase === "bienvenida") {
    return <PantallaAcceso><Bienvenida/></PantallaAcceso>;
  }

  if (fase === "bloqueado") {
    return <PantallaAcceso>
      <Desbloqueo perfil={perfil} alDesbloquear={(p) => {
        setPerfil(p);
        setFase("listo");
      }}/>
    </PantallaAcceso>;
  }

  return <PerfilContext.Provider value={{perfil, bloquear}}>
    {children}
  </PerfilContext.Provider>;
}
