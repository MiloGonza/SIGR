import { useState } from "react";
import { motion } from "motion/react";
import { Link } from "react-router";
import {
	ArrowRight,
	Bike,
	ChefHat,
	Clock,
	MapPin,
	Search,
	Sparkles,
	Star,
	X,
} from "lucide-react";
import useStore from "../../store/useStore";
import dishCurry from "../../assets/dish-curry.jpg";
import LazyImage from "../../components/globals/LazyImage";
import { CATEGORIES, DISHES, STORES } from "./data";

const normalize = (value = "") => value.trim().toLowerCase();

function SectionHeading({ title, action }) {
	return (
		<div className="flex items-end justify-between gap-4">
			<h2 className="text-2xl font-semibold text-foreground md:text-3xl">
				{title}
			</h2>
			{action}
		</div>
	);
}

function Home() {
	const { user } = useStore();
	const [query, setQuery] = useState("");
	const [category, setCategory] = useState("Todos");

	const search = normalize(query);
	const isExploring = !search && category === "Todos";
	const firstName = user?.username?.trim().split(/\s+/)[0] ?? "vecino";

	const visibleStores = STORES.filter((store) => {
		const byCategory = category === "Todos" || store.tags.includes(category);
		const bySearch =
			!search ||
			normalize([store.nombre, store.tipo, ...store.tags].join(" ")).includes(
				search,
			);
		return byCategory && bySearch;
	});

	const visibleDishes = DISHES.filter((dish) => {
		const byCategory = category === "Todos" || dish.categoria === category;
		const bySearch =
			!search ||
			normalize([dish.nombre, dish.tienda, dish.etiqueta].join(" ")).includes(
				search,
			);
		return byCategory && bySearch;
	});

	const hasResults = visibleStores.length > 0 || visibleDishes.length > 0;

	return (
		<section className="min-h-dvh w-full bg-background px-5 py-8 md:px-10 md:py-10">
			<div className="mx-auto w-full max-w-[1600px]">
				<header className="flex flex-wrap items-end justify-between gap-4">
					<div>
						<p className="text-sm font-medium text-muted">
							Hola, {firstName}
						</p>
						<h1 className="mt-1 font-advercase text-4xl leading-none text-foreground md:text-5xl">
							¿Qué se te antoja hoy?
						</h1>
					</div>
					<span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-xs font-medium text-muted">
						<MapPin className="size-4 text-accent" />
						Entregar en casa
					</span>
				</header>

				<div className="mt-6 flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3 shadow-sm transition-colors focus-within:border-accent/40">
					<Search className="size-5 shrink-0 text-muted" />
					<input
						type="search"
						value={query}
						onChange={(event) => setQuery(event.target.value)}
						placeholder="Busca tiendas, platillos o antojos..."
						aria-label="Buscar tiendas y platillos"
						className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted"
					/>
					{query && (
						<button
							type="button"
							onClick={() => setQuery("")}
							aria-label="Limpiar búsqueda"
							className="rounded-full p-1 text-muted transition-colors hover:bg-default hover:text-foreground"
						>
							<X className="size-4" />
						</button>
					)}
				</div>

				<div className="mt-5 flex gap-2 overflow-x-auto pb-1">
					{CATEGORIES.map((item) => {
						const Icon = item.icon;
						const active = category === item.name;
						return (
							<button
								key={item.name}
								type="button"
								onClick={() => setCategory(item.name)}
								aria-pressed={active}
								className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition-colors ${
									active
										? "border-accent bg-accent text-accent-foreground"
										: "border-border bg-surface text-muted hover:border-accent/30 hover:text-foreground"
								}`}
							>
								<Icon className="size-4" />
								{item.name}
							</button>
						);
					})}
				</div>

				{isExploring && (
					<motion.div
						initial={{ opacity: 0, y: 14 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.4, ease: "easeOut" }}
						className="relative mt-6 overflow-hidden rounded-3xl bg-accent text-accent-foreground"
					>
						<div className="absolute inset-y-0 right-0 hidden w-1/2 md:block">
							<LazyImage
								src={dishCurry}
								alt=""
								className="h-full w-full"
								fallback={
									<div className="flex h-full w-full items-center justify-center bg-linear-to-br from-accent/40 to-black/30">
										<ChefHat className="size-32 text-white/15" />
									</div>
								}
							/>
							<div className="absolute inset-0 bg-linear-to-r from-accent via-accent/70 to-transparent" />
						</div>
						<div className="relative z-10 max-w-xl px-6 py-10 md:px-10 md:py-14">
							<span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold tracking-[0.18em] uppercase">
								<Sparkles className="size-3.5" />
								Bienvenido a Punto y Sazón
							</span>
							<h2 className="mt-4 font-advercase text-4xl leading-[1.05] md:text-5xl">
								Comida rica,
								<br />
								cerca de ti.
							</h2>
							<p className="mt-3 max-w-md text-sm text-white/80">
								Explora tiendas, descubre platillos y pide lo que se te antoje.
								Todo desde un solo lugar.
							</p>
							<div className="mt-6 flex flex-wrap gap-3">
								<Link
									to="/home/tiendas"
									className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-accent transition-transform hover:scale-[1.02]"
								>
									Explorar tiendas
									<ArrowRight className="size-4" />
								</Link>
								<Link
									to="/home/pedidos"
									className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
								>
									Ver mis pedidos
								</Link>
							</div>
						</div>
					</motion.div>
				)}

				{!hasResults ? (
					<div className="mt-10 flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface px-6 py-12 text-center">
						<Search className="size-10 text-accent/50" />
						<h2 className="mt-4 text-lg font-semibold text-foreground">
							No encontramos antojos con esa búsqueda
						</h2>
						<p className="mt-1 max-w-sm text-sm text-muted">
							Prueba con otra palabra o explora todas las categorías.
						</p>
						<button
							type="button"
							onClick={() => {
								setQuery("");
								setCategory("Todos");
							}}
							className="mt-5 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground"
						>
							Limpiar filtros
						</button>
					</div>
				) : (
					<>
						{visibleStores.length > 0 && (
							<div className="mt-10">
								<SectionHeading
									title={isExploring ? "Tiendas cerca de ti" : "Tiendas encontradas"}
									action={
										<Link
											to="/home/tiendas"
											className="inline-flex items-center gap-1 text-sm font-semibold text-accent hover:underline"
										>
											Ver todas
											<ArrowRight className="size-4" />
										</Link>
									}
								/>
								<div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
									{visibleStores.map((store) => {
										const Icon = store.icon;
										return (
											<article
												key={store.id}
												className="group overflow-hidden rounded-2xl border border-border bg-surface transition-all duration-200 hover:-translate-y-1 hover:border-accent/30 hover:shadow-lg"
											>
												<div className="relative h-32">
													<LazyImage
														src={store.image}
														alt={store.nombre}
														className="h-full w-full"
														imageClassName="transition-transform duration-500 group-hover:scale-105"
														fallback={
															<div
																className={`flex h-full w-full items-center justify-center bg-linear-to-br ${store.gradient}`}
															>
																<Icon className="size-20 text-white/25" />
															</div>
														}
													/>
													<div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/50 via-black/5 to-transparent" />
													<span className="absolute top-3 left-3 rounded-full bg-black/25 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">
														{store.tags[0]}
													</span>
													<span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[10px] font-bold text-foreground">
														<Star className="size-3 fill-warning text-warning" />
														{store.rating}
													</span>
												</div>
												<div className="p-4">
													<h3 className="font-semibold text-foreground">
														{store.nombre}
													</h3>
													<p className="mt-0.5 text-xs text-muted">{store.tipo}</p>
													<div className="mt-3 flex items-center gap-3 text-[11px] text-muted">
														<span className="inline-flex items-center gap-1">
															<Clock className="size-3.5" />
															{store.tiempo}
														</span>
														<span className="inline-flex items-center gap-1">
															<Bike className="size-3.5" />
															{store.envio}
														</span>
													</div>
												</div>
											</article>
										);
									})}
								</div>
							</div>
						)}

						{visibleDishes.length > 0 && (
							<div className="mt-10">
								<SectionHeading
									title={
										isExploring
											? "Platillos que te pueden gustar"
											: "Platillos encontrados"
									}
								/>
								<div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
									{visibleDishes.map((dish) => {
										const Icon = dish.icon;
										return (
											<article
												key={dish.id}
												className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-all duration-200 hover:-translate-y-1 hover:border-accent/30 hover:shadow-lg"
											>
												<div className="relative h-36 overflow-hidden">
													<LazyImage
														src={dish.image}
														alt={dish.nombre}
														className="h-full w-full"
														imageClassName="transition-transform duration-500 group-hover:scale-105"
														fallback={
															<div
																className={`flex h-full w-full items-center justify-center bg-linear-to-br ${dish.gradient}`}
															>
																<Icon className="size-12 text-white/50" />
															</div>
														}
													/>
													<span className="absolute top-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold text-foreground">
														{dish.etiqueta}
													</span>
												</div>
												<div className="flex flex-1 flex-col p-4">
													<div className="flex items-start justify-between gap-2">
														<h3 className="font-semibold text-foreground">
															{dish.nombre}
														</h3>
														<span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-muted">
															<Star className="size-3 fill-warning text-warning" />
															{dish.rating}
														</span>
													</div>
													<p className="mt-0.5 text-xs text-muted">
														{dish.tienda}
													</p>
													<div className="mt-auto flex items-center justify-between gap-3 pt-4">
														<span className="font-semibold text-accent">
															{dish.precio}
														</span>
														<Link
															to="/home/tiendas"
															className="inline-flex items-center gap-1 text-xs font-semibold text-foreground hover:text-accent"
														>
															Ver menú
															<ArrowRight className="size-3.5" />
														</Link>
													</div>
												</div>
											</article>
										);
									})}
								</div>
							</div>
						)}
					</>
				)}
			</div>
		</section>
	);
}

export default Home;
