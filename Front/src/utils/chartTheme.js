// Paleta y utilidades compartidas por las gráficas del panel.
// Los colores se mantienen fijos para que el lienzo de ECharts se vea
// consistente en modo claro y oscuro.

export const BRAND = "#9f1239";
export const BRAND_SOFT = "#f43f5e";
export const AMBER = "#f59e0b";

export const CHART_COLORS = [
	"#9f1239",
	"#f59e0b",
	"#0ea5e9",
	"#10b981",
	"#8b5cf6",
	"#f43f5e",
	"#14b8a6",
	"#64748b",
];

export const STATE_COLORS = {
	pendiente: "#f59e0b",
	confirmado: "#0ea5e9",
	preparando: "#8b5cf6",
	en_camino: "#14b8a6",
	entregado: "#10b981",
	cancelado: "#f43f5e",
};

export const getChartTheme = (dark = false) => ({
	text: dark ? "#f4f4f5" : "#27272a",
	muted: dark ? "#a1a1aa" : "#71717a",
	grid: dark ? "rgba(255,255,255,0.1)" : "rgba(24,24,27,0.08)",
	surface: dark ? "#18181b" : "#ffffff",
	tooltip: {
		backgroundColor: dark ? "rgba(24,24,27,0.96)" : "rgba(255,255,255,0.98)",
		borderColor: dark ? "rgba(255,255,255,0.14)" : "rgba(24,24,27,0.08)",
		borderWidth: 1,
		padding: [10, 14],
		textStyle: { color: dark ? "#f4f4f5" : "#18181b", fontSize: 12 },
		extraCssText:
			"border-radius:12px;box-shadow:0 16px 40px rgba(0,0,0,0.18);backdrop-filter:blur(8px);",
	},
});

/**
 * Degradado vertical para áreas y barras.
 * ECharts acepta esta estructura sin necesidad de importar `graphic`.
 */
export const verticalGradient = (from, to) => ({
	type: "linear",
	x: 0,
	y: 0,
	x2: 0,
	y2: 1,
	colorStops: [
		{ offset: 0, color: from },
		{ offset: 1, color: to },
	],
});

export const horizontalGradient = (from, to) => ({
	type: "linear",
	x: 0,
	y: 0,
	x2: 1,
	y2: 0,
	colorStops: [
		{ offset: 0, color: from },
		{ offset: 1, color: to },
	],
});

const COMPACT = new Intl.NumberFormat("es-CO", {
	notation: "compact",
	maximumFractionDigits: 1,
});

export const formatCompact = (value) => COMPACT.format(Number(value) || 0);

export const formatCompactCOP = (value) => `$${formatCompact(value)}`;

const FECHA_CORTA = new Intl.DateTimeFormat("es-CO", {
	day: "2-digit",
	month: "short",
});

const FECHA_LARGA = new Intl.DateTimeFormat("es-CO", {
	weekday: "short",
	day: "numeric",
	month: "long",
});

// Se usa mediodía para que la fecha no se desplace por la zona horaria.
const parseFecha = (iso) => new Date(`${iso}T12:00:00`);

export const fechaCorta = (iso) => FECHA_CORTA.format(parseFecha(iso));

export const fechaLarga = (iso) => FECHA_LARGA.format(parseFecha(iso));

export const formatHora = (hora) => `${String(hora).padStart(2, "0")}:00`;

/** Evita que un nombre con HTML se interprete dentro del tooltip de ECharts. */
export const escapeHtml = (value = "") =>
	String(value).replace(
		/[&<>"']/g,
		(char) =>
			({
				"&": "&amp;",
				"<": "&lt;",
				">": "&gt;",
				'"': "&quot;",
				"'": "&#39;",
			})[char],
	);
