import { useEffect, useState } from "react";
import { Tooltip } from "@heroui/react";
import {
	ChefHat,
	Clock,
	ImageOff,
	ImagePlus,
	Minus,
	Pencil,
	Plus,
	Search,
	Tag,
	Trash2,
	X,
} from "lucide-react";
import {
	createRecipe,
	deleteRecipe,
	getApiErrorMessage,
	getCategories,
	getRecipes,
	updateRecipe,
} from "../../../Api/clientApi";
import useStore from "../../../store/useStore";
import { formatCOP } from "../../../utils/format";
import Dashboard from "../Dashboard";

const EMPTY_FORM = {
	nombre: "",
	descripcion: "",
	precio: "",
	categoria: "",
	etiqueta: "",
	prep_minutes: 15,
	stock: 20,
	is_active: true,
};

function TooltipButton({ label, children, ...buttonProps }) {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<Tooltip isOpen={isOpen} onOpenChange={setIsOpen} delay={150} closeDelay={0}>
			<Tooltip.Trigger
				render={(triggerProps) => (
					<button
						{...triggerProps}
						{...buttonProps}
						onPointerEnter={() => setIsOpen(true)}
						onPointerLeave={() => setIsOpen(false)}
						onFocus={() => setIsOpen(true)}
						onBlur={() => setIsOpen(false)}
					>
						{children}
					</button>
				)}
			/>
			<Tooltip.Content showArrow>{label}</Tooltip.Content>
		</Tooltip>
	);
}

const stockClass = (stock) => {
	if (stock <= 0) return "bg-danger/10 text-danger";
	if (stock <= 5) return "bg-warning/10 text-warning";
	return "bg-success/10 text-success";
};

