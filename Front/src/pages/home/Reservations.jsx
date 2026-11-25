import { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
	CalendarClock,
	Check,
	Clock,
	MapPin,
	Users,
	X,
} from "lucide-react";
import {
	cancelReservation,
	createReservation,
	getApiErrorMessage,
	getPublicTables,
	getReservations,
	getRestaurants,
} from "../../Api/clientApi";
import useStore from "../../store/useStore";

const inputClass =
	"w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-accent/60 focus:ring-2 focus:ring-accent/20";

const STATUS = {
	pendiente: { label: "Pendiente", icon: Clock, className: "text-accent bg-accent/10" },
	aceptada: { label: "Aceptada", icon: Check, className: "text-success bg-success/10" },
	completada: { label: "Completada", icon: Check, className: "text-success bg-success/10" },
	cancelada: { label: "Cancelada", icon: X, className: "text-muted bg-surface-secondary" },
};

const EMPTY_FORM = {
	restaurante: "",
	mesa: "",
	fecha: "",
	hora: "",
	personas: "2",
	nombre: "",
	telefono: "",
	notas: "",
};

function Reservations() {
	const { user } = useStore();
	const [restaurants, setRestaurants] = useState([]);
	const [tables, setTables] = useState([]);
	const [reservations, setReservations] = useState([]);
	const [form, setForm] = useState(EMPTY_FORM);
	const [loading, setLoading] = useState(Boolean(user));
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");
	const [notice, setNotice] = useState("");

	useEffect(() => {
		let active = true;
		if (!user) return undefined;
		Promise.all([getRestaurants(), getReservations()])
			.then(([restaurantData, reservationData]) => {
				if (!active) return;
				setRestaurants(restaurantData);
				setReservations(reservationData);
			})
			.catch((requestError) => {
				if (active) {
					setError(getApiErrorMessage(requestError, "No se pudieron cargar las reservas"));
				}
			})
			.finally(() => active && setLoading(false));
		return () => {
			active = false;
		};
	}, [user]);

	useEffect(() => {
		let active = true;
		if (!form.restaurante) {
			return undefined;
		}
		getPublicTables(form.restaurante)
			.then((data) => {
				if (active) setTables(data);
			})
			.catch(() => active && setTables([]));
		return () => {
			active = false;
		};
	}, [form.restaurante]);

	const update = (field) => (event) => {
		const value = event.target.value;
		if (field === "restaurante") setTables([]);
		setForm((current) => {
			const next = {
				...current,
				[field]: value,
				...(field === "restaurante" ? { mesa: "" } : {}),
			};
			if (field === "mesa") {
				const table = tables.find((item) => String(item.id) === value);
				if (table) {
					const capacity = Math.max(1, Number(table.capacidad) || 1);
					next.personas = String(
						Math.min(Math.max(1, Number(current.personas) || 1), capacity),
					);
				}
			}
			return next;
		});
	};

	const selectedTable = tables.find((table) => String(table.id) === form.mesa);

	const submit = async (event) => {
		event.preventDefault();
		setError("");
		if (!form.restaurante || !form.mesa || !form.fecha || !form.hora) {
			setError("Selecciona restaurante, mesa, fecha y hora.");
			return;
		}
		if (selectedTable && Number(form.personas) > selectedTable.capacidad) {
			setError(`Esa mesa admite máximo ${selectedTable.capacidad} personas.`);
			return;
		}
		setSaving(true);
		try {
			const created = await createReservation({
				restaurante: form.restaurante,
				mesa: form.mesa,
				fecha: form.fecha,
				hora: form.hora,
				personas: Number(form.personas),
				nombre: form.nombre.trim(),
				telefono: form.telefono.trim(),
				notas: form.notas.trim(),
			});
			setReservations((current) => [created, ...current]);
			setForm((current) => ({ ...EMPTY_FORM, restaurante: current.restaurante }));
			setNotice("Reserva enviada. El personal de sala la revisará.");
		} catch (requestError) {
			setError(getApiErrorMessage(requestError, "No se pudo crear la reserva"));
		} finally {
			setSaving(false);
		}
	};

	const cancel = async (id) => {
		setError("");
		try {
			await cancelReservation(id);
			setReservations((current) =>
				current.map((reservation) =>
					reservation.id === id
						? { ...reservation, estado: "cancelada" }
						: reservation,
				),
			);
			setNotice("Reserva cancelada.");
		} catch (requestError) {
			setError(getApiErrorMessage(requestError, "No se pudo cancelar la reserva"));
		}
	};

	return (
		<section className="min-h-dvh w-full bg-background px-5 py-8 md:px-10 md:py-12">
			<div className="mx-auto w-full max-w-[1400px]">
				<header>
					<p className="text-xs font-semibold tracking-[0.22em] text-muted uppercase">
						Cliente · Reservas
					</p>
					<h1 className="mt-3 font-advercase text-4xl text-foreground md:text-5xl">
						Reserva tu mesa
					</h1>
					<p className="mt-2 max-w-xl text-sm text-muted">
						Elige restaurante, mesa y horario. El personal de sala confirmará tu
						solicitud.
					</p>
				</header>

				{error && (
					<p className="mt-6 rounded-xl border border-danger/30 bg-danger/10 px-4 py-2.5 text-sm text-danger">
						{error}
					</p>
				)}
				{notice && (
					<motion.p
						initial={{ opacity: 0, y: -4 }}
						animate={{ opacity: 1, y: 0 }}
						className="mt-6 rounded-xl border border-success/30 bg-success/10 px-4 py-2.5 text-sm text-success"
					>
						{notice}
					</motion.p>
				)}

				<div className="mt-8 grid gap-6 lg:grid-cols-[420px_1fr]">
					<form onSubmit={submit} className="h-fit rounded-2xl border border-border bg-surface p-5 md:p-6">
						<h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
							<CalendarClock className="size-5 text-accent" />
							Nueva reserva
						</h2>
						<div className="mt-4 space-y-3">
							<label className="block text-xs font-semibold text-muted">
								<span className="mb-1.5 flex items-center gap-1.5">
									<MapPin className="size-3.5" /> Restaurante
								</span>
								<select value={form.restaurante} onChange={update("restaurante")} className={inputClass}>
									<option value="">Selecciona un restaurante</option>
									{restaurants.map((restaurant) => (
										<option key={restaurant.id} value={restaurant.id}>
											{restaurant.nombre}
										</option>
									))}
								</select>
							</label>
							<label className="block text-xs font-semibold text-muted">
								<span className="mb-1.5 flex items-center gap-1.5">
									<Users className="size-3.5" /> Mesa
								</span>
								<select value={form.mesa} onChange={update("mesa")} className={inputClass} disabled={!form.restaurante}>
									<option value="">{form.restaurante ? "Selecciona una mesa" : "Primero elige restaurante"}</option>
									{tables.map((table) => (
										<option key={table.id} value={table.id}>
											{table.nombre} · hasta {table.capacidad} personas
										</option>
									))}
								</select>
							</label>
							<div className="grid grid-cols-2 gap-3">
								<label className="block text-xs font-semibold text-muted">
									Fecha
									<input type="date" value={form.fecha} onChange={update("fecha")} className={inputClass} />
								</label>
								<label className="block text-xs font-semibold text-muted">
									Hora
									<input type="time" value={form.hora} onChange={update("hora")} className={inputClass} />
								</label>
							</div>
							<label className="block text-xs font-semibold text-muted">
								Personas
								<input type="number" min={1} max={selectedTable?.capacidad ?? 30} value={form.personas} onChange={update("personas")} className={inputClass} />
								{selectedTable && (
									<span className="mt-1 block text-[11px] font-normal text-muted">
										Máximo {selectedTable.capacidad} personas para esta mesa.
									</span>
								)}
							</label>
							<label className="block text-xs font-semibold text-muted">
								Nombre
								<input value={form.nombre} onChange={update("nombre")} placeholder={user?.username ?? ""} className={inputClass} />
							</label>
							<label className="block text-xs font-semibold text-muted">
								Teléfono
								<input value={form.telefono} onChange={update("telefono")} placeholder="300 000 0000" className={inputClass} />
							</label>
							<label className="block text-xs font-semibold text-muted">
								Notas
								<textarea value={form.notas} onChange={update("notas")} rows={2} placeholder="Cumpleaños, silla para bebé..." className={inputClass} />
							</label>
						</div>
						<button type="submit" disabled={saving} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60">
							<CalendarClock className="size-4" />
							{saving ? "Enviando..." : "Solicitar reserva"}
						</button>
					</form>

					<div className="overflow-hidden rounded-2xl border border-border bg-surface">
						<div className="border-b border-border p-5">
							<h2 className="text-lg font-semibold text-foreground">Mis reservas</h2>
							<p className="text-sm text-muted">Sigue el estado de tus solicitudes.</p>
						</div>
						{loading ? (
							<p className="px-5 py-12 text-sm text-muted">Cargando reservas...</p>
						) : reservations.length === 0 ? (
							<p className="px-5 py-12 text-sm text-muted">Todavía no has reservado una mesa.</p>
						) : (
							<ul className="divide-y divide-border px-5">
								{reservations.map((reservation) => {
									const meta = STATUS[reservation.estado] ?? STATUS.pendiente;
									const Icon = meta.icon;
									return (
										<li key={reservation.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
											<div>
												<div className="flex items-center gap-2">
													<span className={`rounded-lg p-2 ${meta.className}`}>
														<Icon className="size-4" />
													</span>
													<p className="font-semibold text-foreground">
														{reservation.restaurante_nombre ?? "Restaurante"} · {reservation.mesa_nombre ?? "Mesa"}
													</p>
													<span className="text-xs font-semibold text-muted">{meta.label}</span>
												</div>
												<p className="mt-1.5 text-sm text-muted">
													{reservation.fecha} · {reservation.hora} · {reservation.personas} personas
												</p>
											</div>
											{reservation.estado === "pendiente" && (
												<button type="button" onClick={() => cancel(reservation.id)} className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted transition hover:border-danger/40 hover:text-danger">
													Cancelar
												</button>
											)}
										</li>
									);
								})}
							</ul>
						)}
					</div>
				</div>
			</div>
		</section>
	);
}

export default Reservations;
