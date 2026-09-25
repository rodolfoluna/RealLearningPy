import React from "react";

export function Mensaje({error, children, tipo = "danger"}) {
  const texto = error ? (error.message || String(error)) : children;
  if (!texto) {
    return null;
  }
  return <div className={`alert alert-${tipo}`} role="alert">{texto}</div>;
}

export function Campo({etiqueta, ayuda, ...props}) {
  const id = props.id || props.name;
  return <div className="form-group">
    <label htmlFor={id}>{etiqueta}</label>
    <input className="form-control" id={id} {...props}/>
    {ayuda && <small className="form-text text-muted">{ayuda}</small>}
  </div>;
}

export function BotonTrabajando({trabajando, children, textoTrabajando = "Procesando...", ...props}) {
  return <button disabled={trabajando || props.disabled} {...props}>
    {trabajando ? textoTrabajando : children}
  </button>;
}
