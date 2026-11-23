import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import {
	AlertTriangle,
	Bell,
	Package,
	PackageCheck,
	PackageX,
	ShoppingBag,
	X,
} from "lucide-react";
import { getStaffNotifications } from "../../Api/clientApi";
import { normalizeRole } from "../../config/sidebarNav";
import useNotificationStore from "../../store/useNotificationStore";
import useStore from "../../store/useStore";

const POLL_MS = 30000;
const VISIBLE_MS = 6000;
const MAX_VISIBLE = 3;

const TYPE_STYLES = {
	no_disponible: {
		icon: PackageX,
		iconClass: "bg-danger/10 text-danger",
		border: "border-danger/30",
	},
	agotado: {
		icon: AlertTriangle,
		iconClass: "bg-warning/10 text-warning",
		border: "border-warning/30",
	},
	disponible: {
		icon: PackageCheck,
		iconClass: "bg-success/10 text-success",
		border: "border-success/30",
	},
	stock: {
		icon: Package,
		iconClass: "bg-accent/10 text-accent",
		border: "border-accent/30",
	},
	pedido: {
		icon: ShoppingBag,
		iconClass: "bg-accent/10 text-accent",
		border: "border-accent/30",
	},
};

function StaffToast({ notification, onDismiss, onOpen }) {
	const style = TYPE_STYLES[notification.tipo] ?? TYPE_STYLES.no_disponible;
	const Icon = style.icon;

	useEffect(() => {
		const timer = window.setTimeout(
			() => onDismiss(notification.id),
			VISIBLE_MS,
		);
		return () => window.clearTimeout(timer);
	}, [notification.id, onDismiss]);

	return (
		<motion.div
			layout
			initial={{ opacity: 0, y: 28, scale: 0.96 }}
			animate={{ opacity: 1, y: 0, scale: 1 }}
			exit={{ opacity: 0, y: 16, scale: 0.96 }}
			transition={{ type: "spring", stiffness: 380, damping: 32 }}
			role="status"
			aria-live="polite"
			className={`flex w-full items-start gap-3 overflow-hidden rounded-2xl border bg-surface/95 p-4 shadow-2xl backdrop-blur ${style.border}`}
		>
			<span
				className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${style.iconClass}`}
			>
				<Icon className="size-5" />
			</span>
			<div className="min-w-0 flex-1">
				<p className="text-[11px] font-semibold tracking-[0.14em] text-muted uppercase">
					Nuevo aviso de tu tienda
				</p>
				<p className="mt-0.5 text-sm font-medium text-foreground">
					{notification.mensaje}
				</p>
				<button
					type="button"
					onClick={onOpen}
					className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-accent/10 px-2.5 py-1.5 text-xs font-semibold text-accent transition-colors hover:bg-accent/20"
				>
					<Bell className="size-3.5" />
					Ver notificaciones
				</button>
			</div>
			<button
				type="button"
				onClick={() => onDismiss(notification.id)}
				aria-label="Cerrar notificación"
				className="rounded-lg p-1 text-muted transition-colors hover:bg-default hover:text-foreground"
			>
				<X className="size-4" />
			</button>
			<motion.span
				aria-hidden="true"
				initial={{ scaleX: 1 }}
				animate={{ scaleX: 0 }}
				transition={{ duration: VISIBLE_MS / 1000, ease: "linear" }}
				className="absolute bottom-0 left-0 h-0.5 w-full origin-left bg-accent/50"
			/>
		</motion.div>
	);
}

/**
 * Escucha los avisos de disponibilidad de la tienda y muestra un toast
 * temporal a los demás empleados. La primera carga solo registra los avisos
 * existentes para no inundar la pantalla al entrar.
 */
function StaffNotificationToasts() {
	const { user } = useStore();
	const navigate = useNavigate();
	const role = normalizeRole(user?.rol);
	const enabled = role === "administrador" || role === "mesero";

	const seenRef = useRef(new Set());
	const initializedRef = useRef(false);
	const [toasts, setToasts] = useState([]);

	const dismiss = useCallback((id) => {
		setToasts((current) => current.filter((toast) => toast.id !== id));
	}, []);

	const openList = useCallback(() => {
		setToasts([]);
		navigate("/dashboard/notificaciones");
	}, [navigate]);

	useEffect(() => {
		if (!enabled) return undefined;

		let active = true;
		let inFlight = false;

		const load = () => {
			if (inFlight) return;
			inFlight = true;
			getStaffNotifications()
				.then((items) => {
					if (!active) return;
					const userId = user?.id;
					if (!userId) return;
					const persistedSeen = new Set(
						useNotificationStore.getState().seenIdsByUser[String(userId)] ??
							[],
					);
					const pending = items.filter(
						(item) =>
							item.actor_id !== userId &&
							!persistedSeen.has(String(item.id)),
					);
					useNotificationStore.getState().setUnread(userId, pending.length);

					if (!initializedRef.current) {
						items.forEach((item) => seenRef.current.add(item.id));
						initializedRef.current = true;
						return;
					}

					const fresh = items.filter(
						(item) => !seenRef.current.has(item.id),
					);
					fresh.forEach((item) => seenRef.current.add(item.id));

					const fromOthers = fresh.filter(
						(item) => item.actor_id !== userId,
					);
					if (!fromOthers.length) return;

					const visible = fromOthers.slice(0, MAX_VISIBLE);
					setToasts((current) =>
						[...visible, ...current].slice(0, MAX_VISIBLE),
					);

					// Mostrar el toast no marca el aviso como visto: el usuario
					// pudo no estar mirando la pantalla. El contador permanece
					// hasta que abra la pestaña de Notificaciones.
				})
				.catch(() => {
					// La disponibilidad se sigue usando aunque falle este aviso.
				})
				.finally(() => {
					inFlight = false;
				});
		};

		load();
		const interval = window.setInterval(load, POLL_MS);
		return () => {
			active = false;
			window.clearInterval(interval);
		};
	}, [enabled, user?.id]);

	if (!enabled) return null;

	return (
		<div className="pointer-events-none fixed right-4 bottom-4 z-50 flex w-[min(92vw,380px)] flex-col gap-2">
			<AnimatePresence initial={false}>
				{toasts.map((notification) => (
					<div key={notification.id} className="pointer-events-auto relative">
						<StaffToast
							notification={notification}
							onDismiss={dismiss}
							onOpen={openList}
						/>
					</div>
				))}
			</AnimatePresence>
		</div>
	);
}

export default StaffNotificationToasts;
