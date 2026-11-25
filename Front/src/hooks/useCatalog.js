import { useEffect, useState } from "react";
import {
	ChefHat,
	Coffee,
	CupSoda,
	Flame,
	IceCream,
	Pizza,
	Salad,
	UtensilsCrossed,
} from "lucide-react";
import { getCategories, getDishes, getRestaurants } from "../Api/clientApi";
import { formatCOP } from "../utils/format";

const ICON_MAP = {
	ChefHat,
	Coffee,
	CupSoda,
	Flame,
	IceCream,
	Pizza,
	Salad,
	UtensilsCrossed,
};

const iconByName = (name, fallback = ChefHat) => ICON_MAP[name] ?? fallback;

const mapCategory = (category) => ({
	name: category.nombre,
	slug: category.slug,
	icon: iconByName(category.icon, UtensilsCrossed),
});

const mapStore = (store) => {
	const tags = Array.isArray(store.tags) ? store.tags : [];
	return {
		id: store.id,
		nombre: store.nombre,
		tipo: store.tipo,
		rating: Number(store.rating) || 0,
		rating_count: store.rating_count ?? 0,
		tiempo:
			store.tiempo ?? `${store.delivery_min}-${store.delivery_max} min`,
		envio:
			store.envio ??
			(store.free_shipping
				? "Envío gratis"
				: formatCOP(store.shipping_cost)),
		tags: tags.length ? tags : ["Nuevo"],
		icon: iconByName(store.icon),
		gradient: store.gradient,
		image: store.image,
	};
};

const mapDish = (dish) => ({
	id: dish.id,
	nombre: dish.nombre,
	restauranteId: dish.restaurante ?? null,
	tienda: dish.restaurante_nombre ?? "",
	precio: formatCOP(dish.precio),
	precioNumerico: Number(dish.precio) || 0,
	rating: Number(dish.rating) || 0,
	etiqueta: dish.etiqueta || dish.categoria_nombre || "Nuevo",
	categoria: dish.categoria_nombre ?? "",
	icon: iconByName(dish.icon),
	gradient: dish.gradient,
	image: dish.image,
	descripcion: dish.descripcion ?? "",
	prep_minutes: dish.prep_minutes ?? 0,
	stock: Number(dish.stock ?? 0),
});

const initialCatalog = {
	stores: [],
	dishes: [],
	categories: [],
};

/**
 * Carga el catálogo real desde la API. No hay datos de ejemplo: si el backend
 * falla, las listas quedan vacías y `offline` queda en true.
 */
export default function useCatalog() {
	const [catalog, setCatalog] = useState(initialCatalog);
	const [loading, setLoading] = useState(true);
	const [offline, setOffline] = useState(false);

	useEffect(() => {
		let active = true;

		Promise.all([getCategories(), getRestaurants(), getDishes()])
			.then(([categories, stores, dishes]) => {
				if (!active) return;
				const apiCategories = categories.map(mapCategory);
				setCatalog({
					categories: [
						{
							name: "Todos",
							slug: "todos",
							icon: UtensilsCrossed,
						},
						...apiCategories,
					],
					stores: stores.map(mapStore),
					dishes: dishes.map(mapDish),
				});
				setOffline(false);
			})
			.catch(() => {
				if (!active) return;
				setCatalog(initialCatalog);
				setOffline(true);
			})
			.finally(() => {
				if (active) setLoading(false);
			});

		return () => {
			active = false;
		};
	}, []);

	return { ...catalog, loading, offline };
}
