from pathlib import Path

from django.conf import settings
from django.core.files import File
from django.core.management.base import BaseCommand

from restaurants.models import Category, Dish, Restaurant

ASSETS_DIR = Path(settings.BASE_DIR).parent / "Front" / "src" / "assets"

CATEGORIES = [
	{"nombre": "Rápida", "slug": "rapida", "icon": "Pizza", "orden": 1},
	{"nombre": "Saludable", "slug": "saludable", "icon": "Salad", "orden": 2},
	{"nombre": "Postres", "slug": "postres", "icon": "IceCream", "orden": 3},
	{"nombre": "Bebidas", "slug": "bebidas", "icon": "CupSoda", "orden": 4},
	{"nombre": "Desayunos", "slug": "desayunos", "icon": "Coffee", "orden": 5},
	{"nombre": "Parrilla", "slug": "parrilla", "icon": "Flame", "orden": 6},
]

STORES = [
	{
		"slug": "punto-y-sazon",
		"nombre": "Punto y Sazón",
		"tipo": "Cocina casera",
		"descripcion": "Comida casera y sabores de siempre, preparados al momento.",
		"rating": "4.9",
		"rating_count": 320,
		"delivery_min": 20,
		"delivery_max": 30,
		"shipping_cost": "0.00",
		"free_shipping": True,
		"tags": ["Popular", "Almuerzo", "Saludable"],
		"image": "store-punto.jpg",
		"icon": "ChefHat",
		"gradient": "linear-gradient(135deg, #7f1d1d 0%, #c2410c 100%)",
	},
	{
		"slug": "la-brasa",
		"nombre": "La Brasa",
		"tipo": "Parrilla y hamburguesas",
		"descripcion": "Carnes a la parrilla, hamburguesas y pizzas al horno.",
		"rating": "4.7",
		"rating_count": 185,
		"delivery_min": 25,
		"delivery_max": 35,
		"shipping_cost": "2900.00",
		"free_shipping": False,
		"tags": ["Rápida", "Cena"],
		"image": "store-brasa.jpg",
		"icon": "Flame",
		"gradient": "linear-gradient(135deg, #431407 0%, #ea580c 100%)",
	},
	{
		"slug": "verde-mesa",
		"nombre": "Verde Mesa",
		"tipo": "Bowls y comida saludable",
		"descripcion": "Bowls frescos, ensaladas y desayunos para comer bien.",
		"rating": "4.8",
		"rating_count": 210,
		"delivery_min": 15,
		"delivery_max": 25,
		"shipping_cost": "0.00",
		"free_shipping": True,
		"tags": ["Saludable", "Desayunos"],
		"image": "store-verde.jpg",
		"icon": "Salad",
		"gradient": "linear-gradient(135deg, #14532d 0%, #65a30d 100%)",
	},
	{
		"slug": "dulce-hogar",
		"nombre": "Dulce Hogar",
		"tipo": "Postres y bebidas",
		"descripcion": "Postres, mousses y bebidas frías para endulzar el día.",
		"rating": "4.9",
		"rating_count": 275,
		"delivery_min": 30,
		"delivery_max": 40,
		"shipping_cost": "1900.00",
		"free_shipping": False,
		"tags": ["Postres", "Bebidas"],
		"image": "store-dulce.jpg",
		"icon": "IceCream",
		"gradient": "linear-gradient(135deg, #4c1d95 0%, #db2777 100%)",
	},
	{
		"slug": "el-zangano",
		"nombre": "ElZangano",
		"tipo": "Parrilla y cortes",
		"descripcion": "Carnes a la parrilla, cortes y acompañamientos para compartir.",
		"rating": "4.6",
		"rating_count": 96,
		"delivery_min": 25,
		"delivery_max": 40,
		"shipping_cost": "2500.00",
		"free_shipping": False,
		"tags": ["Parrilla", "Cena"],
		"image": "store-brasa.jpg",
		"icon": "Flame",
		"gradient": "linear-gradient(135deg, #7f1d1d 0%, #dc2626 100%)",
	},
	{
		"slug": "el-sabor-de-pepito",
		"nombre": "El sabor de pepito",
		"tipo": "Comida rápida y casera",
		"descripcion": "Pepitos, sándwiches y platos rápidos con sabor casero.",
		"rating": "4.5",
		"rating_count": 64,
		"delivery_min": 20,
		"delivery_max": 30,
		"shipping_cost": "0.00",
		"free_shipping": True,
		"tags": ["Rápida", "Almuerzo"],
		"image": "store-punto.jpg",
		"icon": "ChefHat",
		"gradient": "linear-gradient(135deg, #78350f 0%, #f59e0b 100%)",
	},
	{
		"slug": "pereza-total",
		"nombre": "Pereza total",
		"tipo": "Postres y café",
		"descripcion": "Postres, café y bebidas para consentirte sin salir de casa.",
		"rating": "4.4",
		"rating_count": 38,
		"delivery_min": 15,
		"delivery_max": 25,
		"shipping_cost": "1500.00",
		"free_shipping": False,
		"tags": ["Postres", "Bebidas"],
		"image": "store-dulce.jpg",
		"icon": "IceCream",
		"gradient": "linear-gradient(135deg, #581c87 0%, #ec4899 100%)",
	},
]

