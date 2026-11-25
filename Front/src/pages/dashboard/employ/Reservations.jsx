import { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
	ArrowDownUp,
	CalendarClock,
	Check,
	CheckCircle2,
	Clock,
	Users,
} from "lucide-react";
import {
	acceptReservation,
	cancelReservation,
	completeReservation,
	getApiErrorMessage,
	getReservations,
} from "../../../Api/clientApi";
import useStore from "../../../store/useStore";
import Dashboard from "../Dashboard";

const inputClass =
	"w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-accent/60 focus:ring-2 focus:ring-accent/20";

const STATUS_LABELS = {
	pendiente: "Pendiente",
	aceptada: "Aceptada",
	completada: "Completada",
	cancelada: "Cancelada",
};

const STATUS_ICONS = {
	pendiente: Clock,
	aceptada: Check,
	completada: CheckCircle2,
	cancelada: ArrowDownUp,
};

const formatDateTime = (value) => {
	if (!value) return "-";
	return new Date(value).toLocaleString("es-ES", {
		dateStyle: "short",
		timeStyle: "short",
	});
};

function Reservations() {
	const { user } = useStore();
	const [reservations, setReservations] = useState([]);
	const [loading, setLoading] = useState(Boolean(user));
	const [error, setError] = useState("");
	const [notice, setNotice] = useState("");
	const [busyId, setBusyId] = useState(null);
	const [status, setStatus] = useState("");

	useEffect(() => {
		let active = true;
		if (!user) return undefined;
		getReservations()
			.then((data) => {
				if (!active) return;
				setReservations(data);
			})
			.catch((requestError) => {
				if (active) {
					setError(
						getApiErrorMessage(requestError, "No se pudieron cargar las reservas"),
					);
				}
			})
			.finally(() => active && setLoading(false));
		return () => {
			active = false;
		};
	}, [user]);

	const filtered = status
		? reservations.filter((reservation) => reservation.estado === status)
		: reservations;
	const pending = reservations.filter((r) => r.estado === "pendiente").length;
	const accepted = reservations.filter((r) => r.estado === "aceptada").length;
	const completed = reservations.filter((r) => r.estado === "completada").length;
	const cancelled = reservations.filter((r) => r.estado === "cancelada").length;

	const apply = async (id, action, nextState, label) => {
		setBusyId(id);
		try {
			await action(id);
			setReservations((current) =>
				current.map((reservation) =>
					reservation.id === id ? { ...reservation, estado: nextState } : reservation,
				),
			);
			setNotice(`Reserva ${label}.`);
		} catch (requestError) {
			setError(getApiErrorMessage(requestError, "No se pudo actualizar la reserva"));
		} finally {
			setBusyId(null);
		}
	};

	return (
		<Dashboard
			title="Reservas"
			description="Administra las solicitudes de reserva de tu restaurante."
			icon={Users}
			eyebrow="SIGR · Sala"
		>
			<div className="space-y-5">
				{error && (
					<p className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-2.5 text-sm text-danger">
						{error}
					</p>
				)}
				{notice && (
					<motion.p
						initial={{ opacity: 0, y: -4 }}
						animate={{ opacity: 1, y: 0 }}
						className="rounded-xl border border-success/30 bg-success/10 px-4 py-2.5 text-sm text-success"
					>
						{notice}
					</motion.p>
				)}
				<div className="grid gap-4 sm:grid-cols-5">
					<div className="rounded-2xl border border-border bg-surface p-5">
						<p className="text-xs font-semibold tracking-[0.2em] text-muted uppercase">
							Total
						</p>
						<p className="mt-3 font-advercase text-4xl text-foreground">
							{reservations.length}
						</p>
					</div>
					<div className="rounded-2xl border border-border bg-surface p-5">
						<p className="text-xs font-semibold tracking-[0.2em] text-muted uppercase">
							Pendientes
						</p>
						<p className="mt-3 font-advercase text-4xl text-foreground">{pending}</p>
					</div>
					<div className="rounded-2xl border border-border bg-surface p-5">
						<p className="text-xs font-semibold tracking-[0.2em] text-muted uppercase">
							Aceptadas
						</p>
						<p className="mt-3 font-advercase text-4xl text-foreground">{accepted}</p>
					</div>
					<div className="rounded-2xl border border-border bg-surface p-5">
						<p className="text-xs font-semibold tracking-[0.2em] text-muted uppercase">
							Completadas
						</p>
						<p className="mt-3 font-advercase text-4xl text-foreground">{completed}</p>
					</div>
					<div className="rounded-2xl border border-border bg-surface p-5">
						<p className="text-xs font-semibold tracking-[0.2em] text-muted uppercase">
							Canceladas
						</p>
						<p className="mt-3 font-advercase text-4xl text-foreground">{cancelled}</p>
					</div>
				</div>

				<div className="overflow-hidden rounded-2xl border border-border bg-surface">
					<div className="flex flex-col gap-3 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
						<h2 className="text-lg font-semibold text-foreground">Reservas</h2>
						<select
							value={status}
							onChange={(event) => setStatus(event.target.value)}
							className={inputClass}
						>
							<option value="">Todos los estados</option>
							<option value="pendiente">Pendientes</option>
							<option value="aceptada">Aceptadas</option>
							<option value="completada">Completadas</option>
							<option value="cancelada">Canceladas</option>
						</select>
					</div>
					{loading ? (
						<p className="px-5 py-12 text-sm text-muted">Cargando reservas...</p>
					) : filtered.length === 0 ? (
						<p className="px-5 py-12 text-sm text-muted">No hay reservas.</p>
					) : (
						<ul className="divide-y divide-border px-5">
							{filtered.map((reservation) => {
								const StatusIcon = STATUS_ICONS[reservation.estado] ?? Clock;
								return (
									<motion.li
										key={reservation.id}
										layout
										className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
									>
										<div>
											<div className="flex items-center gap-3">
												<span className={`rounded-lg p-2 ${["aceptada", "completada"].includes(reservation.estado) ? "bg-success/10 text-success" : "bg-accent/10 text-accent"}`}>
													<StatusIcon className="size-4" />
												</span>
												<p className="font-semibold text-foreground">{reservation.nombre}</p>
												<span className="rounded-full border border-border px-2.5 py-0.5 text-[11px] font-semibold text-muted">
													{STATUS_LABELS[reservation.estado] ?? reservation.estado}
												</span>
											</div>
											<div className="mt-2 grid grid-cols-1 gap-1.5 text-sm text-muted sm:grid-cols-3">
												<span className="flex items-center gap-2">
													<CalendarClock className="size-3.5" />
													{formatDateTime(reservation.fecha)} · {reservation.hora ?? "-"}
												</span>
												<span>Personas: {reservation.personas ?? "-"}</span>
												<span>Teléfono: {reservation.telefono ?? "-"}</span>
											</div>
											{reservation.notas && (
												<p className="mt-2 text-sm text-muted">{reservation.notas}</p>
											)}
										</div>
										<div className="flex shrink-0 gap-2">
											{reservation.estado === "pendiente" && (
												<button
													type="button"
													disabled={busyId === reservation.id}
													onClick={() =>
														apply(reservation.id, acceptReservation, "aceptada", "aceptada")
													}
													className="inline-flex items-center gap-2 rounded-xl bg-accent px-3.5 py-2 text-sm font-semibold text-accent-foreground transition hover:bg-accent/90 disabled:opacity-60"
												>
													<Check className="size-4" /> Aceptar
												</button>
											)}
											{reservation.estado === "aceptada" && (
												<button
													type="button"
													disabled={busyId === reservation.id}
													onClick={() =>
														apply(reservation.id, completeReservation, "completada", "completada")
													}
													className="inline-flex items-center gap-2 rounded-xl bg-success px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-success/90 disabled:opacity-60"
												>
													<CheckCircle2 className="size-4" /> Completar
												</button>
											)}
											{["pendiente", "aceptada"].includes(reservation.estado) && (
												<button
													type="button"
													disabled={busyId === reservation.id}
													onClick={() =>
														apply(reservation.id, cancelReservation, "cancelada", "cancelada")
													}
													className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-3.5 py-2 text-sm font-semibold text-muted transition hover:border-danger/40 hover:text-danger disabled:opacity-60"
												>
													<ArrowDownUp className="size-4" /> Cancelar
												</button>
											)}
										</div>
									</motion.li>
								);
							})}
						</ul>
					)}
				</div>
			</div>
		</Dashboard>
	);
}

export default Reservations;
