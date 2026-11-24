import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
	AlertTriangle,
	Check,
	Pencil,
	Plus,
	Search,
	Tags,
	Trash2,
	UtensilsCrossed,
	X,
} from "lucide-react";
import {
	createCategory,
	deleteCategory,
	getAdminCategories,
	getApiErrorMessage,
	updateCategory,
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

function Categories() {
	const { user } = useStore();
	const [categories, setCategories] = useState([]);
	const [loading, setLoading] = useState(Boolean(user));
	const [error, setError] = useState("");
	const [notice, setNotice] = useState("");
	const [query, setQuery] = useState("");
	const [nombre, setNombre] = useState("");
	const [editing, setEditing] = useState(null);
	const [saving, setSaving] = useState(false);
	const [formError, setFormError] = useState("");
	const [confirming, setConfirming] = useState(null);
	const [deleteError, setDeleteError] = useState("");
	const [deleting, setDeleting] = useState(false);
	const inputRef = useRef(null);

	useEffect(() => {
		let active = true;
		if (!user) return undefined;

		getAdminCategories()
			.then((data) => {
				if (!active) return;
				setCategories(data);
				setError("");
			})
			.catch((requestError) => {
				if (!active) return;
				setError(
					getApiErrorMessage(
						requestError,
						"No se pudieron cargar las categorías",
					),
				);
			})
			.finally(() => {
				if (active) setLoading(false);
			});

		return () => {
			active = false;
		};
	}, [user]);

	useEffect(() => {
		if (!confirming) return undefined;
		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		const handleKeyDown = (event) => {
			if (event.key === "Escape" && !deleting) setConfirming(null);
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => {
			document.body.style.overflow = previousOverflow;
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [confirming, deleting]);

	const filtered = categories.filter((category) =>
		category.nombre.toLowerCase().includes(query.trim().toLowerCase()),
	);
	const totalPlatos = categories.reduce(
		(sum, category) => sum + (category.platillos_count || 0),
		0,
	);
	const positionById = new Map(
		categories.map((category, index) => [category.id, index + 1]),
	);

	const resetForm = () => {
		setNombre("");
		setEditing(null);
		setFormError("");
	};

	const startEdit = (category) => {
		setEditing(category);
		setNombre(category.nombre);
		setFormError("");
		setNotice("");
		inputRef.current?.focus();
	};

	const handleSubmit = async (event) => {
		event.preventDefault();
		const value = nombre.trim();
		if (!value) {
			setFormError("Escribe el nombre de la categoría.");
			return;
		}

		setSaving(true);
		setFormError("");
		setNotice("");
		try {
			if (editing) {
				const updated = await updateCategory(editing.id, {
					nombre: value,
				});
				setCategories((current) =>
					current.map((category) =>
						category.id === updated.id ? updated : category,
					),
				);
				setNotice(`Categoría «${updated.nombre}» actualizada.`);
			} else {
				const created = await createCategory({ nombre: value });
				setCategories((current) => [...current, created]);
				setNotice(`Categoría «${created.nombre}» creada.`);
			}
			resetForm();
		} catch (requestError) {
			setFormError(
				getApiErrorMessage(
					requestError,
					"No se pudo guardar la categoría",
				),
			);
		} finally {
			setSaving(false);
		}
	};

	const openDelete = (category) => {
		setConfirming(category);
		setDeleteError("");
	};

	const handleDelete = async () => {
		if (!confirming) return;
		setDeleting(true);
		setDeleteError("");
		try {
			await deleteCategory(confirming.id);
			setCategories((current) =>
				current.filter((category) => category.id !== confirming.id),
			);
			setNotice(`Categoría «${confirming.nombre}» eliminada.`);
			setConfirming(null);
		} catch (requestError) {
			setDeleteError(
				getApiErrorMessage(
					requestError,
					"No se pudo eliminar la categoría",
				),
			);
		} finally {
			setDeleting(false);
		}
	};

	return (
		<Dashboard
			title="Categorías"
			description="Crea y organiza las categorías que usan las recetas de tu menú."
			icon={Tags}
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
						<div className="flex items-center justify-between gap-3">
							<p className="text-xs font-semibold tracking-[0.2em] text-muted uppercase">
								Categorías
							</p>
							<span className="flex size-9 items-center justify-center rounded-xl bg-accent/10 text-accent">
								<Tags className="size-4" />
							</span>
						</div>
						<p className="mt-3 font-advercase text-4xl text-foreground">
							{categories.length}
						</p>
						<p className="mt-1 text-xs text-muted">
							Disponibles para clasificar el menú.
						</p>
					</div>
					<div className="rounded-2xl border border-border bg-surface p-5">
						<div className="flex items-center justify-between gap-3">
							<p className="text-xs font-semibold tracking-[0.2em] text-muted uppercase">
								Platos clasificados
							</p>
							<span className="flex size-9 items-center justify-center rounded-xl bg-success/10 text-success">
								<UtensilsCrossed className="size-4" />
							</span>
						</div>
						<p className="mt-3 font-advercase text-4xl text-foreground">
							{totalPlatos}
						</p>
						<p className="mt-1 text-xs text-muted">
							Recetas con una categoría asignada.
						</p>
					</div>
				</div>

				<div className="rounded-2xl border border-border bg-surface p-5 md:p-6">
					<div className="flex flex-wrap items-start justify-between gap-3">
						<div>
							<h2 className="text-lg font-semibold text-foreground">
								{editing ? "Editar categoría" : "Nueva categoría"}
							</h2>
							<p className="mt-1 text-sm text-muted">
								{editing
									? `Actualiza el nombre de «${editing.nombre}».`
									: "Solo necesitas un nombre; el sistema la ordena automáticamente."}
							</p>
						</div>
						{editing && (
							<button
								type="button"
								onClick={resetForm}
								className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-muted transition hover:bg-background hover:text-foreground"
							>
								<X className="size-3.5" />
								Cancelar edición
							</button>
						)}
					</div>

					<form
						onSubmit={handleSubmit}
						className="mt-4 flex flex-col gap-3 sm:flex-row"
					>
						<label className="flex-1">
							<span className="sr-only">Nombre de la categoría</span>
							<input
								ref={inputRef}
								value={nombre}
								onChange={(event) => {
									setNombre(event.target.value);
									setFormError("");
								}}
								maxLength={80}
								placeholder="Ej. Postres, Bebidas, Parrilla"
								className={inputClass}
							/>
						</label>
						<button
							type="submit"
							disabled={saving}
							className={primaryButtonClass}
						>
							{editing ? (
								<Check className="size-4" />
							) : (
								<Plus className="size-4" />
							)}
							{saving
								? "Guardando..."
								: editing
									? "Guardar cambios"
									: "Crear categoría"}
						</button>
					</form>

					{formError && (
						<p className="mt-3 rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
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
				</div>

				<div className="overflow-hidden rounded-2xl border border-border bg-surface">
					<div className="flex flex-col gap-3 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<h2 className="text-lg font-semibold text-foreground">
								Tus categorías
							</h2>
							<p className="text-sm text-muted">
								{plural(categories.length, "categoría", "categorías")} en
								total
							</p>
						</div>
						<div className="relative w-full sm:w-64">
							<Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
							<input
								type="search"
								value={query}
								onChange={(event) => setQuery(event.target.value)}
								placeholder="Buscar categoría..."
								aria-label="Buscar categoría"
								className={`${inputClass} pl-9`}
							/>
						</div>
					</div>

					{loading ? (
						<div className="flex items-center justify-center gap-3 px-5 py-14 text-sm text-muted">
							<span className="size-4 animate-spin rounded-full border-2 border-accent/30 border-t-accent" />
							Cargando categorías...
						</div>
					) : filtered.length === 0 ? (
						<div className="flex flex-col items-center justify-center px-6 py-14 text-center">
							<span className="flex size-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
								<Tags className="size-6" />
							</span>
							<p className="mt-4 text-base font-medium text-foreground">
								{categories.length === 0
									? "Aún no hay categorías"
									: "No encontramos coincidencias"}
							</p>
							<p className="mt-1 max-w-sm text-sm text-muted">
								{categories.length === 0
									? "Crea la primera categoría con el formulario de arriba y empieza a organizar tus recetas."
									: "Prueba con otro nombre o limpia la búsqueda."}
							</p>
						</div>
					) : (
						<div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
							<AnimatePresence initial={false}>
								{filtered.map((category) => (
									<motion.article
										key={category.id}
										layout
										initial={{ opacity: 0, y: 8 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0, scale: 0.96 }}
										transition={{ duration: 0.2 }}
										className="flex items-start justify-between gap-3 rounded-xl border border-border bg-background p-4 transition hover:border-accent/40"
									>
										<div className="flex min-w-0 items-center gap-3">
											<span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 font-advercase text-xs text-accent">
												#{positionById.get(category.id)}
											</span>
											<div className="min-w-0">
												<p className="truncate font-medium text-foreground">
													{category.nombre}
												</p>
												<p className="text-xs text-muted">
													{plural(
														category.platillos_count || 0,
														"plato clasificado",
														"platos clasificados",
													)}
												</p>
											</div>
										</div>
										<div className="flex shrink-0 items-center gap-1.5">
											<button
												type="button"
												onClick={() => startEdit(category)}
												aria-label={`Editar ${category.nombre}`}
												className="flex size-8 items-center justify-center rounded-lg border border-border text-muted transition hover:border-accent/40 hover:text-accent"
											>
												<Pencil className="size-3.5" />
											</button>
											<button
												type="button"
												onClick={() => openDelete(category)}
												aria-label={`Eliminar ${category.nombre}`}
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
			</div>

			<AnimatePresence>
				{confirming && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed inset-0 z-50 flex items-center justify-center px-4"
					>
						<div
							className="absolute inset-0 bg-background/70 backdrop-blur-sm"
							onClick={() => {
								if (!deleting) setConfirming(null);
							}}
						/>
						<motion.div
							role="dialog"
							aria-modal="true"
							aria-labelledby="delete-category-title"
							initial={{ opacity: 0, y: 16, scale: 0.97 }}
							animate={{ opacity: 1, y: 0, scale: 1 }}
							exit={{ opacity: 0, y: 12, scale: 0.98 }}
							transition={{
								type: "spring",
								stiffness: 320,
								damping: 28,
							}}
							className="relative w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-2xl"
						>
							<div className="flex items-start gap-3">
								<span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-danger/10 text-danger">
									<AlertTriangle className="size-5" />
								</span>
								<div>
									<h3
										id="delete-category-title"
										className="text-lg font-semibold text-foreground"
									>
										¿Eliminar «{confirming.nombre}»?
									</h3>
									<p className="mt-2 text-sm text-muted">
										{confirming.platillos_count > 0
											? `${plural(
													confirming.platillos_count,
													"plato quedará",
													"platos quedarán",
												)} sin categoría. `
											: "Esta categoría no tiene platos asignados. "}
										Esta acción no se puede deshacer.
									</p>
								</div>
							</div>

							{deleteError && (
								<p className="mt-4 rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
									{deleteError}
								</p>
							)}

							<div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
								<button
									type="button"
									onClick={() => setConfirming(null)}
									disabled={deleting}
									className={secondaryButtonClass}
								>
									Cancelar
								</button>
								<button
									type="button"
									onClick={handleDelete}
									disabled={deleting}
									className="inline-flex items-center justify-center gap-2 rounded-xl bg-danger px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-danger/90 disabled:cursor-not-allowed disabled:opacity-60"
								>
									<Trash2 className="size-4" />
									{deleting ? "Eliminando..." : "Eliminar categoría"}
								</button>
							</div>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>
		</Dashboard>
	);
}

export default Categories;
