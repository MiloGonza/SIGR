import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import {
	ArrowRight,
	Check,
	ChevronDown,
	Clock,
	CreditCard,
	History as HistoryIcon,
	MapPin,
	ReceiptText,
	Repeat2,
	Store,
} from "lucide-react";
import { getApiErrorMessage, getOrders } from "../../Api/clientApi";
import useCartStore from "../../store/useCartStore";
import useStore from "../../store/useStore";
import { formatCOP, formatDate, formatDateTime } from "../../utils/format";

const STATUS = {
	pendiente: {
		label: "Pendiente",
		className: "bg-default text-muted",
	},
	confirmado: {
		label: "Confirmado",
		className: "bg-success/10 text-success",
	},
	preparando: {
		label: "En preparación",
		className: "bg-warning/10 text-warning",
	},
	en_camino: {
		label: "En camino",
		className: "bg-accent/10 text-accent",
	},
	entregado: {
		label: "Entregado",
		className: "bg-success/10 text-success",
	},
	cancelado: {
		label: "Cancelado",
		className: "bg-danger/10 text-danger",
	},
};

const getStatus = (order) => STATUS[order.estado] ?? STATUS.confirmado;

const getItems = (order) => order.items ?? [];

const countItems = (order) =>
	getItems(order).reduce((total, item) => total + item.cantidad, 0);

