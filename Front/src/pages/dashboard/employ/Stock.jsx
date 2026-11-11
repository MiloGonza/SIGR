import { PackageSearch } from "lucide-react";
import Dashboard from "../Dashboard";

function Stock() {
	return (
		<Dashboard
			title="Disponibilidad"
			description="Revisa el stock y la disponibilidad de los productos."
			icon={PackageSearch}
			eyebrow="SIGR · Operación"
		/>
	);
}

export default Stock;
