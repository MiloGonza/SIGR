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
import dishCurry from "../../assets/dish-curry.jpg";
import storePunto from "../../assets/store-punto.jpg";
import storeBrasa from "../../assets/store-brasa.jpg";
import storeVerde from "../../assets/store-verde.jpg";
import storeDulce from "../../assets/store-dulce.jpg";
import dishBowl from "../../assets/dish-bowl.jpg";
import dishPizza from "../../assets/dish-pizza.jpg";
import dishMousse from "../../assets/dish-mousse.jpg";
import dishLimonada from "../../assets/dish-limonada.jpg";

// Categorías y contenido de demostración para la vista previa del cliente.
// Cuando exista el catálogo real, estos arreglos se reemplazan por la API.
export const CATEGORIES = [
	{ name: "Todos", icon: UtensilsCrossed },
	{ name: "Rápida", icon: Pizza },
	{ name: "Saludable", icon: Salad },
	{ name: "Postres", icon: IceCream },
	{ name: "Bebidas", icon: CupSoda },
	{ name: "Desayunos", icon: Coffee },
];

export const STORES = [
	{
		id: "punto-y-sazon",
		nombre: "Punto y Sazón",
		tipo: "Cocina casera",
		rating: 4.9,
		tiempo: "20-30 min",
		envio: "Envío gratis",
		tags: ["Popular", "Almuerzo", "Saludable"],
		icon: ChefHat,
		gradient: "from-[#7f1d1d] to-[#c2410c]",
		image: storePunto,
	},
	{
		id: "la-brasa",
		nombre: "La Brasa",
		tipo: "Parrilla y hamburguesas",
		rating: 4.7,
		tiempo: "25-35 min",
		envio: "$2.900",
		tags: ["Rápida", "Cena"],
		icon: Flame,
		gradient: "from-[#431407] to-[#ea580c]",
		image: storeBrasa,
	},
	{
		id: "verde-mesa",
		nombre: "Verde Mesa",
		tipo: "Bowls y comida saludable",
		rating: 4.8,
		tiempo: "15-25 min",
		envio: "Envío gratis",
		tags: ["Saludable", "Desayunos"],
		icon: Salad,
		gradient: "from-[#14532d] to-[#65a30d]",
		image: storeVerde,
	},
	{
		id: "dulce-hogar",
		nombre: "Dulce Hogar",
		tipo: "Postres y bebidas",
		rating: 4.9,
		tiempo: "30-40 min",
		envio: "$1.900",
		tags: ["Postres", "Bebidas"],
		icon: IceCream,
		gradient: "from-[#4c1d95] to-[#db2777]",
		image: storeDulce,
	},
];

export const DISHES = [
	{
		id: "pollo-al-curry",
		nombre: "Pollo al curry",
		tienda: "Punto y Sazón",
		precio: "$18.900",
		rating: 4.9,
		etiqueta: "Más pedido",
		categoria: "Rápida",
		icon: ChefHat,
		gradient: "from-[#92400e] to-[#f59e0b]",
		image: dishCurry,
	},
	{
		id: "bowl-mediterraneo",
		nombre: "Bowl mediterráneo",
		tienda: "Verde Mesa",
		precio: "$16.500",
		rating: 4.8,
		etiqueta: "Saludable",
		categoria: "Saludable",
		icon: Salad,
		gradient: "from-[#14532d] to-[#84cc16]",
		image: dishBowl,
	},
	{
		id: "pizza-margarita",
		nombre: "Pizza margarita",
		tienda: "La Brasa",
		precio: "$22.000",
		rating: 4.7,
		etiqueta: "Para compartir",
		categoria: "Rápida",
		icon: Pizza,
		gradient: "from-[#7c2d12] to-[#f97316]",
		image: dishPizza,
	},
	{
		id: "mousse-chocolate",
		nombre: "Mousse de chocolate",
		tienda: "Dulce Hogar",
		precio: "$9.500",
		rating: 4.9,
		etiqueta: "Postre",
		categoria: "Postres",
		icon: IceCream,
		gradient: "from-[#4c1d95] to-[#db2777]",
		image: dishMousse,
	},
	{
		id: "limonada-casa",
		nombre: "Limonada de la casa",
		tienda: "Punto y Sazón",
		precio: "$6.500",
		rating: 4.6,
		etiqueta: "Refrescante",
		categoria: "Bebidas",
		icon: CupSoda,
		gradient: "from-[#365314] to-[#a3e635]",
		image: dishLimonada,
	},
];
