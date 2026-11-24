import unicodedata


PAYMENT_SUMMARY_LABELS = (
	("Pago contra entrega", ("contra entrega", "contraentrega")),
	("Pago en el local", ("pago en el local", "local", "mesa")),
	("Nequi", ("nequi",)),
	("Daviplata", ("daviplata",)),
	("PSE", ("pse",)),
	("Efectivo", ("efectivo", "cash")),
)

PAYMENT_CARD_KEYWORDS = (
	"visa",
	"mastercard",
	"maestro",
	"amex",
	"american express",
	"diners",
	"discover",
	"tarjeta",
	"card",
	"credito",
	"debito",
)


def normalize_payment_summary(value):
	"""Agrupa el método de pago en una etiqueta segura.

	Los pedidos antiguos guardaban la marca y los últimos cuatro dígitos de la
	tarjeta. Aquí se reducen a su tipo para que nunca se expongan datos del
	medio de pago, y para que las estadísticas agrupen todas las tarjetas juntas.
	"""
	text = str(value or "").strip()
	if not text:
		return "Pago contra entrega"

	plain = (
		unicodedata.normalize("NFKD", text)
		.encode("ascii", "ignore")
		.decode("ascii")
		.lower()
	)
	if any(keyword in plain for keyword in PAYMENT_CARD_KEYWORDS) or any(
		char.isdigit() for char in plain
	):
		return "Tarjeta"

	for label, keywords in PAYMENT_SUMMARY_LABELS:
		if any(keyword in plain for keyword in keywords):
			return label

	return "Otro"
