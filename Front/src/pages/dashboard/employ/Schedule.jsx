import { CalendarClock } from "lucide-react";
import Dashboard from "../Dashboard";

function Schedule() {
	return (
		<Dashboard
			title="Turnos"
			description="Consulta y organiza tus turnos de trabajo."
			icon={CalendarClock}
			eyebrow="SIGR · Operación"
		/>
	);
}

export default Schedule;
