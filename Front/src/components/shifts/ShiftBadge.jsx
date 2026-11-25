import { motion } from "motion/react";
import { formatTime } from "../../utils/calendar";
import { firstName, getTypeMeta } from "./shiftMeta";

/**
 * Pill compacta que representa un turno dentro del calendario.
 * Es arrastrable cuando el usuario es administrador.
 */
function ShiftBadge({
	shift,
	compact = false,
	draggable = false,
	onDragStart,
	onDragEnd,
	showEmployee = true,
	className = "",
}) {
	const meta = getTypeMeta(shift.tipo);
	const cancelled = shift.estado === "cancelado";

	const handleDragStart = (event) => {
		event.dataTransfer.effectAllowed = "move";
		event.dataTransfer.setData("text/plain", shift.id);
		onDragStart?.(shift);
	};

	return (
		<motion.div
			layout
			draggable={draggable}
			onDragStart={handleDragStart}
			onDragEnd={onDragEnd}
			whileHover={draggable ? { y: -1 } : undefined}
			title={`${shift.empleado_nombre} · ${meta.label}`}
			className={`flex select-none items-center gap-1.5 rounded-md border px-1.5 py-1 text-[10px] leading-tight transition-opacity sm:text-[11px] ${meta.chip} ${
				draggable ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"
			} ${cancelled ? "opacity-45 line-through" : ""} ${className}`}
		>
			<span className={`size-1.5 shrink-0 rounded-full ${meta.dot}`} />
			<span className="truncate font-semibold">
				{showEmployee ? firstName(shift.empleado_nombre) : meta.label}
			</span>
			{!compact && (
				<span className="ml-auto shrink-0 tabular-nums opacity-80">
					{formatTime(shift.hora_inicio)}
				</span>
			)}
		</motion.div>
	);
}

export default ShiftBadge;
