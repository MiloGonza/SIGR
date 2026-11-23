import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
	isToday,
	toISODate,
	weekDays,
	weekdayLabel,
} from "../../utils/calendar";
import ShiftBadge from "./ShiftBadge";

function ShiftWeekView({
	cursor,
	shifts,
	selectedDate,
	onSelectDay,
	onMoveShift,
	isAdmin,
}) {
	const reduceMotion = useReducedMotion();
	const [dragOver, setDragOver] = useState(null);
	const days = weekDays(cursor);

	const byDate = shifts.reduce((groups, shift) => {
		if (!groups[shift.fecha]) groups[shift.fecha] = [];
		groups[shift.fecha].push(shift);
		return groups;
	}, {});

	const handleDrop = (event, iso) => {
		event.preventDefault();
		setDragOver(null);
		const shiftId = event.dataTransfer.getData("text/plain");
		if (shiftId) onMoveShift(shiftId, iso);
	};

	return (
		<div className="overflow-x-auto pb-1">
			<div className="grid min-w-[760px] grid-cols-7 gap-2">
				{days.map((day, index) => {
					const iso = toISODate(day);
					const dayShifts = byDate[iso] ?? [];
					const selected = selectedDate === iso;
					const today = isToday(day);
					const isDragTarget = dragOver === iso;

					return (
						<motion.div
							key={iso}
							initial={reduceMotion ? false : { opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{
								delay: reduceMotion ? 0 : index * 0.03,
								duration: 0.25,
								ease: "easeOut",
							}}
							className={`flex min-h-[240px] flex-col rounded-xl border p-2 transition-colors ${
								selected
									? "border-accent/60 bg-accent/5"
									: "border-border bg-background/40"
							} ${
								isDragTarget
									? "border-accent bg-accent/10 ring-2 ring-accent/30"
									: ""
							}`}
							onDragOver={(event) => {
								if (!isAdmin) return;
								event.preventDefault();
								event.dataTransfer.dropEffect = "move";
								setDragOver(iso);
							}}
							onDragLeave={() =>
								setDragOver((current) =>
									current === iso ? null : current,
								)
							}
							onDrop={(event) => {
								if (isAdmin) handleDrop(event, iso);
							}}
						>
							<button
								type="button"
								onClick={() => onSelectDay(iso)}
								className="flex items-center justify-between rounded-lg px-1 py-1 text-left transition-colors hover:bg-surface-secondary/60"
							>
								<span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
									{weekdayLabel(day)}
								</span>
								<span
									className={`flex size-6 items-center justify-center rounded-full text-xs font-semibold ${
										today
											? "bg-accent text-accent-foreground"
											: "text-foreground"
									}`}
								>
									{day.getDate()}
								</span>
							</button>

							<div className="mt-2 flex flex-1 flex-col gap-1.5">
								{dayShifts.length === 0 ? (
									<div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-border px-2 py-4 text-center text-[10px] text-muted">
										Libre
									</div>
								) : (
									dayShifts.map((shift) => (
										<ShiftBadge
											key={shift.id}
											shift={shift}
											draggable={isAdmin}
										/>
									))
								)}
							</div>

							{dayShifts.length > 0 && (
								<p className="mt-1 px-1 text-[10px] text-muted">
									{dayShifts.length}{" "}
									{dayShifts.length === 1 ? "turno" : "turnos"}
								</p>
							)}
						</motion.div>
					);
				})}
			</div>
		</div>
	);
}

export default ShiftWeekView;
