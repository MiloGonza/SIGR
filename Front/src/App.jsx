import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router'
import { motion, AnimatePresence } from 'motion/react'
import { useState, useEffect } from 'react'
import NavBar from './components/globals/NavBar'
import SideBar from './components/globals/SideBar'
import useStore from './store/useStore'
import LandingPage from './pages/landingPage/LandingPage'
import LoginRegisterModal from './components/loginRegister/LoginRegisterModal'
import Home from './pages/home/Home'
import Shops from './pages/home/Shops'
import StoreDetail from './pages/home/StoreDetail'
import Cars from './pages/home/Cars'
import Payments from './pages/home/Payments'
import Addresses from './pages/home/Addresses'
import ClientOrders from './pages/home/Orders'
import ClientHistory from './pages/home/History'
import Stats from './pages/dashboard/admin/Stats'
import Emplpoys from './pages/dashboard/admin/Emplpoys'
import Recipes from './pages/dashboard/admin/Recipes'
import EmployOrders from './pages/dashboard/employ/Orders'
import Schedule from './pages/dashboard/employ/Schedule'
import Stock from './pages/dashboard/employ/Stock'
import { SIDEBAR_WIDTH, getDefaultWorkspacePath, isWorkspacePath, normalizeRole } from './config/sidebarNav'

const COVER_MS = 400
const TRANSITION_MS = 800
// El cambio de página ocurre un instante después de que la cortina terminó de
// entrar, para garantizar que nunca se vea la página nueva antes de tiempo.
const SWAP_MS = COVER_MS + 50

const Curtain = () => (
	<motion.div
		initial={{ x: '100%' }}
		animate={{ x: '0%' }}
		exit={{ x: '-100%' }}
		transition={{ duration: COVER_MS / 1000, ease: 'easeInOut' }}
		style={{
			position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
			backgroundColor: 'black', zIndex: 9999, pointerEvents: 'none'
		}}
	/>
)

const Page = ({ children }) => (
	<motion.div
		initial={{ opacity: 0 }}
		animate={{ opacity: 1 }}
		transition={{ duration: 0.3 }}
		className='w-full max-w-full min-w-0 h-fit flex overflow-x-clip overflow-y-hidden'
	>
		{children}
	</motion.div>
)

// /dashboard lleva a la primera pestaña del rol que tenga la sesión.
function DashboardHome() {
	const { user } = useStore()
	return <Navigate to={getDefaultWorkspacePath(user?.rol)} replace />
}

// Protege las rutas privadas: sin sesión abre el modal de acceso y regresa al
// inicio; si el rol no corresponde a la sección, lleva a su espacio de trabajo.
function RequireAuth({ roles }) {
	const { user, setIsOpen } = useStore()
	const role = normalizeRole(user?.rol) ?? 'cliente'

	useEffect(() => {
		if (!user) setIsOpen(true)
	}, [user, setIsOpen])

	if (!user) return <Navigate to="/" replace />
	if (roles && !roles.includes(role)) {
		return <Navigate to={getDefaultWorkspacePath(role)} replace />
	}
	return <Outlet />
}

