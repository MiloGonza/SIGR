const MONTH_FORMAT = new Intl.DateTimeFormat("es-CO", {
	month: "long",
	year: "numeric",
});

const DAY_FORMAT = new Intl.DateTimeFormat("es-CO", {
	weekday: "long",
	day: "numeric",
	month: "long",
});

const TIME_FORMAT = new Intl.DateTimeFormat("es-CO", {
	hour: "2-digit",
	minute: "2-digit",
});

export const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const capitalize = (value) =>
	value ? value.charAt(0).toUpperCase() + value.slice(1) : "";

/** Fecha local en formato YYYY-MM-DD (sin pasar por UTC). */
export const toISODate = (date) => {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
};

export const parseISODate = (value) => {
	if (!value) return null;
	const [year, month, day] = String(value).split("-").map(Number);
	if (!year || !month || !day) return null;
	return new Date(year, month - 1, day);
};

export const addDays = (date, amount) => {
	const next = new Date(date.getFullYear(), date.getMonth(), date.getDate());
	next.setDate(next.getDate() + amount);
	return next;
};

export const addMonths = (date, amount) =>
	new Date(date.getFullYear(), date.getMonth() + amount, 1);

export const startOfMonth = (date) =>
	new Date(date.getFullYear(), date.getMonth(), 1);

/** Lunes como primer día de la semana. */
export const startOfWeek = (date) => {
	const base = new Date(date.getFullYear(), date.getMonth(), date.getDate());
	const offset = (base.getDay() + 6) % 7;
	return addDays(base, -offset);
};

export const isSameDay = (first, second) =>
	Boolean(first && second) &&
	first.getFullYear() === second.getFullYear() &&
	first.getMonth() === second.getMonth() &&
	first.getDate() === second.getDate();

export const isToday = (date) => isSameDay(date, new Date());

/** Matriz de 6 semanas (42 días) que cubre el mes de la fecha dada. */
export const monthMatrix = (date) => {
	const first = startOfWeek(startOfMonth(date));
	return Array.from({ length: 42 }, (_, index) => addDays(first, index));
};

export const weekDays = (date) => {
	const first = startOfWeek(date);
	return Array.from({ length: 7 }, (_, index) => addDays(first, index));
};

export const weekdayLabel = (date) => WEEKDAYS[(date.getDay() + 6) % 7];

export const formatMonthYear = (date) => capitalize(MONTH_FORMAT.format(date));

export const formatDayLong = (date) => capitalize(DAY_FORMAT.format(date));

export const formatTime = (value) => {
	if (!value) return "";
	const [hours, minutes] = String(value).split(":");
	const date = new Date();
	date.setHours(Number(hours), Number(minutes || 0), 0, 0);
	return TIME_FORMAT.format(date);
};

export const formatShiftRange = (shift) =>
	`${formatTime(shift.hora_inicio)} – ${formatTime(shift.hora_fin)}`;

/** Rango ISO que cubre la vista mensual completa. */
export const monthRange = (date) => {
	const days = monthMatrix(date);
	return {
		desde: toISODate(days[0]),
		hasta: toISODate(days[days.length - 1]),
	};
};

export const weekRange = (date) => {
	const days = weekDays(date);
	return {
		desde: toISODate(days[0]),
		hasta: toISODate(days[days.length - 1]),
	};
};
