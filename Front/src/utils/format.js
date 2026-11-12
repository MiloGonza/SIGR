const COP_FORMAT = new Intl.NumberFormat("es-CO", {
	style: "currency",
	currency: "COP",
	maximumFractionDigits: 0,
});

export const formatCOP = (value) => COP_FORMAT.format(Number(value) || 0);

const DATE_FORMAT = new Intl.DateTimeFormat("es-CO", {
	day: "numeric",
	month: "short",
	year: "numeric",
});

const TIME_FORMAT = new Intl.DateTimeFormat("es-CO", {
	hour: "numeric",
	minute: "2-digit",
});

export const formatDate = (value) => {
	if (!value) return "";
	return DATE_FORMAT.format(new Date(value));
};

export const formatDateTime = (value) => {
	if (!value) return "";
	const date = new Date(value);
	return `${DATE_FORMAT.format(date)}, ${TIME_FORMAT.format(date)}`;
};
