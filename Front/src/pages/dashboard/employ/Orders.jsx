import { useEffect, useState, useSyncExternalStore } from "react";
import { Tooltip } from "@heroui/react";
import { AnimatePresence, motion } from "motion/react";
import {
	Bike,
	Check,
	ClipboardList,
	Clock,
	CookingPot,
	MapPin,
	PackageCheck,
	RefreshCw,
	Search,
	ShoppingBag,
	Store,
	Table2,
	Timer,
	UserRound,
	X,
	XCircle,
} from "lucide-react";
import {
	getApiErrorMessage,
	getStaffOrders,
	updateOrderStatus,
} from "../../../Api/clientApi";
import useStore from "../../../store/useStore";
import { formatCOP } from "../../../utils/format";
import Dashboard from "../Dashboard";

const ORDERS_REFRESH_MS = 20000;
const FEEDBACK_VISIBLE_MS = 4500;
const CLOCK_TICK_MS = 1000;

const TIME_FORMAT = new Intl.DateTimeFormat("es-CO", {
	hour: "numeric",
	minute: "2-digit",
});

const DATE_FORMAT = new Intl.DateTimeFormat("es-CO", {
	day: "numeric",
	month: "short",
});

const TYPE_META = {
	mesa: {
		label: "En mesa",
		icon: Table2,
		className: "bg-accent/10 text-accent",
	},
	domicilio: {
		label: "Domicilio",
		icon: Bike,
		className: "bg-warning/10 text-warning",
	},
	llevar: {
		label: "Para llevar",
		icon: ShoppingBag,
		className: "bg-success/10 text-success",
	},
};

const STATUS_META = {
	pendiente: {
		label: "Pendiente",
		className: "bg-warning/15 text-warning",
	},
	confirmado: {
		label: "Confirmado",
		className: "bg-success/10 text-success",
	},
	preparando: {
		label: "En preparación",
		className: "bg-warning/10 text-warning",
	},
	en_camino: {
		label: "En camino",
		className: "bg-accent/10 text-accent",
	},
	entregado: {
		label: "Entregado",
		className: "bg-success/10 text-success",
	},
	cancelado: {
		label: "Cancelado",
		className: "bg-danger/10 text-danger",
	},
};

const TYPE_FILTERS = [
	{ id: "todos", label: "Todos", icon: ClipboardList },
	...Object.entries(TYPE_META).map(([id, meta]) => ({
		id,
		label: meta.label,
		icon: meta.icon,
	})),
];

const LANES = [
	{
		id: "por_aceptar",
		title: "Por aceptar",
		hint: "Pedidos nuevos",
		icon: Clock,
		states: ["pendiente", "confirmado"],
		className: "bg-warning/10 text-warning",
	},
	{
		id: "preparando",
		title: "En preparación",
		hint: "En cocina",
		icon: CookingPot,
		states: ["preparando"],
		className: "bg-accent/10 text-accent",
	},
	{
		id: "listos",
		title: "En camino",
		hint: "Listos para entregar",
		icon: Bike,
		states: ["en_camino"],
		className: "bg-success/10 text-success",
	},
];

const mapOrder = (order) => {
	const createdAt = new Date(order.created_at).getTime();
	const acceptedAt = order.accepted_at
		? new Date(order.accepted_at).getTime()
		: null;
	const prepMinutes = Number(order.prep_minutes) || 0;

	return {
		...order,
		createdAt,
		acceptedAt,
		prepMinutes,
		readyAt: acceptedAt ? acceptedAt + prepMinutes * 60_000 : null,
		deliveredAt: order.delivered_at
			? new Date(order.delivered_at).getTime()
			: null,
	};
};

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

