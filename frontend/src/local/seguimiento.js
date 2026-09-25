/*
Registra en este dispositivo cuándo avanza el alumno en cada lección,
para que el profesor pueda ver fechas de actividad y de lecciones completadas.
*/

import _ from "lodash";
import {almacen, actualizarEstado, bloqueoGuardado, cargarActividad} from "./perfil";

function indicesDePasos(book) {
  const {pages, pageSlugsList, user} = book;
  if (!user.uid || pageSlugsList.length <= 1) {
    return null;  // todavía cargando
  }
  const indices = {};
  pageSlugsList.forEach(slug => {
    const pasos = pages[slug].steps;
    indices[slug] = {
      indice: Math.max(0, _.findIndex(pasos, {name: user.pagesProgress[slug]?.step_name})),
      ultimo: pasos.length - 1,
    };
  });
  return indices;
}

export function iniciarSeguimiento(store) {
  let anteriores = null;
  let cola = Promise.resolve();

  store.subscribe(() => {
    const book = store.getState().book;
    if (anteriores && book.user.pagesProgress === anteriores.pagesProgress) {
      return;
    }
    const actuales = indicesDePasos(book);
    if (!actuales) {
      return;
    }
    const previos = anteriores?.indices;
    anteriores = {indices: actuales, pagesProgress: book.user.pagesProgress};
    if (!previos) {
      return;  // primera carga: sólo se toma como referencia
    }

    const avances = Object.keys(actuales).filter(
      slug => previos[slug] && actuales[slug].indice > previos[slug].indice
    );
    if (!avances.length || bloqueoGuardado.activo) {
      return;
    }

    const ahora = new Date().toISOString();
    cola = cola.then(async () => {
      const actividad = await cargarActividad();
      for (const slug of avances) {
        const registro = {...(actividad[slug] || {})};
        registro.inicio = registro.inicio || ahora;
        registro.ultima = ahora;
        if (actuales[slug].indice >= actuales[slug].ultimo && !registro.completada) {
          registro.completada = ahora;
        }
        actividad[slug] = registro;
      }
      if (!bloqueoGuardado.activo) {
        await almacen.setItem("actividad", actividad);
        await actualizarEstado({ultimoCambio: ahora});
      }
    }).catch(e => console.error(e));
  });
}
