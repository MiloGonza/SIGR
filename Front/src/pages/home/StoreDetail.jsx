import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import {
	ArrowLeft,
	ArrowRight,
	Bike,
	ChefHat,
	Clock,
	Plus,
	ShoppingCart,
	Star,
	UtensilsCrossed,
} from "lucide-react";
import { getApiErrorMessage, getRestaurantMenu } from "../../Api/clientApi";
import LazyImage from "../../components/globals/LazyImage";
import useCartStore, { quantityInCart } from "../../store/useCartStore";
import useStore from "../../store/useStore";
import { formatCOP } from "../../utils/format";

const priceLabel = (value) => {
	const text = String(value ?? "").trim();
	return /^\d+(\.\d+)?$/.test(text) ? formatCOP(text) : text;
};

const OTHER_CATEGORY = "Otros";

const categoryName = (dish) =>
	(dish.categoria_nombre || dish.categoria || "").trim() || OTHER_CATEGORY;

function DishCard({ dish, inCart, adding, added, onAdd }) {
	return (
		<article className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-all duration-200 hover:-translate-y-1 hover:border-accent/30 hover:shadow-lg">
			<div className="relative h-36 overflow-hidden">
				<LazyImage
					src={dish.image}
					alt={dish.nombre}
					className="h-full w-full"
					imageClassName="transition-transform duration-500 group-hover:scale-105"
					fallback={
						<div
							className="flex h-full w-full items-center justify-center"
							style={{ backgroundImage: dish.gradient }}
						>
							<ChefHat className="size-12 text-white/50" />
						</div>
					}
				/>
				<span className="absolute top-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold text-neutral-900">
					{dish.etiqueta || "Nuevo"}
				</span>
				{inCart > 0 && (
					<span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-accent px-2 py-1 text-[10px] font-bold text-accent-foreground">
						<ShoppingCart className="size-3" />
						{inCart} en carrito
					</span>
				)}
			</div>
			<div className="flex flex-1 flex-col p-4">
				<div className="flex items-start justify-between gap-2">
					<h3 className="font-semibold text-foreground">{dish.nombre}</h3>
					{dish.rating ? (
						<span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-muted">
							<Star className="size-3 fill-warning text-warning" />
							{Number(dish.rating)}
						</span>
					) : null}
				</div>
				{dish.descripcion && (
					<p className="mt-1 line-clamp-2 text-xs text-muted">
						{dish.descripcion}
					</p>
				)}
				{dish.prep_minutes > 0 && (
					<p className="mt-2 inline-flex items-center gap-1 text-[11px] text-muted">
						<Clock className="size-3" />
						{dish.prep_minutes} min de preparación
					</p>
				)}
				<div className="mt-auto flex items-center justify-between gap-3 pt-4">
					<span className="font-semibold text-accent">
						{priceLabel(dish.precio)}
					</span>
					<button
						type="button"
						onClick={() => onAdd(dish)}
						disabled={adding}
						className="inline-flex items-center gap-1 rounded-lg bg-accent/10 px-2.5 py-1.5 text-xs font-semibold text-accent transition-colors hover:bg-accent hover:text-accent-foreground disabled:cursor-wait disabled:opacity-60"
					>
						<Plus className="size-3.5" />
						{added ? "Agregado" : adding ? "Agregando..." : "Agregar"}
					</button>
				</div>
			</div>
		</article>
	);
}

