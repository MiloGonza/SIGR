import { Link } from "react-router";
import { ArrowRight, ShoppingCart, Trash2 } from "lucide-react";

function Cars() {
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

				<div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
					<div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface px-6 py-12 text-center">
						<span className="flex size-16 items-center justify-center rounded-full bg-accent/10 text-accent">
							<ShoppingCart className="size-8" />
						</span>
						<h2 className="mt-5 text-xl font-semibold text-foreground">
							Tu carrito está vacío
						</h2>
						<p className="mt-2 max-w-sm text-sm text-muted">
							Todavía no has agregado nada. Explora las tiendas y encuentra algo
							rico para hoy.
						</p>
						<Link
							to="/home/tiendas"
							className="mt-6 inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition-transform hover:scale-[1.02]"
						>
							Explorar tiendas
							<ArrowRight className="size-4" />
						</Link>
					</div>

					<aside className="h-fit rounded-2xl border border-border bg-surface p-5">
						<h2 className="text-lg font-semibold text-foreground">
							Resumen del pedido
						</h2>
						<div className="mt-4 space-y-3 text-sm">
							<div className="flex items-center justify-between text-muted">
								<span>Subtotal</span>
								<span className="text-foreground">$0</span>
							</div>
							<div className="flex items-center justify-between text-muted">
								<span>Envío</span>
								<span className="text-foreground">—</span>
							</div>
							<div className="border-t border-border pt-3">
								<div className="flex items-center justify-between font-semibold text-foreground">
									<span>Total</span>
									<span className="text-accent">$0</span>
								</div>
							</div>
						</div>
						<button
							type="button"
							disabled
							className="mt-5 inline-flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-default px-4 py-2.5 text-sm font-semibold text-muted"
						>
							<Trash2 className="size-4" />
							Confirmar pedido
						</button>
						<p className="mt-3 text-center text-[11px] text-muted">
							Agrega productos para continuar.
						</p>
					</aside>
				</div>
			</div>
		</section>
	);
}

export default Cars;
