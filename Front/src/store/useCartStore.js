import { create } from "zustand";
import {
	addCartItem,
	clearCart,
	getCart,
	removeCartItem,
	updateCartItem,
} from "../Api/clientApi";

// El backend devuelve items_count como la suma de las cantidades, así que el
// contador global del carrito se mantiene sincronizado con cada respuesta.
const countOf = (cart) => cart?.items_count ?? 0;

const useCartStore = create((set) => ({
	cart: null,
	count: 0,
	loading: false,

	setCart: (cart) => set({ cart, count: countOf(cart) }),

	fetchCart: async () => {
		set({ loading: true });
		try {
			const cart = await getCart();
			set({ cart, count: countOf(cart) });
			return cart;
		} finally {
			set({ loading: false });
		}
	},

	addItem: async (dishId, cantidad = 1, notas = "") => {
		const cart = await addCartItem(dishId, cantidad, notas);
		set({ cart, count: countOf(cart) });
		return cart;
	},

	updateItem: async (itemId, cantidad) => {
		const cart = await updateCartItem(itemId, cantidad);
		set({ cart, count: countOf(cart) });
		return cart;
	},

	removeItem: async (itemId) => {
		const cart = await removeCartItem(itemId);
		set({ cart, count: countOf(cart) });
		return cart;
	},

	clear: async () => {
		const cart = await clearCart();
		set({ cart, count: countOf(cart) });
		return cart;
	},

	reset: () => set({ cart: null, count: 0 }),
}));

// Cantidad de un platillo específico dentro del carrito. Los ids de la API son
// números y los de respaldo son slugs, por eso comparamos como texto.
export const quantityInCart = (cart, dishId) =>
	cart?.items?.find((item) => String(item.dish?.id) === String(dishId))
		?.cantidad ?? 0;

export default useCartStore;
