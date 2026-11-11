import { MapPin } from "lucide-react"

function Addresses() {
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

				<div className="mt-8 flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface px-6 py-12 text-center">
					<span className="flex size-16 items-center justify-center rounded-full bg-accent/10 text-accent">
						<MapPin className="size-8" />
					</span>
					<h2 className="mt-5 text-xl font-semibold text-foreground">
						Aún no tienes direcciones guardadas
					</h2>
					<p className="mt-2 max-w-sm text-sm text-muted">
						Agrega una dirección para que tus pedidos lleguen justo donde los
						necesitas.
					</p>
				</div>
			</div>
		</section>
	)
}

export default Addresses
