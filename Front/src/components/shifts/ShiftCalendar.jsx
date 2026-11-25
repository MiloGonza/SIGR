import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
	isToday,
	monthMatrix,
	toISODate,
	WEEKDAYS,
} from "../../utils/calendar";
import ShiftBadge from "./ShiftBadge";
import { getTypeMeta } from "./shiftMeta";

const gridVariants = {
	enter: (direction) => ({
		opacity: 0,
		x: direction >= 0 ? 36 : -36,
	}),
	center: {
		opacity: 1,
		x: 0,
		transition: {
			duration: 0.28,
			ease: "easeOut",
			staggerChildren: 0.004,
		},
	},
	exit: (direction) => ({
		opacity: 0,
		x: direction >= 0 ? -36 : 36,
		transition: { duration: 0.16, ease: "easeIn" },
	}),
};

const cellVariants = {
	enter: { opacity: 0, y: 8 },
	center: {
		opacity: 1,
		y: 0,
		transition: { duration: 0.2, ease: "easeOut" },
	},
};

function groupByDate(shifts) {
	return shifts.reduce((groups, shift) => {
		if (!groups[shift.fecha]) groups[shift.fecha] = [];
		groups[shift.fecha].push(shift);
		return groups;
	}, {});
}

function ShiftCalendar({
	cursor,
	direction = 1,
	shifts,
	selectedDate,
	onSelectDay,
	onMoveShift,
	isAdmin,
}) {
	const reduceMotion = useReducedMotion();
	const [dragOver, setDragOver] = useState(null);
	const days = monthMatrix(cursor);
	const byDate = groupByDate(shifts);
	const monthKey = `${cursor.getFullYear()}-${cursor.getMonth()}`;

	const handleDrop = (event, iso) => {
		event.preventDefault();
		setDragOver(null);
		const shiftId = event.dataTransfer.getData("text/plain");
		if (shiftId) onMoveShift(shiftId, iso);
	};

	return (
		<div>
			<div className="mb-1.5 grid grid-cols-7 gap-1.5">
				{WEEKDAYS.map((label) => (
					<div
						key={label}
						className="px-1 text-center text-[10px] font-semibold uppercase tracking-wider text-muted sm:text-xs"
					>
						{label}
					</div>
				))}
			</div>

			<div className="overflow-hidden">
				<AnimatePresence mode="wait" initial={false} custom={direction}>
					<motion.div
						key={monthKey}
						custom={direction}
						variants={reduceMotion ? undefined : gridVariants}
						initial={reduceMotion ? false : "enter"}
						animate="center"
						exit={reduceMotion ? undefined : "exit"}
						className="grid grid-cols-7 gap-1.5"
					>
						{days.map((day) => {
							const iso = toISODate(day);
							const dayShifts = byDate[iso] ?? [];
							const outside = day.getMonth() !== cursor.getMonth();
							const selected = selectedDate === iso;
							const today = isToday(day);
							const isDragTarget = dragOver === iso;

							return (
								<motion.div
									key={iso}
									variants={reduceMotion ? undefined : cellVariants}
									role="button"
									tabIndex={0}
									aria-label={`${day.getDate()} de ${day.toLocaleDateString(
										"es-CO",
										{ month: "long" },
									)}, ${dayShifts.length} turnos`}
									aria-pressed={selected}
									onClick={() => onSelectDay(iso)}
									onKeyDown={(event) => {
										if (event.key === "Enter" || event.key === " ") {
											event.preventDefault();
											onSelectDay(iso);
										}
									}}
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
									className={`relative flex min-h-[76px] cursor-pointer flex-col rounded-xl border p-1.5 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent/50 sm:min-h-[108px] ${
										outside
											? "border-transparent bg-surface-secondary/25 text-muted/60"
											: "border-border bg-background/40 hover:border-accent/35"
									} ${
										isDragTarget
											? "border-accent bg-accent/10 ring-2 ring-accent/30"
											: ""
									}`}
								>
									{selected && (
										<motion.span
											layoutId="shift-selected-day"
											className="pointer-events-none absolute inset-0 rounded-xl border-2 border-accent"
											transition={{
												type: "spring",
												stiffness: 420,
												damping: 34,
											}}
										/>
									)}

									<div className="flex items-center justify-between">
										<span
											className={`flex size-6 items-center justify-center rounded-full text-[11px] font-semibold sm:text-xs ${
												today
													? "bg-accent text-accent-foreground"
													: ""
											}`}
										>
											{day.getDate()}
										</span>
										{dayShifts.length > 0 && (
											<span className="text-[10px] font-medium text-muted">
												{dayShifts.length}
											</span>
										)}
									</div>

									<div className="mt-1 hidden flex-1 flex-col gap-1 sm:flex">
										{dayShifts.slice(0, 3).map((shift) => (
											<ShiftBadge
												key={shift.id}
												shift={shift}
												draggable={isAdmin}
											/>
										))}
										{dayShifts.length > 3 && (
											<span className="px-1 text-[10px] font-medium text-muted">
												+{dayShifts.length - 3} más
											</span>
										)}
									</div>

									<div className="mt-1.5 flex flex-wrap gap-1 sm:hidden">
										{dayShifts.slice(0, 4).map((shift) => (
											<span
												key={shift.id}
												className={`size-1.5 rounded-full ${
													getTypeMeta(shift.tipo).dot
												}`}
											/>
										))}
									</div>
								</motion.div>
							);
						})}
					</motion.div>
				</AnimatePresence>
			</div>
		</div>
	);
}

export default ShiftCalendar;
