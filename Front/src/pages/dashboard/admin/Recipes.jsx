import { ChefHat } from "lucide-react";
import Dashboard from "../Dashboard";

function Recipes() {
	return (
		<Dashboard
			title="Recetas"
			description="Organiza las recetas y preparaciones de tu menú."
			icon={ChefHat}
			eyebrow="SIGR · Administración"
		/>
	);
}

export default Recipes;
