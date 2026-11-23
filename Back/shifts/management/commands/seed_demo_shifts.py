"""Genera turnos de ejemplo para el calendario del equipo."""

import random
from datetime import time, timedelta

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils import timezone

from restaurants.models import Restaurant
from shifts.models import Shift
from users.models import Profile

User = get_user_model()

TIPOS = [
	(Shift.MANANA, time(7, 0), time(13, 0)),
	(Shift.TARDE, time(13, 0), time(19, 0)),
	(Shift.NOCHE, time(19, 0), time(23, 0)),
]


class Command(BaseCommand):
	help = (
		"Genera turnos de ejemplo para las próximas semanas usando el "
		"personal de cada restaurante."
	)

	def add_arguments(self, parser):
		parser.add_argument(
			"--restaurante",
			action="append",
			default=None,
			help=(
				"Nombre o slug de la tienda. Se puede repetir. Si se omite, "
				"se usan todas las tiendas con personal."
			),
		)
		parser.add_argument(
			"--semanas",
			type=int,
			default=4,
			help="Cantidad de semanas a generar (default: 4).",
		)
		parser.add_argument(
			"--seed",
			type=int,
			default=2026,
			help="Semilla aleatoria para reproducir los datos (default: 2026).",
		)
		parser.add_argument(
			"--limpiar",
			action="store_true",
			help="Solo elimina los turnos existentes y termina.",
		)

	def handle(self, *args, **options):
		random.seed(options["seed"])

		if options["limpiar"]:
			deleted, _ = Shift.objects.all().delete()
			self.stdout.write(
				self.style.WARNING(f"Turnos eliminados ({deleted}).")
			)
			return

		restaurantes = self.resolve_restaurants(options["restaurante"])
		if not restaurantes:
			self.stderr.write(
				self.style.ERROR(
					"No se encontraron tiendas con personal. Crea empleados "
					"o indica --restaurante."
				)
			)
			return

		hoy = timezone.localdate()
		lunes = hoy - timedelta(days=hoy.weekday())
		semanas = max(1, options["semanas"])
		total = 0

		for restaurante in restaurantes:
			personal = list(
				User.objects.filter(
					profile__restaurante=restaurante,
					profile__rol__in=(
						Profile.MESERO,
						Profile.ADMINISTRADOR,
					),
					is_active=True,
				).order_by("username")
			)
			if not personal:
				self.stderr.write(
					self.style.WARNING(
						f"  {restaurante.nombre}: sin personal, se omite."
					)
				)
				continue

			creados = 0
			for semana in range(semanas):
				for offset in range(6):
					fecha = lunes + timedelta(weeks=semana, days=offset)
					asignados = set()
					for tipo, inicio, fin in TIPOS:
						if random.random() > 0.55:
							continue
						candidatos = [
							persona
							for persona in personal
							if persona.pk not in asignados
						]
						if not candidatos:
							continue
						empleado = random.choice(candidatos)
						_, created = Shift.objects.get_or_create(
							empleado=empleado,
							fecha=fecha,
							hora_inicio=inicio,
							defaults={
								"restaurante": restaurante,
								"hora_fin": fin,
								"tipo": tipo,
								"estado": Shift.PROGRAMADO,
								"notas": "",
							},
						)
						asignados.add(empleado.pk)
						if created:
							creados += 1

			total += creados
			self.stdout.write(
				self.style.SUCCESS(
					f"  {restaurante.nombre}: {creados} turnos"
				)
			)

		self.stdout.write(
			self.style.SUCCESS(
				f"Listo: {total} turnos de ejemplo en "
				f"{len(restaurantes)} tienda(s)."
			)
		)

	def resolve_restaurants(self, names):
		queryset = Restaurant.objects.all()
		if not names:
			return list(
				queryset.filter(
					usuarios__rol__in=(
						Profile.MESERO,
						Profile.ADMINISTRADOR,
					),
					usuarios__restaurante__isnull=False,
				).distinct()
			)

		found = []
		for name in names:
			restaurante = (
				queryset.filter(slug=name).first()
				or queryset.filter(nombre__iexact=name).first()
				or queryset.filter(nombre__icontains=name).first()
			)
			if restaurante and restaurante not in found:
				found.append(restaurante)
		return found
