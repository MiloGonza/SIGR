"""Genera pedidos de prueba para ver el panel de resumen con datos."""

import random
import uuid
from datetime import datetime, time, timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from orders.models import Order, OrderItem
from restaurants.models import Dish, Restaurant
from users.models import Profile

User = get_user_model()

DEMO_PREFIX = "DEMO-"

NOMBRES = [
	"Ana",
	"Carlos",
	"Daniela",
	"Felipe",
	"Laura",
	"Mateo",
	"Camila",
	"Santiago",
	"Valentina",
	"Andrés",
	"Isabella",
	"Sebastián",
]

APELLIDOS = [
	"Gómez",
	"Rodríguez",
	"Martínez",
	"López",
	"García",
	"Ramírez",
	"Torres",
	"Vargas",
	"Castro",
	"Rojas",
]

DIRECCIONES = [
	"Calle 45 # 12-30, Chapinero",
	"Carrera 7 # 62-18, Centro",
	"Cra. 15 # 85-20, Chicó",
	"Calle 100 # 19-45, Usaquén",
	"Av. Suba # 115-30",
	"Calle 26 # 68-15, Salitre",
	"Transversal 23 # 54-12",
	"Calle 72 # 10-34, Rosales",
]

CIUDADES = ["Bogotá", "Medellín", "Cali", "Barranquilla"]

METODOS_PAGO = ["Tarjeta", "Nequi", "Efectivo", "Pago contra entrega"]


