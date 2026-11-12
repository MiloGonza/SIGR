import { useEffect, useState, useSyncExternalStore } from "react";
import { Link } from "react-router";
import {
	ArrowRight,
	Bike,
	CalendarDays,
	Check,
	ClipboardList,
	Clock,
	MapPin,
	Store,
	Timer,
} from "lucide-react";
import { getApiErrorMessage, getOrders } from "../../Api/clientApi";
import useStore from "../../store/useStore";
import { formatCOP } from "../../utils/format";

const CLOCK_TICK_MS = 1000;
const ORDERS_REFRESH_MS = 30000;

const TIME_FORMAT = new Intl.DateTimeFormat("es-CO", {
	hour: "numeric",
	minute: "2-digit",
});

const DATE_FORMAT = new Intl.DateTimeFormat("es-CO", {
	day: "numeric",
	month: "short",
});

const STATUS = {
	pendiente: {
		label: "Pendiente",
		icon: Clock,
		className: "bg-default text-muted",
	},
	confirmado: {
		label: "Confirmado",
		icon: Check,
		className: "bg-success/10 text-success",
	},
	preparando: {
		label: "En preparación",
		icon: Clock,
		className: "bg-warning/10 text-warning",
	},
	en_camino: {
		label: "En camino",
		icon: Bike,
		className: "bg-accent/10 text-accent",
	},
	entregado: {
		label: "Entregado",
		icon: Check,
		className: "bg-success/10 text-success",
	},
	cancelado: {
		label: "Cancelado",
		icon: Clock,
		className: "bg-danger/10 text-danger",
	},
};

const mapOrder = (order) => ({
	id: order.numero,
	tienda: order.tienda,
	acceptedAt: new Date(order.accepted_at || order.created_at).getTime(),
	prepMinutes: order.prep_minutes || 0,
	estado: order.estado,
	estadoLabel: order.estado_label,
	total: formatCOP(order.total),
	entrega: order.direccion_entrega,
	detalles: (order.items ?? []).map((item) => ({
		nombre: item.nombre,
		cantidad: item.cantidad,
		precio: formatCOP(item.precio_unitario),
		prepMinutes: item.prep_minutes,
	})),
});

function subscribeToClock(callback) {
	const id = window.setInterval(callback, CLOCK_TICK_MS);
	return () => window.clearInterval(id);
}

function getClockSnapshot() {
	return Math.floor(Date.now() / CLOCK_TICK_MS);
}

function useNow() {
	return (
		useSyncExternalStore(
			subscribeToClock,
			getClockSnapshot,
			getClockSnapshot,
		) * CLOCK_TICK_MS
	);
}

function getPrepTiming(order, now) {
	const totalMs = order.prepMinutes * 60_000;
	const readyAt = order.acceptedAt + totalMs;
	const remainingMs = Math.max(0, readyAt - now);
	const progress =
		totalMs === 0
			? 1
			: Math.min(1, Math.max(0, (now - order.acceptedAt) / totalMs));

	return { readyAt, remainingMs, progress, done: remainingMs === 0 };
}

