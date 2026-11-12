import { useEffect, useState } from "react";
import { Check, CreditCard, Plus, Trash2 } from "lucide-react";
import {
	createPaymentMethod,
	deletePaymentMethod,
	getApiErrorMessage,
	getPaymentMethods,
	updatePaymentMethod,
} from "../../Api/clientApi";
import useStore from "../../store/useStore";

const TIPOS = [
	{ id: "tarjeta", label: "Tarjeta" },
	{ id: "nequi", label: "Nequi" },
	{ id: "daviplata", label: "Daviplata" },
	{ id: "pse", label: "PSE" },
	{ id: "efectivo", label: "Efectivo" },
];

const EMPTY_FORM = {
	tipo: "tarjeta",
	alias: "Mi tarjeta",
	titular: "",
	numero_tarjeta: "",
	mes_expira: "12",
	anio_expira: String(new Date().getFullYear() + 3),
};

const tipoLabel = (tipo) =>
	TIPOS.find((item) => item.id === tipo)?.label ?? tipo;

function Payments() {
	const { user, setIsOpen } = useStore();
	const [methods, setMethods] = useState([]);
	const [form, setForm] = useState(EMPTY_FORM);
	const [loading, setLoading] = useState(Boolean(user));
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");

	const load = () => {
		if (!user) {
			setMethods([]);
			setLoading(false);
			return;
		}
		setLoading(true);
		getPaymentMethods()
			.then((data) => {
				setMethods(data);
				setError("");
			})
			.catch((requestError) =>
				setError(
					getApiErrorMessage(
						requestError,
						"No se pudieron cargar tus métodos de pago",
					),
				),
			)
			.finally(() => setLoading(false));
	};

	useEffect(() => {
		let active = true;
		if (!user) return undefined;

		getPaymentMethods()
			.then((data) => {
				if (active) {
					setMethods(data);
					setError("");
				}
			})
			.catch((requestError) => {
				if (active) {
					setError(
						getApiErrorMessage(
							requestError,
							"No se pudieron cargar tus métodos de pago",
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

	const handleChange = (event) => {
		const { name, value } = event.target;
		setForm((current) => ({ ...current, [name]: value }));
	};

	const handleSubmit = async (event) => {
		event.preventDefault();
		setSaving(true);
		setError("");
		try {
			const payload = {
				tipo: form.tipo,
				alias: form.alias.trim(),
				titular: form.titular.trim(),
			};
			if (form.tipo === "tarjeta") {
				payload.numero_tarjeta = form.numero_tarjeta.trim();
				payload.mes_expira = Number(form.mes_expira);
				payload.anio_expira = Number(form.anio_expira);
			}
			await createPaymentMethod(payload);
			setForm(EMPTY_FORM);
			load();
		} catch (requestError) {
			setError(
				getApiErrorMessage(
					requestError,
					"No se pudo guardar el método de pago",
				),
			);
		} finally {
			setSaving(false);
		}
	};

	const handleDefault = async (method) => {
		setError("");
		try {
			await updatePaymentMethod(method.id, { is_default: true });
			load();
		} catch (requestError) {
			setError(
				getApiErrorMessage(
					requestError,
					"No se pudo marcar el método como predeterminado",
				),
			);
		}
	};

	const handleDelete = async (method) => {
		setError("");
		try {
			await deletePaymentMethod(method.id);
			load();
		} catch (requestError) {
			setError(
				getApiErrorMessage(
					requestError,
					"No se pudo eliminar el método de pago",
				),
			);
		}
	};

	return (
		<section className="min-h-dvh w-full bg-background px-5 py-8 md:px-10 md:py-12">
			<div className="mx-auto w-full max-w-[1600px]">
				<header>
					<p className="text-xs font-semibold tracking-[0.22em] text-muted uppercase">
						Cliente · Perfil
					</p>
					<h1 className="mt-3 font-advercase text-4xl text-foreground md:text-5xl">
						Métodos de pago
					</h1>
					<p className="mt-2 max-w-xl text-sm text-muted">
						Guarda tus métodos de pago para completar tus pedidos más rápido.
					</p>
				</header>

				{error && (
					<p className="mt-6 rounded-xl border border-danger/30 bg-danger/10 px-4 py-2.5 text-sm text-danger">
						{error}
					</p>
				)}

				{!user ? (
					<div className="mt-8 flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface px-6 py-12 text-center">
						<span className="flex size-16 items-center justify-center rounded-full bg-accent/10 text-accent">
							<CreditCard className="size-8" />
						</span>
						<h2 className="mt-5 text-xl font-semibold text-foreground">
							Inicia sesión para guardar métodos de pago
						</h2>
						<p className="mt-2 max-w-sm text-sm text-muted">
							Los métodos quedan asociados a tu cuenta y nunca guardamos el
							número completo de la tarjeta.
						</p>
						<button
							type="button"
							onClick={() => setIsOpen(true)}
							className="mt-6 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground"
						>
							Iniciar sesión
						</button>
					</div>
				) : (
					<div className="mt-8 grid gap-6 lg:grid-cols-[1fr_380px]">
						<div className="space-y-3">
							{loading ? (
								<p className="rounded-2xl border border-border bg-surface px-5 py-10 text-center text-sm text-muted">
									Cargando métodos de pago...
								</p>
							) : methods.length === 0 ? (
								<div className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface px-6 py-10 text-center">
									<span className="flex size-14 items-center justify-center rounded-full bg-accent/10 text-accent">
										<CreditCard className="size-7" />
									</span>
									<h2 className="mt-4 text-lg font-semibold text-foreground">
										Aún no tienes métodos de pago
									</h2>
									<p className="mt-2 max-w-sm text-sm text-muted">
										Cuando agregues uno, aparecerá aquí para que pagues tus
										pedidos sin volver a escribirlo.
									</p>
								</div>
							) : (
								methods.map((method) => (
									<article
										key={method.id}
										className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-border bg-surface p-5"
									>
										<div className="flex items-start gap-3">
											<span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
												<CreditCard className="size-5" />
											</span>
											<div>
												<div className="flex flex-wrap items-center gap-2">
													<h2 className="font-semibold text-foreground">
														{method.alias}
													</h2>
													{method.is_default && (
														<span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent">
															Predeterminado
														</span>
													)}
												</div>
												<p className="mt-1 text-sm text-foreground">
													{tipoLabel(method.tipo)}
													{method.ultimos4
														? ` ${method.marca} •••• ${method.ultimos4}`
														: ""}
												</p>
												{method.titular && (
													<p className="text-xs text-muted">{method.titular}</p>
												)}
												{method.mes_expira && method.anio_expira && (
													<p className="text-xs text-muted">
														Vence {String(method.mes_expira).padStart(2, "0")}/
														{method.anio_expira}
													</p>
												)}
											</div>
										</div>
										<div className="flex items-center gap-1">
											{!method.is_default && (
												<button
													type="button"
													onClick={() => handleDefault(method)}
													className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-muted transition-colors hover:bg-accent/10 hover:text-accent"
												>
													<Check className="size-3.5" />
													Predeterminado
												</button>
											)}
											<button
												type="button"
												onClick={() => handleDelete(method)}
												aria-label={`Eliminar ${method.alias}`}
												className="rounded-lg p-1.5 text-muted transition-colors hover:bg-danger/10 hover:text-danger"
											>
												<Trash2 className="size-4" />
											</button>
										</div>
									</article>
								))
							)}
						</div>

						<form
							onSubmit={handleSubmit}
							className="h-fit rounded-2xl border border-border bg-surface p-5"
						>
							<h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
								<Plus className="size-4 text-accent" />
								Agregar método
							</h2>
							<div className="mt-4 space-y-3">
								<label className="block text-xs font-semibold text-muted">
									Tipo
									<select
										name="tipo"
										value={form.tipo}
										onChange={handleChange}
										className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
									>
										{TIPOS.map((tipo) => (
											<option key={tipo.id} value={tipo.id}>
												{tipo.label}
											</option>
										))}
									</select>
								</label>
								<label className="block text-xs font-semibold text-muted">
									Alias
									<input
										name="alias"
										value={form.alias}
										onChange={handleChange}
										maxLength={60}
										className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
									/>
								</label>
								<label className="block text-xs font-semibold text-muted">
									Titular
									<input
										name="titular"
										value={form.titular}
										onChange={handleChange}
										maxLength={120}
										placeholder="Nombre como aparece en el método"
										className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
									/>
								</label>

								{form.tipo === "tarjeta" && (
									<>
										<label className="block text-xs font-semibold text-muted">
											Número de tarjeta
											<input
												name="numero_tarjeta"
												value={form.numero_tarjeta}
												onChange={handleChange}
												inputMode="numeric"
												autoComplete="cc-number"
												placeholder="4242 4242 4242 4242"
												maxLength={25}
												className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
											/>
										</label>
										<div className="grid grid-cols-2 gap-3">
											<label className="block text-xs font-semibold text-muted">
												Mes
												<select
													name="mes_expira"
													value={form.mes_expira}
													onChange={handleChange}
													className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
												>
													{Array.from({ length: 12 }, (_, index) => (
														<option
															key={index + 1}
															value={String(index + 1).padStart(2, "0")}
														>
															{String(index + 1).padStart(2, "0")}
														</option>
													))}
												</select>
											</label>
											<label className="block text-xs font-semibold text-muted">
												Año
												<input
													name="anio_expira"
													value={form.anio_expira}
													onChange={handleChange}
													inputMode="numeric"
													maxLength={4}
													className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
												/>
											</label>
										</div>
										<p className="text-[11px] text-muted">
											Solo guardamos la marca y los últimos cuatro dígitos.
										</p>
									</>
								)}
							</div>
							<button
								type="submit"
								disabled={saving}
								className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground disabled:opacity-60"
							>
								<Plus className="size-4" />
								{saving ? "Guardando..." : "Guardar método"}
							</button>
						</form>
					</div>
				)}
			</div>
		</section>
	);
}

export default Payments;
