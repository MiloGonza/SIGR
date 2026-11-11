import { Users } from "lucide-react";
import Dashboard from "../Dashboard";

function Emplpoys() {
	return (
		<Dashboard
			title="Empleados"
			description="Administra el equipo de tu restaurante y sus roles."
			icon={Users}
			eyebrow="SIGR · Administración"
		/>
	);
}

export default Emplpoys;
