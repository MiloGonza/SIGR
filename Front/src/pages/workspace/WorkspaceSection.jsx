import { motion } from "motion/react";

/**
 * Contenido provisional de las subpáginas del área privada.
 * Recibe el título, la descripción y el icono definidos en sidebarNav.js.
 */
function WorkspaceSection({ title, description, icon: Icon }) {
	return (
		<section className="min-h-dvh w-full bg-background px-6 py-8 md:px-10 md:py-12">
			<motion.header
				initial={{ opacity: 0, y: 12 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.35, ease: "easeOut" }}
				className="max-w-3xl"
			>
				<div className="flex items-center gap-3">
					<span className="flex size-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
						<Icon className="size-5" />
					</span>
					<span className="text-xs font-semibold tracking-[0.22em] text-muted uppercase">
						SIGR
					</span>
				</div>
				<h1
					className="mt-5 text-4xl font-semibold text-foreground md:text-5xl"
					style={{ fontFamily: "'Advercase', serif" }}
				>
					{title}
				</h1>
				<p className="mt-3 max-w-xl text-base text-muted">{description}</p>
			</motion.header>

			<motion.div
				initial={{ opacity: 0, y: 16 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.4, delay: 0.08, ease: "easeOut" }}
				className="mt-10 flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface px-6 py-12 text-center"
			>
				<Icon className="size-10 text-accent/60" />
				<p className="mt-4 text-lg font-medium text-surface-foreground">
					Contenido en construcción
				</p>
				<p className="mt-1 max-w-sm text-sm text-muted">
					Esta sección estará disponible próximamente. Por ahora puedes navegar
					entre las demás pestañas desde la barra lateral.
				</p>
			</motion.div>
		</section>
	);
}

export default WorkspaceSection;
