import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { Tooltip } from "@heroui/react";
import {
	AlertTriangle,
	ArrowDownRight,
	ArrowUpRight,
	Banknote,
	CalendarDays,
	ChefHat,
	CreditCard,
	Flame,
	LayoutDashboard,
	PackageSearch,
	RefreshCw,
	ShoppingBag,
	Sparkles,
	TrendingUp,
	Users,
} from "lucide-react";
import { Link } from "react-router";
import { getApiErrorMessage, getDashboardStats } from "../../../Api/clientApi";
import EChart from "../../../components/charts/EChart";
import useStore from "../../../store/useStore";
import {
	AMBER,
	BRAND,
	BRAND_SOFT,
	CHART_COLORS,
	STATE_COLORS,
	escapeHtml,
	fechaCorta,
	fechaLarga,
	formatCompactCOP,
	formatHora,
	getChartTheme,
	horizontalGradient,
	verticalGradient,
} from "../../../utils/chartTheme";
import { formatCOP, formatDateTime } from "../../../utils/format";
import Dashboard from "../Dashboard";

const RANGES = [
	{ id: 7, label: "7 días" },
	{ id: 30, label: "30 días" },
	{ id: 90, label: "90 días" },
];

const STATUS_STYLES = {
	pendiente: "bg-warning/10 text-warning",
	confirmado: "bg-sky-500/10 text-sky-500",
	preparando: "bg-violet-500/10 text-violet-500",
	en_camino: "bg-teal-500/10 text-teal-500",
	entregado: "bg-success/10 text-success",
	cancelado: "bg-danger/10 text-danger",
};

const HORA_ACTUAL = new Intl.DateTimeFormat("es-CO", {
	hour: "2-digit",
	minute: "2-digit",
});

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

const deltaOf = (actual, previous) => {
	const base = Number(previous) || 0;
	if (base <= 0) return null;
	return ((Number(actual) - base) / base) * 100;
};

