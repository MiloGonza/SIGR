import { CreditCard } from "lucide-react"

function Payments() {
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

				<div className="mt-8 flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface px-6 py-12 text-center">
					<span className="flex size-16 items-center justify-center rounded-full bg-accent/10 text-accent">
						<CreditCard className="size-8" />
					</span>
					<h2 className="mt-5 text-xl font-semibold text-foreground">
						Aún no tienes métodos de pago
					</h2>
					<p className="mt-2 max-w-sm text-sm text-muted">
						Cuando agregues uno, aparecerá aquí para que pagues tus pedidos sin
						volver a escribirlo.
					</p>
				</div>
			</div>
		</section>
	)
}

export default Payments
