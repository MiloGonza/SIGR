import {
	CalendarClock,
	ChefHat,
	ClipboardList,
	History,
	LayoutDashboard,
	PackageSearch,
	ShoppingCart,
	Store,
	Users,
} from "lucide-react";

// Ancho de la barra lateral en píxeles: encogida y desplegada.
export const SIDEBAR_WIDTH = { collapsed: 76, expanded: 264 };

// Elementos de navegación por rol. El orden es el que se muestra en la barra.
export const SIDEBAR_ITEMS = {
	cliente: [
		{
			to: "/home/tiendas",
			label: "Tiendas",
			icon: Store,
			description: "Descubre los restaurantes disponibles y explora sus menús.",
		},
		{
			to: "/home/carrito",
			label: "Carrito",
			icon: ShoppingCart,
			description: "Revisa los productos que agregaste antes de confirmar tu pedido.",
		},
		{
			to: "/home/pedidos",
			label: "Pedidos en curso",
			icon: ClipboardList,
			description: "Sigue el estado de tus pedidos en tiempo real.",
		},
		{
			to: "/home/historial",
			label: "Historial",
			icon: History,
			description: "Consulta los pedidos que has realizado anteriormente.",
		},
	],
	administrador: [
		{
			to: "/dashboard/resumen",
			label: "Resumen",
			icon: LayoutDashboard,
			description: "Consulta el estado general de tu restaurante de un vistazo.",
		},
		{
			to: "/dashboard/empleados",
			label: "Empleados",
			icon: Users,
			description: "Administra el equipo de tu restaurante y sus roles.",
		},
		{
			to: "/dashboard/recetas",
			label: "Recetas",
			icon: ChefHat,
			description: "Organiza las recetas y preparaciones de tu menú.",
		},
	],
	mesero: [
		{
			to: "/dashboard/pedidos",
			label: "Pedidos",
			icon: ClipboardList,
			description: "Gestiona los pedidos de las mesas y su estado.",
		},
		{
			to: "/dashboard/turnos",
			label: "Turnos",
			icon: CalendarClock,
			description: "Consulta y organiza tus turnos de trabajo.",
		},
		{
			to: "/dashboard/disponibilidad",
			label: "Disponibilidad",
			icon: PackageSearch,
			description: "Revisa el stock y la disponibilidad de los productos.",
		},
	],
};

// El backend ya devuelve roles canónicos, pero aceptamos los alias por si
// llegan desde una sesión antigua guardada en localStorage.
const ROLE_ALIASES = { empleado: "mesero", admin: "administrador" };

export const normalizeRole = (rol) => ROLE_ALIASES[rol] ?? rol;

export const getSidebarItems = (rol) => SIDEBAR_ITEMS[normalizeRole(rol)] ?? [];

// Rutas que pertenecen al área privada y muestran la barra lateral.
export const isWorkspacePath = (pathname = "") =>
	pathname === "/home" ||
	pathname.startsWith("/home/") ||
	pathname === "/dashboard" ||
	pathname.startsWith("/dashboard/");

// Primera pestaña del rol, usada al iniciar sesión y al entrar a /home o /dashboard.
export const getDefaultWorkspacePath = (rol) => {
	const role = normalizeRole(rol);
	if (role === "cliente") return "/home";
	if (role === "administrador") return "/dashboard/resumen";
	if (role === "mesero") return "/dashboard/pedidos";
	return "/";
};