function History() {
	const navigate = useNavigate();
	const { user } = useStore();
	const { addItem } = useCartStore();
	const [orders, setOrders] = useState([]);
	const [loading, setLoading] = useState(Boolean(user));
	const [error, setError] = useState("");
	const [expandedId, setExpandedId] = useState(null);
	const [repeatingId, setRepeatingId] = useState(null);
	const [actionError, setActionError] = useState("");

	useEffect(() => {
		let active = true;

		if (!user) {
			return undefined;
		}

		getOrders({ historial: 1 })
			.then((data) => {
				if (active) {
					setOrders(data);
					setError("");
				}
			})
			.catch((requestError) => {
				if (active) {
					setError(
						getApiErrorMessage(
							requestError,
							"No se pudo cargar tu historial",
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

	const delivered = orders.filter((order) => order.estado === "entregado");
	const totalSpent = delivered.reduce(
		(total, order) => total + Number(order.total || 0),
		0,
	);
	const lastDelivered = delivered[0]?.delivered_at ?? delivered[0]?.created_at;

	const handleRepeat = async (order) => {
		const available = getItems(order).filter((item) => item.dish);
		if (available.length === 0) {
			setActionError(
				"Los platillos de este pedido ya no están disponibles.",
			);
			return;
		}

		setActionError("");
		setRepeatingId(order.id);
		try {
			for (const item of available) {
				await addItem(item.dish, item.cantidad);
			}
			navigate("/home/carrito");
		} catch (requestError) {
			setActionError(
				getApiErrorMessage(requestError, "No se pudo repetir el pedido"),
			);
		} finally {
			setRepeatingId(null);
		}
	};

	return (
		<section className="min-h-dvh w-full bg-background px-5 py-8 md:px-10 md:py-12">
			<div className="mx-auto w-full max-w-[1600px]">
				<header className="flex flex-wrap items-end justify-between gap-4">
					<div>
						<p className="text-xs font-semibold tracking-[0.22em] text-muted uppercase">
							Cliente · Historial
						</p>
						<h1 className="mt-3 font-advercase text-4xl text-foreground md:text-5xl">
							Tus pedidos anteriores
						</h1>
						<p className="mt-2 max-w-xl text-sm text-muted">
							Consulta lo que has pedido, revisa cada detalle y repite tus
							favoritos en un clic.
						</p>
					</div>
					<span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-xs font-medium text-muted">
						<HistoryIcon className="size-4 text-accent" />
						{orders.length} {orders.length === 1 ? "pedido" : "pedidos"}
					</span>
				</header>

				{(error || actionError) && (
					<p className="mt-6 rounded-xl border border-danger/30 bg-danger/10 px-4 py-2.5 text-sm text-danger">
						{error || actionError}
					</p>
				)}

				{!loading && delivered.length > 0 && (
					<div className="mt-8 grid gap-4 sm:grid-cols-3">
						<div className="rounded-2xl border border-border bg-surface p-5">
							<span className="flex size-9 items-center justify-center rounded-xl bg-success/10 text-success">
								<Check className="size-4" />
							</span>
							<p className="mt-3 text-[11px] font-semibold tracking-[0.14em] text-muted uppercase">
								Pedidos entregados
							</p>
							<p className="mt-1 text-2xl font-semibold text-foreground">
								{delivered.length}
							</p>
						</div>
						<div className="rounded-2xl border border-border bg-surface p-5">
							<span className="flex size-9 items-center justify-center rounded-xl bg-accent/10 text-accent">
								<ReceiptText className="size-4" />
							</span>
							<p className="mt-3 text-[11px] font-semibold tracking-[0.14em] text-muted uppercase">
								Total gastado
							</p>
							<p className="mt-1 text-2xl font-semibold text-accent">
								{formatCOP(totalSpent)}
							</p>
						</div>
						<div className="rounded-2xl border border-border bg-surface p-5">
							<span className="flex size-9 items-center justify-center rounded-xl bg-default text-muted">
								<Clock className="size-4" />
							</span>
							<p className="mt-3 text-[11px] font-semibold tracking-[0.14em] text-muted uppercase">
								Última compra
							</p>
							<p className="mt-1 text-sm font-semibold text-foreground">
								{lastDelivered ? formatDate(lastDelivered) : "—"}
							</p>
						</div>
					</div>
				)}

				<div className="mt-8 space-y-4">
					{loading ? (
						<div className="rounded-2xl border border-border bg-surface px-5 py-12 text-center text-sm text-muted">
							Cargando tu historial...
						</div>
					) : orders.length > 0 ? (
						orders.map((order) => {
							const status = getStatus(order);
							const isOpen = expandedId === order.id;
							const items = getItems(order);
							const isFreeShipping = Number(order.envio) === 0;

							return (
								<article
									key={order.id}
									className="overflow-hidden rounded-2xl border border-border bg-surface"
								>
									<button
										type="button"
										onClick={() => setExpandedId(isOpen ? null : order.id)}
										aria-expanded={isOpen}
										className="flex w-full flex-wrap items-center gap-4 p-5 text-left transition-colors hover:bg-default/30"
									>
										<span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
											<Store className="size-5" />
										</span>
										<div className="min-w-0 flex-1">
											<div className="flex flex-wrap items-center gap-2">
												<p className="text-[11px] font-semibold tracking-[0.16em] text-muted uppercase">
													Pedido {order.numero}
												</p>
												<span
													className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${status.className}`}
												>
													{order.estado_label || status.label}
												</span>
											</div>
											<h2 className="mt-1 truncate text-lg font-semibold text-foreground">
												{order.tienda}
											</h2>
											<p className="mt-1 text-xs text-muted">
												{formatDateTime(order.created_at)} · {countItems(order)}{" "}
												{countItems(order) === 1 ? "producto" : "productos"}
											</p>
										</div>
										<div className="flex items-center gap-4">
											<div className="text-right">
												<p className="text-[11px] font-semibold tracking-[0.12em] text-muted uppercase">
													Total
												</p>
												<p className="text-lg font-semibold text-accent">
													{formatCOP(order.total)}
												</p>
											</div>
											<ChevronDown
												className={`size-5 text-muted transition-transform ${
													isOpen ? "rotate-180" : ""
												}`}
											/>
										</div>
									</button>

									{isOpen && (
										<div className="grid gap-6 border-t border-border p-5 lg:grid-cols-[1.4fr_1fr]">
											<div>
												<h3 className="text-sm font-semibold text-foreground">
													Productos
												</h3>
												<ul className="mt-3 divide-y divide-border">
													{items.map((item) => (
														<li
															key={item.id}
															className="flex items-center justify-between gap-4 py-3 text-sm"
														>
															<div className="flex min-w-0 items-start gap-3">
																<span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-default text-[11px] font-semibold text-muted">
																	{item.cantidad}x
																</span>
																<div className="min-w-0">
																	<p className="truncate font-medium text-foreground">
																		{item.nombre}
																	</p>
																	<p className="text-[11px] text-muted">
																		{formatCOP(item.precio_unitario)} ·{" "}
																		{item.prep_minutes} min de preparación
																	</p>
																</div>
															</div>
															<span className="shrink-0 font-medium text-foreground">
																{formatCOP(item.subtotal)}
															</span>
														</li>
													))}
												</ul>

												<div className="mt-4 flex flex-wrap items-center gap-3">
													<button
														type="button"
														onClick={() => handleRepeat(order)}
														disabled={repeatingId === order.id}
														className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition-transform enabled:hover:scale-[1.02] disabled:cursor-wait disabled:opacity-60"
													>
														<Repeat2 className="size-4" />
														{repeatingId === order.id
															? "Agregando..."
															: "Repetir pedido"}
													</button>
													<Link
														to={`/home/tiendas/${order.restaurante}`}
														className="inline-flex items-center gap-1 text-sm font-semibold text-foreground hover:text-accent"
													>
														Ver tienda
														<ArrowRight className="size-4" />
													</Link>
												</div>
											</div>

											<div className="space-y-4 rounded-xl border border-border bg-background/50 p-4">
												<div>
													<p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.14em] text-muted uppercase">
														<MapPin className="size-3.5" />
														Entrega
													</p>
													<p className="mt-1.5 text-sm text-foreground">
														{order.direccion_entrega}
													</p>
													{order.ciudad_entrega && (
														<p className="text-xs text-muted">
															{order.ciudad_entrega}
														</p>
													)}
													{order.notas && (
														<p className="mt-1 text-xs text-muted">
															Notas: {order.notas}
														</p>
													)}
												</div>

												<div>
													<p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.14em] text-muted uppercase">
														<CreditCard className="size-3.5" />
														Pago
													</p>
													<p className="mt-1.5 text-sm text-foreground">
														{order.metodo_pago || "Pago contra entrega"}
													</p>
												</div>

												<div className="space-y-2 border-t border-border pt-4 text-sm">
													<div className="flex items-center justify-between text-muted">
														<span>Subtotal</span>
														<span className="text-foreground">
															{formatCOP(order.subtotal)}
														</span>
													</div>
													<div className="flex items-center justify-between text-muted">
														<span>Envío</span>
														<span className="text-foreground">
															{isFreeShipping
																? "Gratis"
																: formatCOP(order.envio)}
														</span>
													</div>
													<div className="flex items-center justify-between border-t border-border pt-2 font-semibold text-foreground">
														<span>Total</span>
														<span className="text-accent">
															{formatCOP(order.total)}
														</span>
													</div>
												</div>

												<div className="space-y-1 border-t border-border pt-4 text-xs text-muted">
													<p>Creado: {formatDateTime(order.created_at)}</p>
													{order.delivered_at && (
														<p>Entregado: {formatDateTime(order.delivered_at)}</p>
													)}
												</div>
											</div>
										</div>
									)}
								</article>
							);
						})
					) : (
						<div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface px-6 py-12 text-center">
							<span className="flex size-16 items-center justify-center rounded-full bg-accent/10 text-accent">
								<ReceiptText className="size-8" />
							</span>
							<h2 className="mt-5 text-xl font-semibold text-foreground">
								Tu historial está vacío
							</h2>
							<p className="mt-2 max-w-sm text-sm text-muted">
								Cuando completes tu primer pedido, podrás encontrarlo aquí con
								todos sus detalles.
							</p>
							<Link
								to="/home/tiendas"
								className="mt-6 inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition-transform hover:scale-[1.02]"
							>
								Descubrir tiendas
								<ArrowRight className="size-4" />
							</Link>
						</div>
					)}
				</div>
			</div>
		</section>
	);
}

export default History;
