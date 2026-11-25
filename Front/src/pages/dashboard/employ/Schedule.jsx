import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
	AlertCircle,
	CalendarClock,
	CalendarDays,
	ChevronLeft,
	ChevronRight,
	Clock3,
	Plus,
	RefreshCw,
	UsersRound,
} from "lucide-react";
import {
	createShift,
	deleteShift,
	getApiErrorMessage,
	getEmployees,
	getShifts,
	updateShift,
} from "../../../Api/clientApi";
import { normalizeRole } from "../../../config/sidebarNav";
import useStore from "../../../store/useStore";
import Dashboard from "../Dashboard";
import ShiftCalendar from "../../../components/shifts/ShiftCalendar";
import ShiftDayPanel from "../../../components/shifts/ShiftDayPanel";
import ShiftFormModal from "../../../components/shifts/ShiftFormModal";
import ShiftWeekView from "../../../components/shifts/ShiftWeekView";
import { SHIFT_TYPE_META } from "../../../components/shifts/shiftMeta";
import {
	addDays,
	addMonths,
	formatDayLong,
	formatMonthYear,
	formatShiftRange,
	monthRange,
	parseISODate,
	startOfMonth,
	startOfWeek,
	toISODate,
	weekRange,
} from "../../../utils/calendar";

const normalizeErrors = (error) => {
	const data = error?.response?.data;
	if (!data || typeof data !== "object") {
		return {
			detalle: getApiErrorMessage(
				error,
				"No se pudo guardar el turno.",
			),
		};
	}

	const errors = {};
	Object.entries(data).forEach(([key, value]) => {
		if (key === "fechas_conflicto") {
			errors[key] = Array.isArray(value) ? value : [String(value)];
		} else if (Array.isArray(value)) {
			errors[key] = value.join(" ");
		} else if (value && typeof value === "object") {
			errors[key] = Object.values(value).flat().join(" ");
		} else {
			errors[key] = String(value);
		}
	});
	return errors;
};

const STAT_CARDS = [
	{
		id: "total",
		label: "Turnos del periodo",
		icon: CalendarDays,
		tone: "bg-accent/10 text-accent",
	},
	{
		id: "hours",
		label: "Horas programadas",
		icon: Clock3,
		tone: "bg-warning/10 text-warning",
	},
	{
		id: "employees",
		label: "Empleados cubiertos",
		icon: UsersRound,
		tone: "bg-success/10 text-success",
	},
];

const NOTICE_STYLES = {
	success: "border-success/30 bg-success/10 text-success",
	warning: "border-warning/30 bg-warning/10 text-warning",
	error: "border-danger/30 bg-danger/10 text-danger",
};

