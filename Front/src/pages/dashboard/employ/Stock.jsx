import { useEffect, useState } from "react";
import { Tooltip } from "@heroui/react";
import { AnimatePresence, motion } from "motion/react";
import {
	AlertTriangle,
	ChefHat,
	Clock,
	Eye,
	EyeOff,
	Minus,
	PackageCheck,
	PackageSearch,
	PackageX,
	Plus,
	RefreshCw,
	Search,
	Tag,
	X,
} from "lucide-react";
import {
	getApiErrorMessage,
	getStaffAvailability,
	updateStaffAvailability,
} from "../../../Api/clientApi";
import useStore from "../../../store/useStore";
import { formatCOP } from "../../../utils/format";
import Dashboard from "../Dashboard";

const FILTERS = [
	{ id: "todos", label: "Todos" },
	{ id: "disponibles", label: "Disponibles" },
	{ id: "bajo", label: "Stock bajo" },
	{ id: "agotados", label: "Agotados" },
	{ id: "inactivos", label: "No disponibles" },
];

const AVAILABILITY_REFRESH_MS = 30000;
const FEEDBACK_VISIBLE_MS = 4500;

const isAvailable = (dish) => dish.is_active && Number(dish.stock) > 0;

const stockTone = (stock) => {
	if (stock <= 0) return "bg-danger/10 text-danger";
	if (stock <= 5) return "bg-warning/10 text-warning";
	return "bg-success/10 text-success";
};

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

function StockStepper({ dish, busy, onChange }) {
	const commit = (event) => {
		const next = Number.parseInt(event.currentTarget.value, 10);
		if (Number.isNaN(next)) {
			event.currentTarget.value = dish.stock;
			return;
		}
		const clamped = Math.max(0, Math.min(9999, next));
		event.currentTarget.value = clamped;
		if (clamped !== dish.stock) onChange(clamped);
	};

	return (
		<div className="flex items-center gap-1.5">
			<TooltipButton
				label="Quitar una unidad"
				type="button"
				onClick={() => onChange(Math.max(0, Number(dish.stock) - 1))}
				disabled={busy || Number(dish.stock) <= 0}
				aria-label={`Quitar stock a ${dish.nombre}`}
				className="flex size-8 items-center justify-center rounded-lg border border-border text-muted transition-colors hover:border-accent/40 hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
			>
				<Minus className="size-4" />
			</TooltipButton>
			<input
				key={dish.stock}
				type="number"
				min="0"
				max="9999"
				defaultValue={dish.stock}
				onBlur={commit}
				onKeyDown={(event) => {
					if (event.key === "Enter") {
						event.preventDefault();
						event.currentTarget.blur();
					}
				}}
				disabled={busy}
				aria-label={`Stock de ${dish.nombre}`}
				className={`w-16 rounded-lg border border-border bg-background px-2 py-1.5 text-center text-sm font-semibold outline-none focus:border-accent disabled:opacity-60 ${stockTone(Number(dish.stock))}`}
			/>
			<TooltipButton
				label="Agregar una unidad"
				type="button"
				onClick={() => onChange(Math.min(9999, Number(dish.stock) + 1))}
				disabled={busy || Number(dish.stock) >= 9999}
				aria-label={`Agregar stock a ${dish.nombre}`}
				className="flex size-8 items-center justify-center rounded-lg border border-border text-muted transition-colors hover:border-accent/40 hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
			>
				<Plus className="size-4" />
			</TooltipButton>
		</div>
	);
}

