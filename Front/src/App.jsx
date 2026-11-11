import { Routes, Route, useLocation } from 'react-router'
import { motion, AnimatePresence } from 'motion/react'
import { useState, useEffect } from 'react'
import NavBar from './components/globals/NavBar'
import useStore from './store/useStore'
import LandingPage from './pages/landingPage/LandingPage'
import LoginRegisterModal from './components/loginRegister/LoginRegisterModal'
import { lazy, Suspense } from 'react'

const LazyHome = lazy(() => import('./pages/home/Home'))

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
	const { darkMode, triggerCurtain, setTriggerCurtain, isOpen, setIsOpen, mode, setMode } = useStore()

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

	console.log('isopen:', isOpen, 'mode:', mode) // Debugging line to check the values of isopen and mode

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
				<NavBar />
				<LoginRegisterModal isOpen={isOpen} setIsOpen={setIsOpen} mode={mode} setMode={setMode} />
				<Routes location={displayLocation}>
					<Route path="/" element={
						<Page>
							<LandingPage />
						</Page>
					} />
					<Route path="/dashboard" element={
						<Page>
							<h1 style={{ textAlign: 'center' }}>Dashboard</h1>
						</Page>
					} />
					<Route path="/home" element={
						<Page>
							<Suspense>
								<LazyHome />
							</Suspense>
						</Page>
					} />
				</Routes>
			</motion.div>
		</div>
	)
}

export default App
