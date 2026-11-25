import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
	AlertTriangle,
	CalendarDays,
	Clock,
	Repeat,
	StickyNote,
	UserRound,
	X,
} from "lucide-react";
import {
	formatDayLong,
	parseISODate,
	toISODate,
} from "../../utils/calendar";

const TYPE_OPTIONS = [
	{ id: "manana", label: "Mañana" },
	{ id: "tarde", label: "Tarde" },
	{ id: "noche", label: "Noche" },
];

const STATE_OPTIONS = [
	{ id: "programado", label: "Programado" },
	{ id: "confirmado", label: "Confirmado" },
	{ id: "completado", label: "Completado" },
	{ id: "cancelado", label: "Cancelado" },
];

const REPETITION_OPTIONS = [
	{ value: "1", label: "Solo esta vez" },
	{ value: "2", label: "2 semanas" },
	{ value: "4", label: "4 semanas" },
	{ value: "8", label: "8 semanas" },
	{ value: "12", label: "12 semanas" },
];

const inputClass =
	"w-full rounded-xl border border-border bg-background/60 px-3 py-2 text-sm text-foreground outline-none transition focus:border-accent/50 focus:ring-2 focus:ring-accent/20";

const emptyForm = (shift, date) => ({
	empleado:
		shift?.empleado !== undefined && shift?.empleado !== null
			? String(shift.empleado)
			: "",
	fecha: shift?.fecha || (date ? toISODate(date) : toISODate(new Date())),
	hora_inicio: shift?.hora_inicio ? shift.hora_inicio.slice(0, 5) : "07:00",
	hora_fin: shift?.hora_fin ? shift.hora_fin.slice(0, 5) : "13:00",
	tipo: shift?.tipo || "manana",
	estado: shift?.estado || "programado",
	notas: shift?.notas || "",
	repeticiones: "1",
});

function FieldError({ message }) {
	if (!message) return null;
	return <p className="mt-1 text-[11px] font-medium text-danger">{message}</p>;
}