function formatCountdown(ms) {
	const totalSeconds = Math.ceil(Math.max(0, ms) / 1000);
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;
	return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function startOfDay(timestamp) {
	const date = new Date(timestamp);
	return new Date(
		date.getFullYear(),
		date.getMonth(),
		date.getDate(),
	).getTime();
}

function isToday(timestamp, now) {
	return startOfDay(timestamp) === startOfDay(now);
}

function formatOrderDate(timestamp, now) {
	const date = new Date(timestamp);
	const days = Math.round((startOfDay(now) - startOfDay(date)) / 86_400_000);
	const prefix =
		days === 0 ? "Hoy" : days === 1 ? "Ayer" : DATE_FORMAT.format(date);
	return `${prefix} · ${TIME_FORMAT.format(date)}`;
}

function getLocation(order) {
	if (order.tipo_pedido === "mesa") {
		return order.mesa ? `Mesa ${order.mesa}` : "Mesa sin asignar";
	}
	if (order.tipo_pedido === "llevar") {
		return "Mostrador · para llevar";
	}
	return order.direccion_entrega || "Dirección de entrega";
}

function getAction(order) {
	if (order.estado === "pendiente" || order.estado === "confirmado") {
		return {
			label: "Aceptar y preparar",
			next: "preparando",
			success: "Pedido aceptado. El cronómetro ya está corriendo.",
		};
	}
	if (order.estado === "preparando") {
		if (order.tipo_pedido === "domicilio") {
			return {
				label: "Enviar a domicilio",
				next: "en_camino",
				success: "Pedido marcado como en camino.",
			};
		}
		return {
			label:
				order.tipo_pedido === "mesa" ? "Servir en mesa" : "Entregar pedido",
			next: "entregado",
			success: "Pedido entregado.",
		};
	}
	if (order.estado === "en_camino") {
		return {
			label: "Marcar entregado",
			next: "entregado",
			success: "Pedido entregado.",
		};
	}
	return null;
}

function getPrepTiming(order, now) {
	const startedAt = order.acceptedAt ?? order.createdAt;
	const totalMs = Math.max(1, order.prepMinutes * 60_000);
	const readyAt = startedAt + totalMs;
	const remainingMs = Math.max(0, readyAt - now);
	const late = now > readyAt;
	const progress = Math.min(1, Math.max(0, (now - startedAt) / totalMs));

	return { readyAt, remainingMs, progress, late };
}

function TooltipButton({ label, children, ...buttonProps }) {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<Tooltip isOpen={isOpen} onOpenChange={setIsOpen} delay={150} closeDelay={0}>
			<Tooltip.Trigger
				render={(triggerProps) => (
					<button
						{...triggerProps}
						{...buttonProps}
						onPointerEnter={() => setIsOpen(true)}
						onPointerLeave={() => setIsOpen(false)}
						onFocus={() => setIsOpen(true)}
						onBlur={() => setIsOpen(false)}
					>
						{children}
					</button>
				)}
			/>
			<Tooltip.Content showArrow>{label}</Tooltip.Content>
		</Tooltip>
	);
}

function OrderTimer({ order, now }) {
	if (order.estado === "pendiente" || order.estado === "confirmado") {
		const waiting = Math.max(0, now - order.createdAt);
		return (
			<div className="mt-3 flex items-center gap-2 rounded-xl border border-warning/20 bg-warning/5 px-3 py-2 text-xs font-medium text-warning">
				<Clock className="size-4" />
				Esperando aceptación · {formatCountdown(waiting)}
			</div>
		);
	}

	if (order.estado === "preparando") {
		const timing = getPrepTiming(order, now);
		return (
			<div className="mt-3 rounded-xl border border-border bg-background px-3 py-2">
				<div className="flex items-center justify-between gap-2 text-xs font-semibold">
					<span className="inline-flex items-center gap-1.5 text-muted">
						<Timer className="size-3.5" />
						{timing.late ? "Tiempo excedido" : "Listo en"}
					</span>
					<span className={timing.late ? "text-danger" : "text-accent"}>
						{timing.late
							? `+${formatCountdown(now - timing.readyAt)}`
							: formatCountdown(timing.remainingMs)}
					</span>
				</div>
				<div className="mt-2 h-1.5 overflow-hidden rounded-full bg-default">
					<motion.div
						className={`h-full rounded-full ${timing.late ? "bg-danger" : "bg-accent"}`}
						animate={{ width: `${Math.round(timing.progress * 100)}%` }}
						transition={{ duration: 0.4, ease: "easeOut" }}
					/>
				</div>
			</div>
		);
	}

	if (order.estado === "en_camino") {
		return (
			<div className="mt-3 flex items-center gap-2 rounded-xl border border-success/20 bg-success/5 px-3 py-2 text-xs font-medium text-success">
				<Bike className="size-4" />
				En camino desde {order.readyAt ? TIME_FORMAT.format(order.readyAt) : "hace un momento"}
			</div>
		);
	}

	return null;
}

