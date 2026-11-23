import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
	AlertTriangle,
	Bell,
	CalendarDays,
	ChefHat,
	Clock,
	Package,
	PackageCheck,
	PackageX,
	RefreshCw,
	Search,
	ShoppingBag,
	UserRound,
	X,
} from "lucide-react";
import { getApiErrorMessage, getStaffNotifications } from "../../../Api/clientApi";
import useNotificationStore from "../../../store/useNotificationStore";
import useStore from "../../../store/useStore";
import { formatDateTime } from "../../../utils/format";
import Dashboard from "../Dashboard";

const REFRESH_MS = 30000;

const TYPE_META = {
	no_disponible: {
		label: "No disponible",
		icon: PackageX,
		iconClass: "bg-danger/10 text-danger",
		chipClass: "bg-danger/10 text-danger",
	},
	agotado: {
		label: "Agotado",
		icon: AlertTriangle,
		iconClass: "bg-warning/10 text-warning",
		chipClass: "bg-warning/10 text-warning",
	},
	disponible: {
		label: "Disponible",
		icon: PackageCheck,
		iconClass: "bg-success/10 text-success",
		chipClass: "bg-success/10 text-success",
	},
	stock: {
		label: "Stock",
		icon: Package,
		iconClass: "bg-accent/10 text-accent",
		chipClass: "bg-accent/10 text-accent",
	},
	pedido: {
		label: "Nuevo pedido",
		icon: ShoppingBag,
		iconClass: "bg-accent/10 text-accent",
		chipClass: "bg-accent/10 text-accent",
	},
};

const FILTERS = [
	{ id: "todas", label: "Todas" },
	{ id: "pedido", label: "Pedidos" },
	{ id: "no_disponible", label: "No disponibles" },
	{ id: "agotado", label: "Agotados" },
	{ id: "disponible", label: "Disponibles" },
	{ id: "stock", label: "Stock" },
];

const DATE_FILTERS = [
	{ id: "hoy", label: "Hoy", days: 1 },
	{ id: "7d", label: "7 días", days: 7 },
	{ id: "30d", label: "30 días", days: 30 },
];

const startOfDay = (timestamp) => {
	const date = new Date(timestamp);
	date.setHours(0, 0, 0, 0);
	return date.getTime();
};

const relativeTime = (iso, reference) => {
	const then = new Date(iso).getTime();
	if (Number.isNaN(then) || !reference) return "";
	const minutes = Math.floor((reference - then) / 60000);
	if (minutes < 1) return "Ahora";
	if (minutes < 60) return `Hace ${minutes} min`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `Hace ${hours} h`;
	const days = Math.floor(hours / 24);
	if (days === 1) return "Ayer";
	if (days < 30) return `Hace ${days} días`;
	return new Intl.DateTimeFormat("es-CO", {
		day: "2-digit",
		month: "short",
	}).format(new Date(iso));
};

