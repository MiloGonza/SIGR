import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
	Pencil,
	Plus,
	Search,
	Table2,
	Trash2,
} from "lucide-react";
import {
	createTable,
	deleteTable,
	getAdminTables,
	getApiErrorMessage,
	updateTable,
} from "../../../Api/clientApi";
import useStore from "../../../store/useStore";
import Dashboard from "../Dashboard";

const inputClass =
	"w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-accent/60 focus:ring-2 focus:ring-accent/20";
const primaryButtonClass =
	"inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60";
const secondaryButtonClass =
	"inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-muted transition hover:border-accent/40 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60";

const plural = (count, singular, pluralWord) =>
	`${count} ${count === 1 ? singular : pluralWord}`;

function Tables() {
	const { user } = useStore();
	const [tables, setTables] = useState([]);
	const [loading, setLoading] = useState(Boolean(user));
	const [error, setError] = useState("");
	const [query, setQuery] = useState("");
	const [notice, setNotice] = useState("");
	const [editing, setEditing] = useState(null);
	const [saving, setSaving] = useState(false);
	const [formError, setFormError] = useState("");
	const [confirming, setConfirming] = useState(null);
	const [deleting, setDeleting] = useState(false);

	useEffect(() => {
		let active = true;
		if (!user) return undefined;
		getAdminTables()
			.then((tableData) => {
				if (!active) return;
				setTables(tableData);
			})
			.catch((requestError) => {
				if (active) {
					setError(
						getApiErrorMessage(requestError, "No se pudieron cargar las mesas"),
					);
				}
			})
			.finally(() => active && setLoading(false));
		return () => {
			active = false;
		};
	}, [user]);

	const filtered = tables.filter((table) =>
		table.nombre?.toLowerCase().includes(query.trim().toLowerCase()),
	);

	const resetForm = () => {
		setEditing(null);
		setFormRefName("");
		setFormRefCapacidad("");
		setFormRefDisponible(true);
		setFormError("");
	};

	// Centraliza los campos del formulario y permite reusar validate/submit.
	const [formRefName, setFormRefName] = useState("");
	const [formRefCapacidad, setFormRefCapacidad] = useState("");
	const [formRefDisponible, setFormRefDisponible] = useState(true);

	const handleSubmit = async (event) => {
		event.preventDefault();
		const nombre = formRefName.trim();
		const capacidad = Number(formRefCapacidad);
		if (!nombre) {
			setFormError("Escribe un nombre para la mesa.");
			return;
		}
		if (!Number.isInteger(capacidad) || capacidad < 1) {
			setFormError("La capacidad debe ser un número entero positivo.");
			return;
		}
		setSaving(true);
		setFormError("");
		try {
			const data = {
				nombre,
				capacidad,
				esta_disponible: formRefDisponible,
			};
			if (editing) {
				const updated = await updateTable(editing.id, data);
				setTables((current) =>
					current.map((table) => (table.id === updated.id ? updated : table)),
				);
				setNotice(`Mesa «${updated.nombre}» actualizada.`);
			} else {
				const created = await createTable(data);
				setTables((current) => [...current, created]);
				setNotice(`Mesa «${created.nombre}» creada.`);
			}
			resetForm();
		} catch (requestError) {
			setFormError(getApiErrorMessage(requestError, "No se pudo guardar la mesa"));
		} finally {
			setSaving(false);
		}
	};

	const startEdit = (table) => {
		setEditing(table);
		setFormRefName(table.nombre ?? "");
		setFormRefCapacidad(String(table.capacidad ?? ""));
		setFormRefDisponible(Boolean(table.esta_disponible));
		setFormError("");
	};

	const handleDelete = async () => {
		if (!confirming) return;
		setDeleting(true);
		try {
			await deleteTable(confirming.id);
			setTables((current) => current.filter((table) => table.id !== confirming.id));
			setNotice(`Mesa «${confirming.nombre}» eliminada.`);
			setConfirming(null);
		} catch (requestError) {
			setError(getApiErrorMessage(requestError, "No se pudo eliminar la mesa"));
		} finally {
			setDeleting(false);
		}
	};

	return (
		<Dashboard
			title="Mesas"
			description="Organiza las mesas disponibles del restaurante."
			icon={Table2}
			eyebrow="SIGR · Operación"
		>
			<div className="space-y-5">
				{error && (
					<p className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-2.5 text-sm text-danger">
						{error}
					</p>
				)}
				<div className="grid gap-4 sm:grid-cols-2">
					<div className="rounded-2xl border border-border bg-surface p-5">
						<p className="text-xs font-semibold tracking-[0.2em] text-muted uppercase">
							Mesas
						</p>
						<p className="mt-3 font-advercase text-4xl text-foreground">
							{tables.length}
						</p>
					</div>
					<div className="rounded-2xl border border-border bg-surface p-5">
						<p className="text-xs font-semibold tracking-[0.2em] text-muted uppercase">
							Disponibles
						</p>
						<p className="mt-3 font-advercase text-4xl text-foreground">
							{tables.filter((table) => table.esta_disponible).length}
						</p>
					</div>
				</div>

				<form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-surface p-5 md:p-6">
					<h2 className="text-lg font-semibold text-foreground">
						{editing ? "Editar mesa" : "Nueva mesa"}
					</h2>
					<div className="mt-4 grid gap-3 sm:grid-cols-[1fr_120px_auto]">
						<label className="text-sm font-semibold text-foreground">
							Nombre
							<input
								value={formRefName}
								onChange={(event) => setFormRefName(event.target.value)}
								placeholder="Ej. Terraza 2"
								className={inputClass}
							/>
						</label>
						<label className="text-sm font-semibold text-foreground">
							Capacidad
							<input
								type="number"
								min={1}
								value={formRefCapacidad}
								onChange={(event) => setFormRefCapacidad(event.target.value)}
								placeholder="Personas"
								className={inputClass}
							/>
						</label>
						<label className="flex items-center gap-2 text-sm font-semibold text-foreground sm:pt-7">
							<input
								type="checkbox"
								checked={formRefDisponible}
								onChange={(event) => setFormRefDisponible(event.target.checked)}
								className="size-4 accent-accent"
							/>
							Disponible
						</label>
					</div>
					<div className="mt-4 flex flex-wrap gap-3">
						<button type="submit" disabled={saving} className={primaryButtonClass}>
							<Plus className="size-4" />
							{saving ? "Guardando..." : editing ? "Guardar" : "Crear mesa"}
						</button>
						{editing && (
							<button type="button" onClick={resetForm} className={secondaryButtonClass}>
								Cancelar
							</button>
						)}
					</div>
					{formError && (
						<p className="mt-4 rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
							{formError}
						</p>
					)}
					<AnimatePresence>
						{notice && (
							<motion.p
								initial={{ opacity: 0, y: -4 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0 }}
								className="mt-3 rounded-xl border border-success/30 bg-success/10 px-3 py-2 text-sm text-success"
							>
								{notice}
							</motion.p>
						)}
					</AnimatePresence>
				</form>

				<div className="overflow-hidden rounded-2xl border border-border bg-surface">
					<div className="flex flex-col gap-3 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
						<h2 className="text-lg font-semibold text-foreground">Mesas</h2>
						<div className="relative w-full sm:w-64">
							<Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
							<input
								type="search"
								value={query}
								onChange={(event) => setQuery(event.target.value)}
								placeholder="Buscar mesa..."
								aria-label="Buscar mesa"
								className={`${inputClass} pl-9`}
							/>
						</div>
					</div>
					{loading ? (
						<p className="px-5 py-12 text-sm text-muted">Cargando mesas...</p>
					) : filtered.length === 0 ? (
						<p className="px-5 py-12 text-sm text-muted">No hay mesas.</p>
					) : (
						<div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
							<AnimatePresence>
								{filtered.map((table) => (
									<motion.article
										key={table.id}
										layout
										initial={{ opacity: 0, y: 8 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0, scale: 0.96 }}
										className="flex items-start justify-between gap-3 rounded-xl border border-border bg-background p-4 transition hover:border-accent/40"
									>
										<div className="min-w-0">
											<p className="truncate font-medium text-foreground">{table.nombre}</p>
											<p className="text-xs text-muted">
												{plural(table.capacidad ?? 0, "1 persona", `${table.capacidad ?? 0} personas`)} ·{" "}
												{table.esta_disponible ? "Disponible" : "Ocupada"}
											</p>
										</div>
										<div className="flex shrink-0 items-center gap-1.5">
											<button
												type="button"
												onClick={() => startEdit(table)}
												aria-label={`Editar ${table.nombre}`}
												className="flex size-8 items-center justify-center rounded-lg border border-border text-muted transition hover:border-accent/40 hover:text-accent"
											>
												<Pencil className="size-3.5" />
											</button>
											<button
												type="button"
												onClick={() => setConfirming(table)}
												aria-label={`Eliminar ${table.nombre}`}
												className="flex size-8 items-center justify-center rounded-lg border border-border text-muted transition hover:border-danger/40 hover:text-danger"
											>
												<Trash2 className="size-3.5" />
											</button>
										</div>
									</motion.article>
								))}
							</AnimatePresence>
						</div>
					)}
				</div>

				<AnimatePresence>
					{confirming && (
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							className="fixed inset-0 z-50 flex items-center justify-center px-4"
						>
							<div className="absolute inset-0 bg-background/70 backdrop-blur-sm" onClick={() => !deleting && setConfirming(null)} />
							<motion.div
								role="dialog"
								aria-modal="true"
								initial={{ opacity: 0, scale: 0.97 }}
								animate={{ opacity: 1, scale: 1 }}
								className="relative w-full max-w-md rounded-2xl border border-border bg-surface p-6"
							>
								<h3 className="text-lg font-semibold text-foreground">Eliminar «{confirming.nombre}»?</h3>
								<p className="mt-2 text-sm text-muted">Esta acción no se puede deshacer.</p>
								<div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
									<button type="button" onClick={() => setConfirming(null)} disabled={deleting} className={secondaryButtonClass}>
										Cancelar
									</button>
									<button type="button" onClick={handleDelete} disabled={deleting} className="inline-flex items-center justify-center gap-2 rounded-xl bg-danger px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-danger/90 disabled:cursor-not-allowed disabled:opacity-60">
										<Trash2 className="size-4" />
										{deleting ? "Eliminando..." : "Eliminar"}
									</button>
								</div>
							</motion.div>
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		</Dashboard>
	);
}

export default Tables;