function OrderCard({ order, now, busy, onAction, onCancel }) {
	const type = TYPE_META[order.tipo_pedido] ?? TYPE_META.domicilio;
	const status = STATUS_META[order.estado] ?? STATUS_META.pendiente;
	const TypeIcon = type.icon;
	const action = getAction(order);
	const canCancel = ["pendiente", "confirmado", "preparando", "en_camino"].includes(
		order.estado,
	);

	return (
		<motion.article
			layout
			initial={{ opacity: 0, y: 10, scale: 0.98 }}
			animate={{ opacity: 1, y: 0, scale: 1 }}
			exit={{ opacity: 0, scale: 0.96 }}
			transition={{ duration: 0.22, ease: "easeOut" }}
			className="rounded-xl border border-border bg-surface p-4 shadow-sm"
		>
			<div className="flex items-start justify-between gap-2">
				<div className="min-w-0">
					<p className="truncate text-sm font-semibold text-foreground">
						{order.numero}
					</p>
					<div className="mt-1.5 flex flex-wrap items-center gap-1.5">
						<span
							className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${type.className}`}
						>
							<TypeIcon className="size-3" />
							{type.label}
						</span>
						<span
							className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${status.className}`}
						>
							{status.label}
						</span>
					</div>
				</div>
				<span className="shrink-0 text-[11px] text-muted">
					{TIME_FORMAT.format(order.createdAt)}
				</span>
			</div>

			<p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-foreground">
				<MapPin className="size-3.5 shrink-0 text-muted" />
				{getLocation(order)}
			</p>
			<p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
				<UserRound className="size-3.5 shrink-0" />
				{order.cliente}
			</p>

			<ul className="mt-3 space-y-1 border-t border-border pt-3">
				{(order.items ?? []).map((item) => (
					<li
						key={item.id}
						className="flex items-start justify-between gap-2 text-xs"
					>
						<span className="text-foreground">
							<span className="font-semibold text-accent">{item.cantidad}×</span>{" "}
							{item.nombre}
						</span>
						<span className="shrink-0 text-muted">
							{formatCOP(item.precio_unitario)}
						</span>
					</li>
				))}
			</ul>

			{order.notas && (
				<p className="mt-2 rounded-lg bg-warning/5 px-2.5 py-1.5 text-[11px] text-warning">
					{order.notas}
				</p>
			)}

			<OrderTimer order={order} now={now} />

			<div className="mt-3 flex items-end justify-between gap-2 border-t border-border pt-3">
				<div>
					<p className="text-sm font-semibold text-foreground">
						{formatCOP(order.total)}
					</p>
					<p className="text-[11px] text-muted">
						{order.metodo_pago_resumen || "Pago contra entrega"}
					</p>
				</div>
				<span className="text-[11px] text-muted">
					{order.items_count} {order.items_count === 1 ? "ítem" : "ítems"}
				</span>
			</div>

			{(action || canCancel) && (
				<div className="mt-3 flex flex-wrap gap-2">
					{action && (
						<button
							type="button"
							onClick={() => onAction(order, action.next, action.success)}
							disabled={busy}
							className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-accent-foreground transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
						>
							<Check className="size-3.5" />
							{busy ? "Actualizando..." : action.label}
						</button>
					)}
					{canCancel && (
						<TooltipButton
							label="Cancelar pedido"
							type="button"
							onClick={() => onCancel(order)}
							disabled={busy}
							aria-label={`Cancelar pedido ${order.numero}`}
							className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-danger/20 px-2.5 py-2 text-xs font-semibold text-danger transition-colors hover:bg-danger/10 disabled:cursor-not-allowed disabled:opacity-60"
						>
							<XCircle className="size-3.5" />
						</TooltipButton>
					)}
				</div>
			)}
		</motion.article>
	);
}

