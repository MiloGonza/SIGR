import { ClipboardList } from "lucide-react";
import Dashboard from "../Dashboard";

function Orders() {
	return (
		<Dashboard
			title="Pedidos"
			description="Gestiona los pedidos de las mesas y su estado."
			icon={ClipboardList}
			eyebrow="SIGR · Operación"
		/>
	);
}

export default Orders;
