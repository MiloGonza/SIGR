import { useEffect, useState } from "react";
import { Check, MapPin, Plus, Trash2 } from "lucide-react";
import {
	createAddress,
	deleteAddress,
	getAddresses,
	getApiErrorMessage,
	updateAddress,
} from "../../Api/clientApi";
import useStore from "../../store/useStore";

const EMPTY_FORM = {
	alias: "Casa",
	direccion: "",
	ciudad: "Bogotá",
	notas: "",
};

function Addresses() {
	const { user, setIsOpen } = useStore();
	const [addresses, setAddresses] = useState([]);
	const [form, setForm] = useState(EMPTY_FORM);
	const [loading, setLoading] = useState(Boolean(user));
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");

	const load = () => {
		if (!user) {
			setAddresses([]);
			setLoading(false);
			return;
		}
		setLoading(true);
		getAddresses()
			.then((data) => {
				setAddresses(data);
				setError("");
			})
			.catch((requestError) =>
				setError(
					getApiErrorMessage(requestError, "No se pudieron cargar tus direcciones"),
				),
			)
			.finally(() => setLoading(false));
	};

	useEffect(() => {
		let active = true;
		if (!user) return undefined;

		getAddresses()
			.then((data) => {
				if (active) {
					setAddresses(data);
					setError("");
				}
			})
			.catch((requestError) => {
				if (active) {
					setError(
						getApiErrorMessage(
							requestError,
							"No se pudieron cargar tus direcciones",
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
		if (!form.direccion.trim()) {
			setError("Escribe la dirección de entrega.");
			return;
		}
		setSaving(true);
		setError("");
		try {
			await createAddress({
				...form,
				direccion: form.direccion.trim(),
				notas: form.notas.trim(),
			});
			setForm(EMPTY_FORM);
			load();
		} catch (requestError) {
			setError(
				getApiErrorMessage(requestError, "No se pudo guardar la dirección"),
			);
		} finally {
			setSaving(false);
		}
	};

	const handleDefault = async (address) => {
		setError("");
		try {
			await updateAddress(address.id, { is_default: true });
			load();
		} catch (requestError) {
			setError(
				getApiErrorMessage(
					requestError,
					"No se pudo marcar la dirección como predeterminada",
				),
			);
		}
	};

	const handleDelete = async (address) => {
		setError("");
		try {
			await deleteAddress(address.id);
			load();
		} catch (requestError) {
			setError(
				getApiErrorMessage(requestError, "No se pudo eliminar la dirección"),
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
						Direcciones
					</h1>
					<p className="mt-2 max-w-xl text-sm text-muted">
						Administra los lugares donde quieres recibir tus pedidos.
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
							<MapPin className="size-8" />
						</span>
						<h2 className="mt-5 text-xl font-semibold text-foreground">
							Inicia sesión para guardar direcciones
						</h2>
						<p className="mt-2 max-w-sm text-sm text-muted">
							Tus direcciones quedan asociadas a tu cuenta.
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
									Cargando direcciones...
								</p>
							) : addresses.length === 0 ? (
								<div className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface px-6 py-10 text-center">
									<span className="flex size-14 items-center justify-center rounded-full bg-accent/10 text-accent">
										<MapPin className="size-7" />
									</span>
									<h2 className="mt-4 text-lg font-semibold text-foreground">
										Aún no tienes direcciones guardadas
									</h2>
									<p className="mt-2 max-w-sm text-sm text-muted">
										Agrega una dirección para que tus pedidos lleguen justo donde
										los necesitas.
									</p>
								</div>
							) : (
								addresses.map((address) => (
									<article
										key={address.id}
										className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-border bg-surface p-5"
									>
										<div className="flex items-start gap-3">
											<span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
												<MapPin className="size-5" />
											</span>
											<div>
												<div className="flex flex-wrap items-center gap-2">
													<h2 className="font-semibold text-foreground">
														{address.alias}
													</h2>
													{address.is_default && (
														<span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent">
															Predeterminada
														</span>
													)}
												</div>
												<p className="mt-1 text-sm text-foreground">
													{address.direccion}
												</p>
												<p className="text-xs text-muted">{address.ciudad}</p>
												{address.notas && (
													<p className="mt-1 text-xs text-muted">
														{address.notas}
													</p>
												)}
											</div>
										</div>
										<div className="flex items-center gap-1">
											{!address.is_default && (
												<button
													type="button"
													onClick={() => handleDefault(address)}
													className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-muted transition-colors hover:bg-accent/10 hover:text-accent"
												>
													<Check className="size-3.5" />
													Predeterminada
												</button>
											)}
											<button
												type="button"
												onClick={() => handleDelete(address)}
												aria-label={`Eliminar ${address.alias}`}
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
								Agregar dirección
							</h2>
							<div className="mt-4 space-y-3">
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
									Dirección
									<input
										name="direccion"
										value={form.direccion}
										onChange={handleChange}
										required
										maxLength={200}
										placeholder="Calle 45 #12-30"
										className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
									/>
								</label>
								<label className="block text-xs font-semibold text-muted">
									Ciudad
									<input
										name="ciudad"
										value={form.ciudad}
										onChange={handleChange}
										maxLength={100}
										className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
									/>
								</label>
								<label className="block text-xs font-semibold text-muted">
									Notas
									<input
										name="notas"
										value={form.notas}
										onChange={handleChange}
										maxLength={200}
										placeholder="Torre, apartamento, indicaciones"
										className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
									/>
								</label>
							</div>
							<button
								type="submit"
								disabled={saving}
								className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground disabled:opacity-60"
							>
								<Plus className="size-4" />
								{saving ? "Guardando..." : "Guardar dirección"}
							</button>
						</form>
					</div>
				)}
			</div>
		</section>
	);
}

export default Addresses;
