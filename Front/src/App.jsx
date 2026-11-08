import { Routes, Route, useLocation } from 'react-router'
import { motion, AnimatePresence } from 'motion/react'
import { useState, useEffect } from 'react'
import LandingPage from './pages/LandingPage'

const Curtain = ({ isVisible }) => (
  <motion.div
    initial={{ x: '100%' }}
    animate={{ x: isVisible ? '0%' : '100%' }}
    exit={{ x: '-100%' }}
    transition={{ duration: 0.5, ease: 'easeInOut' }}
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
    transition={{ delay: 0.5 }}
    className='w-full max-w-full min-w-0 h-fit flex overflow-x-clip overflow-y-hidden'
  >
    {children}
  </motion.div>
)

function App() {
  const location = useLocation()
  const [isTransitioning, setIsTransitioning] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsTransitioning(true)
      setTimeout(() => setIsTransitioning(false), 1000)
    }, 0)
    return () => clearTimeout(timer)
  }, [location.pathname])

  return (
    <div className="App" style={{ width: '100%', maxWidth: '100vw', minHeight: '100vh', overflowX: 'clip', overflowY: 'hidden' }}>
      <AnimatePresence mode="wait">
        {isTransitioning && <Curtain isVisible={true} key={location.pathname + 'curtain'} />}
      </AnimatePresence>

      <Routes>
        <Route path="/" element={
          <Page>
            <LandingPage />
          </Page>
        } />
        <Route path="/about" element={
          <Page>
            <h1 style={{ textAlign: 'center' }}>Acerca de</h1>
          </Page>
        } />
      </Routes>
    </div>
  )
}

export default App