function AvailabilityCard({ dish, busy, onStockChange, onToggle }) {
	const available = isAvailable(dish);
	const soldOut = Number(dish.stock) <= 0;
	const lowStock = !soldOut && Number(dish.stock) <= 5;

	return (
		<motion.article
			layout
			initial={{ opacity: 0, y: 14, scale: 0.98 }}
			animate={{ opacity: 1, y: 0, scale: 1 }}
			exit={{ opacity: 0, scale: 0.97 }}
			whileHover={{ y: -3 }}
			transition={{ duration: 0.22, ease: "easeOut" }}
			className={`flex flex-col rounded-2xl border border-border bg-surface p-4 transition-opacity ${
				dish.is_active ? "" : "opacity-75"
			}`}
		>
			<div className="flex min-w-0 gap-3">
				<div
					className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-default"
					style={{
						backgroundImage:
							dish.gradient ||
							"linear-gradient(135deg, #92400e 0%, #f59e0b 100%)",
					}}
				>
					<div className="flex h-full w-full items-center justify-center">
						<ChefHat className="size-7 text-white/70" />
					</div>
					{dish.image && (
						<img
							src={dish.image}
							alt={dish.nombre}
							className="absolute inset-0 h-full w-full object-cover"
							loading="lazy"
							onError={(event) => {
								event.currentTarget.style.display = "none";
							}}
						/>
					)}
				</div>

				<div className="min-w-0 flex-1">
					<div className="flex flex-wrap items-start justify-between gap-2">
						<h2 className="truncate font-semibold text-foreground">
							{dish.nombre}
						</h2>
						<span
							className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
								!dish.is_active
									? "bg-default text-muted"
									: soldOut
										? "bg-danger/10 text-danger"
										: "bg-success/10 text-success"
							}`}
						>
							{!dish.is_active
								? "No disponible"
								: soldOut
									? "Agotado"
									: "Disponible"}
						</span>
					</div>

					<div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
						<span className="inline-flex items-center gap-1">
							<Tag className="size-3.5" />
							{dish.categoria_nombre || "Sin categoría"}
						</span>
						<span className="inline-flex items-center gap-1">
							<Clock className="size-3.5" />
							{dish.prep_minutes} min
						</span>
						<span className="font-semibold text-accent">
							{formatCOP(dish.precio)}
						</span>
					</div>

					{dish.descripcion && (
						<p className="mt-2 line-clamp-2 text-xs text-muted">
							{dish.descripcion}
						</p>
					)}
				</div>
			</div>

			<div className="mt-auto flex flex-wrap items-end justify-between gap-3 border-t border-border pt-3">
				<div>
					<div className="mb-1.5 flex items-center gap-2">
						<span className="text-[10px] font-semibold tracking-[0.12em] text-muted uppercase">
							Stock
						</span>
						{lowStock && (
							<span className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2 py-0.5 text-[10px] font-semibold text-warning">
								<AlertTriangle className="size-3" />
								Bajo
							</span>
						)}
						{soldOut && (
							<span className="rounded-full bg-danger/10 px-2 py-0.5 text-[10px] font-semibold text-danger">
								Sin unidades
							</span>
						)}
					</div>
					<StockStepper
						dish={dish}
						busy={busy}
						onChange={onStockChange}
					/>
				</div>

				<TooltipButton
					label={
						dish.is_active
							? "Marcar como no disponible"
							: soldOut
								? "Agrega stock para activarlo"
								: "Marcar como disponible"
					}
					type="button"
					onClick={onToggle}
					disabled={busy || (!dish.is_active && soldOut)}
					aria-label={
						dish.is_active
							? `Marcar ${dish.nombre} como no disponible`
							: `Marcar ${dish.nombre} como disponible`
					}
					className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${
						available
							? "bg-warning/10 text-warning hover:bg-warning/20"
							: "bg-success/10 text-success hover:bg-success/20"
					}`}
				>
					{dish.is_active ? (
						<EyeOff className="size-4" />
					) : (
						<Eye className="size-4" />
					)}
					{dish.is_active ? "No disponible" : "Disponible"}
				</TooltipButton>
			</div>
		</motion.article>
	);
}

function AvailabilitySkeleton() {
	return (
		<div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
			{Array.from({ length: 6 }).map((_, index) => (
				<div
					key={index}
					className="h-56 animate-pulse rounded-2xl border border-border bg-surface"
				/>
			))}
		</div>
	);
}

