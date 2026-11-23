import { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
	CalendarOff,
	Clock,
	Pencil,
	Plus,
	Trash2,
	X,
} from "lucide-react";
import { formatDayLong, formatShiftRange } from "../../utils/calendar";
import { getStateMeta, getTypeMeta } from "./shiftMeta";

function ShiftDayPanel({
	date,
	shifts,
	isAdmin,
	onClose,
	onEdit,
	onDelete,
	onCreate,
}) {
	const [confirming, setConfirming] = useState(null);

	useEffect(() => {
		const handler = (event) => {
			if (event.key === "Escape") onClose();
		};
		window.addEventListener("keydown", handler);
		return () => window.removeEventListener("keydown", handler);
	}, [onClose]);

	return (
		<>
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				onClick={onClose}
				className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm"
			/>

			<motion.aside
				role="dialog"
				aria-modal="true"
				aria-label={`Turnos del ${formatDayLong(date)}`}
				initial={{ opacity: 0, y: 32 }}
				animate={{ opacity: 1, y: 0 }}
				exit={{ opacity: 0, y: 24 }}
				transition={{ type: "spring", stiffness: 320, damping: 32 }}
				className="fixed inset-x-0 bottom-0 z-50 flex max-h-[86dvh] flex-col rounded-t-3xl border border-border bg-surface shadow-2xl md:inset-y-0 md:left-auto md:right-0 md:max-h-none md:w-[26rem] md:rounded-none md:border-y-0 md:border-r-0"
			>
				<header className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
					<div>
						<p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">
							Agenda del día
						</p>
						<h2 className="mt-1 text-lg font-semibold text-foreground">
							{formatDayLong(date)}
						</h2>
						<p className="mt-0.5 text-xs text-muted">
							{shifts.length}{" "}
							{shifts.length === 1 ? "turno" : "turnos"}{" "}
							programados
						</p>
					</div>
					<button
						type="button"
						onClick={onClose}
						aria-label="Cerrar agenda del día"
						className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border text-muted transition-colors hover:border-accent/40 hover:text-accent"
					>
						<X className="size-4" />
					</button>
				</header>

				{isAdmin && (
					<div className="px-5 pt-4">
						<button
							type="button"
							onClick={onCreate}
							className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition-transform hover:scale-[1.01] active:scale-[0.99]"
						>
							<Plus className="size-4" />
							Nuevo turno
						</button>
					</div>
				)}

				<div className="flex-1 space-y-2.5 overflow-y-auto px-5 py-4">
					{shifts.length === 0 ? (
						<div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border px-6 py-12 text-center">
							<CalendarOff className="size-8 text-muted" />
							<p className="mt-3 text-sm font-medium text-foreground">
								No hay turnos este día
							</p>
							<p className="mt-1 text-xs text-muted">
								{isAdmin
									? "Usa «Nuevo turno» para programar al equipo."
									: "Tu administrador todavía no ha programado turnos."}
							</p>
						</div>
					) : (
						shifts.map((shift) => {
							const type = getTypeMeta(shift.tipo);
							const state = getStateMeta(shift.estado);
							const TypeIcon = type.icon;

							return (
								<motion.article
									key={shift.id}
									layout
									initial={{ opacity: 0, y: 8 }}
									animate={{ opacity: 1, y: 0 }}
									className="rounded-2xl border border-border bg-background/40 p-3"
								>
									<div className="flex items-start justify-between gap-2">
										<div className="min-w-0">
											<p className="truncate text-sm font-semibold text-foreground">
												{shift.empleado_nombre}
											</p>
											<p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
												<Clock className="size-3.5 shrink-0" />
												{formatShiftRange(shift)}
											</p>
										</div>
										<span
											className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${type.chip}`}
										>
											<TypeIcon className="size-3" />
											{type.label}
										</span>
									</div>

									<div className="mt-2.5 flex flex-wrap items-center gap-1.5">
										<span
											className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${state.chip}`}
										>
											{state.label}
										</span>
										<span className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted">
											{shift.duracion_horas} h
										</span>
									</div>

									{shift.notas && (
										<p className="mt-2 rounded-lg bg-surface-secondary/60 px-2.5 py-1.5 text-xs text-muted">
											{shift.notas}
										</p>
									)}

									{isAdmin && (
										<div className="mt-3 flex items-center gap-2">
											<button
												type="button"
												onClick={() => onEdit(shift)}
												className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-[11px] font-semibold text-muted transition-colors hover:border-accent/40 hover:text-accent"
											>
												<Pencil className="size-3.5" />
												Editar
											</button>

											{confirming === shift.id ? (
												<div className="ml-auto flex items-center gap-1.5">
													<span className="text-[11px] font-medium text-danger">
														¿Eliminar?
													</span>
													<button
														type="button"
														onClick={() => {
															onDelete(shift);
															setConfirming(null);
														}}
														className="rounded-lg bg-danger px-2.5 py-1.5 text-[11px] font-semibold text-danger-foreground"
													>
														Sí
													</button>
													<button
														type="button"
														onClick={() => setConfirming(null)}
														className="rounded-lg border border-border px-2.5 py-1.5 text-[11px] font-semibold text-muted"
													>
														No
													</button>
												</div>
											) : (
												<button
													type="button"
													onClick={() => setConfirming(shift.id)}
													className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-danger/30 px-2.5 py-1.5 text-[11px] font-semibold text-danger transition-colors hover:bg-danger/10"
												>
													<Trash2 className="size-3.5" />
													Eliminar
												</button>
											)}
										</div>
									)}
								</motion.article>
							);
						})
					)}

					{!isAdmin && (
						<p className="rounded-xl border border-border bg-surface-secondary px-3 py-2 text-[11px] text-muted">
							Vista de solo lectura. Tu administrador gestiona los
							cambios de la agenda.
						</p>
					)}
				</div>
			</motion.aside>
		</>
	);
}

export default ShiftDayPanel;
