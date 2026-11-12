import { useEffect, useState } from "react";
import { Tooltip } from "@heroui/react";
import {
	Crown,
	Mail,
	Pencil,
	Plus,
	Search,
	ShieldCheck,
	Trash2,
	UserRound,
	UserRoundCheck,
	UserRoundX,
	Users,
	X,
} from "lucide-react";
import {
	createEmployee,
	deleteEmployee,
	getApiErrorMessage,
	getEmployees,
	updateEmployee,
} from "../../../Api/clientApi";
import useStore from "../../../store/useStore";
import { formatDate } from "../../../utils/format";
import Dashboard from "../Dashboard";

const ROLES = [
	{ id: "mesero", label: "Mesero" },
	{ id: "administrador", label: "Administrador" },
];

const EMPTY_FORM = {
	username: "",
	email: "",
	password: "",
	rol: "mesero",
};

const roleLabel = (rol) =>
	ROLES.find((role) => role.id === rol)?.label ?? "Mesero";

const initials = (name = "") =>
	name
		.trim()
		.split(/\s+/)
		.slice(0, 2)
		.map((part) => part[0]?.toUpperCase() ?? "")
		.join("") || "?";

// HeroUI Tooltip.Trigger no activa el overlay de forma fiable al renderizar un
// botón propio, así que controlamos la apertura con eventos del botón.
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

