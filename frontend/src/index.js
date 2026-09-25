// La misma base de código genera dos aplicaciones independientes:
// - la del alumno (el curso), publicada en la raíz;
// - la del profesor (revisar archivos de avance), publicada en la carpeta profesor/.
// REACT_APP_MODO se fija al compilar, así que cada app sólo incluye su propio código.
if (process.env.REACT_APP_MODO === "profesor") {
  require("./indexProfesor");
} else {
  require("./indexAlumno");
}
