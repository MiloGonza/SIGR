import { LayoutDashboard } from "lucide-react";
import Dashboard from "../Dashboard";

function Stats() {
	return (
		<Dashboard
			title="Resumen"
			description="Consulta el estado general de tu restaurante de un vistazo."
			icon={LayoutDashboard}
			eyebrow="SIGR · Administración"
		/>
	);
}

export default Stats;
