// Dashboard de la plataforma de datos de Percy (Observable Framework, sitio estático)
export default {
  title: "Percy · Plataforma de datos",
  root: "src",
  pages: [{name: "Misión", path: "/"}],
  // Los cargadores de datos .py corren con el entorno Python de data/ (uv)
  interpreters: {".py": ["uv", "run", "--project", "../data", "--quiet", "python"]},
  theme: ["air", "near-midnight"],
  sidebar: false,
  footer: "Datos: NASA/JPL-Caltech · Pipeline: dlt → DuckDB → dbt → Dagster",
};