function Emplpoys() {
	const { user } = useStore();
	const [employees, setEmployees] = useState([]);
	const [loading, setLoading] = useState(Boolean(user));
	const [error, setError] = useState("");
	const [notice, setNotice] = useState("");
	const [query, setQuery] = useState("");
	const [roleFilter, setRoleFilter] = useState("todos");
	const [form, setForm] = useState(EMPTY_FORM);
	const [editingId, setEditingId] = useState(null);
	const [saving, setSaving] = useState(false);
	const [busyId, setBusyId] = useState(null);

	useEffect(() => {
		let active = true;

		if (!user) return undefined;

		getEmployees()
			.then((data) => {
				if (active) {
					setEmployees(data);
					setError("");
				}
			})
			.catch((requestError) => {
				if (active) {
					setError(
						getApiErrorMessage(
							requestError,
							"No se pudo cargar el equipo del restaurante",
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
	const visible = employees.filter((employee) => {
		const byRole =
			roleFilter === "todos" ||
			(roleFilter === "inactivos"
				? !employee.is_active
				: employee.rol === roleFilter && employee.is_active);
		const bySearch =
			!search ||
			[employee.username, employee.email, employee.rol]
				.join(" ")
				.toLowerCase()
				.includes(search);
		return byRole && bySearch;
	});

	const totalActive = employees.filter((item) => item.is_active).length;
	const waiters = employees.filter(
		(item) => item.rol === "mesero" && item.is_active,
	).length;
	const admins = employees.filter(
		(item) => item.rol === "administrador" && item.is_active,
	).length;

	const resetForm = () => {
		setForm(EMPTY_FORM);
		setEditingId(null);
	};

	const handleChange = (event) => {
		const { name, value } = event.target;
		setForm((current) => ({ ...current, [name]: value }));
	};

	const handleEdit = (employee) => {
		setEditingId(employee.id);
		setForm({
			username: employee.username,
			email: employee.email ?? "",
			password: "",
			rol: employee.rol,
		});
		setError("");
		setNotice("");
		window.scrollTo({ top: 0, behavior: "smooth" });
	};

	const handleSubmit = async (event) => {
		event.preventDefault();
		setError("");
		setNotice("");

		const username = form.username.trim();
		const email = form.email.trim();
		const password = form.password;

		if (username.length < 3) {
			setError("El nombre de usuario debe tener al menos 3 caracteres.");
			return;
		}
		if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			setError("Escribe un correo electrónico válido.");
			return;
		}
		if (!editingId && password.length < 8) {
			setError("La contraseña debe tener al menos 8 caracteres.");
			return;
		}
		if (editingId && password && password.length < 8) {
			setError("La nueva contraseña debe tener al menos 8 caracteres.");
			return;
		}

		const payload = { username, email, rol: form.rol };
		if (password) payload.password = password;

		setSaving(true);
		try {
			if (editingId) {
				const updated = await updateEmployee(editingId, payload);
				setEmployees((current) =>
					current.map((employee) =>
						employee.id === updated.id ? updated : employee,
					),
				);
				setNotice(`Perfil de ${updated.username} actualizado.`);
			} else {
				const created = await createEmployee(payload);
				setEmployees((current) =>
					[...current, created].sort((a, b) =>
						a.username.localeCompare(b.username),
					),
				);
				setNotice(`Perfil de ${created.username} creado.`);
			}
			resetForm();
		} catch (requestError) {
			setError(
				getApiErrorMessage(
					requestError,
					"No se pudo guardar el perfil del empleado",
				),
			);
		} finally {
			setSaving(false);
		}
	};

	const handleToggleActive = async (employee) => {
		setError("");
		setNotice("");
		setBusyId(employee.id);
		try {
			const updated = await updateEmployee(employee.id, {
				is_active: !employee.is_active,
			});
			setEmployees((current) =>
				current.map((item) => (item.id === updated.id ? updated : item)),
			);
			setNotice(
				updated.is_active
					? `${updated.username} puede volver a iniciar sesión.`
					: `${updated.username} quedó desactivado.`,
			);
		} catch (requestError) {
			setError(
				getApiErrorMessage(
					requestError,
					"No se pudo actualizar el estado del empleado",
				),
			);
		} finally {
			setBusyId(null);
		}
	};

	const handleDelete = async (employee) => {
		if (
			!window.confirm(
				`¿Eliminar el perfil de ${employee.username}? Esta acción no se puede deshacer.`,
			)
		) {
			return;
		}
		setError("");
		setNotice("");
		setBusyId(employee.id);
		try {
			await deleteEmployee(employee.id);
			setEmployees((current) =>
				current.filter((item) => item.id !== employee.id),
			);
			if (editingId === employee.id) resetForm();
			setNotice(`Perfil de ${employee.username} eliminado.`);
		} catch (requestError) {
			setError(
				getApiErrorMessage(
					requestError,
					"No se pudo eliminar el perfil del empleado",
				),
			);
		} finally {
			setBusyId(null);
		}
	};

	const isEditingSelf =
		editingId !== null && Number(editingId) === Number(user?.id);

	return (
		<Dashboard
			title="Empleados"
			description="Crea y administra los perfiles del equipo de tu restaurante."
			icon={Users}
			eyebrow="SIGR · Administración"
		>
			<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				{[
					{ label: "Total del equipo", value: employees.length, icon: Users },
					{ label: "Activos", value: totalActive, icon: UserRoundCheck },
					{ label: "Meseros", value: waiters, icon: UserRound },
					{ label: "Administradores", value: admins, icon: Crown },
				].map((stat) => {
					const StatIcon = stat.icon;
					return (
						<div
							key={stat.label}
							className="rounded-2xl border border-border bg-surface p-5"
						>
							<span className="flex size-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
								<StatIcon className="size-5" />
							</span>
							<p className="mt-3 text-2xl font-semibold text-foreground">
								{stat.value}
							</p>
							<p className="text-xs text-muted">{stat.label}</p>
						</div>
					);
				})}
			</div>

			{user?.restaurante?.nombre && (
				<p className="mt-4 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-xs font-medium text-muted">
					<ShieldCheck className="size-4 text-accent" />
					Equipo de {user.restaurante.nombre}
				</p>
			)}

			{(error || notice) && (
				<p
					role={error ? "alert" : "status"}
					className={`mt-5 rounded-xl border px-4 py-2.5 text-sm ${
						error
							? "border-danger/30 bg-danger/10 text-danger"
							: "border-success/30 bg-success/10 text-success"
					}`}
				>
					{error || notice}
				</p>
			)}

			<div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
				<div>
					<div className="flex flex-wrap items-center gap-3">
						<label className="relative min-w-56 flex-1">
							<span className="sr-only">Buscar empleado</span>
							<Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
							<input
								value={query}
								onChange={(event) => setQuery(event.target.value)}
								placeholder="Buscar por nombre o correo"
								className="w-full rounded-xl border border-border bg-surface py-2.5 pr-9 pl-9 text-sm text-foreground outline-none focus:border-accent"
							/>
							{query && (
								<TooltipButton
									label="Limpiar búsqueda"
									type="button"
									onClick={() => setQuery("")}
									aria-label="Limpiar búsqueda"
									className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1 text-muted hover:text-foreground"
								>
									<X className="size-3.5" />
								</TooltipButton>
							)}
						</label>

						<div className="flex flex-wrap gap-1.5">
							{[
								{ id: "todos", label: "Todos" },
								{ id: "mesero", label: "Meseros" },
								{ id: "administrador", label: "Administradores" },
								{ id: "inactivos", label: "Inactivos" },
							].map((filter) => (
								<button
									key={filter.id}
									type="button"
									onClick={() => setRoleFilter(filter.id)}
									aria-pressed={roleFilter === filter.id}
									className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
										roleFilter === filter.id
											? "border-accent bg-accent text-accent-foreground"
											: "border-border bg-surface text-muted hover:border-accent/40 hover:text-accent"
									}`}
								>
									{filter.label}
								</button>
							))}
						</div>
					</div>

					<div className="mt-4 overflow-hidden rounded-2xl border border-border bg-surface">
						{loading ? (
							<p className="px-5 py-12 text-center text-sm text-muted">
								Cargando el equipo...
							</p>
						) : visible.length === 0 ? (
							<div className="flex min-h-56 flex-col items-center justify-center px-6 py-12 text-center">
								<span className="flex size-14 items-center justify-center rounded-full bg-accent/10 text-accent">
									<Users className="size-7" />
								</span>
								<h2 className="mt-4 text-lg font-semibold text-foreground">
									{employees.length === 0
										? "Aún no hay perfiles en tu equipo"
										: "No hay resultados para este filtro"}
								</h2>
								<p className="mt-2 max-w-sm text-sm text-muted">
									{employees.length === 0
										? "Crea el primer perfil con el formulario de la derecha."
										: "Prueba con otra búsqueda o cambia el filtro de rol."}
								</p>
							</div>
						) : (
							<ul className="divide-y divide-border">
								{visible.map((employee) => {
									const isSelf = Number(employee.id) === Number(user?.id);
									const isWaiter = employee.rol === "mesero";
									const busy = busyId === employee.id;
									return (
										<li
											key={employee.id}
											className="flex flex-wrap items-center justify-between gap-4 px-5 py-4"
										>
											<div className="flex min-w-0 items-start gap-3">
												<span
													className={`flex size-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
														employee.is_active
															? "bg-accent/10 text-accent"
															: "bg-default text-muted"
													}`}
												>
													{initials(employee.username)}
												</span>
												<div className="min-w-0">
													<div className="flex flex-wrap items-center gap-2">
														<h2 className="truncate font-semibold text-foreground">
															{employee.username}
														</h2>
														{isSelf && (
															<span className="rounded-full bg-default px-2 py-0.5 text-[10px] font-semibold text-muted">
																Tú
															</span>
														)}
														<span
															className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
																employee.is_active
																	? "bg-success/10 text-success"
																	: "bg-danger/10 text-danger"
															}`}
														>
															{employee.is_active ? "Activo" : "Inactivo"}
														</span>
													</div>
													<p className="mt-1 flex items-center gap-1.5 truncate text-xs text-muted">
														<Mail className="size-3.5 shrink-0" />
														{employee.email || "Sin correo registrado"}
													</p>
													<div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted">
														<span
															className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold ${
																isWaiter
																	? "bg-default text-foreground"
																	: "bg-accent/10 text-accent"
															}`}
														>
															{isWaiter ? (
																<UserRound className="size-3" />
															) : (
																<Crown className="size-3" />
															)}
															{roleLabel(employee.rol)}
														</span>
														<span>
															Desde {formatDate(employee.date_joined)}
														</span>
														{employee.last_login && (
															<span>
																· Último acceso{" "}
																{formatDate(employee.last_login)}
															</span>
														)}
													</div>
												</div>
											</div>

											<div className="flex items-center gap-1 self-center">
												<TooltipButton
													label="Editar empleado"
													type="button"
													onClick={() => handleEdit(employee)}
													aria-label={`Editar ${employee.username}`}
													className="rounded-lg p-2 text-muted transition-colors hover:bg-accent/10 hover:text-accent"
												>
													<Pencil className="size-4" />
												</TooltipButton>
												{!isSelf && (
													<TooltipButton
														label={
															employee.is_active
																? "Desactivar empleado"
																: "Activar empleado"
														}
														type="button"
														onClick={() => handleToggleActive(employee)}
														disabled={busy}
														aria-label={
															employee.is_active
																? `Desactivar ${employee.username}`
																: `Activar ${employee.username}`
														}
														className="rounded-lg p-2 text-muted transition-colors hover:bg-warning/10 hover:text-warning disabled:opacity-50"
													>
														{employee.is_active ? (
															<UserRoundX className="size-4" />
														) : (
															<UserRoundCheck className="size-4" />
														)}
													</TooltipButton>
												)}
												{!isSelf && (
													<TooltipButton
														label="Eliminar empleado"
														type="button"
														onClick={() => handleDelete(employee)}
														disabled={busy}
														aria-label={`Eliminar ${employee.username}`}
														className="rounded-lg p-2 text-muted transition-colors hover:bg-danger/10 hover:text-danger disabled:opacity-50"
													>
														<Trash2 className="size-4" />
													</TooltipButton>
												)}
											</div>
										</li>
									);
								})}
							</ul>
						)}
					</div>
				</div>

				<form
					onSubmit={handleSubmit}
					className="h-fit rounded-2xl border border-border bg-surface p-5 lg:sticky lg:top-6"
				>
					<div className="flex items-start justify-between gap-3">
						<h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
							{editingId ? (
								<Pencil className="size-4 text-accent" />
							) : (
								<Plus className="size-4 text-accent" />
							)}
							{editingId ? "Editar perfil" : "Nuevo empleado"}
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
					<p className="mt-1 text-xs text-muted">
						{editingId
							? "Actualiza los datos o asigna una nueva contraseña."
							: "El perfil quedará asociado a tu restaurante."}
					</p>

					<div className="mt-4 space-y-3">
						<label className="block text-xs font-semibold text-muted">
							Nombre de usuario
							<input
								name="username"
								value={form.username}
								onChange={handleChange}
								required
								minLength={3}
								maxLength={150}
								autoComplete="off"
								placeholder="Ej. maria.mesera"
								className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
							/>
						</label>

						<label className="block text-xs font-semibold text-muted">
							Correo electrónico
							<input
								name="email"
								type="email"
								value={form.email}
								onChange={handleChange}
								maxLength={254}
								autoComplete="off"
								placeholder="empleado@correo.com"
								className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
							/>
						</label>

						<label className="block text-xs font-semibold text-muted">
							{editingId ? "Nueva contraseña (opcional)" : "Contraseña"}
							<input
								name="password"
								type="password"
								value={form.password}
								onChange={handleChange}
								required={!editingId}
								minLength={8}
								autoComplete="new-password"
								placeholder={
									editingId ? "Dejar vacío para conservarla" : "Mínimo 8 caracteres"
								}
								className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
							/>
						</label>

						<label className="block text-xs font-semibold text-muted">
							Rol
							<select
								name="rol"
								value={form.rol}
								onChange={handleChange}
								disabled={isEditingSelf}
								className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-accent disabled:opacity-60"
							>
								{ROLES.map((role) => (
									<option key={role.id} value={role.id}>
										{role.label}
									</option>
								))}
							</select>
						</label>
						{isEditingSelf && (
							<p className="text-[11px] text-muted">
								No puedes cambiar tu propio rol desde tu perfil.
							</p>
						)}
					</div>

					<button
						type="submit"
						disabled={saving}
						className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition-transform enabled:hover:scale-[1.01] disabled:cursor-wait disabled:opacity-60"
					>
						{editingId ? (
							<Pencil className="size-4" />
						) : (
							<Plus className="size-4" />
						)}
						{saving
							? "Guardando..."
							: editingId
								? "Guardar cambios"
								: "Crear perfil"}
					</button>

					<p className="mt-3 text-center text-[11px] text-muted">
						Los meseros acceden al panel de pedidos, turnos y disponibilidad.
					</p>
				</form>
			</div>
		</Dashboard>
	);
}

export default Emplpoys;