DISHES = [
	{
		"nombre": "Pollo al curry",
		"restaurante": "punto-y-sazon",
		"categoria": "rapida",
		"descripcion": "Pollo tierno en salsa de curry con arroz y vegetales.",
		"precio": "18900.00",
		"rating": "4.9",
		"rating_count": 132,
		"etiqueta": "Más pedido",
		"prep_minutes": 22,
		"image": "dish-curry.jpg",
		"icon": "ChefHat",
		"gradient": "linear-gradient(135deg, #92400e 0%, #f59e0b 100%)",
	},
	{
		"nombre": "Arroz con pollo",
		"restaurante": "punto-y-sazon",
		"categoria": "rapida",
		"descripcion": "Arroz sazonado con pollo desmechado y vegetales frescos.",
		"precio": "17900.00",
		"rating": "4.7",
		"rating_count": 81,
		"etiqueta": "Casero",
		"prep_minutes": 20,
		"image": "dish-curry.jpg",
		"icon": "ChefHat",
		"gradient": "linear-gradient(135deg, #92400e 0%, #f59e0b 100%)",
	},
	{
		"nombre": "Limonada de la casa",
		"restaurante": "punto-y-sazon",
		"categoria": "bebidas",
		"descripcion": "Limonada natural con hierbabuena y hielo.",
		"precio": "6500.00",
		"rating": "4.6",
		"rating_count": 64,
		"etiqueta": "Refrescante",
		"prep_minutes": 4,
		"image": "dish-limonada.jpg",
		"icon": "CupSoda",
		"gradient": "linear-gradient(135deg, #365314 0%, #a3e635 100%)",
	},
	{
		"nombre": "Bowl mediterráneo",
		"restaurante": "verde-mesa",
		"categoria": "saludable",
		"descripcion": "Vegetales frescos, garbanzos, aguacate y aderezo de la casa.",
		"precio": "16500.00",
		"rating": "4.8",
		"rating_count": 98,
		"etiqueta": "Saludable",
		"prep_minutes": 12,
		"image": "dish-bowl.jpg",
		"icon": "Salad",
		"gradient": "linear-gradient(135deg, #14532d 0%, #84cc16 100%)",
	},
	{
		"nombre": "Ensalada César",
		"restaurante": "verde-mesa",
		"categoria": "saludable",
		"descripcion": "Lechuga, crutones, parmesano y aderezo César de la casa.",
		"precio": "14900.00",
		"rating": "4.6",
		"rating_count": 54,
		"etiqueta": "Fresca",
		"prep_minutes": 10,
		"image": "dish-bowl.jpg",
		"icon": "Salad",
		"gradient": "linear-gradient(135deg, #14532d 0%, #84cc16 100%)",
	},
	{
		"nombre": "Pizza margarita",
		"restaurante": "la-brasa",
		"categoria": "rapida",
		"descripcion": "Masa artesanal, tomate, mozzarella y albahaca fresca.",
		"precio": "22000.00",
		"rating": "4.7",
		"rating_count": 87,
		"etiqueta": "Para compartir",
		"prep_minutes": 16,
		"image": "dish-pizza.jpg",
		"icon": "Pizza",
		"gradient": "linear-gradient(135deg, #7c2d12 0%, #f97316 100%)",
	},
	{
		"nombre": "Hamburguesa clásica",
		"restaurante": "la-brasa",
		"categoria": "rapida",
		"descripcion": "Carne a la parrilla, queso, vegetales y papas rústicas.",
		"precio": "23900.00",
		"rating": "4.8",
		"rating_count": 73,
		"etiqueta": "Recomendada",
		"prep_minutes": 18,
		"image": "dish-pizza.jpg",
		"icon": "Flame",
		"gradient": "linear-gradient(135deg, #7c2d12 0%, #f97316 100%)",
	},
	{
		"nombre": "Mousse de chocolate",
		"restaurante": "dulce-hogar",
		"categoria": "postres",
		"descripcion": "Mousse cremoso de chocolate con un toque de vainilla.",
		"precio": "9500.00",
		"rating": "4.9",
		"rating_count": 143,
		"etiqueta": "Postre",
		"prep_minutes": 6,
		"image": "dish-mousse.jpg",
		"icon": "IceCream",
		"gradient": "linear-gradient(135deg, #4c1d95 0%, #db2777 100%)",
	},
	{
		"nombre": "Café helado",
		"restaurante": "dulce-hogar",
		"categoria": "bebidas",
		"descripcion": "Café frío con leche y un toque de crema.",
		"precio": "7500.00",
		"rating": "4.6",
		"rating_count": 49,
		"etiqueta": "Refrescante",
		"prep_minutes": 5,
		"image": "dish-limonada.jpg",
		"icon": "Coffee",
		"gradient": "linear-gradient(135deg, #4c1d95 0%, #db2777 100%)",
	},
	{
		"nombre": "Churrasco de res",
		"restaurante": "el-zangano",
		"categoria": "parrilla",
		"descripcion": "Corte de res a la parrilla con papas y ensalada.",
		"precio": "32900.00",
		"rating": "4.7",
		"rating_count": 58,
		"etiqueta": "Recomendado",
		"prep_minutes": 25,
		"image": "dish-curry.jpg",
		"icon": "Flame",
		"gradient": "linear-gradient(135deg, #7f1d1d 0%, #dc2626 100%)",
	},
	{
		"nombre": "Limonada de panela",
		"restaurante": "el-zangano",
		"categoria": "bebidas",
		"descripcion": "Limonada natural endulzada con panela.",
		"precio": "6900.00",
		"rating": "4.5",
		"rating_count": 32,
		"etiqueta": "Refrescante",
		"prep_minutes": 4,
		"image": "dish-limonada.jpg",
		"icon": "CupSoda",
		"gradient": "linear-gradient(135deg, #365314 0%, #a3e635 100%)",
	},
	{
		"nombre": "Pepito de res",
		"restaurante": "el-sabor-de-pepito",
		"categoria": "rapida",
		"descripcion": "Pan artesanal con res, queso y vegetales salteados.",
		"precio": "21900.00",
		"rating": "4.6",
		"rating_count": 45,
		"etiqueta": "Más pedido",
		"prep_minutes": 15,
		"image": "dish-pizza.jpg",
		"icon": "ChefHat",
		"gradient": "linear-gradient(135deg, #78350f 0%, #f59e0b 100%)",
	},
	{
		"nombre": "Limonada natural",
		"restaurante": "el-sabor-de-pepito",
		"categoria": "bebidas",
		"descripcion": "Limonada fresca con hielo y hierbabuena.",
		"precio": "6500.00",
		"rating": "4.4",
		"rating_count": 27,
		"etiqueta": "Refrescante",
		"prep_minutes": 4,
		"image": "dish-limonada.jpg",
		"icon": "CupSoda",
		"gradient": "linear-gradient(135deg, #365314 0%, #a3e635 100%)",
	},
	{
		"nombre": "Mousse de chocolate",
		"restaurante": "pereza-total",
		"categoria": "postres",
		"descripcion": "Mousse cremoso de chocolate con un toque de vainilla.",
		"precio": "9500.00",
		"rating": "4.7",
		"rating_count": 39,
		"etiqueta": "Postre",
		"prep_minutes": 6,
		"image": "dish-mousse.jpg",
		"icon": "IceCream",
		"gradient": "linear-gradient(135deg, #581c87 0%, #ec4899 100%)",
	},
	{
		"nombre": "Café helado",
		"restaurante": "pereza-total",
		"categoria": "bebidas",
		"descripcion": "Café frío con leche y crema batida.",
		"precio": "7500.00",
		"rating": "4.5",
		"rating_count": 21,
		"etiqueta": "Refrescante",
		"prep_minutes": 5,
		"image": "dish-limonada.jpg",
		"icon": "Coffee",
		"gradient": "linear-gradient(135deg, #581c87 0%, #ec4899 100%)",
	},
]


