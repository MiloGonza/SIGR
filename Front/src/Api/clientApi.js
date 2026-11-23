import api from "./LoginRegisterApi";

// El backend pagina las tiendas con DRF; las demás listas llegan como arreglo.
const asList = (data) => (Array.isArray(data) ? data : (data?.results ?? []));

/* ------------------------------------------------------------------ */
/* Catálogo público                                                    */
/* ------------------------------------------------------------------ */

export const getCategories = () =>
	api.get("/restaurants/categories/").then((response) => response.data);

export const getRestaurants = (params = {}) =>
	api
		.get("/restaurants/", { params })
		.then((response) => asList(response.data));

export const getDishes = (params = {}) =>
	api
		.get("/restaurants/dishes/", { params })
		.then((response) => asList(response.data));

export const getRestaurantMenu = (id) =>
	api.get(`/restaurants/${id}/menu/`).then((response) => response.data);

/* ------------------------------------------------------------------ */
/* Carrito                                                             */
/* ------------------------------------------------------------------ */

export const getCart = () =>
	api.get("/orders/cart/").then((response) => response.data);

export const clearCart = () =>
	api.delete("/orders/cart/").then((response) => response.data);

export const addCartItem = (dish, cantidad = 1, notas = "") =>
	api
		.post("/orders/cart/items/", { dish, cantidad, notas })
		.then((response) => response.data);

export const updateCartItem = (id, cantidad) =>
	api
		.patch(`/orders/cart/items/${id}/`, { cantidad })
		.then((response) => response.data);

export const removeCartItem = (id) =>
	api
		.delete(`/orders/cart/items/${id}/`)
		.then((response) => response.data);

/* ------------------------------------------------------------------ */
/* Pedidos                                                             */
/* ------------------------------------------------------------------ */

export const getOrders = (params = {}) =>
	api.get("/orders/", { params }).then((response) => asList(response.data));

export const getDashboardStats = (dias = 30) =>
	api
		.get("/orders/stats/", { params: { dias } })
		.then((response) => response.data);

export const getStaffOrders = (params = {}) =>
	api
		.get("/orders/staff/", { params })
		.then((response) => asList(response.data));

export const updateOrderStatus = (id, estado) =>
	api
		.patch(`/orders/${id}/status/`, { estado })
		.then((response) => response.data);

export const getOrder = (id) =>
	api.get(`/orders/${id}/`).then((response) => response.data);

export const checkout = (payload) =>
	api.post("/orders/", payload).then((response) => response.data);

/* ------------------------------------------------------------------ */
/* Recetas del restaurante (administrador)                             */
/* ------------------------------------------------------------------ */

export const getRecipes = () =>
	api.get("/restaurants/recipes/").then((response) => asList(response.data));

// Si el payload incluye un archivo se envía como multipart; si no, como JSON.
const recipeConfig = (data) =>
	typeof FormData !== "undefined" && data instanceof FormData
		? { headers: { "Content-Type": "multipart/form-data" } }
		: undefined;

export const createRecipe = (data) =>
	api
		.post("/restaurants/recipes/", data, recipeConfig(data))
		.then((response) => response.data);

export const updateRecipe = (id, data) =>
	api
		.patch(`/restaurants/recipes/${id}/`, data, recipeConfig(data))
		.then((response) => response.data);

export const deleteRecipe = (id) =>
	api.delete(`/restaurants/recipes/${id}/`).then((response) => response.data);

/* ------------------------------------------------------------------ */
/* Disponibilidad del personal (administrador y mesero)                */
/* ------------------------------------------------------------------ */

export const getStaffAvailability = () =>
	api
		.get("/restaurants/availability/")
		.then((response) => asList(response.data));

export const updateStaffAvailability = (id, data) =>
	api
		.patch(`/restaurants/availability/${id}/`, data)
		.then((response) => response.data);

export const getStaffNotifications = () =>
	api
		.get("/restaurants/notifications/")
		.then((response) => asList(response.data));

/* ------------------------------------------------------------------ */
/* Equipo del restaurante                                              */
/* ------------------------------------------------------------------ */

export const getEmployees = () =>
	api.get("/users/employees/").then((response) => asList(response.data));

export const createEmployee = (data) =>
	api.post("/users/employees/", data).then((response) => response.data);

export const updateEmployee = (id, data) =>
	api
		.patch(`/users/employees/${id}/`, data)
		.then((response) => response.data);

export const deleteEmployee = (id) =>
	api.delete(`/users/employees/${id}/`).then((response) => response.data);

/* ------------------------------------------------------------------ */
/* Turnos del equipo                                                   */
/* ------------------------------------------------------------------ */

export const getShifts = (params = {}) =>
	api.get("/shifts/", { params }).then((response) => asList(response.data));

export const createShift = (data) =>
	api.post("/shifts/", data).then((response) => response.data);

export const updateShift = (id, data) =>
	api.patch(`/shifts/${id}/`, data).then((response) => response.data);

export const deleteShift = (id) =>
	api.delete(`/shifts/${id}/`).then((response) => response.data);

/* ------------------------------------------------------------------ */
/* Direcciones                                                         */
/* ------------------------------------------------------------------ */

export const getAddresses = () =>
	api.get("/users/addresses/").then((response) => asList(response.data));

export const createAddress = (data) =>
	api.post("/users/addresses/", data).then((response) => response.data);

export const updateAddress = (id, data) =>
	api
		.patch(`/users/addresses/${id}/`, data)
		.then((response) => response.data);

export const deleteAddress = (id) =>
	api.delete(`/users/addresses/${id}/`).then((response) => response.data);

/* ------------------------------------------------------------------ */
/* Métodos de pago                                                     */
/* ------------------------------------------------------------------ */

export const getPaymentMethods = () =>
	api
		.get("/users/payment-methods/")
		.then((response) => asList(response.data));

export const createPaymentMethod = (data) =>
	api
		.post("/users/payment-methods/", data)
		.then((response) => response.data);

export const updatePaymentMethod = (id, data) =>
	api
		.patch(`/users/payment-methods/${id}/`, data)
		.then((response) => response.data);

export const deletePaymentMethod = (id) =>
	api
		.delete(`/users/payment-methods/${id}/`)
		.then((response) => response.data);

export { getApiErrorMessage } from "./LoginRegisterApi";
