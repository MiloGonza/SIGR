import { useState } from "react";
import { Avatar, Button, ListBox, Select } from "@heroui/react";
import { motion } from "motion/react";
import { CreditCard, LogOut, MapPin, Moon, Sun } from "lucide-react";
import { Link, useNavigate } from "react-router";
import useStore from "../../store/useStore";
import {
	SIDEBAR_WIDTH,
	getDefaultWorkspacePath,
	getSidebarItems,
	normalizeRole,
} from "../../config/sidebarNav";

const getInitials = (name = "") =>
	name
		.trim()
		.split(/\s+/)
		.slice(0, 2)
		.map((part) => part[0]?.toUpperCase() ?? "")
		.join("");

// La anchura se anima con una curva suave; los textos solo cambian de opacidad
// para que los iconos no salten de posición al encoger o desplegar.
const widthTransition = { duration: 0.32, ease: [0.4, 0, 0.2, 1] };
const labelTransition = { duration: 0.18, ease: "easeOut" };
const labelExitTransition = { duration: 0.1, ease: "easeOut" };
const markerTransition = { duration: 0.22, ease: [0.4, 0, 0.2, 1] };

function SideBar({ user, activePath = "" }) {
	const [expanded, setExpanded] = useState(false);
	const { logout, darkMode, setDarkMode, setTriggerCurtain } = useStore();
	const navigate = useNavigate();

	const items = getSidebarItems(user?.rol);
	const homePath = getDefaultWorkspacePath(user?.rol);
	const isClient = normalizeRole(user?.rol) === "cliente";
	const labelAnimation = {
		opacity: expanded ? 1 : 0,
		transition: expanded ? labelTransition : labelExitTransition,
	};

	const handleMouseLeave = () => setExpanded(false);

	const handleBlur = (event) => {
		if (!event.currentTarget.contains(event.relatedTarget)) setExpanded(false);
	};

	const handleUserAction = (key) => {
		if (key === "logout") {
			logout();
			navigate("/");
			return;
		}
		if (key === "theme") {
			setTriggerCurtain(true);
			setDarkMode(!darkMode);
			return;
		}
		if (key === "payments") {
			navigate("/home/metodos-pago");
			return;
		}
		if (key === "addresses") {
			navigate("/home/direcciones");
		}
	};

	const handleLogout = () => {
		logout();
		navigate("/");
	};

	return (
		<motion.aside
			initial={false}
			animate={{ width: expanded ? SIDEBAR_WIDTH.expanded : SIDEBAR_WIDTH.collapsed }}
			transition={widthTransition}
			onMouseEnter={() => setExpanded(true)}
			onMouseLeave={handleMouseLeave}
			onFocusCapture={() => setExpanded(true)}
			onBlurCapture={handleBlur}
			aria-label="Barra lateral de navegación"
			aria-expanded={expanded}
			className="fixed inset-y-0 left-0 z-40 flex flex-col overflow-hidden border-r border-border bg-surface shadow-[10px_0_40px_-30px_rgba(0,0,0,0.5)]"
		>
			{/* Marca: el icono queda siempre centrado en la barra encogida. */}
			<div className="flex h-20 shrink-0 items-center gap-3 pl-4 pr-3">
				<Link
					to={homePath}
					aria-label="Ir al inicio de Punto y Sazón"
					className="flex size-11 shrink-0 items-center justify-center rounded-xl transition-transform hover:scale-105"
				>
					<img src="/favicon.svg" alt="Logo de Punto y Sazón" className="size-10" />
				</Link>
				<motion.div
					animate={labelAnimation}
					aria-hidden={!expanded}
					className="w-[180px] shrink-0"
				>
					<p
						className="truncate text-lg leading-tight font-bold whitespace-nowrap text-foreground"
						style={{ fontFamily: "'Advercase', serif" }}
					>
						Punto y Sazón
					</p>
					<p className="text-[10px] font-semibold tracking-[0.22em] text-muted uppercase">
						{user?.restaurante?.nombre}
					</p>
				</motion.div>
			</div>

			<div className="mx-3 h-px shrink-0 bg-border" />

			{/* Pestañas del rol */}
			<nav className="flex flex-1 flex-col gap-1.5 overflow-x-hidden overflow-y-auto px-3 py-4">
				{items.map((item) => {
					const Icon = item.icon;
					const active =
						activePath === item.to || activePath.startsWith(`${item.to}/`);

					return (
						<Link
							key={item.to}
							to={item.to}
							onClick={(event) => {
								if (active) event.preventDefault();
							}}
							aria-label={item.label}
							aria-current={active ? "page" : undefined}
							title={expanded ? undefined : item.label}
							className={`relative flex h-11 shrink-0 items-center gap-3 rounded-xl pl-4 pr-3 transition-colors ${
								active
									? "bg-accent/10 font-semibold text-accent"
									: "text-muted hover:bg-default/60 hover:text-foreground"
							}`}
						>
							{active && (
								<span className="pointer-events-none absolute inset-y-0 -left-3 flex items-center">
									<motion.span
										layoutId="sidebar-active-marker"
										className="h-6 w-1 rounded-r-full bg-accent"
										transition={markerTransition}
									/>
								</span>
							)}
							<Icon className="size-5 shrink-0" />
							<motion.span
								animate={labelAnimation}
								aria-hidden={!expanded}
								className="w-[180px] shrink-0 truncate text-sm whitespace-nowrap"
							>
								{item.label}
							</motion.span>
						</Link>
					);
				})}
			</nav>

			{/* Usuario y cierre de sesión */}
			<div className="flex shrink-0 flex-col gap-2 border-t border-border p-3">
				<Select
					aria-label="Menú de usuario"
					selectedKey={null}
					onSelectionChange={handleUserAction}
					className="w-full"
				>
					<Select.Trigger className="flex items-center gap-2 overflow-hidden rounded-xl py-2 pr-2 pl-2.5 transition-colors hover:bg-accent-soft">
						<Avatar size="sm" className="shrink-0">
							<Avatar.Fallback>{getInitials(user?.username) || "U"}</Avatar.Fallback>
						</Avatar>
						<motion.span
							animate={labelAnimation}
							aria-hidden={!expanded}
							className="w-[148px] shrink-0 truncate text-left text-sm font-medium"
						>
							{user?.username}
						</motion.span>
						<motion.span
							animate={labelAnimation}
							aria-hidden={!expanded}
							className="shrink-0"
						>
							<Select.Indicator />
						</motion.span>
					</Select.Trigger>
					<Select.Popover>
						<ListBox>
							<ListBox.Item
								id="theme"
								textValue={darkMode ? "Modo claro" : "Modo oscuro"}
							>
								{darkMode ? (
									<Sun className="size-4" />
								) : (
									<Moon className="size-4" />
								)}
								{darkMode ? "Modo claro" : "Modo oscuro"}
								<ListBox.ItemIndicator />
							</ListBox.Item>
							{isClient && (
								<ListBox.Item id="payments" textValue="Métodos de pago">
									<CreditCard className="size-4" />
									Métodos de pago
									<ListBox.ItemIndicator />
								</ListBox.Item>
							)}
							{isClient && (
								<ListBox.Item id="addresses" textValue="Direcciones">
									<MapPin className="size-4" />
									Direcciones
									<ListBox.ItemIndicator />
								</ListBox.Item>
							)}
							<ListBox.Item id="logout" textValue="Cerrar sesión">
								<LogOut className="size-4" />
								Cerrar sesión
								<ListBox.ItemIndicator />
							</ListBox.Item>
						</ListBox>
					</Select.Popover>
				</Select>

				<Button
					variant="ghost"
					onPress={handleLogout}
					aria-label="Cerrar sesión"
					className="h-10 w-full justify-start gap-3 overflow-hidden rounded-xl pr-3 pl-4 text-sm font-medium text-muted hover:bg-danger/10 hover:text-danger"
				>
					<LogOut className="size-5 shrink-0" />
					<motion.span
						animate={labelAnimation}
						aria-hidden={!expanded}
						className="w-[180px] shrink-0 text-left whitespace-nowrap"
					>
						Cerrar sesión
					</motion.span>
				</Button>
			</div>
		</motion.aside>
	);
}

export default SideBar;