function Recipes() {
	const { user } = useStore();
	const [recipes, setRecipes] = useState([]);
	const [categories, setCategories] = useState([]);
	const [loading, setLoading] = useState(Boolean(user));
	const [error, setError] = useState("");
	const [notice, setNotice] = useState("");
	const [query, setQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState("todas");
	const [form, setForm] = useState(EMPTY_FORM);
	const [editingId, setEditingId] = useState(null);
	const [saving, setSaving] = useState(false);
	const [busyId, setBusyId] = useState(null);
	const [imageFile, setImageFile] = useState(null);
	const [imagePreview, setImagePreview] = useState("");
	const [originalImage, setOriginalImage] = useState("");
	const [previewGradient, setPreviewGradient] = useState("");
	const [removeImage, setRemoveImage] = useState(false);

	useEffect(() => {
		return () => {
			if (imagePreview.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
		};
	}, [imagePreview]);

	useEffect(() => {
		let active = true;
		if (!user) return undefined;

		Promise.all([getRecipes(), getCategories()])
			.then(([recipeData, categoryData]) => {
				if (!active) return;
				setRecipes(recipeData);
				setCategories(categoryData);
				setError("");
			})
			.catch((requestError) => {
				if (active) {
					setError(
						getApiErrorMessage(
							requestError,
							"No se pudieron cargar las recetas de la tienda",
						),
					);
				}
			})
			.finally(() => {
				if (active) setLoading(false);
			});

		return () => {
			active = false;
		};
	}, [user]);

	const search = query.trim().toLowerCase();
	const visible = recipes.filter((recipe) => {
		const matchesSearch =
			!search ||
			[recipe.nombre, recipe.descripcion, recipe.categoria_nombre, recipe.etiqueta]
				.join(" ")
				.toLowerCase()
				.includes(search);
		const matchesStatus =
			statusFilter === "todas" ||
			(statusFilter === "activas" && recipe.is_active && recipe.stock > 0) ||
			(statusFilter === "inactivas" && !recipe.is_active) ||
			(statusFilter === "agotadas" && recipe.stock === 0);
		return matchesSearch && matchesStatus;
	});

	const activeCount = recipes.filter((recipe) => recipe.is_active).length;
	const stockTotal = recipes.reduce(
		(total, recipe) => total + Number(recipe.stock || 0),
		0,
	);
	const outOfStock = recipes.filter((recipe) => recipe.stock === 0).length;

	const resetForm = () => {
		setForm(EMPTY_FORM);
		setEditingId(null);
		if (imagePreview.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
		setImageFile(null);
		setImagePreview("");
		setOriginalImage("");
		setPreviewGradient("");
		setRemoveImage(false);
	};

	const handleImageChange = (event) => {
		const file = event.target.files?.[0] ?? null;
		event.target.value = "";
		if (!file) return;
		if (file.size > 5 * 1024 * 1024) {
			setError("La imagen no puede superar los 5 MB.");
			return;
		}
		setError("");
		if (imagePreview.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
		setImageFile(file);
		setImagePreview(URL.createObjectURL(file));
		setRemoveImage(false);
	};

	const handleRemoveImage = () => {
		if (imageFile) {
			// Deshace la selección y recupera la imagen guardada, si existe.
			if (imagePreview.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
			setImageFile(null);
			setImagePreview(originalImage);
			setRemoveImage(false);
			return;
		}
		setImagePreview("");
		setRemoveImage(Boolean(editingId));
	};

	const handleChange = (event) => {
		const { name, value, type, checked } = event.target;
		setForm((current) => ({
			...current,
			[name]: type === "checkbox" ? checked : value,
		}));
	};

	const handleEdit = (recipe) => {
		setEditingId(recipe.id);
		setForm({
			nombre: recipe.nombre,
			descripcion: recipe.descripcion ?? "",
			precio: recipe.precio,
			categoria: recipe.categoria ? String(recipe.categoria) : "",
			etiqueta: recipe.etiqueta ?? "",
			prep_minutes: recipe.prep_minutes ?? 15,
			stock: recipe.stock ?? 0,
			is_active: recipe.is_active,
		});
		if (imagePreview.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
		setImageFile(null);
		setImagePreview(recipe.image ?? "");
		setOriginalImage(recipe.image ?? "");
		setPreviewGradient(recipe.gradient ?? "");
		setRemoveImage(false);
		setError("");
		setNotice("");
	};

	const handleSubmit = async (event) => {
		event.preventDefault();
		if (!form.nombre.trim()) {
			setError("Escribe el nombre de la receta.");
			return;
		}
		if (!Number(form.precio) || Number(form.precio) <= 0) {
			setError("Ingresa un precio mayor que cero.");
			return;
		}

		setSaving(true);
		setError("");
		setNotice("");
		const fields = {
			nombre: form.nombre.trim(),
			descripcion: form.descripcion.trim(),
			precio: Number(form.precio),
			etiqueta: form.etiqueta.trim(),
			prep_minutes: Number(form.prep_minutes) || 0,
			stock: Number(form.stock) || 0,
			is_active: form.is_active,
		};
		if (form.categoria) fields.categoria = Number(form.categoria);

		let payload = fields;
		if (imageFile || removeImage) {
			payload = new FormData();
			Object.entries(fields).forEach(([key, value]) => {
				payload.append(
					key,
					typeof value === "boolean" ? String(value) : value,
				);
			});
			if (form.categoria) payload.append("categoria", form.categoria);
			if (imageFile) payload.append("image", imageFile);
			if (removeImage) payload.append("remove_image", "true");
		}

		try {
			if (editingId) {
				const updated = await updateRecipe(editingId, payload);
				setRecipes((current) =>
					current.map((recipe) => (recipe.id === updated.id ? updated : recipe)),
				);
				setNotice("Receta actualizada.");
			} else {
				const created = await createRecipe(payload);
				setRecipes((current) => [created, ...current]);
				setNotice("Receta creada.");
			}
			resetForm();
		} catch (requestError) {
			setError(
				getApiErrorMessage(requestError, "No se pudo guardar la receta"),
			);
		} finally {
			setSaving(false);
		}
	};

	const adjustStock = async (recipe, delta) => {
		const next = Math.max(0, Number(recipe.stock) + delta);
		if (next === recipe.stock) return;
		setBusyId(recipe.id);
		setError("");
		setNotice("");
		try {
			const updated = await updateRecipe(recipe.id, { stock: next });
			setRecipes((current) =>
				current.map((item) => (item.id === updated.id ? updated : item)),
			);
		} catch (requestError) {
			setError(
				getApiErrorMessage(requestError, "No se pudo actualizar el stock"),
			);
		} finally {
			setBusyId(null);
		}
	};

	const handleToggle = async (recipe) => {
		setBusyId(recipe.id);
		setError("");
		setNotice("");
		try {
			const updated = await updateRecipe(recipe.id, {
				is_active: !recipe.is_active,
			});
			setRecipes((current) =>
				current.map((item) => (item.id === updated.id ? updated : item)),
			);
			setNotice(
				updated.is_active ? "Receta activada." : "Receta desactivada.",
			);
		} catch (requestError) {
			setError(
				getApiErrorMessage(
					requestError,
					"No se pudo cambiar el estado de la receta",
				),
			);
		} finally {
			setBusyId(null);
		}
	};

	const handleDelete = async (recipe) => {
		if (!window.confirm(`¿Eliminar la receta "${recipe.nombre}"?`)) return;
		setBusyId(recipe.id);
		setError("");
		setNotice("");
		try {
			await deleteRecipe(recipe.id);
			setRecipes((current) => current.filter((item) => item.id !== recipe.id));
			if (editingId === recipe.id) resetForm();
			setNotice("Receta eliminada.");
		} catch (requestError) {
			setError(
				getApiErrorMessage(requestError, "No se pudo eliminar la receta"),
			);
		} finally {
			setBusyId(null);
		}
	};

	return (
		<Dashboard
			title="Recetas"
			description="Administra los platillos de tu tienda, su inventario y disponibilidad."
			icon={ChefHat}
			eyebrow="SIGR · Administración"
		>
			<div className="space-y-6">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-xs font-medium text-muted">
						<ChefHat className="size-4 text-accent" />
						{user?.restaurante?.nombre ?? "Tu restaurante"}
					</span>
					<button
						type="button"
						onClick={resetForm}
						className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition-transform hover:scale-[1.01]"
					>
						<Plus className="size-4" />
						Nueva receta
					</button>
				</div>

				<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
					{[
						["Recetas", recipes.length, "Del menú de la tienda"],
						["Activas", activeCount, "Disponibles para pedir"],
						["Stock total", stockTotal, "Unidades registradas"],
						["Agotadas", outOfStock, "Necesitan reposición"],
					].map(([label, value, hint]) => (
						<article
							key={label}
							className="rounded-2xl border border-border bg-surface p-5"
						>
							<p className="text-[11px] font-semibold tracking-[0.14em] text-muted uppercase">
								{label}
							</p>
							<p className="mt-2 text-3xl font-semibold text-foreground">
								{value}
							</p>
							<p className="mt-1 text-xs text-muted">{hint}</p>
						</article>
					))}
				</div>

				{(error || notice) && (
					<p
						className={`rounded-xl border px-4 py-2.5 text-sm ${
							error
								? "border-danger/30 bg-danger/10 text-danger"
								: "border-success/30 bg-success/10 text-success"
						}`}
					>
						{error || notice}
					</p>
				)}

				<div className="grid gap-6 xl:grid-cols-[1fr_380px]">
					<div className="min-w-0 rounded-2xl border border-border bg-surface">
						<div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
							<label className="relative min-w-56 flex-1">
								<Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
								<span className="sr-only">Buscar recetas</span>
								<input
									value={query}
									onChange={(event) => setQuery(event.target.value)}
									placeholder="Buscar por nombre, categoría o etiqueta"
									className="w-full rounded-xl border border-border bg-background pr-10 pl-9 py-2 text-sm text-foreground outline-none focus:border-accent"
								/>
								{query && (
									<TooltipButton
										label="Limpiar búsqueda"
										type="button"
										onClick={() => setQuery("")}
										aria-label="Limpiar búsqueda"
										className="absolute top-1/2 right-2 -translate-y-1/2 rounded-lg p-1.5 text-muted hover:bg-default hover:text-foreground"
									>
										<X className="size-3.5" />
									</TooltipButton>
								)}
							</label>
							<div className="flex flex-wrap gap-1">
								{[
									["todas", "Todas"],
									["activas", "Activas"],
									["inactivas", "Inactivas"],
									["agotadas", "Agotadas"],
								].map(([id, label]) => (
									<button
										key={id}
										type="button"
										aria-pressed={statusFilter === id}
										onClick={() => setStatusFilter(id)}
										className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
											statusFilter === id
												? "bg-accent text-accent-foreground"
												: "bg-default text-muted hover:text-foreground"
										}`}
									>
										{label}
									</button>
								))}
							</div>
						</div>

						{loading ? (
							<p className="px-5 py-12 text-center text-sm text-muted">
								Cargando recetas...
							</p>
						) : visible.length === 0 ? (
							<div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
								<span className="flex size-14 items-center justify-center rounded-full bg-accent/10 text-accent">
									<ChefHat className="size-7" />
								</span>
								<h2 className="mt-4 text-lg font-semibold text-foreground">
									No hay recetas para mostrar
								</h2>
								<p className="mt-2 max-w-sm text-sm text-muted">
									{recipes.length === 0
										? "Crea la primera receta con el formulario de la derecha."
										: "Prueba otra búsqueda o cambia el filtro."}
								</p>
							</div>
						) : (
							<ul className="divide-y divide-border">
								{visible.map((recipe) => {
									const busy = busyId === recipe.id;
									return (
										<li
											key={recipe.id}
											className="flex flex-wrap items-center justify-between gap-4 px-5 py-4"
										>
											<div className="flex min-w-0 flex-1 items-center gap-3">
												<div
													className="size-14 shrink-0 overflow-hidden rounded-xl bg-default"
													style={{
														backgroundImage:
															recipe.gradient ||
															"linear-gradient(135deg, #92400e 0%, #f59e0b 100%)",
													}}
												>
													{recipe.image ? (
														<img
															src={recipe.image}
															alt={recipe.nombre}
															className="h-full w-full object-cover"
															loading="lazy"
															onError={(event) => {
																event.currentTarget.style.display = "none";
															}}
														/>
													) : (
														<div className="flex h-full w-full items-center justify-center">
															<ChefHat className="size-6 text-white/70" />
														</div>
													)}
												</div>
												<div className="min-w-0">
													<div className="flex flex-wrap items-center gap-2">
														<h2 className="truncate font-semibold text-foreground">
															{recipe.nombre}
														</h2>
														<span
															className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
																recipe.is_active
																	? "bg-success/10 text-success"
																	: "bg-default text-muted"
															}`}
														>
															{recipe.is_active ? "Activa" : "Inactiva"}
														</span>
														{recipe.stock === 0 && (
															<span className="rounded-full bg-danger/10 px-2 py-0.5 text-[10px] font-semibold text-danger">
																Agotada
															</span>
														)}
													</div>
													<div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
														<span className="inline-flex items-center gap-1">
															<Tag className="size-3.5" />
															{recipe.categoria_nombre || "Sin categoría"}
														</span>
														<span className="inline-flex items-center gap-1">
															<Clock className="size-3.5" />
															{recipe.prep_minutes} min
														</span>
														<span className="font-semibold text-accent">
															{formatCOP(recipe.precio)}
														</span>
														{recipe.etiqueta && (
															<span className="rounded-full bg-default px-2 py-0.5 text-[10px]">
																{recipe.etiqueta}
															</span>
														)}
													</div>
												</div>
											</div>

											<div className="flex items-center gap-3 self-center">
												<div className="flex items-center gap-1.5">
													<TooltipButton
														label="Quitar una unidad"
														type="button"
														onClick={() => adjustStock(recipe, -1)}
														disabled={busy || recipe.stock === 0}
														aria-label={`Quitar stock a ${recipe.nombre}`}
														className="flex size-7 items-center justify-center rounded-lg border border-border text-muted hover:border-accent/40 hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
													>
														<Minus className="size-3.5" />
													</TooltipButton>
													<span
														className={`min-w-14 rounded-full px-3 py-1 text-center text-xs font-semibold ${stockClass(recipe.stock)}`}
													>
														{recipe.stock} uds.
													</span>
													<TooltipButton
														label="Agregar una unidad"
														type="button"
														onClick={() => adjustStock(recipe, 1)}
														disabled={busy}
														aria-label={`Agregar stock a ${recipe.nombre}`}
														className="flex size-7 items-center justify-center rounded-lg border border-border text-muted hover:border-accent/40 hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
													>
														<Plus className="size-3.5" />
													</TooltipButton>
												</div>
												<div className="flex items-center gap-1">
													<TooltipButton
														label="Editar receta"
														type="button"
														onClick={() => handleEdit(recipe)}
														aria-label={`Editar ${recipe.nombre}`}
														className="rounded-lg p-2 text-muted transition-colors hover:bg-accent/10 hover:text-accent"
													>
														<Pencil className="size-4" />
													</TooltipButton>
													<TooltipButton
														label={
															recipe.is_active
																? "Desactivar receta"
																: "Activar receta"
														}
														type="button"
														onClick={() => handleToggle(recipe)}
														disabled={busy}
														aria-label={
															recipe.is_active
																? `Desactivar ${recipe.nombre}`
																: `Activar ${recipe.nombre}`
														}
														className="rounded-lg p-2 text-muted transition-colors hover:bg-warning/10 hover:text-warning disabled:opacity-50"
													>
														{recipe.is_active ? (
															<X className="size-4" />
														) : (
															<ChefHat className="size-4" />
														)}
													</TooltipButton>
													<TooltipButton
														label="Eliminar receta"
														type="button"
														onClick={() => handleDelete(recipe)}
														disabled={busy}
														aria-label={`Eliminar ${recipe.nombre}`}
														className="rounded-lg p-2 text-muted transition-colors hover:bg-danger/10 hover:text-danger disabled:opacity-50"
													>
														<Trash2 className="size-4" />
													</TooltipButton>
												</div>
											</div>
										</li>
									);
								})}
							</ul>
						)}
					</div>

					<form
						onSubmit={handleSubmit}
						className="h-fit rounded-2xl border border-border bg-surface p-5 xl:sticky xl:top-6"
					>
						<div className="flex items-start justify-between gap-3">
							<h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
								{editingId ? (
									<Pencil className="size-4 text-accent" />
								) : (
									<Plus className="size-4 text-accent" />
								)}
								{editingId ? "Editar receta" : "Nueva receta"}
							</h2>
							{editingId && (
								<TooltipButton
									label="Cancelar edición"
									type="button"
									onClick={resetForm}
									aria-label="Cancelar edición"
									className="rounded-lg p-1.5 text-muted hover:bg-default hover:text-foreground"
								>
									<X className="size-4" />
								</TooltipButton>
							)}
						</div>

						<div className="mt-4 space-y-3">
							<div className="space-y-2">
								<span className="block text-xs font-semibold text-muted">
									Imagen del platillo
								</span>
								<div className="flex items-center gap-3">
									<div
										className="size-20 shrink-0 overflow-hidden rounded-xl border border-border bg-default"
										style={{
											backgroundImage:
												previewGradient ||
												"linear-gradient(135deg, #92400e 0%, #f59e0b 100%)",
										}}
									>
										{imagePreview ? (
											<img
												src={imagePreview}
												alt="Vista previa de la receta"
												className="h-full w-full object-cover"
												onError={(event) => {
													event.currentTarget.style.display = "none";
												}}
											/>
										) : (
											<div className="flex h-full w-full items-center justify-center text-white/70">
												<ImagePlus className="size-6" />
											</div>
										)}
									</div>
									<div className="min-w-0 flex-1 space-y-2">
										<label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:border-accent hover:text-accent">
											<ImagePlus className="size-4" />
											{imagePreview ? "Cambiar imagen" : "Subir imagen"}
											<input
												type="file"
												accept="image/jpeg,image/png,image/webp,image/gif"
												onChange={handleImageChange}
												className="sr-only"
											/>
										</label>
										{imagePreview && (
											<button
												type="button"
												onClick={handleRemoveImage}
												className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-danger hover:underline"
											>
												<ImageOff className="size-3.5" />
												Quitar imagen
											</button>
										)}
										<p className="text-[11px] text-muted">
											JPG, PNG, WEBP o GIF. Máximo 5 MB.
										</p>
									</div>
								</div>
							</div>
							<label className="block text-xs font-semibold text-muted">
								Nombre
								<input
									name="nombre"
									value={form.nombre}
									onChange={handleChange}
									required
									maxLength={120}
									placeholder="Pollo al curry"
									className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
								/>
							</label>
							<label className="block text-xs font-semibold text-muted">
								Descripción
								<textarea
									name="descripcion"
									value={form.descripcion}
									onChange={handleChange}
									rows={3}
									maxLength={500}
									placeholder="Ingredientes y preparación"
									className="mt-1 w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
								/>
							</label>
							<div className="grid grid-cols-2 gap-3">
								<label className="block text-xs font-semibold text-muted">
									Precio
									<input
										name="precio"
										type="number"
										min="1"
										step="0.01"
										value={form.precio}
										onChange={handleChange}
										required
										placeholder="18900"
										className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
									/>
								</label>
								<label className="block text-xs font-semibold text-muted">
									Stock
									<input
										name="stock"
										type="number"
										min="0"
										step="1"
										value={form.stock}
										onChange={handleChange}
										required
										className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
									/>
								</label>
							</div>
							<label className="block text-xs font-semibold text-muted">
								Categoría
								<select
									name="categoria"
									value={form.categoria}
									onChange={handleChange}
									className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
								>
									<option value="">Sin categoría</option>
									{categories.map((category) => (
										<option key={category.id} value={category.id}>
											{category.nombre}
										</option>
									))}
								</select>
							</label>
							<div className="grid grid-cols-2 gap-3">
								<label className="block text-xs font-semibold text-muted">
									Etiqueta
									<input
										name="etiqueta"
										value={form.etiqueta}
										onChange={handleChange}
										maxLength={60}
										placeholder="Más pedido"
										className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
									/>
								</label>
								<label className="block text-xs font-semibold text-muted">
									Preparación (min)
									<input
										name="prep_minutes"
										type="number"
										min="0"
										step="1"
										value={form.prep_minutes}
										onChange={handleChange}
										required
										className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
									/>
								</label>
							</div>
							<label className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background px-3 py-2.5 text-xs font-semibold text-muted">
								<span>Disponible para pedir</span>
								<input
									name="is_active"
									type="checkbox"
									checked={form.is_active}
									onChange={handleChange}
									className="size-4 accent-[var(--accent)]"
								/>
							</label>
						</div>

						<button
							type="submit"
							disabled={saving}
							className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground disabled:opacity-60"
						>
							<Plus className="size-4" />
							{saving
								? "Guardando..."
								: editingId
									? "Guardar cambios"
									: "Crear receta"}
						</button>
						<p className="mt-2 text-center text-[11px] text-muted">
							El stock se descuenta cuando un cliente confirma un pedido.
						</p>
					</form>
				</div>
			</div>
		</Dashboard>
	);
}

export default Recipes;