function formatCountdown(ms) {
	const totalSeconds = Math.ceil(ms / 1000);
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;

	return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function getDayStart(date) {
	return new Date(
		date.getFullYear(),
		date.getMonth(),
		date.getDate(),
	).getTime();
}

function formatOrderDate(timestamp, now) {
	const date = new Date(timestamp);
	const dayDiff = Math.round(
		(getDayStart(new Date(now)) - getDayStart(date)) / 86_400_000,
	);
	const prefix =
		dayDiff === 0 ? "Hoy" : dayDiff === 1 ? "Ayer" : DATE_FORMAT.format(date);

	return `${prefix}, ${TIME_FORMAT.format(date)}`;
}

function Orders() {
	const now = useNow();
	const { user } = useStore();
	const [orders, setOrders] = useState([]);
	const [loading, setLoading] = useState(Boolean(user));
	const [error, setError] = useState("");

	useEffect(() => {
		let active = true;

		if (!user) {
			return undefined;
		}

		const load = async () => {
			try {
				const data = await getOrders({ activos: 1 });
				if (active) {
					setOrders(data.map(mapOrder));
					setError("");
				}
			} catch (requestError) {
				if (active) {
					setError(
						getApiErrorMessage(
							requestError,
							"No se pudieron cargar tus pedidos",
						),
					);
				}
			} finally {
				if (active) setLoading(false);
			}
		};

		load();
		const interval = window.setInterval(load, ORDERS_REFRESH_MS);
		return () => {
			active = false;
			window.clearInterval(interval);
		};
	}, [user]);

	return (
		<section className="min-h-dvh w-full bg-background px-5 py-8 md:px-10 md:py-12">
			<div className="mx-auto w-full max-w-[1600px]">
				<header className="flex flex-wrap items-end justify-between gap-4">
					<div>
						<p className="text-xs font-semibold tracking-[0.22em] text-muted uppercase">
							Cliente · Pedidos
						</p>
						<h1 className="mt-3 font-advercase text-4xl text-foreground md:text-5xl">
							Pedidos en curso
						</h1>
						<p className="mt-2 max-w-xl text-sm text-muted">
							Sigue el estado de tus pedidos en tiempo real, desde la confirmación
							hasta la entrega.
						</p>
					</div>
					<span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-xs font-medium text-muted">
						<ClipboardList className="size-4 text-accent" />
						{orders.length} pedidos activos
					</span>
				</header>

				{error && (
					<p className="mt-6 rounded-xl border border-danger/30 bg-danger/10 px-4 py-2.5 text-sm text-danger">
						{error}
					</p>
				)}

				{loading ? (
					<p className="mt-8 text-sm text-muted">Cargando tus pedidos...</p>
				) : orders.length > 0 ? (
					<>
						<div className="mt-8 space-y-4">
							{orders.map((order) => {
								const status = STATUS[order.estado] ?? STATUS.confirmado;
								const StatusIcon = status.icon;
								const isPreparing = ["confirmado", "preparando"].includes(
									order.estado,
								);
								const timing = getPrepTiming(order, now);

								return (
									<article
										key={order.id}
										className="overflow-hidden rounded-2xl border border-border bg-surface"
									>
										<div className="flex flex-wrap items-start justify-between gap-4 border-b border-border p-5">
											<div className="flex items-start gap-3">
												<span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
													<Store className="size-5" />
												</span>
												<div>
													<p className="text-[11px] font-semibold tracking-[0.16em] text-muted uppercase">
														Pedido {order.id}
													</p>
													<h2 className="mt-1 text-lg font-semibold text-foreground">
														{order.tienda}
													</h2>
													<p className="mt-1 inline-flex items-center gap-1.5 text-xs text-muted">
														<CalendarDays className="size-3.5" />
														{formatOrderDate(order.acceptedAt, now)}
													</p>
												</div>
											</div>
											<div className="flex flex-col items-end gap-2">
												<span
													className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}
												>
													<StatusIcon className="size-3.5" />
													{order.estadoLabel || status.label}
												</span>
												<span className="inline-flex items-center gap-1.5 text-xs text-muted">
													<Timer className="size-3.5" />
													Preparación estimada: {order.prepMinutes} min
												</span>
											</div>
										</div>

										<div className="p-5">
											<ul className="divide-y divide-border">
												{order.detalles.map((detail) => (
													<li
														key={`${order.id}-${detail.nombre}`}
														className="flex items-center justify-between gap-4 py-2.5 text-sm"
													>
														<span className="flex min-w-0 items-center gap-2">
															<span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-default text-[11px] font-semibold text-muted">
																{detail.cantidad}x
															</span>
															<span className="min-w-0">
																<span className="block truncate text-foreground">
																	{detail.nombre}
																</span>
																<span className="block text-[11px] text-muted">
																	{detail.prepMinutes} min de preparación
																</span>
															</span>
														</span>
														<span className="shrink-0 font-medium text-foreground">
															{detail.precio}
														</span>
													</li>
												))}
											</ul>

											{isPreparing && (
												<div
													className={`mt-4 rounded-xl border p-4 ${
														timing.done
															? "border-success/20 bg-success/5"
															: "border-warning/20 bg-warning/5"
													}`}
												>
													<div className="flex flex-wrap items-end justify-between gap-3">
														<div>
															<p className="text-[11px] font-semibold tracking-[0.14em] text-muted uppercase">
																{timing.done
																	? "Preparación completada"
																	: "Tiempo de preparación restante"}
															</p>
															<p
																className={`mt-1 font-mono text-3xl font-semibold tabular-nums ${
																	timing.done
																		? "text-success"
																		: "text-warning"
																}`}
															>
																{timing.done
																	? "Preparado"
																	: formatCountdown(timing.remainingMs)}
															</p>
														</div>
														<div className="text-right text-xs text-muted">
															<p>
																{timing.done
																	? "Estuvo listo a las"
																	: "Listo aprox. a las"}
															</p>
															<p className="mt-0.5 font-medium text-foreground">
																{TIME_FORMAT.format(timing.readyAt)}
															</p>
														</div>
													</div>
													<div
														className={`mt-3 h-1.5 overflow-hidden rounded-full ${
															timing.done ? "bg-success/15" : "bg-warning/15"
														}`}
													>
														<div
															className={`h-full rounded-full transition-[width] duration-1000 ease-linear ${
																timing.done ? "bg-success" : "bg-warning"
															}`}
															style={{ width: `${timing.progress * 100}%` }}
														/>
													</div>
												</div>
											)}

											<div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
												<span className="inline-flex items-center gap-1.5 text-xs text-muted">
													<MapPin className="size-3.5" />
													{order.entrega}
												</span>
												<div className="flex items-baseline gap-2">
													<span className="text-xs text-muted">Total</span>
													<span className="text-lg font-semibold text-accent">
														{order.total}
													</span>
												</div>
											</div>
										</div>
									</article>
								);
							})}
						</div>

						<div className="mt-6 flex justify-center">
							<Link
								to="/home/tiendas"
								className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground transition-transform hover:scale-[1.02]"
							>
								Hacer un pedido
								<ArrowRight className="size-4" />
							</Link>
						</div>
					</>
				) : (
					<>
						<div className="mt-8 flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface px-6 py-12 text-center">
							<span className="flex size-16 items-center justify-center rounded-full bg-accent/10 text-accent">
								<ClipboardList className="size-8" />
							</span>
							<h2 className="mt-5 text-xl font-semibold text-foreground">
								No tienes pedidos activos
							</h2>
							<p className="mt-2 max-w-sm text-sm text-muted">
								Cuando hagas un pedido, aquí verás su estado, sus detalles y su
								fecha de entrega.
							</p>
						</div>

						<div className="mt-6 flex justify-center">
							<Link
								to="/home/tiendas"
								className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground transition-transform hover:scale-[1.02]"
							>
								Hacer un pedido
								<ArrowRight className="size-4" />
							</Link>
						</div>
					</>
				)}
			</div>
		</section>
	);
}

export default Orders;