function Stock() {
	const { user } = useStore();
	const [dishes, setDishes] = useState([]);
	const [loading, setLoading] = useState(Boolean(user));
	const [error, setError] = useState("");
	const [notice, setNotice] = useState("");
	const [query, setQuery] = useState("");
	const [filter, setFilter] = useState("todos");
	const [busyId, setBusyId] = useState(null);
	const [reloadKey, setReloadKey] = useState(0);
	const [lastUpdated, setLastUpdated] = useState(null);

	useEffect(() => {
		let active = true;
		let inFlight = false;
		if (!user) return undefined;

		const load = async () => {
			if (inFlight) return;
			inFlight = true;
			try {
				const data = await getStaffAvailability();
				if (!active) return;
				setDishes(data);
				setLastUpdated(new Date());
				setError("");
			} catch (requestError) {
				if (active) {
					setError(
						getApiErrorMessage(
							requestError,
							"No se pudo cargar la disponibilidad de la tienda",
						),
					);
				}
			} finally {
				inFlight = false;
				if (active) setLoading(false);
			}
		};

		load();
		const interval = window.setInterval(load, AVAILABILITY_REFRESH_MS);

		return () => {
			active = false;
			window.clearInterval(interval);
		};
	}, [user, reloadKey]);

	useEffect(() => {
		if (!error && !notice) return undefined;
		const timer = window.setTimeout(() => {
			setError("");
			setNotice("");
		}, FEEDBACK_VISIBLE_MS);
		return () => window.clearTimeout(timer);
	}, [error, notice]);

	const search = query.trim().toLowerCase();
	const visible = dishes.filter((dish) => {
		const matchesSearch =
			!search ||
			[dish.nombre, dish.descripcion, dish.categoria_nombre, dish.etiqueta]
				.join(" ")
				.toLowerCase()
				.includes(search);
		const matchesFilter =
			filter === "todos" ||
			(filter === "disponibles" && isAvailable(dish)) ||
			(filter === "bajo" && Number(dish.stock) > 0 && Number(dish.stock) <= 5) ||
			(filter === "agotados" && Number(dish.stock) <= 0) ||
			(filter === "inactivos" && !dish.is_active);
		return matchesSearch && matchesFilter;
	});

	const availableCount = dishes.filter(isAvailable).length;
	const lowStockDishes = dishes.filter(
		(dish) => Number(dish.stock) > 0 && Number(dish.stock) <= 5,
	);
	const lowStockCount = lowStockDishes.length;
	const soldOutCount = dishes.filter((dish) => Number(dish.stock) <= 0).length;
	const lowStockNames = lowStockDishes
		.slice(0, 3)
		.map((dish) => dish.nombre)
		.join(", ");

	const refresh = () => {
		setLoading(true);
		setReloadKey((key) => key + 1);
	};

	const replaceDish = (updated) =>
		setDishes((current) =>
			current.map((dish) => (dish.id === updated.id ? updated : dish)),
		);

	const handleStockChange = async (dish, next) => {
		if (next === Number(dish.stock)) return;
		setBusyId(dish.id);
		setError("");
		setNotice("");
		try {
			const updated = await updateStaffAvailability(dish.id, { stock: next });
			replaceDish(updated);
			setNotice(
				updated.stock > 0
					? `${updated.nombre}: stock actualizado a ${updated.stock}.`
					: `${updated.nombre} quedó agotado.`,
			);
		} catch (requestError) {
			setError(
				getApiErrorMessage(
					requestError,
					"No se pudo actualizar el stock del platillo",
				),
			);
		} finally {
			setBusyId(null);
		}
	};

	const handleToggle = async (dish) => {
		if (!dish.is_active && Number(dish.stock) <= 0) {
			setError("Agrega stock antes de marcar este platillo como disponible.");
			setNotice("");
			return;
		}
		setBusyId(dish.id);
		setError("");
		setNotice("");
		try {
			const updated = await updateStaffAvailability(dish.id, {
				is_active: !dish.is_active,
			});
			replaceDish(updated);
			setNotice(
				updated.is_active
					? `${updated.nombre} está disponible para la venta.`
					: `${updated.nombre} se marcó como no disponible.`,
			);
		} catch (requestError) {
			setError(
				getApiErrorMessage(
					requestError,
					"No se pudo cambiar la disponibilidad del platillo",
				),
			);
		} finally {
			setBusyId(null);
		}
	};

	const updateTime = lastUpdated
		? new Intl.DateTimeFormat("es-CO", {
				hour: "2-digit",
				minute: "2-digit",
			}).format(lastUpdated)
		: "";

	return (
		<Dashboard
			title="Disponibilidad"
			description="Controla el stock y la disponibilidad de los platillos de tu tienda."
			icon={PackageSearch}
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
							<PackageSearch className="size-4 text-accent" />
							{user?.restaurante?.nombre ?? "Tu tienda"}
						</span>
						{updateTime && (
							<span className="rounded-full border border-border bg-surface px-3 py-2 text-xs text-muted">
								Actualizado {updateTime}
							</span>
						)}
					</div>
				</motion.div>

				<div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
					{[
						{
							label: "Platillos",
							value: dishes.length,
							hint: "En el menú de la tienda",
							icon: PackageSearch,
						},
						{
							label: "Disponibles",
							value: availableCount,
							hint: "Con stock y activos",
							icon: PackageCheck,
						},
						{
							label: "Agotados",
							value: soldOutCount,
							hint: "Sin unidades por vender",
							icon: PackageX,
						},
					].map(({ label, value, hint, icon: Icon }, index) => (
						<motion.article
							key={label}
							initial={{ opacity: 0, y: 14 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{
								duration: 0.3,
								delay: index * 0.06,
								ease: "easeOut",
							}}
							whileHover={{ y: -2 }}
							className="rounded-2xl border border-border bg-surface p-4 sm:p-5"
						>
							<div className="flex items-start justify-between gap-2">
								<p className="text-[11px] font-semibold tracking-[0.14em] text-muted uppercase">
									{label}
								</p>
								<Icon className="size-4 text-accent/70" />
							</div>
							<p className="mt-2 text-3xl font-semibold text-foreground">
								{value}
							</p>
							<p className="mt-1 text-xs text-muted">{hint}</p>
						</motion.article>
					))}
				</div>

				<AnimatePresence initial={false}>
					{lowStockCount > 0 && (
						<motion.div
							key="low-stock"
							initial={{ opacity: 0, y: -12, scale: 0.98 }}
							animate={{ opacity: 1, y: 0, scale: 1 }}
							exit={{ opacity: 0, y: -8, scale: 0.98 }}
							transition={{ duration: 0.28, ease: "easeOut" }}
							role="status"
							className="flex flex-wrap items-start gap-3 rounded-2xl border border-warning/30 bg-warning/10 p-4"
						>
							<span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-warning/15 text-warning">
								<AlertTriangle className="size-5" />
							</span>
							<div className="min-w-0 flex-1">
								<p className="text-sm font-semibold text-foreground">
									{lowStockCount === 1
										? "1 platillo está por agotarse"
										: `${lowStockCount} platillos están por agotarse`}
								</p>
								<p className="mt-1 text-xs text-muted">
									Quedan pocas unidades de {lowStockNames}
									{lowStockCount > 3
										? ` y ${lowStockCount - 3} más`
										: ""}
									. Repón el stock para no perder pedidos.
								</p>
							</div>
							<motion.button
								type="button"
								whileHover={{ scale: 1.03 }}
								whileTap={{ scale: 0.96 }}
								onClick={() => {
									setFilter("bajo");
									setQuery("");
								}}
								className="shrink-0 rounded-lg bg-warning/15 px-3 py-2 text-xs font-semibold text-warning transition-colors hover:bg-warning/25"
							>
								Ver stock bajo
							</motion.button>
						</motion.div>
					)}
				</AnimatePresence>

				<motion.div
					initial={{ opacity: 0, y: 12 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.3, delay: 0.12, ease: "easeOut" }}
					className="rounded-2xl border border-border bg-surface"
				>
					<div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
						<label className="relative min-w-56 flex-1">
							<Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
							<span className="sr-only">Buscar platillos</span>
							<input
								value={query}
								onChange={(event) => setQuery(event.target.value)}
								placeholder="Buscar por nombre, categoría o etiqueta"
								className="w-full rounded-xl border border-border bg-background py-2 pr-10 pl-9 text-sm text-foreground outline-none focus:border-accent"
							/>
							{query && (
								<TooltipButton
									label="Limpiar búsqueda"
									type="button"
									onClick={() => setQuery("")}
									aria-label="Limpiar búsqueda"
									className="absolute top-1/2 right-2 -translate-y-1/2 rounded-lg p-1.5 text-muted hover:bg-default hover:text-foreground"
								>
									<X className="size-3.5" />
								</TooltipButton>
							)}
						</label>
						<div className="flex flex-wrap gap-1">
							{FILTERS.map(({ id, label }) => (
								<motion.button
									key={id}
									type="button"
									whileTap={{ scale: 0.94 }}
									aria-pressed={filter === id}
									onClick={() => setFilter(id)}
									className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
										filter === id
											? "bg-accent text-accent-foreground"
											: "bg-default text-muted hover:text-foreground"
									}`}
								>
									{label}
								</motion.button>
							))}
						</div>
					</div>

					<div className="p-4">
						{loading ? (
							<AvailabilitySkeleton />
						) : visible.length === 0 ? (
							<motion.div
								initial={{ opacity: 0, y: 8 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.25 }}
								className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center"
							>
								<span className="flex size-14 items-center justify-center rounded-full bg-accent/10 text-accent">
									<PackageSearch className="size-7" />
								</span>
								<h2 className="mt-4 text-lg font-semibold text-foreground">
									No hay platillos para mostrar
								</h2>
								<p className="mt-2 max-w-sm text-sm text-muted">
									{dishes.length === 0
										? "Tu tienda todavía no tiene platillos registrados."
										: "Prueba otra búsqueda o cambia el filtro."}
								</p>
							</motion.div>
						) : (
							<motion.div
								layout
								className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3"
							>
								<AnimatePresence mode="popLayout" initial={false}>
									{visible.map((dish) => (
										<AvailabilityCard
											key={dish.id}
											dish={dish}
											busy={busyId === dish.id}
											onStockChange={(next) => handleStockChange(dish, next)}
											onToggle={() => handleToggle(dish)}
										/>
									))}
								</AnimatePresence>
							</motion.div>
						)}
					</div>
				</motion.div>

				<motion.p
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.25 }}
					className="text-center text-xs text-muted"
				>
					Los cambios se reflejan de inmediato en el catálogo de la tienda y
					avisan al resto del equipo. Cuando el stock llega a cero, el
					platillo aparece como agotado.
				</motion.p>
			</motion.div>

			<AnimatePresence>
				{(error || notice) && (
					<motion.div
						key={error ? `error-${error}` : `notice-${notice}`}
						initial={{ opacity: 0, y: 24, scale: 0.96 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, y: 16, scale: 0.96 }}
						transition={{ type: "spring", stiffness: 420, damping: 32 }}
						role={error ? "alert" : "status"}
						className={`fixed right-4 bottom-4 z-50 flex w-[min(92vw,380px)] items-start gap-3 overflow-hidden rounded-2xl border bg-surface/95 p-4 shadow-2xl backdrop-blur ${
							error ? "border-danger/40" : "border-success/40"
						}`}
					>
						<span
							className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${
								error
									? "bg-danger/10 text-danger"
									: "bg-success/10 text-success"
							}`}
						>
							{error ? (
								<AlertTriangle className="size-5" />
							) : (
								<PackageCheck className="size-5" />
							)}
						</span>
						<div className="min-w-0 flex-1">
							<p className="text-sm font-semibold text-foreground">
								{error ? "No se pudo completar" : "Listo"}
							</p>
							<p
								className={`mt-0.5 text-xs ${
									error ? "text-danger" : "text-muted"
								}`}
							>
								{error || notice}
							</p>
							{error && (
								<button
									type="button"
									onClick={() => {
										setError("");
										refresh();
									}}
									disabled={loading}
									className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-danger/10 px-2.5 py-1.5 text-xs font-semibold text-danger transition-colors hover:bg-danger/20 disabled:opacity-60"
								>
									<RefreshCw
										className={`size-3.5 ${loading ? "animate-spin" : ""}`}
									/>
									Reintentar
								</button>
							)}
						</div>
						<button
							type="button"
							onClick={() => {
								setError("");
								setNotice("");
							}}
							aria-label="Cerrar notificación"
							className="rounded-lg p-1 text-muted transition-colors hover:bg-default hover:text-foreground"
						>
							<X className="size-4" />
						</button>
						<motion.span
							aria-hidden="true"
							initial={{ scaleX: 1 }}
							animate={{ scaleX: 0 }}
							transition={{
								duration: FEEDBACK_VISIBLE_MS / 1000,
								ease: "linear",
							}}
							className={`absolute bottom-0 left-0 h-0.5 w-full origin-left ${
								error ? "bg-danger/60" : "bg-success/60"
							}`}
						/>
					</motion.div>
				)}
			</AnimatePresence>
		</Dashboard>
	);
}

export default Stock;
