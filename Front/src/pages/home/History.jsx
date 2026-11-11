import { Link } from "react-router";
import { ArrowRight, History as HistoryIcon, ReceiptText } from "lucide-react";

function History() {
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
							Consulta lo que has pedido, repite tus favoritos y revisa tus
							totales.
						</p>
					</div>
					<span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-xs font-medium text-muted">
						<HistoryIcon className="size-4 text-accent" />
						0 pedidos
					</span>
				</header>

				<div className="mt-8 overflow-hidden rounded-2xl border border-border bg-surface">
					<div className="hidden grid-cols-[1.2fr_1fr_1fr_auto] gap-4 border-b border-border px-5 py-3 text-[11px] font-semibold tracking-[0.12em] text-muted uppercase sm:grid">
						<span>Pedido</span>
						<span>Tienda</span>
						<span>Total</span>
						<span className="text-right">Fecha</span>
					</div>

					<div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
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
				</div>
			</div>
		</section>
	);
}

export default History;