class Command(BaseCommand):
	help = "Carga las categorías, tiendas y platillos de vitrina del cliente."

	def attach_image(self, instance, filename):
		if not filename or instance.image:
			return
		path = ASSETS_DIR / filename
		if not path.exists():
			self.stdout.write(
				self.style.WARNING(f"No se encontró la imagen {path}; se omite.")
			)
			return
		with path.open("rb") as handle:
			instance.image.save(filename, File(handle), save=True)

	def handle(self, *args, **options):
		categories = {}
		for data in CATEGORIES:
			category, _ = Category.objects.update_or_create(
				slug=data["slug"],
				defaults={
					"nombre": data["nombre"],
					"icon": data["icon"],
					"orden": data["orden"],
					"is_active": True,
				},
			)
			categories[data["slug"]] = category

		stores = {}
		for data in STORES:
			payload = {key: value for key, value in data.items() if key != "image"}
			restaurant = Restaurant.objects.filter(slug=data["slug"]).first()
			if restaurant is None:
				# Las tiendas creadas desde la app no tienen slug todavía: se
				# buscan por nombre para completarles los datos en vez de duplicarlas.
				restaurant = Restaurant.objects.filter(
					nombre__iexact=data["nombre"]
				).first()
			if restaurant is None:
				restaurant = Restaurant.objects.create(**payload, is_active=True)
			else:
				for key, value in payload.items():
					setattr(restaurant, key, value)
				restaurant.is_active = True
				restaurant.save()
			self.attach_image(restaurant, data["image"])
			stores[data["slug"]] = restaurant

		for data in DISHES:
			category = categories[data["categoria"]]
			restaurant = stores[data["restaurante"]]
			payload = {
				key: value
				for key, value in data.items()
				if key not in {"restaurante", "categoria", "image"}
			}
			dish, created = Dish.objects.update_or_create(
				restaurante=restaurant,
				nombre=data["nombre"],
				defaults={
					**payload,
					"categoria": category,
					"is_active": True,
				},
			)
			if created:
				dish.stock = 24
				dish.save(update_fields=["stock"])
			self.attach_image(dish, data["image"])

		self.stdout.write(
			self.style.SUCCESS(
				f"Catálogo cargado: {Category.objects.count()} categorías, "
				f"{Restaurant.objects.count()} tiendas y {Dish.objects.count()} platillos."
			)
		)
