import { Skeleton, Switch } from '@heroui/react'
import { useState } from 'react'
import useStore from '../store/useStore'
import { Moon, Sun } from 'lucide-react';
import { Link } from 'react-router';

function NavBar() {
    const [logoLoaded, setLogoLoaded] = useState(true)
    const { darkMode, setDarkMode, setTriggerCurtain } = useStore()

    const handleThemeToggle = (isSelected) => {
        setTriggerCurtain(true)
        setDarkMode(isSelected)
    }

    const icons = {
        darkMode: {
            off: Sun,
            on: Moon
        }
    }

    return (
        <nav className='h-20 flex w-screen m-0 p-0 shadow'>
            <div className='flex items-center justify-between w-full px-4'>
                <div className='flex items-center'>
                    {logoLoaded ? (
                        <img src="/favicon.svg" alt="Logo" className='h-15 w-15' onError={() => setLogoLoaded(false)} />
                    ) : (
                        <Skeleton className='h-15 w-15 rounded-xl' />
                    )}
                    <Link className='text-xl font-bold ml-2 px-3 py-2 flex rounded-md hover:text-accent hover:scale-105 transition-all duration-150'>Punto y Sazón</Link>
                </div>
                <div className='flex items-center gap-2'>
                    {Object.entries(icons).map(([key, value]) => (
                        <Switch key={key} isSelected={darkMode} onChange={handleThemeToggle} size='lg'>
                            {({ isSelected }) => (
                                <Switch.Content>
                                    <Switch.Control className={isSelected ? value.selectedControlClass : ""}>
                                        <Switch.Thumb >
                                            <Switch.Icon>
                                                {isSelected ? (
                                                    <value.on className="size-3 text-inherit opacity-100" />
                                                ) : (
                                                    <value.off className="size-3 text-inherit opacity-70" />
                                                )}
                                            </Switch.Icon>
                                        </Switch.Thumb>
                                    </Switch.Control>
                                </Switch.Content>
                            )}
                        </Switch>
                    ))}
                    <ul className='flex gap-2'>
                        <li>
                            <Link href="/" className='px-3 py-2 flex rounded-md text-sm font-medium hover:text-accent hover:scale-105 transition-all duration-150'>Inicia ya!</Link>
                        </li>
                        <li>
                            <Link href="/" className='px-3 py-2 flex rounded-md text-sm font-medium hover:text-accent hover:scale-105 transition-all duration-150'>No tienes cuenta?</Link>
                        </li>
                    </ul>
                </div>
            </div>
        </nav>
    )
}

export default NavBar
