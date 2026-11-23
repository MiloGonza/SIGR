import { Moon, Sun, Sunrise } from "lucide-react";

export const SHIFT_TYPE_META = {
	manana: {
		id: "manana",
		label: "Mañana",
		icon: Sunrise,
		dot: "bg-warning",
		chip: "border-warning/30 bg-warning/10 text-warning",
		ring: "ring-warning/40",
	},
	tarde: {
		id: "tarde",
		label: "Tarde",
		icon: Sun,
		dot: "bg-accent",
		chip: "border-accent/30 bg-accent/10 text-accent",
		ring: "ring-accent/40",
	},
	noche: {
		id: "noche",
		label: "Noche",
		icon: Moon,
		dot: "bg-sky-500",
		chip: "border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-300",
		ring: "ring-sky-500/40",
	},
};

export const SHIFT_STATE_META = {
	programado: {
		label: "Programado",
		chip: "border-border bg-surface-secondary text-muted",
	},
	confirmado: {
		label: "Confirmado",
		chip: "border-success/30 bg-success/10 text-success",
	},
	completado: {
		label: "Completado",
		chip: "border-accent/30 bg-accent/10 text-accent",
	},
	cancelado: {
		label: "Cancelado",
		chip: "border-danger/30 bg-danger/10 text-danger",
	},
};

export const getTypeMeta = (tipo) =>
	SHIFT_TYPE_META[tipo] ?? SHIFT_TYPE_META.manana;

export const getStateMeta = (estado) =>
	SHIFT_STATE_META[estado] ?? SHIFT_STATE_META.programado;

export const firstName = (value = "") =>
	String(value).trim().split(/\s+/)[0] || "Empleado";