function DeltaChip({ value }) {
	if (value === null) {
		return <span className="text-[11px] text-muted">Sin comparación</span>;
	}
	const positive = value >= 0;
	const Icon = positive ? ArrowUpRight : ArrowDownRight;
	return (
		<span
			className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${
				positive ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
			}`}
		>
			<Icon className="size-3" />
			{Math.abs(value).toFixed(1)}%
		</span>
	);
}

function KpiCard({ icon: Icon, label, value, hint, delta, delay = 0 }) {
	return (
		<motion.article
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.35, delay }}
			className="group relative overflow-hidden rounded-2xl border border-border bg-surface p-5 transition-shadow hover:shadow-lg hover:shadow-accent/5"
		>
			<div className="pointer-events-none absolute -top-8 -right-8 size-28 rounded-full bg-accent/[0.04] transition-transform duration-500 group-hover:scale-150" />
			<div className="relative flex items-start justify-between gap-3">
				<div className="min-w-0">
					<p className="text-[11px] font-semibold tracking-[0.16em] text-muted uppercase">
						{label}
					</p>
					<p className="mt-3 truncate text-2xl font-semibold tracking-tight text-foreground">
						{value}
					</p>
				</div>
				<span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
					<Icon className="size-5" />
				</span>
			</div>
			<div className="relative mt-4 flex flex-wrap items-center gap-2">
				<DeltaChip value={delta} />
				<span className="truncate text-[11px] text-muted">{hint}</span>
			</div>
		</motion.article>
	);
}

function ChartCard({ title, subtitle, className = "", children }) {
	return (
		<section
			className={`flex min-w-0 flex-col rounded-2xl border border-border bg-surface p-5 ${className}`}
		>
			<header>
				<h2 className="text-sm font-semibold text-foreground">{title}</h2>
				{subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
			</header>
			<div className="mt-4 flex-1">{children}</div>
		</section>
	);
}

function EmptyChart({ message }) {
	return (
		<div className="flex h-full min-h-56 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-background/60 px-6 text-center">
			<Sparkles className="size-6 text-accent/40" />
			<p className="text-sm font-medium text-foreground">Aún no hay datos</p>
			<p className="max-w-xs text-xs text-muted">{message}</p>
		</div>
	);
}

function EmptyMini({ icon: Icon = Sparkles, text }) {
	return (
		<div className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-border bg-background/60 px-4 py-8 text-center">
			<Icon className="size-5 text-accent/40" />
			<p className="text-xs text-muted">{text}</p>
		</div>
	);
}

function StatsSkeleton() {
	return (
		<div className="space-y-4">
			<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				{["a", "b", "c", "d"].map((key) => (
					<div
						key={key}
						className="h-32 animate-pulse rounded-2xl border border-border bg-surface"
					/>
				))}
			</div>
			<div className="grid gap-4 xl:grid-cols-3">
				<div className="h-96 animate-pulse rounded-2xl border border-border bg-surface xl:col-span-2" />
				<div className="h-96 animate-pulse rounded-2xl border border-border bg-surface" />
			</div>
			<div className="grid gap-4 xl:grid-cols-2">
				<div className="h-80 animate-pulse rounded-2xl border border-border bg-surface" />
				<div className="h-80 animate-pulse rounded-2xl border border-border bg-surface" />
			</div>
		</div>
	);
}

function Stats() {
	const { user, darkMode } = useStore();
	const [range, setRange] = useState(30);
	const [data, setData] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [lastUpdated, setLastUpdated] = useState(null);
	const [reloadKey, setReloadKey] = useState(0);

	useEffect(() => {
		if (!user) return undefined;
		let active = true;

		getDashboardStats(range)
			.then((result) => {
				if (!active) return;
				setData(result);
				setError("");
				setLastUpdated(new Date());
			})
			.catch((requestError) => {
				if (!active) return;
				setError(
					getApiErrorMessage(
						requestError,
						"No se pudieron cargar las estadísticas del restaurante",
					),
				);
			})
			.finally(() => {
				if (active) setLoading(false);
			});

		return () => {
			active = false;
		};
	}, [range, user, reloadKey]);

	const refresh = () => {
		if (!user) return;
		setLoading(true);
		setReloadKey((key) => key + 1);
	};

	const changeRange = (next) => {
		if (next === range) return;
		setLoading(true);
		setRange(next);
	};

	const resumen = data?.resumen ?? null;
	const ventasDiarias = data?.ventas_diarias ?? [];
	const estados = data?.estados ?? [];
	const topPlatillos = data?.top_platillos ?? [];
	const categorias = data?.categorias ?? [];
	const metodosPago = data?.metodos_pago ?? [];
	const porHora = data?.por_hora ?? [];
	const recientes = data?.pedidos_recientes ?? [];
	const stockBajo = data?.stock_bajo ?? [];

	const hasOrders = Boolean(resumen && (resumen.pedidos > 0 || resumen.cancelados > 0));
	const totalEstados = estados.reduce((sum, row) => sum + row.total, 0);
	const totalMetodos = metodosPago.reduce((sum, row) => sum + row.total, 0);
	const totalHoras = porHora.reduce((sum, row) => sum + row.pedidos, 0);
	const hoy = ventasDiarias[ventasDiarias.length - 1];

	const ingresosOption = useMemo(() => {
		const t = getChartTheme(darkMode);
		const rows = data?.ventas_diarias ?? [];

		return {
			aria: { enabled: true },
			animationDuration: 650,
			tooltip: {
				...t.tooltip,
				trigger: "axis",
				axisPointer: {
					type: "cross",
					lineStyle: { color: t.grid },
					crossStyle: { color: t.grid },
					label: {
						backgroundColor: t.text,
						color: t.surface,
						borderRadius: 6,
						fontSize: 11,
					},
				},
				formatter: (params) => {
					const row = rows[params?.[0]?.dataIndex ?? 0];
					if (!row) return "";
					return `<div style="font-weight:600;margin-bottom:4px">${fechaLarga(row.fecha)}</div>
						<div style="display:flex;gap:16px;justify-content:space-between">Ingresos <b>${formatCOP(row.ventas)}</b></div>
						<div style="display:flex;gap:16px;justify-content:space-between">Pedidos <b>${row.pedidos}</b></div>`;
				},
			},
			legend: {
				top: 0,
				right: 0,
				itemWidth: 10,
				itemHeight: 10,
				itemGap: 16,
				icon: "roundRect",
				textStyle: { color: t.muted, fontSize: 11 },
			},
			grid: { left: 6, right: 8, top: 42, bottom: 4, containLabel: true },
			xAxis: {
				type: "category",
				data: rows.map((row) => fechaCorta(row.fecha)),
				axisTick: { show: false },
				axisLine: { lineStyle: { color: t.grid } },
				axisLabel: { color: t.muted, fontSize: 11, hideOverlap: true },
			},
			yAxis: [
				{
					type: "value",
					axisLine: { show: false },
					axisLabel: {
						color: t.muted,
						fontSize: 10,
						formatter: (value) => formatCompactCOP(value),
					},
					splitLine: { lineStyle: { color: t.grid, type: "dashed" } },
				},
				{
					type: "value",
					axisLine: { show: false },
					axisLabel: { color: t.muted, fontSize: 10 },
					splitLine: { show: false },
				},
			],
			series: [
				{
					name: "Ingresos",
					type: "line",
					smooth: 0.4,
					showSymbol: false,
					symbol: "circle",
					symbolSize: 7,
					lineStyle: { width: 3, color: BRAND },
					itemStyle: { color: BRAND },
					areaStyle: {
						color: verticalGradient(
							"rgba(159,18,57,0.32)",
							"rgba(159,18,57,0.01)",
						),
					},
					data: rows.map((row) => row.ventas),
				},
				{
					name: "Pedidos",
					type: "bar",
					yAxisIndex: 1,
					barMaxWidth: 16,
					itemStyle: {
						borderRadius: [5, 5, 0, 0],
						color: verticalGradient(
							"rgba(245,158,11,0.95)",
							"rgba(245,158,11,0.22)",
						),
					},
					data: rows.map((row) => row.pedidos),
				},
			],
		};
	}, [data, darkMode]);

	const estadosOption = useMemo(() => {
		const t = getChartTheme(darkMode);
		const rows = (data?.estados ?? []).filter((row) => row.total > 0);
		const total = rows.reduce((sum, row) => sum + row.total, 0);

		return {
			aria: { enabled: true },
			tooltip: {
				...t.tooltip,
				trigger: "item",
				formatter: (params) =>
					`${params.marker} ${params.name}<br/><b>${params.value}</b> pedidos (${params.percent}%)`,
			},
			legend: {
				bottom: 0,
				icon: "circle",
				itemWidth: 8,
				itemHeight: 8,
				itemGap: 12,
				textStyle: { color: t.muted, fontSize: 10 },
			},
			title: {
				text: String(total),
				subtext: "pedidos",
				left: "center",
				top: "32%",
				textStyle: { color: t.text, fontSize: 28, fontWeight: 700 },
				subtextStyle: { color: t.muted, fontSize: 11 },
			},
			series: [
				{
					type: "pie",
					radius: ["54%", "76%"],
					center: ["50%", "45%"],
					padAngle: 2,
					itemStyle: { borderRadius: 6, borderColor: t.surface, borderWidth: 2 },
					label: { show: false },
					emphasis: {
						scale: true,
						scaleSize: 5,
						itemStyle: { shadowBlur: 16, shadowColor: "rgba(0,0,0,0.22)" },
					},
					data: rows.map((row) => ({
						name: row.label,
						value: row.total,
						itemStyle: { color: STATE_COLORS[row.estado] },
					})),
				},
			],
		};
	}, [data, darkMode]);

	const topPlatillosOption = useMemo(() => {
		const t = getChartTheme(darkMode);
		const rows = data?.top_platillos ?? [];

		return {
			aria: { enabled: true },
			tooltip: {
				...t.tooltip,
				trigger: "axis",
				axisPointer: { type: "shadow" },
				formatter: (params) => {
					const row = rows[params?.[0]?.dataIndex ?? 0];
					if (!row) return "";
					return `<b>${escapeHtml(row.nombre)}</b><br/>${row.unidades} unidades<br/>${formatCOP(row.ingresos)}`;
				},
			},
			grid: { left: 4, right: 56, top: 4, bottom: 4, containLabel: true },
			xAxis: {
				type: "value",
				axisLabel: { color: t.muted, fontSize: 10 },
				splitLine: { lineStyle: { color: t.grid, type: "dashed" } },
			},
			yAxis: {
				type: "category",
				inverse: true,
				data: rows.map((row) => row.nombre),
				axisLine: { show: false },
				axisTick: { show: false },
				axisLabel: {
					color: t.text,
					fontSize: 11,
					width: 132,
					overflow: "truncate",
				},
			},
			series: [
				{
					type: "bar",
					data: rows.map((row) => row.unidades),
					barWidth: 14,
					showBackground: true,
					backgroundStyle: { color: t.grid, borderRadius: 8 },
					itemStyle: {
						borderRadius: [0, 8, 8, 0],
						color: horizontalGradient(BRAND, BRAND_SOFT),
					},
					label: {
						show: true,
						position: "right",
						color: t.muted,
						fontSize: 11,
						formatter: "{c} uds.",
					},
				},
			],
		};
	}, [data, darkMode]);

	const categoriasOption = useMemo(() => {
		const t = getChartTheme(darkMode);
		const rows = data?.categorias ?? [];

		return {
			aria: { enabled: true },
			tooltip: {
				...t.tooltip,
				formatter: (params) =>
					`<b>${escapeHtml(params.name)}</b><br/>${formatCOP(params.value)}`,
			},
			series: [
				{
					type: "treemap",
					roam: false,
					nodeClick: false,
					breadcrumb: { show: false },
					left: 0,
					right: 0,
					top: 0,
					bottom: 0,
					label: {
						show: true,
						formatter: (params) =>
							`${params.name}\n${formatCOP(params.value)}`,
						color: "#ffffff",
						fontSize: 11,
						lineHeight: 17,
						fontWeight: 600,
						overflow: "truncate",
					},
					upperLabel: { show: false },
					itemStyle: {
						borderColor: t.surface,
						borderWidth: 4,
						gapWidth: 2,
						borderRadius: 8,
					},
					emphasis: {
						itemStyle: { shadowBlur: 12, shadowColor: "rgba(0,0,0,0.25)" },
					},
					data: rows.map((row, index) => ({
						name: row.nombre,
						value: row.total,
						itemStyle: {
							color: CHART_COLORS[index % CHART_COLORS.length],
						},
					})),
				},
			],
		};
	}, [data, darkMode]);

	const horasOption = useMemo(() => {
		const t = getChartTheme(darkMode);
		const rows = data?.por_hora ?? [];

		return {
			aria: { enabled: true },
			tooltip: {
				...t.tooltip,
				trigger: "axis",
				axisPointer: { type: "shadow" },
				formatter: (params) => {
					const row = rows[params?.[0]?.dataIndex ?? 0];
					if (!row) return "";
					return `<b>${formatHora(row.hora)}</b><br/>${row.pedidos} pedido(s)`;
				},
			},
			grid: { left: 4, right: 12, top: 28, bottom: 4, containLabel: true },
			xAxis: {
				type: "category",
				data: rows.map((row) => `${String(row.hora).padStart(2, "0")}h`),
				axisTick: { show: false },
				axisLine: { lineStyle: { color: t.grid } },
				axisLabel: { color: t.muted, fontSize: 10, interval: 1 },
			},
			yAxis: {
				type: "value",
				axisLabel: { color: t.muted, fontSize: 10 },
				splitLine: { lineStyle: { color: t.grid, type: "dashed" } },
			},
			series: [
				{
					type: "bar",
					data: rows.map((row) => row.pedidos),
					barMaxWidth: 18,
					itemStyle: {
						borderRadius: [6, 6, 0, 0],
						color: verticalGradient(AMBER, "rgba(245,158,11,0.25)"),
					},
					markLine: {
						silent: true,
						symbol: "none",
						label: { formatter: "Promedio", color: t.muted, fontSize: 10 },
						lineStyle: { color: BRAND_SOFT, type: "dashed", width: 1.4 },
						data: [{ type: "average", name: "Promedio" }],
					},
				},
			],
		};
	}, [data, darkMode]);

	const updatedLabel = lastUpdated
		? HORA_ACTUAL.format(lastUpdated)
		: "sin actualizar";

	return (
		<Dashboard
			title="Resumen"
			description="Ventas, pedidos y comportamiento de tu restaurante en un solo vistazo."
			icon={LayoutDashboard}
			eyebrow="SIGR · Administración"
		>
			<div className="space-y-5">
				<div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
					<div className="flex flex-wrap items-center gap-2">
						<span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-xs font-medium text-muted">
							<ChefHat className="size-4 text-accent" />
							{user?.restaurante?.nombre ?? "Tu restaurante"}
						</span>
						<span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-xs font-medium text-muted">
							<CalendarDays className="size-4 text-accent" />
							{data
								? `${fechaCorta(data.periodo.desde)} – ${fechaCorta(data.periodo.hasta)}`
								: "Cargando periodo"}
						</span>
						{resumen?.activos > 0 && (
							<span className="inline-flex items-center gap-2 rounded-full border border-warning/30 bg-warning/10 px-4 py-2 text-xs font-semibold text-warning">
								<Flame className="size-4" />
								{resumen.activos} pedido(s) en curso
							</span>
						)}
					</div>

					<div className="flex flex-wrap items-center gap-2">
						<div className="flex rounded-xl border border-border bg-surface p-1">
							{RANGES.map((item) => (
								<button
									key={item.id}
									type="button"
									aria-pressed={range === item.id}
									onClick={() => changeRange(item.id)}
									className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
										range === item.id
											? "bg-accent text-accent-foreground"
											: "text-muted hover:text-foreground"
									}`}
								>
									{item.label}
								</button>
							))}
						</div>
						<TooltipButton
							label="Actualizar estadísticas"
							type="button"
							onClick={refresh}
							disabled={loading}
							aria-label="Actualizar estadísticas"
							className="flex size-9 items-center justify-center rounded-xl border border-border bg-surface text-muted transition-colors hover:border-accent/40 hover:text-accent disabled:cursor-wait"
						>
							<RefreshCw
								className={`size-4 ${loading ? "animate-spin" : ""}`}
							/>
						</TooltipButton>
						<span className="text-[11px] text-muted">
							Actualizado {updatedLabel}
						</span>
					</div>
				</div>

				{error && data && (
					<div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
						<span className="inline-flex items-center gap-2">
							<AlertTriangle className="size-4" />
							{error}
						</span>
						<button
							type="button"
							onClick={refresh}
							className="rounded-lg border border-danger/40 px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-danger hover:text-danger-foreground"
						>
							Reintentar
						</button>
					</div>
				)}

				{loading && !data ? (
					<StatsSkeleton />
				) : !data ? (
					<div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface px-6 py-16 text-center">
						<AlertTriangle className="size-8 text-danger/60" />
						<p className="mt-3 text-base font-semibold text-foreground">
							No pudimos cargar el resumen
						</p>
						<p className="mt-1 max-w-sm text-sm text-muted">
							{error || "Revisa tu conexión e intenta de nuevo."}
						</p>
						<button
							type="button"
							onClick={refresh}
							className="mt-5 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground"
						>
							Reintentar
						</button>
					</div>
				) : (
					<>
						<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
							<KpiCard
								icon={Banknote}
								label="Ventas"
								value={formatCOP(resumen.ventas)}
								delta={deltaOf(resumen.ventas, resumen.ventas_anterior)}
								hint="vs. periodo anterior"
								delay={0}
							/>
							<KpiCard
								icon={ShoppingBag}
								label="Pedidos"
								value={resumen.pedidos}
								delta={deltaOf(resumen.pedidos, resumen.pedidos_anterior)}
								hint={`${resumen.activos} en curso`}
								delay={0.05}
							/>
							<KpiCard
								icon={TrendingUp}
								label="Ticket promedio"
								value={formatCOP(resumen.ticket_promedio)}
								delta={deltaOf(resumen.ticket_promedio, resumen.ticket_anterior)}
								hint="por pedido"
								delay={0.1}
							/>
							<KpiCard
								icon={Users}
								label="Clientes"
								value={resumen.clientes}
								delta={null}
								hint={`${resumen.tasa_cancelacion}% de cancelación`}
								delay={0.15}
							/>
						</div>

						{!hasOrders ? (
							<div className="relative overflow-hidden rounded-2xl border border-border bg-surface px-6 py-14 text-center">
								<div className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-accent/5 to-transparent" />
								<span className="relative mx-auto flex size-16 items-center justify-center rounded-2xl bg-accent/10 text-accent">
									<Sparkles className="size-8" />
								</span>
								<h2 className="relative mt-5 text-xl font-semibold text-foreground">
									Todavía no hay ventas en los últimos {range} días
								</h2>
								<p className="relative mx-auto mt-2 max-w-md text-sm text-muted">
									Cuando tus clientes empiecen a pedir verás aquí los
									ingresos, el ticket promedio, los platillos más vendidos y
									las horas con más demanda.
								</p>
								{hoy && (
									<p className="relative mt-3 text-xs text-muted">
										Hoy: {formatCOP(hoy.ventas)} · {hoy.pedidos} pedido(s)
									</p>
								)}
								<Link
									to="/dashboard/recetas"
									className="relative mt-6 inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground"
								>
									<ChefHat className="size-4" />
									Revisar mis recetas
								</Link>
							</div>
						) : (
							<div className="space-y-4">
								<div className="grid gap-4 xl:grid-cols-3">
									<ChartCard
										title="Ingresos y pedidos"
										subtitle="Evolución diaria del periodo seleccionado"
										className="xl:col-span-2"
									>
										{resumen.pedidos > 0 ? (
											<EChart
												option={ingresosOption}
												height={320}
												ariaLabel="Gráfica de ingresos y pedidos por día"
											/>
										) : (
											<EmptyChart message="No hay pedidos válidos en este periodo." />
										)}
									</ChartCard>

									<ChartCard
										title="Estado de los pedidos"
										subtitle="Distribución por etapa"
									>
										{totalEstados > 0 ? (
											<EChart
												option={estadosOption}
												height={320}
												ariaLabel="Gráfica de pedidos por estado"
											/>
										) : (
											<EmptyChart message="No hay pedidos registrados en este periodo." />
										)}
									</ChartCard>
								</div>

								<div className="grid gap-4 xl:grid-cols-2">
									<ChartCard
										title="Platillos más vendidos"
										subtitle="Unidades pedidas en el periodo"
									>
										{topPlatillos.length > 0 ? (
											<EChart
												option={topPlatillosOption}
												height={300}
												ariaLabel="Gráfica de platillos más vendidos"
											/>
										) : (
											<EmptyChart message="Aún no hay platillos vendidos en este periodo." />
										)}
									</ChartCard>

									<ChartCard
										title="Ventas por categoría"
										subtitle="Participación dentro de los ingresos"
									>
										{categorias.length > 0 ? (
											<EChart
												option={categoriasOption}
												height={300}
												ariaLabel="Gráfica de ventas por categoría"
											/>
										) : (
											<EmptyChart message="Las categorías aparecerán cuando haya ventas." />
										)}
									</ChartCard>
								</div>

								<div className="grid gap-4 xl:grid-cols-3">
									<ChartCard
										title="Pedidos por hora"
										subtitle="Horas con mayor demanda"
										className="xl:col-span-2"
									>
										{totalHoras > 0 ? (
											<EChart
												option={horasOption}
												height={280}
												ariaLabel="Gráfica de pedidos por hora"
											/>
										) : (
											<EmptyChart message="Sin pedidos para analizar por hora." />
										)}
									</ChartCard>

									<ChartCard
										title="Métodos de pago"
										subtitle="Cómo pagan tus clientes"
									>
										{metodosPago.length === 0 ? (
											<EmptyMini
												icon={CreditCard}
												text="Aún no hay pagos registrados."
											/>
										) : (
											<div className="space-y-4">
												{metodosPago.map((metodo) => {
													const pct = totalMetodos
														? (metodo.total / totalMetodos) * 100
														: 0;
													return (
														<div key={metodo.metodo}>
															<div className="flex items-baseline justify-between gap-2 text-xs">
																<span className="truncate font-medium text-foreground">
																	{metodo.metodo}
																</span>
																<span className="shrink-0 text-muted">
																	{formatCOP(metodo.total)}
																</span>
															</div>
															<div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-default">
																<div
																	className="h-full rounded-full bg-gradient-to-r from-accent to-rose-500"
																	style={{ width: `${pct}%` }}
																/>
															</div>
															<p className="mt-1 text-[10px] text-muted">
																{metodo.pedidos} pedido(s) ·{" "}
																{pct.toFixed(0)}%
															</p>
														</div>
													);
												})}
											</div>
										)}
									</ChartCard>
								</div>
							</div>
						)}

						<div className="grid gap-4 xl:grid-cols-3">
							<ChartCard
								title="Pedidos recientes"
								subtitle="Últimos movimientos de la tienda"
								className="xl:col-span-2"
							>
								{recientes.length === 0 ? (
									<EmptyMini
										icon={ShoppingBag}
										text="Todavía no hay pedidos recientes."
									/>
								) : (
									<ul className="divide-y divide-border">
										{recientes.map((order) => (
											<li
												key={order.id}
												className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0"
											>
												<span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-default text-muted">
													<ShoppingBag className="size-4" />
												</span>
												<div className="min-w-0 flex-1">
													<div className="flex flex-wrap items-center gap-2">
														<p className="truncate text-sm font-semibold text-foreground">
															{order.numero}
														</p>
														<span
															className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
																STATUS_STYLES[order.estado] ??
																"bg-default text-muted"
															}`}
														>
															{order.estado_label}
														</span>
													</div>
													<p className="truncate text-[11px] text-muted">
														{order.cliente} · {order.items} artículo(s) ·{" "}
														{formatDateTime(order.created_at)}
													</p>
												</div>
												<span className="text-sm font-semibold text-foreground">
													{formatCOP(order.total)}
												</span>
											</li>
										))}
									</ul>
								)}
							</ChartCard>

							<ChartCard
								title="Stock por reponer"
								subtitle="Recetas con 5 unidades o menos"
							>
								{stockBajo.length === 0 ? (
									<EmptyMini
										icon={PackageSearch}
										text="Todo el inventario está por encima de 5 unidades."
									/>
								) : (
									<ul className="space-y-2">
										{stockBajo.map((dish) => (
											<li
												key={dish.id}
												className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background px-3 py-2.5"
											>
												<div className="min-w-0">
													<p className="truncate text-xs font-medium text-foreground">
														{dish.nombre}
													</p>
													{!dish.is_active && (
														<p className="text-[10px] text-muted">Inactiva</p>
													)}
												</div>
												<span
													className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
														dish.stock === 0
															? "bg-danger/10 text-danger"
															: "bg-warning/10 text-warning"
													}`}
												>
													{dish.stock} uds.
												</span>
											</li>
										))}
									</ul>
								)}
								<Link
									to="/dashboard/recetas"
									className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline"
								>
									Administrar recetas
									<ArrowUpRight className="size-3.5" />
								</Link>
							</ChartCard>
						</div>
					</>
				)}
			</div>
		</Dashboard>
	);
}

export default Stats;