function Lane({ lane, orders, now, busyId, onAction, onCancel }) {
	const Icon = lane.icon;

	return (
		<section className="min-w-0 rounded-2xl border border-border bg-surface/70">
			<header className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
				<div className="flex items-center gap-2">
					<span
						className={`flex size-8 items-center justify-center rounded-lg ${lane.className}`}
					>
						<Icon className="size-4" />
					</span>
					<div>
						<h2 className="text-sm font-semibold text-foreground">
							{lane.title}
						</h2>
						<p className="text-[11px] text-muted">{lane.hint}</p>
					</div>
				</div>
				<span className="rounded-full bg-default px-2.5 py-1 text-xs font-semibold text-muted">
					{orders.length}
				</span>
			</header>

			<div className="min-h-40 space-y-3 p-3">
				<AnimatePresence mode="popLayout" initial={false}>
					{orders.map((order) => (
						<OrderCard
							key={order.id}
							order={order}
							now={now}
							busy={busyId === order.id}
							onAction={onAction}
							onCancel={onCancel}
						/>
					))}
				</AnimatePresence>
				{orders.length === 0 && (
					<div className="flex min-h-32 flex-col items-center justify-center rounded-xl border border-dashed border-border px-4 py-6 text-center">
						<ClipboardList className="size-6 text-muted/50" />
						<p className="mt-2 text-xs text-muted">Sin pedidos aquí</p>
					</div>
				)}
			</div>
		</section>
	);
}

function HistoryRow({ order, now }) {
	const type = TYPE_META[order.tipo_pedido] ?? TYPE_META.domicilio;
	const status = STATUS_META[order.estado] ?? STATUS_META.entregado;
	const TypeIcon = type.icon;
	const timestamp = order.deliveredAt ?? order.createdAt;

	return (
		<motion.article
			layout
			initial={{ opacity: 0, y: 6 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0 }}
			className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5"
		>
			<div className="flex min-w-0 items-center gap-3">
				<span
					className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${type.className}`}
				>
					<TypeIcon className="size-4" />
				</span>
				<div className="min-w-0">
					<p className="truncate text-sm font-semibold text-foreground">
						{order.numero}{" "}
						<span className="font-normal text-muted">· {order.cliente}</span>
					</p>
					<p className="mt-0.5 truncate text-xs text-muted">
						{type.label} · {getLocation(order)}
					</p>
				</div>
			</div>

			<div className="flex flex-wrap items-center gap-3 text-right">
				<div>
					<p className="text-sm font-semibold text-foreground">
						{formatCOP(order.total)}
					</p>
					<p className="text-[11px] text-muted">
						{formatOrderDate(timestamp, now)}
					</p>
				</div>
				<span
					className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${status.className}`}
				>
					{status.label}
				</span>
			</div>
		</motion.article>
	);
}