function ShiftFormModal({ shift, date, employees, onClose, onSubmit }) {
	const isEdit = Boolean(shift);
	const [form, setForm] = useState(() => emptyForm(shift, date));
	const [errors, setErrors] = useState({});
	const [conflicts, setConflicts] = useState([]);
	const [submitting, setSubmitting] = useState(false);

	useEffect(() => {
		const handler = (event) => {
			if (event.key === "Escape") onClose();
		};
		window.addEventListener("keydown", handler);
		return () => window.removeEventListener("keydown", handler);
	}, [onClose]);

	const employeeOptions = employees.map((employee) => ({
		id: String(employee.id),
		label: employee.username,
	}));
	if (
		shift &&
		shift.empleado !== undefined &&
		!employeeOptions.some((option) => option.id === String(shift.empleado))
	) {
		employeeOptions.unshift({
			id: String(shift.empleado),
			label: shift.empleado_nombre || "Empleado",
		});
	}
	const selectedEmployee = form.empleado || employeeOptions[0]?.id || "";

	const updateField = (field) => (event) => {
		const { value } = event.target;
		setForm((current) => ({ ...current, [field]: value }));
		setErrors((current) => ({
			...current,
			[field]: undefined,
			detalle: undefined,
		}));
	};

	const submit = async (event, options = {}) => {
		event?.preventDefault();
		if (submitting) return;

		const localErrors = {};
		if (!selectedEmployee) localErrors.empleado = "Selecciona un empleado.";
		if (!form.fecha) localErrors.fecha = "Selecciona una fecha.";
		if (!form.hora_inicio) {
			localErrors.hora_inicio = "Indica la hora de inicio.";
		}
		if (!form.hora_fin) localErrors.hora_fin = "Indica la hora de fin.";
		if (
			form.hora_inicio &&
			form.hora_fin &&
			form.hora_fin <= form.hora_inicio
		) {
			localErrors.hora_fin =
				"La hora de fin debe ser posterior a la de inicio.";
		}
		if (Object.keys(localErrors).length > 0) {
			setErrors(localErrors);
			return;
		}

		setSubmitting(true);
		setErrors({});
		setConflicts([]);

		const payload = {
			empleado: selectedEmployee,
			fecha: form.fecha,
			hora_inicio: form.hora_inicio,
			hora_fin: form.hora_fin,
			tipo: form.tipo,
			estado: form.estado,
			notas: form.notas,
		};
		if (!isEdit) {
			payload.repeticiones = Number(form.repeticiones);
			payload.omitir_conflictos = Boolean(options.omitirConflictos);
		}

		const result = await onSubmit(payload);
		setSubmitting(false);

		if (result?.ok) {
			onClose();
			return;
		}

		const nextErrors = result?.errors ?? {};
		setErrors(nextErrors);
		setConflicts(
			Array.isArray(nextErrors.fechas_conflicto)
				? nextErrors.fechas_conflicto
				: [],
		);
	};

	return (
		<>
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				onClick={onClose}
				className="fixed inset-0 z-[60] bg-background/70 backdrop-blur-sm"
			/>

			<div className="pointer-events-none fixed inset-0 z-[70] flex items-end justify-center p-0 sm:items-center sm:p-6">
				<motion.form
					initial={{ opacity: 0, y: 28, scale: 0.98 }}
					animate={{ opacity: 1, y: 0, scale: 1 }}
					exit={{ opacity: 0, y: 20, scale: 0.98 }}
					transition={{ type: "spring", stiffness: 360, damping: 32 }}
					onSubmit={submit}
					className="pointer-events-auto flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-border bg-surface shadow-2xl sm:rounded-3xl"
				>
					<header className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
						<div>
							<p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">
								{isEdit ? "Editar turno" : "Nuevo turno"}
							</p>
							<h2 className="mt-1 text-lg font-semibold text-foreground">
								{isEdit
									? shift.empleado_nombre || "Turno"
									: "Programa al equipo"}
							</h2>
						</div>
						<button
							type="button"
							onClick={onClose}
							aria-label="Cerrar formulario de turno"
							className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border text-muted transition-colors hover:border-accent/40 hover:text-accent"
						>
							<X className="size-4" />
						</button>
					</header>

					<div className="flex-1 space-y-3.5 overflow-y-auto px-5 py-4">
						{errors.detalle && (
							<div className="rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-xs font-medium text-danger">
								{errors.detalle}
							</div>
						)}

						<label className="block">
							<span className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-muted">
								<UserRound className="size-3.5" />
								Empleado
							</span>
							<select
								value={selectedEmployee}
								onChange={updateField("empleado")}
								className={inputClass}
							>
								<option value="">Selecciona un empleado</option>
								{employeeOptions.map((option) => (
									<option key={option.id} value={option.id}>
										{option.label}
									</option>
								))}
							</select>
							<FieldError message={errors.empleado} />
						</label>

						<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
							<label className="block sm:col-span-1">
								<span className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-muted">
									<CalendarDays className="size-3.5" />
									Fecha
								</span>
								<input
									type="date"
									value={form.fecha}
									onChange={updateField("fecha")}
									className={inputClass}
								/>
								<FieldError message={errors.fecha} />
							</label>

							<label className="block sm:col-span-2">
								<span className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-muted">
									<Clock className="size-3.5" />
									Horario
								</span>
								<div className="flex items-center gap-2">
									<input
										type="time"
										value={form.hora_inicio}
										onChange={updateField("hora_inicio")}
										className={inputClass}
										aria-label="Hora de inicio"
									/>
									<span className="text-xs text-muted">a</span>
									<input
										type="time"
										value={form.hora_fin}
										onChange={updateField("hora_fin")}
										className={inputClass}
										aria-label="Hora de fin"
									/>
								</div>
								<FieldError message={errors.hora_inicio} />
								<FieldError message={errors.hora_fin} />
							</label>
						</div>

						<div className="grid grid-cols-2 gap-3">
							<label className="block">
								<span className="mb-1 block text-xs font-semibold text-muted">
									Franja
								</span>
								<select
									value={form.tipo}
									onChange={updateField("tipo")}
									className={inputClass}
								>
									{TYPE_OPTIONS.map((option) => (
										<option key={option.id} value={option.id}>
											{option.label}
										</option>
									))}
								</select>
							</label>

							<label className="block">
								<span className="mb-1 block text-xs font-semibold text-muted">
									Estado
								</span>
								<select
									value={form.estado}
									onChange={updateField("estado")}
									className={inputClass}
								>
									{STATE_OPTIONS.map((option) => (
										<option key={option.id} value={option.id}>
											{option.label}
										</option>
									))}
								</select>
							</label>
						</div>

						{!isEdit && (
							<label className="block">
								<span className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-muted">
									<Repeat className="size-3.5" />
									Repetir
								</span>
								<select
									value={form.repeticiones}
									onChange={updateField("repeticiones")}
									className={inputClass}
								>
									{REPETITION_OPTIONS.map((option) => (
										<option key={option.value} value={option.value}>
											{option.label}
										</option>
									))}
								</select>
								<p className="mt-1 text-[11px] text-muted">
									Si activas la repetición, el turno se programa cada 7
									días a la misma hora.
								</p>
							</label>
						)}

						<label className="block">
							<span className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-muted">
								<StickyNote className="size-3.5" />
								Notas
							</span>
							<textarea
								rows={3}
								value={form.notas}
								onChange={updateField("notas")}
								placeholder="Instrucciones, relevo, observaciones…"
								className={`${inputClass} resize-none`}
							/>
						</label>

						<AnimatePresence>
							{conflicts.length > 0 && (
								<motion.div
									initial={{ opacity: 0, y: -6 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: -6 }}
									className="rounded-xl border border-warning/30 bg-warning/10 p-3"
								>
									<p className="flex items-center gap-1.5 text-xs font-semibold text-warning">
										<AlertTriangle className="size-4" />
										Fechas con conflicto
									</p>
									<p className="mt-1 text-[11px] text-warning">
										{conflicts
											.map((fecha) =>
												formatDayLong(parseISODate(fecha)),
											)
											.join(" · ")}
									</p>
									<button
										type="button"
										onClick={() =>
											submit(null, { omitirConflictos: true })
										}
										className="mt-2 rounded-lg border border-warning/40 px-2.5 py-1.5 text-[11px] font-semibold text-warning transition-colors hover:bg-warning/15"
									>
										Omitir esas fechas y crear el resto
									</button>
								</motion.div>
							)}
						</AnimatePresence>
					</div>

					<footer className="flex items-center justify-end gap-2 border-t border-border px-5 py-4">
						<button
							type="button"
							onClick={onClose}
							className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-muted transition-colors hover:text-foreground"
						>
							Cancelar
						</button>
						<button
							type="submit"
							disabled={submitting}
							className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
						>
							{submitting
								? "Guardando…"
								: isEdit
									? "Guardar cambios"
									: "Crear turno"}
						</button>
					</footer>
				</motion.form>
			</div>
		</>
	);
}

export default ShiftFormModal;