function App() {
	const location = useLocation()
	// La cortina arranca visible y el contenido oculto: la primera carga no
	// muestra nada hasta que la cortina cubre toda la pantalla.
	const [routeCurtain, setRouteCurtain] = useState(true)
	const [contentVisible, setContentVisible] = useState(false)
	// Durante el cambio de ruta seguimos mostrando la ubicación anterior hasta
	// que la cortina cubre la pantalla: así la página no desaparece.
	const [displayLocation, setDisplayLocation] = useState(location)
	const [lastPath, setLastPath] = useState(location.pathname)
	const { user, darkMode, triggerCurtain, setTriggerCurtain, isOpen, setIsOpen, mode, setMode } = useStore()

	// Mantiene al usuario visible mientras la cortina tapa la pantalla al cerrar
	// sesión; así la barra lateral no desaparece antes de tiempo.
	const [sidebarUser, setSidebarUser] = useState(user)
	if (user && user !== sidebarUser) setSidebarUser(user)
	if (!user && !isWorkspacePath(displayLocation.pathname) && sidebarUser) setSidebarUser(null)
	const showSideBar = isWorkspacePath(displayLocation.pathname) && Boolean(sidebarUser)

	// Al cambiar de ruta levantamos la cortina en el mismo render, antes de
	// pintar, pero sin ocultar la página anterior.
	if (location.pathname !== lastPath) {
		setLastPath(location.pathname)
		setRouteCurtain(true)
	}

	const curtainVisible = routeCurtain || triggerCurtain

	useEffect(() => {
		if (triggerCurtain) {
			const applyTheme = setTimeout(() => {
				document.documentElement.classList.toggle('dark', darkMode)
			}, COVER_MS)
			const reveal = setTimeout(() => {
				setTriggerCurtain(false)
			}, TRANSITION_MS)
			return () => {
				clearTimeout(applyTheme)
				clearTimeout(reveal)
			}
		}
	}, [triggerCurtain, darkMode, setTriggerCurtain])

	// La cortina tapa la pantalla con la página anterior congelada; recién ahí
	// cambiamos a la ruta nueva y, al terminar de cubrir, retiramos la cortina.
	useEffect(() => {
		const swapContent = setTimeout(() => {
			setDisplayLocation(location)
			setContentVisible(true)
		}, SWAP_MS)
		const hideCurtain = setTimeout(() => setRouteCurtain(false), TRANSITION_MS)
		return () => {
			clearTimeout(swapContent)
			clearTimeout(hideCurtain)
		}
	}, [location])

	return (
		<div className="App" style={{ width: '100%', maxWidth: '100vw', minHeight: '100vh', overflowX: 'clip', overflowY: 'hidden' }}>
			<AnimatePresence>
				{curtainVisible && <Curtain key="curtain" />}
			</AnimatePresence>
			<motion.div
				animate={{ opacity: contentVisible ? 1 : 0 }}
				transition={{ duration: contentVisible ? 0.15 : 0 }}
				style={{ pointerEvents: contentVisible ? 'auto' : 'none' }}
			>
				<LoginRegisterModal isOpen={isOpen} setIsOpen={setIsOpen} mode={mode} setMode={setMode} />
				{showSideBar ? <SideBar user={sidebarUser} activePath={displayLocation.pathname} /> : <NavBar />}
				<div
					className="min-h-dvh"
					style={{ paddingLeft: showSideBar ? SIDEBAR_WIDTH.collapsed : 0 }}
				>
					<Routes location={displayLocation}>
						<Route path="/" element={
							<Page>
								<LandingPage />
							</Page>
						} />

						<Route element={<RequireAuth roles={["cliente"]} />}>
							<Route path="/home" element={
								<Page>
									<Home />
								</Page>
							} />
							<Route path="/home/tiendas" element={
								<Page>
									<Shops />
								</Page>
							} />
							<Route path="/home/tiendas/:id" element={
								<Page>
									<StoreDetail />
								</Page>
							} />
							<Route path="/home/carrito" element={
								<Page>
									<Cars />
								</Page>
							} />
							<Route path="/home/metodos-pago" element={
								<Page>
									<Payments />
								</Page>
							} />
							<Route path="/home/direcciones" element={
								<Page>
									<Addresses />
								</Page>
							} />
							<Route path="/home/pedidos" element={
								<Page>
									<ClientOrders />
								</Page>
							} />
							<Route path="/home/historial" element={
								<Page>
									<ClientHistory />
								</Page>
							} />
						</Route>

						<Route element={<RequireAuth roles={["administrador"]} />}>
							<Route path="/dashboard/resumen" element={
								<Page>
									<Stats />
								</Page>
							} />
							<Route path="/dashboard/empleados" element={
								<Page>
									<Emplpoys />
								</Page>
							} />
							<Route path="/dashboard/recetas" element={
								<Page>
									<Recipes />
								</Page>
							} />
						</Route>

						<Route element={<RequireAuth roles={["administrador", "mesero"]} />}>
							<Route path="/dashboard" element={<DashboardHome />} />
							<Route path="/dashboard/pedidos" element={
								<Page>
									<EmployOrders />
								</Page>
							} />
							<Route path="/dashboard/turnos" element={
								<Page>
									<Schedule />
								</Page>
							} />
							<Route path="/dashboard/disponibilidad" element={
								<Page>
									<Stock />
								</Page>
							} />
						</Route>
					</Routes>
				</div>
			</motion.div>
		</div>
	)
}

export default App
