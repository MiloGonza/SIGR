import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { RefreshCw, Table2, Users } from "lucide-react";
import { getApiErrorMessage, getStaffTables } from "../../Api/clientApi";

function StaffTablesSection() {
	const [tables, setTables] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [reloadKey, setReloadKey] = useState(0);

	useEffect(() => {
		let active = true;
		getStaffTables()
			.then((data) => {
				if (!active) return;
				setTables(data);
				setError("");
			})
			.catch((requestError) => {
				if (active) {
					setError(
						getApiErrorMessage(
							requestError,
							"No se pudieron cargar las mesas del restaurante",
						),
					);
				}
			})
			.finally(() => active && setLoading(false));
		return () => {
			active = false;
		};
	}, [reloadKey]);

	const available = tables.filter((table) => table.esta_disponible).length;

	return (
		<motion.section
			initial={{ opacity: 0, y: 12 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.3, ease: "easeOut" }}
			className="rounded-2xl border border-border bg-surface"
			aria-labelledby="staff-tables-title"
		>
			<div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
				<div className="flex items-center gap-3">
					<span className="flex size-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
						<Table2 className="size-5" />
					</span>
					<div>
						<h2 id="staff-tables-title" className="font-semibold text-foreground">
							Mesas del salón
						</h2>
						<p className="text-xs text-muted">
							{available} de {tables.length} disponibles para reservar
						</p>
					</div>
				</div>
				<button
					type="button"
					onClick={() => {
						setLoading(true);
						setReloadKey((key) => key + 1);
					}}
					disabled={loading}
					aria-label="Actualizar mesas"
					className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-muted transition hover:border-accent/40 hover:text-foreground disabled:opacity-50"
				>
					<RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
					Actualizar
				</button>
			</div>

			{error ? (
				<p className="m-4 rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
					{error}
				</p>
			) : loading && tables.length === 0 ? (
				<div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
					{Array.from({ length: 3 }).map((_, index) => (
						<div
							key={index}
							className="h-24 animate-pulse rounded-xl border border-border bg-background"
						/>
					))}
				</div>
			) : tables.length === 0 ? (
				<div className="flex flex-col items-center justify-center px-6 py-10 text-center">
					<Table2 className="size-7 text-muted" />
					<p className="mt-3 text-sm font-medium text-foreground">
						Este restaurante todavía no tiene mesas.
					</p>
					<p className="mt-1 text-xs text-muted">
						El administrador debe crearlas desde su panel.
					</p>
				</div>
			) : (
				<>
					<div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
						{tables.map((table) => (
							<article
								key={table.id}
								className={`rounded-xl border p-4 ${
									table.esta_disponible
										? "border-border bg-background"
										: "border-border/60 bg-background/60 opacity-80"
								}`}
							>
								<div className="flex items-start justify-between gap-2">
									<p className="truncate font-semibold text-foreground">
										{table.nombre}
									</p>
									<span
										className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
											table.esta_disponible
												? "bg-success/10 text-success"
												: "bg-default text-muted"
										}`}
									>
										{table.esta_disponible ? "Disponible" : "No disponible"}
									</span>
								</div>
								<p className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted">
									<Users className="size-3.5" />
									Capacidad para {table.capacidad} personas
								</p>
							</article>
						))}
					</div>
					<p className="border-t border-border px-4 py-3 text-xs text-muted">
						Los clientes solo pueden reservar mesas marcadas como disponibles.
					</p>
				</>
			)}
		</motion.section>
	);
}

export default StaffTablesSection;
