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

export const getOrder = (id) =>
	api.get(`/orders/${id}/`).then((response) => response.data);

export const checkout = (payload) =>
	api.post("/orders/", payload).then((response) => response.data);

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