function Schedule() {
	const { user } = useStore();
	const isAdmin = normalizeRole(user?.rol) === "administrador";

	const [view, setView] = useState("mes");
	const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
	const [direction, setDirection] = useState(1);
	const [selectedDate, setSelectedDate] = useState(null);
	const [shifts, setShifts] = useState([]);
	const [employees, setEmployees] = useState([]);
	const [employeeFilter, setEmployeeFilter] = useState("todos");
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState("");
	const [notice, setNotice] = useState(null);
	const [form, setForm] = useState(null);
	const [lastUpdated, setLastUpdated] = useState(null);
	const [reloadKey, setReloadKey] = useState(0);

	useEffect(() => {
		let active = true;
		const range = view === "mes" ? monthRange(cursor) : weekRange(cursor);
		const params = { ...range };
		if (isAdmin && employeeFilter !== "todos") {
			params.empleado = employeeFilter;
		}

		getShifts(params)
			.then((items) => {
				if (!active) return;
				setShifts(items);
				setLastUpdated(new Date());
				setError("");
			})
			.catch((requestError) => {
				if (active) {
					setError(
						getApiErrorMessage(
							requestError,
							"No se pudieron cargar los turnos.",
						),
					);
				}
			})
			.finally(() => {
				if (!active) return;
				setLoading(false);
				setRefreshing(false);
			});

		return () => {
			active = false;
		};
	}, [cursor, view, employeeFilter, isAdmin, reloadKey]);

	useEffect(() => {
		if (!isAdmin) return undefined;
		let active = true;
		getEmployees()
			.then((items) => {
				if (active) setEmployees(items);
			})
			.catch(() => {
				if (active) setEmployees([]);
			});
		return () => {
			active = false;
		};
	}, [isAdmin]);

	useEffect(() => {
		if (!notice) return undefined;
		const timer = window.setTimeout(() => setNotice(null), 4500);
		return () => window.clearTimeout(timer);
	}, [notice]);

	useEffect(() => {
		const open = Boolean(selectedDate || form);
		document.body.style.overflow = open ? "hidden" : "";
		return () => {
			document.body.style.overflow = "";
		};
	}, [selectedDate, form]);

	const periodLabel =
		view === "mes"
			? formatMonthYear(cursor)
			: `Semana del ${formatDayLong(startOfWeek(cursor))}`;

	const periodShifts = useMemo(() => {
		if (view !== "mes") return shifts;
		const prefix = `${cursor.getFullYear()}-${String(
			cursor.getMonth() + 1,
		).padStart(2, "0")}`;
		return shifts.filter((shift) => shift.fecha.startsWith(prefix));
	}, [shifts, view, cursor]);

	const stats = useMemo(() => {
		const employeesCovered = new Set(
			periodShifts.map((shift) => shift.empleado),
		);
		const hours = periodShifts.reduce(
			(total, shift) => total + Number(shift.duracion_horas || 0),
			0,
		);
		const todayISO = toISODate(new Date());
		const upcoming = shifts
			.filter(
				(shift) =>
					shift.fecha >= todayISO && shift.estado !== "cancelado",
			)
			.sort((first, second) =>
				`${first.fecha}${first.hora_inicio}`.localeCompare(
					`${second.fecha}${second.hora_inicio}`,
				),
			)[0];

		return {
			total: periodShifts.length,
			hours: Math.round(hours * 10) / 10,
			employees: employeesCovered.size,
			upcoming,
		};
	}, [periodShifts, shifts]);

	const selectedShifts = useMemo(
		() =>
			selectedDate
				? shifts
						.filter((shift) => shift.fecha === selectedDate)
						.sort((first, second) =>
							first.hora_inicio.localeCompare(second.hora_inicio),
						)
				: [],
		[selectedDate, shifts],
	);

	const move = (delta) => {
		setLoading(true);
		setDirection(delta);
		setSelectedDate(null);
		setCursor((current) =>
			view === "mes"
				? addMonths(current, delta)
				: addDays(startOfWeek(current), delta * 7),
		);
	};

	const goToday = () => {
		const today = new Date();
		setLoading(true);
		setDirection(1);
		setSelectedDate(toISODate(today));
		setCursor(
			view === "mes" ? startOfMonth(today) : startOfWeek(today),
		);
	};

	const refresh = () => {
		setLoading(true);
		setRefreshing(true);
		setReloadKey((key) => key + 1);
	};

	const defaultFormDate = () => {
		if (selectedDate) return parseISODate(selectedDate);
		const today = new Date();
		if (view === "mes") {
			return today.getMonth() === cursor.getMonth() &&
				today.getFullYear() === cursor.getFullYear()
				? today
				: cursor;
		}
		const weekStart = startOfWeek(cursor);
		const todayISO = toISODate(today);
		const startISO = toISODate(weekStart);
		const endISO = toISODate(addDays(weekStart, 6));
		return todayISO >= startISO && todayISO <= endISO
			? today
			: weekStart;
	};

	const openCreate = () => {
		setForm({ shift: null, date: defaultFormDate() });
	};

	const handleSubmit = async (payload) => {
		try {
			if (form?.shift) {
				const updated = await updateShift(form.shift.id, payload);
				setShifts((current) =>
					current.map((item) =>
						item.id === updated.id ? updated : item,
					),
				);
				setNotice({ type: "success", message: "Turno actualizado." });
			} else {
				const result = await createShift(payload);
				const created = result?.turnos ?? [];
				const omitted = result?.omitidos ?? [];

				setShifts((current) => {
					const ids = new Set(created.map((item) => item.id));
					return [
						...current.filter((item) => !ids.has(item.id)),
						...created,
					];
				});

				setNotice({
					type: omitted.length > 0 ? "warning" : "success",
					message:
						omitted.length > 0
							? `Turnos creados. Se omitieron ${omitted.length} fecha(s) con conflicto.`
							: created.length > 1
								? `${created.length} turnos creados.`
								: "Turno creado.",
				});
			}
			setForm(null);
			return { ok: true };
		} catch (requestError) {
			return { ok: false, errors: normalizeErrors(requestError) };
		}
	};

	const handleDelete = async (shift) => {
		try {
			await deleteShift(shift.id);
			setShifts((current) =>
				current.filter((item) => item.id !== shift.id),
			);
			setNotice({ type: "success", message: "Turno eliminado." });
		} catch (requestError) {
			setNotice({
				type: "error",
				message: getApiErrorMessage(
					requestError,
					"No se pudo eliminar el turno.",
				),
			});
		}
	};

	const handleMoveShift = async (shiftId, targetDate) => {
		const shift = shifts.find((item) => item.id === shiftId);
		if (!shift || shift.fecha === targetDate) return;

		const previousDate = shift.fecha;
		setShifts((current) =>
			current.map((item) =>
				item.id === shiftId ? { ...item, fecha: targetDate } : item,
			),
		);

		try {
			const updated = await updateShift(shiftId, { fecha: targetDate });
			setShifts((current) =>
				current.map((item) =>
					item.id === shiftId ? updated : item,
				),
			);
			setNotice({
				type: "success",
				message: `Turno movido al ${formatDayLong(
					parseISODate(targetDate),
				)}.`,
			});
		} catch (requestError) {
			setShifts((current) =>
				current.map((item) =>
					item.id === shiftId
						? { ...item, fecha: previousDate }
						: item,
				),
			);
			const errors = normalizeErrors(requestError);
			setNotice({
				type: "error",
				message:
					errors.hora_inicio ||
					errors.detalle ||
					"No se pudo mover el turno.",
			});
		}
	};

	return (
		<Dashboard
			title="Turnos"
			description="Programa, ajusta y consulta la agenda de tu equipo."
			icon={CalendarClock}
			eyebrow="SIGR · Operación"
		>
			<div className="space-y-5">
				<div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
					<div className="flex flex-wrap items-center gap-2">
						<button
							type="button"
							onClick={() => move(-1)}
							aria-label="Periodo anterior"
							className="flex size-9 items-center justify-center rounded-full border border-border bg-surface text-muted transition-colors hover:border-accent/40 hover:text-accent"
						>
							<ChevronLeft className="size-4" />
						</button>
						<button
							type="button"
							onClick={goToday}
							className="rounded-full border border-border bg-surface px-3 py-2 text-xs font-semibold text-muted transition-colors hover:border-accent/40 hover:text-accent"
						>
							Hoy
						</button>
						<button
							type="button"
							onClick={() => move(1)}
							aria-label="Periodo siguiente"
							className="flex size-9 items-center justify-center rounded-full border border-border bg-surface text-muted transition-colors hover:border-accent/40 hover:text-accent"
						>
							<ChevronRight className="size-4" />
						</button>

						<AnimatePresence mode="wait" initial={false}>
							<motion.h2
								key={periodLabel}
								initial={{ opacity: 0, y: 6 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -6 }}
								transition={{ duration: 0.18 }}
								className="ml-1 font-advercase text-2xl font-semibold text-foreground"
							>
								{periodLabel}
							</motion.h2>
						</AnimatePresence>
					</div>

					<div className="flex flex-wrap items-center gap-2">
						{isAdmin && (
							<select
								value={employeeFilter}
								onChange={(event) => {
									setLoading(true);
									setEmployeeFilter(event.target.value);
								}}
								aria-label="Filtrar por empleado"
								className="rounded-xl border border-border bg-surface px-3 py-2 text-xs font-medium text-muted outline-none transition focus:border-accent/50"
							>
								<option value="todos">Todo el equipo</option>
								{employees.map((employee) => (
									<option key={employee.id} value={employee.id}>
										{employee.username}
									</option>
								))}
							</select>
						)}

						<div className="inline-flex rounded-xl border border-border bg-surface p-1">
							{[
								["mes", "Mes"],
								["semana", "Semana"],
							].map(([id, label]) => (
								<button
									key={id}
									type="button"
									aria-pressed={view === id}
									onClick={() => {
										setLoading(true);
										setView(id);
										setSelectedDate(null);
									}}
									className={`relative rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
										view === id
											? "text-accent-foreground"
											: "text-muted hover:text-foreground"
									}`}
								>
									{view === id && (
										<motion.span
											layoutId="shift-view-pill"
											className="absolute inset-0 rounded-lg bg-accent"
											transition={{
												type: "spring",
												stiffness: 400,
												damping: 32,
											}}
										/>
									)}
									<span className="relative z-10">{label}</span>
								</button>
							))}
						</div>

						<button
							type="button"
							onClick={refresh}
							aria-label="Actualizar turnos"
							className="flex size-9 items-center justify-center rounded-full border border-border bg-surface text-muted transition-colors hover:border-accent/40 hover:text-accent"
						>
							<RefreshCw
								className={`size-4 ${
									refreshing ? "animate-spin" : ""
								}`}
							/>
						</button>

						{isAdmin && (
							<button
								type="button"
								onClick={openCreate}
								className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-3.5 py-2 text-xs font-semibold text-accent-foreground transition-transform hover:scale-[1.02] active:scale-[0.98]"
							>
								<Plus className="size-4" />
								Nuevo turno
							</button>
						)}
					</div>
				</div>

				<motion.div
					initial="hidden"
					animate="show"
					variants={{
						hidden: {},
						show: { transition: { staggerChildren: 0.05 } },
					}}
					className="grid grid-cols-2 gap-3 lg:grid-cols-4"
				>
					{STAT_CARDS.map((card) => {
						const Icon = card.icon;
						const value =
							card.id === "total"
								? stats.total
								: card.id === "hours"
									? `${stats.hours} h`
									: stats.employees;
						return (
							<motion.div
								key={card.id}
								variants={{
									hidden: { opacity: 0, y: 10 },
									show: { opacity: 1, y: 0 },
								}}
								className="rounded-2xl border border-border bg-surface p-4"
							>
								<span
									className={`flex size-9 items-center justify-center rounded-xl ${card.tone}`}
								>
									<Icon className="size-4" />
								</span>
								<p className="mt-3 text-2xl font-semibold text-foreground">
									{value}
								</p>
								<p className="mt-0.5 text-xs text-muted">
									{card.label}
								</p>
							</motion.div>
						);
					})}

					<motion.div
						variants={{
							hidden: { opacity: 0, y: 10 },
							show: { opacity: 1, y: 0 },
						}}
						className="rounded-2xl border border-border bg-surface p-4"
					>
						<span className="flex size-9 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-300">
							<CalendarClock className="size-4" />
						</span>
						<p className="mt-3 truncate text-sm font-semibold text-foreground">
							{stats.upcoming
								? formatDayLong(
										parseISODate(stats.upcoming.fecha),
									)
								: "Sin turnos próximos"}
						</p>
						<p className="mt-0.5 truncate text-xs text-muted">
							{stats.upcoming
								? `${stats.upcoming.empleado_nombre} · ${formatShiftRange(
										stats.upcoming,
									)}`
								: "Programa el siguiente turno"}
						</p>
					</motion.div>
				</motion.div>

				<AnimatePresence>
					{error && (
						<motion.div
							initial={{ opacity: 0, y: -6 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -6 }}
							className="flex flex-wrap items-center gap-2 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger"
						>
							<AlertCircle className="size-4 shrink-0" />
							<span className="flex-1">{error}</span>
							<button
								type="button"
								onClick={refresh}
								className="rounded-lg border border-danger/30 px-2.5 py-1 text-xs font-semibold"
							>
								Reintentar
							</button>
						</motion.div>
					)}
				</AnimatePresence>

				<AnimatePresence>
					{notice && (
						<motion.div
							key={`${notice.type}-${notice.message}`}
							initial={{ opacity: 0, y: -6 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -6 }}
							className={`rounded-xl border px-4 py-3 text-sm font-medium ${
								NOTICE_STYLES[notice.type] ??
								NOTICE_STYLES.success
							}`}
						>
							{notice.message}
						</motion.div>
					)}
				</AnimatePresence>

				<motion.section
					initial={{ opacity: 0, y: 12 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.1, duration: 0.3 }}
					className="rounded-2xl border border-border bg-surface p-2.5 shadow-sm md:p-4"
				>
					{view === "mes" ? (
						<ShiftCalendar
							cursor={cursor}
							direction={direction}
							shifts={shifts}
							selectedDate={selectedDate}
							onSelectDay={setSelectedDate}
							onMoveShift={handleMoveShift}
							isAdmin={isAdmin}
						/>
					) : (
						<ShiftWeekView
							cursor={cursor}
							shifts={shifts}
							selectedDate={selectedDate}
							onSelectDay={setSelectedDate}
							onMoveShift={handleMoveShift}
							isAdmin={isAdmin}
						/>
					)}

					<div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
						<div className="flex flex-wrap items-center gap-3 text-[11px] text-muted">
							{Object.values(SHIFT_TYPE_META).map((meta) => (
								<span
									key={meta.id}
									className="inline-flex items-center gap-1.5"
								>
									<span
										className={`size-2 rounded-full ${meta.dot}`}
									/>
									{meta.label}
								</span>
							))}
							{isAdmin && (
								<span className="text-muted/80">
									Arrastra un turno para reprogramarlo
								</span>
							)}
						</div>
						<div className="flex items-center gap-2 text-[11px] text-muted">
							{loading && (
								<span className="inline-flex items-center gap-1">
									<RefreshCw className="size-3 animate-spin" />
									Cargando…
								</span>
							)}
							{lastUpdated && (
								<span>
									Actualizado{" "}
									{lastUpdated.toLocaleTimeString("es-CO", {
										hour: "2-digit",
										minute: "2-digit",
									})}
								</span>
							)}
						</div>
					</div>
				</motion.section>
			</div>

			<AnimatePresence>
				{selectedDate && (
					<ShiftDayPanel
						key={selectedDate}
						date={parseISODate(selectedDate)}
						shifts={selectedShifts}
						isAdmin={isAdmin}
						onClose={() => setSelectedDate(null)}
						onEdit={(shift) =>
							setForm({
								shift,
								date: parseISODate(shift.fecha),
							})
						}
						onDelete={handleDelete}
						onCreate={openCreate}
					/>
				)}
			</AnimatePresence>

			<AnimatePresence>
				{form && (
					<ShiftFormModal
						key={
							form.shift
								? `edit-${form.shift.id}`
								: `create-${toISODate(form.date)}`
						}
						shift={form.shift}
						date={form.date}
						employees={employees}
						onClose={() => setForm(null)}
						onSubmit={handleSubmit}
					/>
				)}
			</AnimatePresence>
		</Dashboard>
	);
}

export default Schedule;