class Command(BaseCommand):
	help = (
		"Genera pedidos de prueba, clientes y stock bajo para el panel de "
		"resumen. Por defecto usa todas las tiendas que tienen administrador."
	)

	def add_arguments(self, parser):
		parser.add_argument(
			"--restaurante",
			action="append",
			default=None,
			help=(
				"Nombre o slug de la tienda. Se puede repetir. Si se omite, "
				"se usan todas las tiendas con administrador."
			),
		)
		parser.add_argument(
			"--dias",
			type=int,
			default=90,
			help="Cantidad de días hacia atrás que se generarán (default: 90).",
		)
		parser.add_argument(
			"--por-dia",
			type=int,
			default=4,
			help="Promedio de pedidos por día y tienda (default: 4).",
		)
		parser.add_argument(
			"--clientes",
			type=int,
			default=10,
			help="Cantidad de clientes de prueba (default: 10).",
		)
		parser.add_argument(
			"--seed",
			type=int,
			default=2026,
			help="Semilla aleatoria para reproducir los datos (default: 2026).",
		)
		parser.add_argument(
			"--sin-stock-bajo",
			action="store_true",
			help="No modifica el stock de platillos para la tarjeta de stock bajo.",
		)
		parser.add_argument(
			"--limpiar",
			action="store_true",
			help="Solo elimina los pedidos y clientes de prueba y termina.",
		)

	def handle(self, *args, **options):
		random.seed(options["seed"])

		if options["limpiar"]:
			self.cleanup()
			return

		restaurantes = self.resolve_restaurants(options["restaurante"])
		if not restaurantes:
			self.stderr.write(
				self.style.ERROR(
					"No se encontraron tiendas. Crea una tienda o indica "
					"--restaurante."
				)
			)
			return

		clientes = self.create_clients(options["clientes"])
		self.cleanup(keep_clients=True)

		total_pedidos = 0
		total_items = 0
		for restaurante in restaurantes:
			pedidos, items = self.seed_restaurant(
				restaurante,
				clientes,
				dias=max(1, options["dias"]),
				por_dia=max(1, options["por_dia"]),
				stock_bajo=not options["sin_stock_bajo"],
			)
			total_pedidos += pedidos
			total_items += items
			self.stdout.write(
				self.style.SUCCESS(
					f"  {restaurante.nombre}: {pedidos} pedidos, {items} ítems"
				)
			)

		self.stdout.write(
			self.style.SUCCESS(
				f"Listo: {total_pedidos} pedidos y {total_items} ítems de prueba "
				f"en {len(restaurantes)} tienda(s)."
			)
		)

	def resolve_restaurants(self, names):
		queryset = Restaurant.objects.all()
		if not names:
			return list(
				queryset.filter(
					usuarios__rol=Profile.ADMINISTRADOR,
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

	def create_clients(self, cantidad):
		clientes = []
		for index in range(1, max(1, cantidad) + 1):
			username = f"demo_cliente_{index:02d}"
			nombre = NOMBRES[(index - 1) % len(NOMBRES)]
			apellido = APELLIDOS[(index - 1) % len(APELLIDOS)]
			user, created = User.objects.get_or_create(
				username=username,
				defaults={
					"email": f"{username}@sigr.local",
					"first_name": nombre,
					"last_name": apellido,
					"is_active": True,
				},
			)
			if created:
				user.set_unusable_password()
				user.save(update_fields=["password"])
			else:
				user.first_name = nombre
				user.last_name = apellido
				user.save(update_fields=["first_name", "last_name"])
			Profile.objects.update_or_create(
				user=user, defaults={"rol": Profile.CLIENTE, "restaurante": None}
			)
			clientes.append(user)
		return clientes

	def cleanup(self, keep_clients=False):
		pedidos, _ = Order.objects.filter(numero__startswith=DEMO_PREFIX).delete()
		if not keep_clients:
			User.objects.filter(username__startswith="demo_cliente_").delete()
		self.stdout.write(
			self.style.WARNING(f"Datos de prueba anteriores eliminados ({pedidos}).")
		)

	def seed_restaurant(self, restaurante, clientes, dias, por_dia, stock_bajo):
		platillos = list(Dish.objects.filter(restaurante=restaurante))
		if not platillos:
			self.stderr.write(
				self.style.WARNING(
					f"  {restaurante.nombre}: sin platillos, se omite."
				)
			)
			return 0, 0

		hoy = timezone.localdate()
		pedidos = []
		items = []

		for days_ago in range(dias - 1, -1, -1):
			dia = hoy - timedelta(days=days_ago)
			cantidad = self.orders_for_day(dia, por_dia)
			for _ in range(cantidad):
				order = self.build_order(
					restaurante,
					platillos,
					random.choice(clientes),
					dia,
					days_ago,
				)
				if order is None:
					continue
				pedidos.append(order)
				items.extend(order._demo_items)

		if not pedidos:
			return 0, 0

		with transaction.atomic():
			Order.objects.bulk_create(pedidos, batch_size=500)
			# auto_now_add sobrescribe created_at al insertar; restauramos la
			# fecha simulada y la persistimos con bulk_update.
			for order in pedidos:
				order.created_at = order._demo_created_at
			Order.objects.bulk_update(pedidos, ["created_at"], batch_size=500)
			OrderItem.objects.bulk_create(items, batch_size=500)

		if stock_bajo:
			self.mark_low_stock(restaurante, platillos)

		return len(pedidos), len(items)

	def orders_for_day(self, dia, promedio):
		# Más pedidos el fin de semana y menos los lunes.
		factor = {0: 0.7, 1: 0.9, 2: 1.0, 3: 1.1, 4: 1.5, 5: 1.7, 6: 1.3}[
			dia.weekday()
		]
		media = max(1, promedio * factor)
		cantidad = int(random.gauss(media, 1.2))
		return max(1, min(12, cantidad))

	def build_order(self, restaurante, platillos, cliente, dia, days_ago):
		estado = self.pick_status(days_ago)
		hora = random.choices(
			[11, 12, 12, 13, 13, 14, 15, 17, 18, 19, 19, 20, 20, 21, 22],
			k=1,
		)[0]
		momento = timezone.make_aware(
			datetime.combine(
				dia, time(hora, random.randint(0, 59), random.randint(0, 59))
			),
			timezone.get_current_timezone(),
		)

		seleccion = random.sample(
			platillos, min(len(platillos), random.choices([1, 2, 3], [0.45, 0.4, 0.15])[0])
		)
		subtotal = Decimal("0.00")
		order_items = []
		prep_max = 0
		for platillo in seleccion:
			cantidad = random.choices([1, 1, 2, 2, 3], [0.4, 0.25, 0.2, 0.1, 0.05])[0]
			subtotal += platillo.precio * cantidad
			prep_max = max(prep_max, platillo.prep_minutes)
			order_items.append(
				OrderItem(
					order=None,
					dish=platillo,
					nombre=platillo.nombre,
					precio_unitario=platillo.precio,
					cantidad=cantidad,
					prep_minutes=platillo.prep_minutes,
				)
			)

		envio = (
			Decimal("0.00")
			if restaurante.free_shipping
			else Decimal(restaurante.shipping_cost)
		)
		order = Order(
			numero=f"{DEMO_PREFIX}{uuid.uuid4().hex[:8].upper()}",
			user=cliente,
			restaurante=restaurante,
			direccion_entrega=random.choice(DIRECCIONES),
			ciudad_entrega=random.choice(CIUDADES),
			metodo_pago_resumen=random.choice(METODOS_PAGO),
			estado=estado,
			subtotal=subtotal,
			envio=envio,
			total=subtotal + envio,
			prep_minutes=prep_max,
			notas="Pedido de prueba generado por seed_demo_orders.",
			created_at=momento,
		)
		if estado in (Order.PREPARANDO, Order.EN_CAMINO, Order.ENTREGADO):
			order.accepted_at = momento + timedelta(minutes=random.randint(2, 8))
		if estado == Order.ENTREGADO:
			order.delivered_at = momento + timedelta(
				minutes=prep_max + random.randint(8, 30)
			)

		for item in order_items:
			item.order = order
		order._demo_items = order_items
		order._demo_created_at = momento
		return order

	def pick_status(self, days_ago):
		if days_ago == 0:
			return random.choices(
				[
					Order.PENDIENTE,
					Order.CONFIRMADO,
					Order.PREPARANDO,
					Order.EN_CAMINO,
					Order.ENTREGADO,
				],
				[15, 30, 25, 20, 10],
			)[0]
		if days_ago == 1:
			return random.choices(
				[Order.EN_CAMINO, Order.ENTREGADO, Order.CANCELADO],
				[10, 85, 5],
			)[0]
		return random.choices([Order.ENTREGADO, Order.CANCELADO], [92, 8])[0]

	def mark_low_stock(self, restaurante, platillos):
		candidatos = [p for p in platillos if p.stock > 5]
		if not candidatos:
			return
		for platillo, stock in zip(candidatos[:2], [3, 5]):
			Dish.objects.filter(pk=platillo.pk).update(stock=stock)