function Orders() {
	const now = useNow();
	const { user } = useStore();
	const [activeOrders, setActiveOrders] = useState([]);
	const [history, setHistory] = useState([]);
	const [loading, setLoading] = useState(Boolean(user));
	const [error, setError] = useState("");
	const [feedback, setFeedback] = useState(null);
	const [query, setQuery] = useState("");
	const [typeFilter, setTypeFilter] = useState("todos");
	const [view, setView] = useState("activos");
	const [busyId, setBusyId] = useState(null);
	const [lastUpdated, setLastUpdated] = useState(null);
	const [reloadKey, setReloadKey] = useState(0);

	useEffect(() => {
		let active = true;
		if (!user) return undefined;

		let inFlight = false;

		const load = async () => {
			if (inFlight) return;
			inFlight = true;
			try {
				const [activeData, historyData] = await Promise.all([
					getStaffOrders({ alcance: "activos" }),
					getStaffOrders({ alcance: "historial" }),
				]);
				if (!active) return;
				setActiveOrders(activeData.map(mapOrder));
				setHistory(historyData.map(mapOrder));
				setError("");
				setLastUpdated(new Date());
			} catch (requestError) {
				if (active) {
					setError(
						getApiErrorMessage(
							requestError,
							"No se pudieron cargar los pedidos de la tienda",
						),
					);
				}
			} finally {
				inFlight = false;
				if (active) setLoading(false);
			}
		};

		load();
		const interval = window.setInterval(load, ORDERS_REFRESH_MS);

		return () => {
			active = false;
			window.clearInterval(interval);
		};
	}, [user, reloadKey]);

	useEffect(() => {
		if (!feedback) return undefined;
		const timeout = window.setTimeout(
			() => setFeedback(null),
			FEEDBACK_VISIBLE_MS,
		);
		return () => window.clearTimeout(timeout);
	}, [feedback]);

	const source = view === "activos" ? activeOrders : history;
	const search = query.trim().toLowerCase();
	const searched = source.filter((order) => {
		if (!search) return true;
		const items = (order.items ?? []).map((item) => item.nombre).join(" ");
		return [
			order.numero,
			order.cliente,
			order.mesa,
			order.direccion_entrega,
			order.tipo_pedido_label,
			order.estado_label,
			items,
		]
			.join(" ")
			.toLowerCase()
			.includes(search);
	});

	const visible = searched.filter(
		(order) => typeFilter === "todos" || order.tipo_pedido === typeFilter,
	);

	const typeCounts = {
		todos: searched.length,
		mesa: searched.filter((order) => order.tipo_pedido === "mesa").length,
		domicilio: searched.filter((order) => order.tipo_pedido === "domicilio")
			.length,
		llevar: searched.filter((order) => order.tipo_pedido === "llevar").length,
	};

	const pendingCount = activeOrders.filter((order) =>
		["pendiente", "confirmado"].includes(order.estado),
	).length;
	const preparingCount = activeOrders.filter(
		(order) => order.estado === "preparando",
	).length;
	const onTheWayCount = activeOrders.filter(
		(order) => order.estado === "en_camino",
	).length;
	const deliveredToday = history.filter(
		(order) =>
			order.estado === "entregado" &&
			order.deliveredAt &&
			isToday(order.deliveredAt, now),
	).length;

	const refresh = () => {
		setLoading(true);
		setError("");
		setReloadKey((value) => value + 1);
	};

	const handleAction = async (order, next, successMessage) => {
		setBusyId(order.id);
		setFeedback(null);
		try {
			const updated = mapOrder(await updateOrderStatus(order.id, next));
			const finished =
				updated.estado === "entregado" || updated.estado === "cancelado";

			setActiveOrders((current) =>
				finished
					? current.filter((item) => item.id !== updated.id)
					: current.map((item) => (item.id === updated.id ? updated : item)),
			);
			if (finished) {
				setHistory((current) => [
					updated,
					...current.filter((item) => item.id !== updated.id),
				]);
			}
			setFeedback({ type: "success", message: successMessage });
		} catch (requestError) {
			setFeedback({
				type: "error",
				message: getApiErrorMessage(
					requestError,
					"No se pudo actualizar el estado del pedido",
				),
			});
		} finally {
			setBusyId(null);
		}
	};

	const handleCancel = (order) => {
		const confirmed = window.confirm(
			`¿Cancelar el pedido ${order.numero}? Las unidades volverán al inventario.`,
		);
		if (!confirmed) return;
		handleAction(
			order,
			"cancelado",
			"Pedido cancelado. El stock fue devuelto al inventario.",
		);
	};

	const stats = [
		{
			label: "Por aceptar",
			value: pendingCount,
			hint: "Pedidos nuevos",
			icon: Clock,
			className: "bg-warning/10 text-warning",
		},
		{
			label: "En preparación",
			value: preparingCount,
			hint: "En cocina",
			icon: CookingPot,
			className: "bg-accent/10 text-accent",
		},
		{
			label: "En camino",
			value: onTheWayCount,
			hint: "Domicilios",
			icon: Bike,
			className: "bg-success/10 text-success",
		},
		{
			label: "Entregados hoy",
			value: deliveredToday,
			hint: "Pedidos cerrados",
			icon: PackageCheck,
			className: "bg-success/10 text-success",
		},
	];

	return (
		<Dashboard
			title="Pedidos"
			description="Acepta, prepara y entrega los pedidos de tu tienda en tiempo real."
			icon={ClipboardList}
			eyebrow="SIGR · Operación"
		>
			<div className="space-y-5">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div className="flex flex-wrap items-center gap-2">
						<span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-2 text-xs font-medium text-muted">
							<Store className="size-4 text-accent" />
							{user?.restaurante?.nombre ?? "Tu restaurante"}
						</span>
						{lastUpdated && (
							<span className="rounded-full border border-border bg-surface px-3 py-2 text-xs text-muted">
								Actualizado {TIME_FORMAT.format(lastUpdated)}
							</span>
						)}
						<TooltipButton
							label="Actualizar pedidos"
							type="button"
							onClick={refresh}
							aria-label="Actualizar pedidos"
							className="flex size-9 items-center justify-center rounded-full border border-border bg-surface text-muted transition-colors hover:border-accent/40 hover:text-accent"
						>
							<RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
						</TooltipButton>
					</div>

					<div className="inline-flex rounded-xl border border-border bg-surface p-1">
						{[
							["activos", "En curso"],
							["historial", "Historial"],
						].map(([id, label]) => (
							<button
								key={id}
								type="button"
								aria-pressed={view === id}
								onClick={() => setView(id)}
								className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
									view === id
										? "bg-accent text-accent-foreground"
										: "text-muted hover:text-foreground"
								}`}
							>
								{label}
							</button>
						))}
					</div>
				</div>

				<div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-4">
					{stats.map((stat, index) => {
						const Icon = stat.icon;
						return (
							<motion.article
								key={stat.label}
								initial={{ opacity: 0, y: 8 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: index * 0.05, duration: 0.25 }}
								className="flex items-center gap-3 bg-surface p-4"
							>
								<span
									className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${stat.className}`}
								>
									<Icon className="size-4" />
								</span>
								<div>
									<p className="text-xl font-semibold text-foreground">
										{stat.value}
									</p>
									<p className="text-[11px] font-semibold text-foreground">
										{stat.label}
									</p>
									<p className="text-[10px] text-muted">{stat.hint}</p>
								</div>
							</motion.article>
						);
					})}
				</div>

				{error && (
					<div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-danger/30 bg-danger/10 px-4 py-2.5 text-sm text-danger">
						<span>{error}</span>
						<button
							type="button"
							onClick={refresh}
							className="rounded-lg border border-danger/30 px-3 py-1 text-xs font-semibold hover:bg-danger/10"
						>
							Reintentar
						</button>
					</div>
				)}

				<AnimatePresence>
					{feedback && (
						<motion.div
							initial={{ opacity: 0, y: -8 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -8 }}
							role={feedback.type === "error" ? "alert" : "status"}
							className={`rounded-xl border px-4 py-2.5 text-sm ${
								feedback.type === "error"
									? "border-danger/30 bg-danger/10 text-danger"
									: "border-success/30 bg-success/10 text-success"
							}`}
						>
							{feedback.message}
						</motion.div>
					)}
				</AnimatePresence>

				<div className="rounded-2xl border border-border bg-surface p-3">
					<div className="flex flex-wrap items-center justify-between gap-3">
						<div className="flex flex-wrap gap-1.5">
							{TYPE_FILTERS.map((filter) => {
								const Icon = filter.icon;
								const activeFilter = typeFilter === filter.id;
								return (
									<button
										key={filter.id}
										type="button"
										aria-pressed={activeFilter}
										onClick={() => setTypeFilter(filter.id)}
										className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
											activeFilter
												? "bg-accent text-accent-foreground"
												: "bg-default text-muted hover:text-foreground"
										}`}
									>
										<Icon className="size-3.5" />
										{filter.label}
										<span
											className={`rounded-full px-1.5 text-[10px] ${
												activeFilter
													? "bg-white/20"
													: "bg-surface text-muted"
											}`}
										>
											{typeCounts[filter.id] ?? 0}
										</span>
									</button>
								);
							})}
						</div>

						<label className="relative min-w-56 flex-1 sm:max-w-xs">
							<Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
							<span className="sr-only">Buscar pedidos</span>
							<input
								value={query}
								onChange={(event) => setQuery(event.target.value)}
								placeholder="Buscar por cliente, mesa o número"
								className="w-full rounded-xl border border-border bg-background py-2 pr-9 pl-9 text-sm text-foreground outline-none focus:border-accent"
							/>
							{query && (
								<button
									type="button"
									onClick={() => setQuery("")}
									aria-label="Limpiar búsqueda"
									className="absolute top-1/2 right-2 -translate-y-1/2 rounded-lg p-1.5 text-muted hover:bg-default hover:text-foreground"
								>
									<X className="size-3.5" />
								</button>
							)}
						</label>
					</div>
				</div>

				{loading && activeOrders.length === 0 && history.length === 0 ? (
					<div className="grid gap-4 xl:grid-cols-3">
						{[0, 1, 2].map((index) => (
							<div
								key={index}
								className="animate-pulse rounded-2xl border border-border bg-surface p-4"
							>
								<div className="h-5 w-32 rounded bg-default" />
								<div className="mt-3 h-4 w-full rounded bg-default" />
								<div className="mt-2 h-4 w-2/3 rounded bg-default" />
								<div className="mt-6 h-24 rounded-xl bg-default" />
							</div>
						))}
					</div>
				) : view === "activos" ? (
					<div className="grid items-start gap-4 xl:grid-cols-3">
						{LANES.map((lane) => (
							<Lane
								key={lane.id}
								lane={lane}
								orders={visible.filter((order) =>
									lane.states.includes(order.estado),
								)}
								now={now}
								busyId={busyId}
								onAction={handleAction}
								onCancel={handleCancel}
							/>
						))}
					</div>
				) : (
					<div className="rounded-2xl border border-border bg-surface">
						{visible.length === 0 ? (
							<div className="flex min-h-56 flex-col items-center justify-center px-6 py-10 text-center">
								<ClipboardList className="size-8 text-muted/50" />
								<p className="mt-3 text-sm font-semibold text-foreground">
									No hay pedidos en el historial
								</p>
								<p className="mt-1 text-xs text-muted">
									Los pedidos entregados o cancelados aparecerán aquí.
								</p>
							</div>
						) : (
							<div className="divide-y divide-border">
								<AnimatePresence mode="popLayout" initial={false}>
									{visible.map((order) => (
										<HistoryRow key={order.id} order={order} now={now} />
									))}
								</AnimatePresence>
							</div>
						)}
					</div>
				)}

				<p className="text-center text-[11px] text-muted">
					Los pedidos se actualizan automáticamente cada 20 segundos. El
					cronómetro inicia cuando aceptas el pedido.
				</p>
			</div>
		</Dashboard>
	);
}

export default Orders;
