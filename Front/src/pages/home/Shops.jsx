import { useState } from "react";
import { motion } from "motion/react";
import { Bike, Clock, Search, SlidersHorizontal, Star } from "lucide-react";
import LazyImage from "../../components/globals/LazyImage";
import { CATEGORIES, STORES } from "./data";

const normalize = (value = "") => value.trim().toLowerCase();

function Shops() {
	const [query, setQuery] = useState("");
	const [category, setCategory] = useState("Todos");
	const search = normalize(query);

	const filtered = STORES.filter((store) => {
		const byCategory = category === "Todos" || store.tags.includes(category);
		const bySearch =
			!search ||
			normalize([store.nombre, store.tipo, ...store.tags].join(" ")).includes(
				search,
			);
		return byCategory && bySearch;
	});

	return (
		<section className="min-h-dvh w-full bg-background px-5 py-8 md:px-10 md:py-12">
			<div className="mx-auto w-full max-w-[1600px]">
				<motion.header
					initial={{ opacity: 0, y: 12 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.35, ease: "easeOut" }}
				>
					<p className="text-xs font-semibold tracking-[0.22em] text-muted uppercase">
						Cliente · Tiendas
					</p>
					<h1 className="mt-3 font-advercase text-4xl text-foreground md:text-5xl">
						Encuentra tu próxima tienda
					</h1>
					<p className="mt-2 max-w-xl text-sm text-muted">
						Explora los restaurantes disponibles, compara tiempos de entrega y
						elige dónde pedir hoy.
					</p>
				</motion.header>

				<div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center">
					<div className="flex flex-1 items-center gap-3 rounded-xl border border-border bg-surface px-4 py-2.5 focus-within:border-accent/40">
						<Search className="size-4 shrink-0 text-muted" />
						<input
							type="search"
							value={query}
							onChange={(event) => setQuery(event.target.value)}
							placeholder="Buscar por nombre o tipo de comida..."
							aria-label="Buscar tiendas"
							className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted"
						/>
					</div>
					<div className="flex items-center gap-2 overflow-x-auto pb-1">
						<SlidersHorizontal className="size-4 shrink-0 text-muted" />
						{CATEGORIES.filter((item) => item.name !== "Todos").map((item) => (
							<button
								key={item.name}
								type="button"
								onClick={() =>
									setCategory((current) =>
										current === item.name ? "Todos" : item.name,
									)
								}
								aria-pressed={category === item.name}
								className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
									category === item.name
										? "border-accent bg-accent text-accent-foreground"
										: "border-border bg-surface text-muted hover:border-accent/30 hover:text-foreground"
								}`}
							>
								{item.name}
							</button>
						))}
					</div>
				</div>

				<p className="mt-6 text-xs font-medium text-muted">
					{filtered.length} {filtered.length === 1 ? "tienda" : "tiendas"}{" "}
					disponibles
				</p>

				<div className="mt-3 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
					{filtered.map((store) => {
						const Icon = store.icon;
						return (
							<article
								key={store.id}
								className="flex flex-col gap-4 p-4 transition-colors hover:bg-default/40 sm:flex-row sm:items-center"
							>
								<div className="size-20 shrink-0 overflow-hidden rounded-xl">
									<LazyImage
										src={store.image}
										alt={store.nombre}
										className="h-full w-full"
										fallback={
											<div
												className={`flex h-full w-full items-center justify-center bg-linear-to-br ${store.gradient}`}
											>
												<Icon className="size-8 text-white/80" />
											</div>
										}
									/>
								</div>
								<div className="min-w-0 flex-1">
									<div className="flex flex-wrap items-center gap-2">
										<h2 className="font-semibold text-foreground">
											{store.nombre}
										</h2>
										<span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent">
											{store.tags[0]}
										</span>
									</div>
									<p className="mt-0.5 text-sm text-muted">{store.tipo}</p>
									<div className="mt-2 flex flex-wrap gap-1.5">
										{store.tags.slice(1).map((tag) => (
											<span
												key={tag}
												className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted"
											>
												{tag}
											</span>
										))}
									</div>
								</div>
								<div className="flex items-center gap-4 text-xs text-muted sm:flex-col sm:items-end sm:gap-1.5">
									<span className="inline-flex items-center gap-1 font-semibold text-foreground">
										<Star className="size-3.5 fill-warning text-warning" />
										{store.rating}
									</span>
									<span className="inline-flex items-center gap-1">
										<Clock className="size-3.5" />
										{store.tiempo}
									</span>
									<span className="inline-flex items-center gap-1">
										<Bike className="size-3.5" />
										{store.envio}
									</span>
								</div>
							</article>
						);
					})}
				</div>

				{filtered.length === 0 && (
					<div className="mt-3 flex min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface px-6 py-10 text-center">
						<Search className="size-9 text-accent/50" />
						<p className="mt-3 font-semibold text-foreground">
							No hay tiendas para ese filtro
						</p>
						<button
							type="button"
							onClick={() => {
								setQuery("");
								setCategory("Todos");
							}}
							className="mt-4 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground"
						>
							Ver todas las tiendas
						</button>
					</div>
				)}
			</div>
		</section>
	);
}

export default Shops;
