import {applyMiddleware, combineReducers, compose, createStore} from "redux";
import thunk from "redux-thunk";
import logger from "redux-logger";
import {connect} from "react-redux";
import {dispatcher, redact, TextContainer} from "./frontendlib";
import {bookReducer, currentStep, localStore, navigate} from "./book/store";
import * as Sentry from "@sentry/react";
import _ from "lodash";
import {bloqueoGuardado} from "./local/perfil";
import {iniciarSeguimiento} from "./local/seguimiento";

const sentryReduxEnhancer = Sentry.createReduxEnhancer({
  actionTransformer: action => {
    if (action.type === "LOAD_PAGES") {
      return null;
    }
    if (action.type === "RAN_CODE") {
      try {
        action = {
          ...action,
          messages: action.messages?.map(m => _.truncate(m, {length: 100})),
          output: _.truncate(action.output, {length: 100}),
        }
      } catch {
      }
    }
    return action;
  },
  stateTransformer: state => {
    state = state.book;
    try {
      state = {...state, currentStep: currentStep(state)};
    } catch {
    }
    return _.omit(state, "pages", "pageSlugsList");
  },
});

const sentryDsn = process.env.REACT_APP_SENTRY_DSN;
if (sentryDsn) {
  console.log('Configuring sentry');
  Sentry.init({
    dsn: sentryDsn,
    normalizeDepth: 5,
    beforeBreadcrumb(breadcrumb, hint) {
      const {message} = breadcrumb;
      // Exclude console logging of redux actions
      if (message.includes("prev state") || message.includes("next state") || message.includes("%c action  ")) {
        return null;
      }
      return breadcrumb;
    },
  });
}

const {delegateReducer} = redact("root");

TextContainer.connect = connect;

const saveToLocalStoreMiddleware = store => next => async (action) => {
  // first call the next middleware function in the chain; we want the state to be updated so that, when we should
  // update the storage, we have the values that we need.
  next(action);
  const {user, editorContent} = store.getState().book;
  if (!user.uid || bloqueoGuardado.activo) {  // still in initial loading stage, or replacing local data
    return;
  }
  // Save the data in the same shape as in firebase
  await localStore.setItem('user', {editorContent, ...user});
};

const reducer = delegateReducer(
  combineReducers({
    book: bookReducer,
  })
);

// noinspection JSUnresolvedVariable
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

export const store = createStore(
  reducer,
  composeEnhancers(
    applyMiddleware(
      thunk,
      // Registrar cada acción en la consola sólo durante el desarrollo (es lento en celulares)
      ...(process.env.NODE_ENV === "development" ? [logger] : []),
      saveToLocalStoreMiddleware,
    ),
    sentryReduxEnhancer,
  )
);

dispatcher.store = store;
iniciarSeguimiento(store);
redact.store = store;
window.reduxStore = store;

navigate();