function StoreDetail() {
	const { id } = useParams();
	const { user, setIsOpen } = useStore();
	const { cart, count, fetchCart, addItem } = useCartStore();
	const [menu, setMenu] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [attempt, setAttempt] = useState(0);
	const [addingId, setAddingId] = useState(null);
	const [addedId, setAddedId] = useState(null);
	const [cartError, setCartError] = useState("");
	// La categoría activa se guarda junto al id para que al cambiar de tienda
	// el filtro vuelva a "Todos" sin necesidad de un efecto.
	const [filter, setFilter] = useState({ id, category: "Todos" });

	useEffect(() => {
		if (!user) return;
		fetchCart().catch(() => {});
	}, [user, fetchCart]);

	useEffect(() => {
		let active = true;

		getRestaurantMenu(id)
			.then((data) => {
				if (!active) return;
				setMenu(data);
				setError("");
			})
			.catch((requestError) => {
				if (!active) return;
				setError(
					getApiErrorMessage(
						requestError,
						"No pudimos cargar esta tienda. Intenta de nuevo.",
					),
				);
			})
			.finally(() => {
				if (active) setLoading(false);
			});

		return () => {
			active = false;
		};
	}, [id, attempt]);

	const store = menu?.restaurante;
	const dishes = menu?.platillos ?? [];
	const tags = Array.isArray(store?.tags) ? store.tags : [];

	// Agrupa por categoría respetando el orden en que aparecen los platillos y
	// deja "Otros" al final para los que no tienen categoría asignada.
	const categoryGroups = dishes.reduce((groups, dish) => {
		const name = categoryName(dish);
		const existing = groups.find((group) => group.name === name);
		if (existing) existing.dishes.push(dish);
		else groups.push({ name, dishes: [dish] });
		return groups;
	}, []);
	categoryGroups.sort(
		(a, b) =>
			Number(a.name === OTHER_CATEGORY) - Number(b.name === OTHER_CATEGORY),
	);

	const activeCategory =
		String(filter.id) === String(id) ? filter.category : "Todos";
	const visibleGroups =
		activeCategory === "Todos"
			? categoryGroups
			: categoryGroups.filter((group) => group.name === activeCategory);

	const chipClass = (active) =>
		`inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors ${
			active
				? "border-accent bg-accent text-accent-foreground"
				: "border-border bg-surface text-muted hover:border-accent/40 hover:text-accent"
		}`;

	const chipCountClass = (active) =>
		`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
			active ? "bg-white/20 text-accent-foreground" : "bg-default text-foreground"
		}`;

	const handleAddToCart = async (dish) => {
		if (!user) {
			setIsOpen(true);
			return;
		}
		setAddingId(dish.id);
		setCartError("");
		try {
			await addItem(dish.id, 1);
			setAddedId(dish.id);
			window.setTimeout(() => setAddedId(null), 1600);
		} catch (requestError) {
			setCartError(
				getApiErrorMessage(
					requestError,
					"No se pudo agregar el platillo al carrito",
				),
			);
		} finally {
			setAddingId(null);
		}
	};

	if (loading) {
		return (
			<section className="min-h-dvh w-full bg-background px-5 py-8 md:px-10 md:py-12">
				<div className="mx-auto w-full max-w-[1600px]">
					<div className="h-64 animate-pulse rounded-3xl bg-surface" />
					<p className="mt-6 text-sm text-muted">Cargando el menú...</p>
				</div>
			</section>
		);
	}

	if (!store) {
		return (
			<section className="min-h-dvh w-full bg-background px-5 py-8 md:px-10 md:py-12">
				<div className="mx-auto w-full max-w-[1600px]">
					<Link
						to="/home/tiendas"
						className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted transition-colors hover:text-accent"
					>
						<ArrowLeft className="size-4" />
						Volver a tiendas
					</Link>
					<div className="mt-8 flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface px-6 py-12 text-center">
						<ChefHat className="size-10 text-accent/50" />
						<h2 className="mt-4 text-xl font-semibold text-foreground">
							No pudimos abrir esta tienda
						</h2>
						<p className="mt-2 max-w-sm text-sm text-muted">
							{error || "Es posible que ya no esté disponible."}
						</p>
						<button
							type="button"
							onClick={() => {
								setLoading(true);
								setAttempt((value) => value + 1);
							}}
							className="mt-5 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground"
						>
							Reintentar
						</button>
					</div>
				</div>
			</section>
		);
	}

	return (
		<section className="min-h-dvh w-full bg-background px-5 py-8 md:px-10 md:py-12">
			<div className="mx-auto w-full max-w-[1600px]">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<Link
						to="/home/tiendas"
						className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted transition-colors hover:text-accent"
					>
						<ArrowLeft className="size-4" />
						Volver a tiendas
					</Link>
					<Link
						to="/home/carrito"
						className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:border-accent/40 hover:text-accent"
					>
						<ShoppingCart className="size-4 text-accent" />
						{count > 0
							? `${count} ${count === 1 ? "producto" : "productos"} en el carrito`
							: "Carrito vacío"}
					</Link>
				</div>

				<header className="relative mt-5 overflow-hidden rounded-3xl border border-border bg-surface">
					<div className="relative h-56 md:h-72">
						<LazyImage
							src={store.image}
							alt={store.nombre}
							className="h-full w-full"
							imageClassName="transition-transform duration-700 hover:scale-105"
							fallback={
								<div
									className="flex h-full w-full items-center justify-center"
									style={{ backgroundImage: store.gradient }}
								>
									<ChefHat className="size-28 text-white/25" />
								</div>
							}
						/>
						<div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-black/5" />
						<div className="absolute inset-x-0 bottom-0 p-5 md:p-8">
							{tags.length > 0 && (
								<div className="flex flex-wrap gap-2">
									{tags.map((tag) => (
										<span
											key={tag}
											className="rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-sm"
										>
											{tag}
										</span>
									))}
								</div>
							)}
							<h1 className="mt-2 font-advercase text-4xl leading-none text-white md:text-5xl">
								{store.nombre}
							</h1>
							<p className="mt-1 text-sm text-white/80">{store.tipo}</p>
							<div className="mt-3 flex flex-wrap items-center gap-4 text-xs font-medium text-white/90">
								{Number(store.rating) > 0 ? (
									<span className="inline-flex items-center gap-1">
										<Star className="size-3.5 fill-warning text-warning" />
										{store.rating}
										{store.rating_count ? ` (${store.rating_count})` : ""}
									</span>
								) : (
									<span className="inline-flex items-center gap-1">
										<Star className="size-3.5 text-white/60" />
										Sin calificaciones
									</span>
								)}
								<span className="inline-flex items-center gap-1">
									<Clock className="size-3.5" />
									{store.tiempo ??
										(store.delivery_max > 0
											? `${store.delivery_min}-${store.delivery_max} min`
											: "Tiempo por confirmar")}
								</span>
								<span className="inline-flex items-center gap-1">
									<Bike className="size-3.5" />
									{store.envio ??
										(store.free_shipping
											? "Envío gratis"
											: Number(store.shipping_cost) > 0
												? formatCOP(store.shipping_cost)
												: "Envío por confirmar")}
								</span>
							</div>
						</div>
					</div>
					{store.descripcion && (
						<p className="px-5 py-4 text-sm text-muted md:px-8">
							{store.descripcion}
						</p>
					)}
				</header>

				{cartError && (
					<p className="mt-5 rounded-xl border border-danger/30 bg-danger/10 px-4 py-2.5 text-sm text-danger">
						{cartError}
					</p>
				)}

				<div className="mt-8 flex flex-wrap items-end justify-between gap-3">
					<div>
						<p className="text-xs font-semibold tracking-[0.22em] text-muted uppercase">
							Menú
						</p>
						<h2 className="mt-1 text-2xl font-semibold text-foreground md:text-3xl">
							Platillos de {store.nombre}
						</h2>
					</div>
					<span className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-muted">
						{dishes.length} {dishes.length === 1 ? "platillo" : "platillos"}
					</span>
				</div>

				{categoryGroups.length > 1 && (
					<nav
						aria-label="Filtrar platillos por categoría"
						className="mt-5 flex gap-2 overflow-x-auto pb-1"
					>
						<button
							type="button"
							onClick={() => setFilter({ id, category: "Todos" })}
							aria-pressed={activeCategory === "Todos"}
							className={chipClass(activeCategory === "Todos")}
						>
							Todos
							<span className={chipCountClass(activeCategory === "Todos")}>
								{dishes.length}
							</span>
						</button>
						{categoryGroups.map((group) => (
							<button
								key={group.name}
								type="button"
								onClick={() => setFilter({ id, category: group.name })}
								aria-pressed={activeCategory === group.name}
								className={chipClass(activeCategory === group.name)}
							>
								{group.name}
								<span className={chipCountClass(activeCategory === group.name)}>
									{group.dishes.length}
								</span>
							</button>
						))}
					</nav>
				)}

				{dishes.length === 0 ? (
					<div className="mt-5 flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface px-6 py-12 text-center">
						<UtensilsCrossed className="size-10 text-accent/50" />
						<h3 className="mt-4 text-lg font-semibold text-foreground">
							Esta tienda aún no tiene platillos publicados
						</h3>
						<p className="mt-1 max-w-sm text-sm text-muted">
							Vuelve pronto o explora otras tiendas mientras tanto.
						</p>
						<Link
							to="/home/tiendas"
							className="mt-5 inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground"
						>
							Explorar tiendas
							<ArrowRight className="size-4" />
						</Link>
					</div>
				) : (
					<div className="mt-8 space-y-10">
						{visibleGroups.map((group) => (
							<section key={group.name} className="scroll-mt-28">
								<div className="flex flex-wrap items-center gap-3">
									<h3 className="text-xl font-semibold text-foreground md:text-2xl">
										{group.name}
									</h3>
									<span className="rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-semibold text-accent">
										{group.dishes.length}
									</span>
									<span className="h-px flex-1 bg-border" />
									<span className="text-xs text-muted">
										{group.dishes.length === 1
											? "1 platillo"
											: `${group.dishes.length} platillos`}
									</span>
								</div>
								<div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
									{group.dishes.map((dish) => (
										<DishCard
											key={dish.id}
											dish={dish}
											inCart={quantityInCart(cart, dish.id)}
											adding={addingId === dish.id}
											added={addedId === dish.id}
											onAdd={handleAddToCart}
										/>
									))}
								</div>
							</section>
						))}
					</div>
				)}
			</div>
		</section>
	);
}

export default StoreDetail;