function Notifications() {
	const { user } = useStore();
	const markAllSeen = useNotificationStore((state) => state.markAllSeen);
	const [notifications, setNotifications] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [query, setQuery] = useState("");
	const [filter, setFilter] = useState("todas");
	const [dateFilter, setDateFilter] = useState("30d");
	const [lastUpdated, setLastUpdated] = useState(null);
	const [reloadKey, setReloadKey] = useState(0);

	useEffect(() => {
		let active = true;
		let inFlight = false;

		const load = () => {
			if (inFlight) return;
			inFlight = true;
			getStaffNotifications()
				.then((items) => {
					if (!active) return;
					setNotifications(items);
					setLastUpdated(new Date());
					setError("");
					markAllSeen(
						user?.id,
						items.map((item) => item.id),
					);
				})
				.catch((requestError) => {
					if (active) {
						setError(
							getApiErrorMessage(
								requestError,
								"No se pudieron cargar las notificaciones",
							),
						);
					}
				})
				.finally(() => {
					inFlight = false;
					if (active) setLoading(false);
				});
		};

		load();
		const interval = window.setInterval(load, REFRESH_MS);
		return () => {
			active = false;
			window.clearInterval(interval);
		};
	}, [reloadKey, user?.id, markAllSeen]);

	const refresh = () => {
		setLoading(true);
		setReloadKey((current) => current + 1);
	};

	const search = query.trim().toLowerCase();
	const reference = lastUpdated ? lastUpdated.getTime() : 0;
	const dateWindow =
		DATE_FILTERS.find((item) => item.id === dateFilter)?.days ?? 30;
	const rangeStart = reference
		? startOfDay(reference) - (dateWindow - 1) * 86400000
		: 0;
	const visible = notifications.filter((notification) => {
		const byType = filter === "todas" || notification.tipo === filter;
		const byDate =
			!rangeStart ||
			new Date(notification.created_at).getTime() >= rangeStart;
		const bySearch =
			!search ||
			[
				notification.mensaje,
				notification.actor_nombre,
				notification.dish_nombre,
				notification.tipo_label,
			]
				.join(" ")
				.toLowerCase()
				.includes(search);
		return byType && byDate && bySearch;
	});

	const updateTime = lastUpdated
		? new Intl.DateTimeFormat("es-CO", {
				hour: "2-digit",
				minute: "2-digit",
			}).format(lastUpdated)
		: "";

	return (
		<Dashboard
			title="Notificaciones"
			description="Revisa los pedidos nuevos y los cambios de disponibilidad y stock de tu tienda."
			icon={Bell}
			eyebrow="SIGR · Operación"
		>
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 0.3 }}
				className="space-y-6"
			>
				<motion.div
					initial={{ opacity: 0, y: -8 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.35, ease: "easeOut" }}
					className="flex flex-wrap items-center justify-between gap-3"
				>
					<div className="flex flex-wrap items-center gap-2">
						<span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-xs font-medium text-muted">
							<Bell className="size-4 text-accent" />
							{user?.restaurante?.nombre ?? "Tu tienda"}
						</span>
						{updateTime && (
							<span className="rounded-full border border-border bg-surface px-3 py-2 text-xs text-muted">
								Actualizado {updateTime}
							</span>
						)}
					</div>
					<button
						type="button"
						onClick={refresh}
						disabled={loading}
						className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-muted transition-colors hover:border-accent/40 hover:text-accent disabled:opacity-60"
					>
						<RefreshCw
							className={`size-3.5 ${loading ? "animate-spin" : ""}`}
						/>
						Actualizar
					</button>
				</motion.div>

				<motion.div
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.3, delay: 0.05, ease: "easeOut" }}
					className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl border border-border bg-surface px-4 py-3"
				>
					<span className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.14em] text-muted uppercase">
						<CalendarDays className="size-4 text-accent" />
						Filtrar por fecha
					</span>
					<div className="flex flex-wrap gap-1">
						{DATE_FILTERS.map(({ id, label }) => (
							<button
								key={id}
								type="button"
								aria-pressed={dateFilter === id}
								onClick={() => setDateFilter(id)}
								className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
									dateFilter === id
										? "bg-accent text-accent-foreground"
										: "bg-default text-muted hover:text-foreground"
								}`}
							>
								{label}
							</button>
						))}
					</div>
					<span className="ml-auto text-xs text-muted">
						{visible.length} de {notifications.length} avisos
					</span>
				</motion.div>

				{error && (
					<div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
						<span>{error}</span>
						<button
							type="button"
							onClick={refresh}
							disabled={loading}
							className="inline-flex items-center gap-1.5 rounded-lg bg-danger/10 px-2.5 py-1.5 text-xs font-semibold transition-colors hover:bg-danger/20 disabled:opacity-60"
						>
							<RefreshCw
								className={`size-3.5 ${loading ? "animate-spin" : ""}`}
							/>
							Reintentar
						</button>
					</div>
				)}

				<motion.div
					initial={{ opacity: 0, y: 12 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.35, delay: 0.12, ease: "easeOut" }}
					className="min-w-0 overflow-hidden rounded-2xl border border-border bg-surface"
				>
					<div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
						<label className="relative min-w-56 flex-1">
							<Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
							<span className="sr-only">Buscar notificaciones</span>
							<input
								value={query}
								onChange={(event) => setQuery(event.target.value)}
								placeholder="Buscar por plato, empleado o mensaje"
								className="w-full rounded-xl border border-border bg-background py-2 pr-10 pl-9 text-sm text-foreground outline-none focus:border-accent"
							/>
							{query && (
								<button
									type="button"
									onClick={() => setQuery("")}
									aria-label="Limpiar búsqueda"
									className="absolute top-1/2 right-2 -translate-y-1/2 rounded-lg p-1.5 text-muted transition-colors hover:bg-default hover:text-foreground"
								>
									<X className="size-3.5" />
								</button>
							)}
						</label>
						<div className="flex flex-wrap gap-1">
							{FILTERS.map(({ id, label }) => (
								<button
									key={id}
									type="button"
									aria-pressed={filter === id}
									onClick={() => setFilter(id)}
									className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
										filter === id
											? "bg-accent text-accent-foreground"
											: "bg-default text-muted hover:text-foreground"
									}`}
								>
									{label}
								</button>
							))}
						</div>
					</div>

					{loading && notifications.length === 0 ? (
						<div className="space-y-3 p-5">
							{[0, 1, 2, 3].map((item) => (
								<div
									key={item}
									className="flex animate-pulse items-center gap-3"
								>
									<div className="size-10 rounded-xl bg-default" />
									<div className="flex-1 space-y-2">
										<div className="h-3 w-2/3 rounded bg-default" />
										<div className="h-2.5 w-1/3 rounded bg-default" />
									</div>
								</div>
							))}
						</div>
					) : visible.length === 0 ? (
						<div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
							<span className="flex size-14 items-center justify-center rounded-full bg-accent/10 text-accent">
								<Bell className="size-7" />
							</span>
							<h2 className="mt-4 text-lg font-semibold text-foreground">
								No hay notificaciones para mostrar
							</h2>
							<p className="mt-2 max-w-sm text-sm text-muted">
								{notifications.length === 0
									? "Cuando entre un pedido nuevo o alguien del equipo cambie la disponibilidad o el stock de un plato, el aviso aparecerá aquí."
									: "Prueba otra búsqueda o cambia los filtros."}
							</p>
						</div>
					) : (
						<ul className="divide-y divide-border">
							<AnimatePresence initial={false}>
								{visible.map((notification) => {
									const meta =
										TYPE_META[notification.tipo] ??
										TYPE_META.no_disponible;
									const Icon = meta.icon;
									return (
										<motion.li
											key={notification.id}
											layout
											initial={{ opacity: 0, y: 8 }}
											animate={{ opacity: 1, y: 0 }}
											exit={{ opacity: 0, y: -6 }}
											transition={{ duration: 0.22 }}
											className="flex items-start gap-3 px-5 py-4"
										>
											<span
												className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${meta.iconClass}`}
											>
												<Icon className="size-5" />
											</span>
											<div className="min-w-0 flex-1">
												<div className="flex flex-wrap items-center gap-2">
													<p className="text-sm font-medium text-foreground">
														{notification.mensaje}
													</p>
													<span
														className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${meta.chipClass}`}
													>
														{meta.label}
													</span>
												</div>
												<div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
													<span className="inline-flex items-center gap-1">
														<UserRound className="size-3.5" />
														{notification.actor_nombre}
													</span>
													{notification.dish_nombre && (
														<span className="inline-flex items-center gap-1">
															<ChefHat className="size-3.5" />
															{notification.dish_nombre}
														</span>
													)}
													<span
														className="inline-flex items-center gap-1"
														title={formatDateTime(
															notification.created_at,
														)}
													>
														<Clock className="size-3.5" />
														{relativeTime(
															notification.created_at,
															reference,
														)}
													</span>
												</div>
											</div>
										</motion.li>
									);
								})}
							</AnimatePresence>
						</ul>
					)}

					<div className="border-t border-border px-5 py-3 text-center text-[11px] text-muted">
						Se conservan los últimos 30 días. Si se superan los 100 avisos,
						se elimina el más antiguo.
					</div>
				</motion.div>
			</motion.div>
		</Dashboard>
	);
}

export default Notifications;
