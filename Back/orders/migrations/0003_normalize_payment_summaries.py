import unicodedata

from django.db import migrations


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


def normalize(value):
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


def forwards(apps, schema_editor):
	Order = apps.get_model("orders", "Order")
	for order in Order.objects.exclude(metodo_pago_resumen="").iterator():
		normalized = normalize(order.metodo_pago_resumen)
		if normalized != order.metodo_pago_resumen:
			order.metodo_pago_resumen = normalized
			order.save(update_fields=["metodo_pago_resumen"])


class Migration(migrations.Migration):

	dependencies = [
		("orders", "0002_order_mesa_order_tipo_pedido_alter_order_estado"),
	]

	operations = [
		migrations.RunPython(forwards, migrations.RunPython.noop),
	]
