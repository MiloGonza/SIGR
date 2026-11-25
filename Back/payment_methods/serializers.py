from django.utils import timezone
from rest_framework import serializers

from .models import PaymentMethod


def detect_card_brand(number):
	if number.startswith("4"):
		return "Visa"
	if number[:2] in {"51", "52", "53", "54", "55"}:
		return "Mastercard"
	if number.startswith(("34", "37")):
		return "American Express"
	if number[:2] in {"36", "38", "39"}:
		return "Diners Club"
	return "Tarjeta"


def luhn_is_valid(number):
	total = 0
	for index, digit in enumerate(reversed(number)):
		value = int(digit)
		if index % 2 == 1:
			value *= 2
			if value > 9:
				value -= 9
		total += value
	return total % 10 == 0


class PaymentMethodSerializer(serializers.ModelSerializer):
	# El número completo solo se acepta al crear/actualizar y nunca se guarda.
	numero_tarjeta = serializers.CharField(
		write_only=True, required=False, allow_blank=True, max_length=25
	)

	class Meta:
		model = PaymentMethod
		fields = [
			"id",
			"tipo",
			"alias",
			"titular",
			"marca",
			"ultimos4",
			"mes_expira",
			"anio_expira",
			"is_default",
			"created_at",
			"numero_tarjeta",
		]
		read_only_fields = ["id", "marca", "ultimos4", "created_at"]

	def validate(self, attrs):
		tipo = attrs.get("tipo", getattr(self.instance, "tipo", PaymentMethod.TARJETA))
		numero = str(attrs.get("numero_tarjeta") or "").replace(" ", "").replace("-", "")
		if not numero:
			attrs.pop("numero_tarjeta", None)

		if tipo == PaymentMethod.TARJETA:
			if numero:
				if not numero.isdigit() or not 13 <= len(numero) <= 19:
					raise serializers.ValidationError(
						{"numero_tarjeta": "El número de tarjeta no es válido."}
					)
				if not luhn_is_valid(numero):
					raise serializers.ValidationError(
						{"numero_tarjeta": "El número de tarjeta no es válido."}
					)
				attrs["ultimos4"] = numero[-4:]
				attrs["marca"] = detect_card_brand(numero)
			elif self.instance is None and not attrs.get("ultimos4"):
				raise serializers.ValidationError(
					{"numero_tarjeta": "Ingresa el número de la tarjeta."}
				)

		mes = attrs.get("mes_expira", getattr(self.instance, "mes_expira", None))
		anio = attrs.get("anio_expira", getattr(self.instance, "anio_expira", None))
		if (mes and not anio) or (anio and not mes):
			raise serializers.ValidationError(
				{"mes_expira": "Indica el mes y el año de vencimiento."}
			)
		if mes is not None and not 1 <= int(mes) <= 12:
			raise serializers.ValidationError(
				{"mes_expira": "El mes debe estar entre 1 y 12."}
			)
		if mes and anio:
			hoy = timezone.localdate()
			if int(anio) < hoy.year or (
				int(anio) == hoy.year and int(mes) < hoy.month
			):
				raise serializers.ValidationError(
					{"anio_expira": "La tarjeta ya está vencida."}
				)

		if numero:
			attrs["numero_tarjeta"] = numero
		return attrs

	def create(self, validated_data):
		validated_data.pop("numero_tarjeta", None)
		if not PaymentMethod.objects.filter(user=validated_data["user"]).exists():
			validated_data["is_default"] = True
		return super().create(validated_data)

	def update(self, instance, validated_data):
		validated_data.pop("numero_tarjeta", None)
		return super().update(instance, validated_data)
