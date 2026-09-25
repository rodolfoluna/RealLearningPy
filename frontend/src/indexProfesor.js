import React from "react";
import "./css/bootstrap-4.4.1.min.css";
import ReactDOM from "react-dom";
import {PanelProfesor} from "./local/PanelProfesor";
import "./local/local.scss";
import * as serviceWorkerRegistration from "./serviceWorkerRegistration";

ReactDOM.render(<PanelProfesor/>, document.getElementById("root"));

// También funciona sin conexión después de abrirla una vez
serviceWorkerRegistration.register();
