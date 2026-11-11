import axios from "axios";

// URL base del backend Django. Se puede sobreescribir con VITE_API_URL.
const BASE_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// TokenAuthentication de DRF usa el esquema "Token <key>".
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Token ${token}`;
  return config;
});

// Devuelve el primer mensaje de error que envíe DRF (detail o errores por campo).
export function getApiErrorMessage(error, fallback = "Ocurrió un error inesperado") {
  if (error?.response) {
    const { data, status } = error.response;
    if (typeof data === "string" && data.trim()) return data;
    if (data?.detail) return data.detail;
    if (data && typeof data === "object") {
      const firstMessage = Object.values(data)
        .flat(Infinity)
        .find((value) => typeof value === "string" && value.trim());
      if (firstMessage) return firstMessage;
    }
    if (status === 401) return "Credenciales inválidas";
    if (status === 404) return "Recurso no encontrado";
    return `Error ${status}`;
  }
  if (error?.code === "ECONNABORTED") return "La petición tardó demasiado";
  return fallback;
}

const unwrap = (request) => request.then((response) => response.data);

/* ------------------------------------------------------------------ */
/* Usuarios                                                            */
/* ------------------------------------------------------------------ */

// GET /users/  → { next, previous, results: [...] }
export const getUsers = (params = {}) => unwrap(api.get("/users/", { params }));

// POST /users/create/
// Payload: { username, email, password, rol?, "Nombre del local"? }
// El nombre del local solo es obligatorio cuando rol === "administrador".
export const createUser = (data) => unwrap(api.post("/users/create/", data));

// PUT /users/update/<id>/ (completo) o PATCH (parcial)
export const updateUser = (id, data, { partial = false } = {}) =>
  unwrap(partial ? api.patch(`/users/update/${id}/`, data) : api.put(`/users/update/${id}/`, data));

// DELETE /users/delete/<id>/
export const deleteUser = (id) => unwrap(api.delete(`/users/delete/${id}/`));

// POST /users/login/
// Acepta { usuario | correo | username | email, contrasena | password }.
// Devuelve { token }.
export const loginUser = (credentials) => unwrap(api.post("/users/login/", credentials));

/* ------------------------------------------------------------------ */
/* Restaurantes                                                        */
/* ------------------------------------------------------------------ */

// GET /restaurants/  → { next, previous, results: [...] }
export const getRestaurants = (params = {}) =>
  unwrap(api.get("/restaurants/", { params }));

// POST /restaurants/create/  → { id, nombre }
export const createRestaurant = (data) =>
  unwrap(api.post("/restaurants/create/", data));

// PUT /restaurants/update/<id>/ (completo) o PATCH (parcial)
export const updateRestaurant = (id, data, { partial = false } = {}) =>
  unwrap(
    partial
      ? api.patch(`/restaurants/update/${id}/`, data)
      : api.put(`/restaurants/update/${id}/`, data),
  );

// DELETE /restaurants/delete/<id>/
export const deleteRestaurant = (id) =>
  unwrap(api.delete(`/restaurants/delete/${id}/`));

export default api;
