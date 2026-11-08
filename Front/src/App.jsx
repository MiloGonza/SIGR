import { Routes, Route, useLocation } from 'react-router'
import { motion, AnimatePresence } from 'motion/react'
import { useState, useEffect } from 'react'
import NavBar from './components/NavBar'
import useStore from './store/useStore'

const Curtain = ({ isVisible }) => (
	<motion.div
		initial={{ x: '100%' }}
		animate={{ x: isVisible ? '0%' : '100%' }}
		exit={{ x: '-100%' }}
		transition={{ duration: 0.4, ease: 'easeInOut' }}
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
		transition={{ delay: 0.4 }}
	>
		{children}
	</motion.div>
)

function App() {
	const location = useLocation()
	const [isTransitioning, setIsTransitioning] = useState(false)
	const {darkMode, triggerCurtain, setTriggerCurtain } = useStore()

	useEffect(() => {
		if (triggerCurtain) {
			setIsTransitioning(true)
			const timer = setTimeout(() => {
				document.documentElement.classList.toggle('dark', darkMode)
				setTimeout(() => {
					setIsTransitioning(false)
					setTriggerCurtain(false)
				}, 400)
			}, 400)
			return () => clearTimeout(timer)
		}
	}, [triggerCurtain, darkMode, setTriggerCurtain])

	useEffect(() => {
		const timer = setTimeout(() => {
			setIsTransitioning(true)
			setTimeout(() => setIsTransitioning(false), 800)
		}, 0)
		return () => clearTimeout(timer)
	}, [location.pathname])

	return (
		<div className="App">
			<AnimatePresence mode="wait">
				{isTransitioning && <Curtain isVisible={true} key={location.pathname + 'curtain'} />}
			</AnimatePresence>
			<NavBar />
			<Routes>
				<Route path="/" element={<Page><h1 style={{ textAlign: 'center' }}>Inicio</h1></Page>} />
				<Route path="/about" element={<Page><h1 style={{ textAlign: 'center' }}>Acerca de</h1></Page>} />
			</Routes>
		</div>
	)
}

export default App
