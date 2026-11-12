import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import {
	ArrowRight,
	CreditCard,
	MapPin,
	Minus,
	Plus,
	ShoppingCart,
	Trash2,
} from "lucide-react";
import {
	checkout,
	clearCart,
	getAddresses,
	getApiErrorMessage,
	getCart,
	getPaymentMethods,
	removeCartItem,
	updateCartItem,
} from "../../Api/clientApi";
import LazyImage from "../../components/globals/LazyImage";
import useStore from "../../store/useStore";
import useCartStore from "../../store/useCartStore";
import { formatCOP } from "../../utils/format";

function Cars() {
	const navigate = useNavigate();
	const { user, setIsOpen } = useStore();
	const [cart, setCart] = useState(null);
	const [addresses, setAddresses] = useState([]);
	const [payments, setPayments] = useState([]);
	const [addressId, setAddressId] = useState("");
	const [paymentId, setPaymentId] = useState("");
	const [loading, setLoading] = useState(Boolean(user));
	const [busyId, setBusyId] = useState(null);
	const [placing, setPlacing] = useState(false);
	const [error, setError] = useState("");

	// Mantiene el contador global sincronizado con el carrito de esta vista.
	const syncCart = (next) => {
		setCart(next);
		useCartStore.getState().setCart(next);
	};

	useEffect(() => {
		let active = true;

		if (!user) {
			useCartStore.getState().reset();
			return undefined;
		}

		Promise.all([getCart(), getAddresses(), getPaymentMethods()])
			.then(([cartData, addressData, paymentData]) => {
				if (!active) return;
				syncCart(cartData);
				setAddresses(addressData);
				setPayments(paymentData);
				setAddressId(
					addressData.find((item) => item.is_default)?.id ??
						addressData[0]?.id ??
						"",
				);
				setPaymentId(
					paymentData.find((item) => item.is_default)?.id ??
						paymentData[0]?.id ??
						"",
				);
			})
			.catch((requestError) => {
				if (active) {
					setError(
						getApiErrorMessage(requestError, "No se pudo cargar el carrito"),
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

	const items = cart?.items ?? [];
	const isEmpty = items.length === 0;

	const changeQuantity = async (item, delta) => {
		const next = item.cantidad + delta;
		setError("");
		setBusyId(item.id);
		try {
			const updated =
				next <= 0
					? await removeCartItem(item.id)
					: await updateCartItem(item.id, next);
			syncCart(updated);
		} catch (requestError) {
			setError(
				getApiErrorMessage(requestError, "No se pudo actualizar el carrito"),
			);
		} finally {
			setBusyId(null);
		}
	};

	const handleRemove = async (item) => {
		setError("");
		setBusyId(item.id);
		try {
			syncCart(await removeCartItem(item.id));
		} catch (requestError) {
			setError(
				getApiErrorMessage(requestError, "No se pudo quitar el producto"),
			);
		} finally {
			setBusyId(null);
		}
	};

	const handleClear = async () => {
		setError("");
		try {
			syncCart(await clearCart());
		} catch (requestError) {
			setError(
				getApiErrorMessage(requestError, "No se pudo vaciar el carrito"),
			);
		}
	};

	const handleCheckout = async () => {
		if (!addressId) {
			setError("Agrega una dirección de entrega antes de confirmar el pedido.");
			return;
		}
		setError("");
		setPlacing(true);
		try {
			await checkout({
				address: Number(addressId),
				payment_method: paymentId ? Number(paymentId) : null,
			});
			useCartStore.getState().reset();
			navigate("/home/pedidos");
		} catch (requestError) {
			setError(
				getApiErrorMessage(requestError, "No se pudo confirmar el pedido"),
			);
		} finally {
			setPlacing(false);
		}
	};

	return (
		<section className="min-h-dvh w-full bg-background px-5 py-8 md:px-10 md:py-12">
			<div className="mx-auto w-full max-w-[1600px]">
				<header>
					<p className="text-xs font-semibold tracking-[0.22em] text-muted uppercase">
						Cliente · Carrito
					</p>
					<h1 className="mt-3 font-advercase text-4xl text-foreground md:text-5xl">
						Tu carrito
					</h1>
					<p className="mt-2 max-w-xl text-sm text-muted">
						Revisa los productos, ajusta cantidades y confirma tu pedido cuando
						todo esté listo.
					</p>
				</header>

				{error && (
					<p className="mt-6 rounded-xl border border-danger/30 bg-danger/10 px-4 py-2.5 text-sm text-danger">
						{error}
					</p>
				)}

				<div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
					<div className="overflow-hidden rounded-2xl border border-border bg-surface">
						{loading ? (
							<p className="px-6 py-12 text-center text-sm text-muted">
								Cargando tu carrito...
							</p>
						) : !user ? (
							<div className="flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center">
								<span className="flex size-16 items-center justify-center rounded-full bg-accent/10 text-accent">
									<ShoppingCart className="size-8" />
								</span>
								<h2 className="mt-5 text-xl font-semibold text-foreground">
									Inicia sesión para ver tu carrito
								</h2>
								<p className="mt-2 max-w-sm text-sm text-muted">
									Tu carrito se guarda en tu cuenta para que puedas continuar
									desde cualquier dispositivo.
								</p>
								<button
									type="button"
									onClick={() => setIsOpen(true)}
									className="mt-6 inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground"
								>
									Iniciar sesión
								</button>
							</div>
						) : isEmpty ? (
							<div className="flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center">
								<span className="flex size-16 items-center justify-center rounded-full bg-accent/10 text-accent">
									<ShoppingCart className="size-8" />
								</span>
								<h2 className="mt-5 text-xl font-semibold text-foreground">
									Tu carrito está vacío
								</h2>
								<p className="mt-2 max-w-sm text-sm text-muted">
									Todavía no has agregado nada. Explora las tiendas y encuentra
									algo rico para hoy.
								</p>
								<Link
									to="/home/tiendas"
									className="mt-6 inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition-transform hover:scale-[1.02]"
								>
									Explorar tiendas
									<ArrowRight className="size-4" />
								</Link>
							</div>
						) : (
							<>
								<div className="flex items-center justify-between border-b border-border px-5 py-4">
									<div>
										<p className="text-[11px] font-semibold tracking-[0.14em] text-muted uppercase">
											Pedido en
										</p>
										<h2 className="font-semibold text-foreground">
											{cart.tienda}
										</h2>
									</div>
									<button
										type="button"
										onClick={handleClear}
										className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-muted transition-colors hover:bg-danger/10 hover:text-danger"
									>
										<Trash2 className="size-3.5" />
										Vaciar
									</button>
								</div>
								<ul className="divide-y divide-border px-5">
									{items.map((item) => (
										<li
											key={item.id}
											className="flex flex-wrap items-center gap-4 py-4 sm:flex-nowrap"
										>
											<div className="size-16 shrink-0 overflow-hidden rounded-xl">
												<LazyImage
													src={item.dish.image}
													alt={item.dish.nombre}
													className="h-full w-full"
													fallback={
														<div
															className="flex h-full w-full items-center justify-center"
															style={{
																backgroundImage: item.dish.gradient,
															}}
														>
															<ShoppingCart className="size-6 text-white/70" />
														</div>
													}
												/>
											</div>
											<div className="min-w-0 flex-1">
												<h3 className="truncate font-semibold text-foreground">
													{item.dish.nombre}
												</h3>
												<p className="mt-0.5 text-xs text-muted">
													{item.dish.restaurante_nombre} ·{" "}
													{formatCOP(item.precio_unitario)}
												</p>
												<div className="mt-2 inline-flex items-center gap-2">
													<button
														type="button"
														aria-label={`Quitar una unidad de ${item.dish.nombre}`}
														onClick={() => changeQuantity(item, -1)}
														disabled={busyId === item.id}
														className="flex size-7 items-center justify-center rounded-lg border border-border text-muted transition-colors hover:border-accent/40 hover:text-accent disabled:opacity-50"
													>
														<Minus className="size-3.5" />
													</button>
													<span className="min-w-6 text-center text-sm font-semibold text-foreground">
														{item.cantidad}
													</span>
													<button
														type="button"
														aria-label={`Agregar una unidad de ${item.dish.nombre}`}
														onClick={() => changeQuantity(item, 1)}
														disabled={busyId === item.id}
														className="flex size-7 items-center justify-center rounded-lg border border-border text-muted transition-colors hover:border-accent/40 hover:text-accent disabled:opacity-50"
													>
														<Plus className="size-3.5" />
													</button>
												</div>
											</div>
											<div className="ml-auto flex items-center gap-3">
												<span className="font-semibold text-foreground">
													{formatCOP(item.subtotal)}
												</span>
												<button
													type="button"
													aria-label={`Quitar ${item.dish.nombre}`}
													onClick={() => handleRemove(item)}
													disabled={busyId === item.id}
													className="rounded-lg p-1.5 text-muted transition-colors hover:bg-danger/10 hover:text-danger disabled:opacity-50"
												>
													<Trash2 className="size-4" />
												</button>
											</div>
										</li>
									))}
								</ul>
							</>
						)}
					</div>

					<aside className="h-fit rounded-2xl border border-border bg-surface p-5">
						<h2 className="text-lg font-semibold text-foreground">
							Resumen del pedido
						</h2>
						<div className="mt-4 space-y-3 text-sm">
							<div className="flex items-center justify-between text-muted">
								<span>Subtotal</span>
								<span className="text-foreground">
									{formatCOP(cart?.subtotal ?? 0)}
								</span>
							</div>
							<div className="flex items-center justify-between text-muted">
								<span>Envío</span>
								<span className="text-foreground">
									{cart && Number(cart.envio) === 0
										? "Gratis"
										: formatCOP(cart?.envio ?? 0)}
								</span>
							</div>
							<div className="border-t border-border pt-3">
								<div className="flex items-center justify-between font-semibold text-foreground">
									<span>Total</span>
									<span className="text-accent">
										{formatCOP(cart?.total ?? 0)}
									</span>
								</div>
							</div>
						</div>

						{user && (
							<div className="mt-5 space-y-3">
								<label className="block text-xs font-semibold text-muted">
									<span className="mb-1.5 flex items-center gap-1.5">
										<MapPin className="size-3.5" />
										Dirección de entrega
									</span>
									<select
										value={addressId}
										onChange={(event) => setAddressId(event.target.value)}
										className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
									>
										{addresses.length === 0 ? (
											<option value="">Sin direcciones guardadas</option>
										) : (
											addresses.map((address) => (
												<option key={address.id} value={address.id}>
													{address.alias} · {address.direccion}
												</option>
											))
										)}
									</select>
								</label>

								<label className="block text-xs font-semibold text-muted">
									<span className="mb-1.5 flex items-center gap-1.5">
										<CreditCard className="size-3.5" />
										Método de pago
									</span>
									<select
										value={paymentId}
										onChange={(event) => setPaymentId(event.target.value)}
										className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
									>
										<option value="">Pago contra entrega</option>
										{payments.map((payment) => (
											<option key={payment.id} value={payment.id}>
												{payment.alias}
												{payment.ultimos4
													? ` · ${payment.marca} •••• ${payment.ultimos4}`
													: ""}
											</option>
										))}
									</select>
								</label>

								{addresses.length === 0 && (
									<Link
										to="/home/direcciones"
										className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
									>
										Agregar una dirección
										<ArrowRight className="size-3.5" />
									</Link>
								)}
							</div>
						)}

						<button
							type="button"
							onClick={handleCheckout}
							disabled={isEmpty || !user || placing}
							className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition-transform enabled:hover:scale-[1.01] disabled:cursor-not-allowed disabled:bg-default disabled:text-muted"
						>
							<ShoppingCart className="size-4" />
							{placing ? "Confirmando..." : "Confirmar pedido"}
						</button>
						<p className="mt-3 text-center text-[11px] text-muted">
							{isEmpty
								? "Agrega productos para continuar."
								: "El estado del pedido se actualizará en Mis pedidos."}
						</p>
					</aside>
				</div>
			</div>
		</section>
	);
}

export default Cars;
