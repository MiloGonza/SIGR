import { Avatar, Button, ListBox, Select, Skeleton, Switch } from '@heroui/react'
import { useState } from 'react'
import useStore from '../../store/useStore'
import { LogOut, Moon, Sun } from 'lucide-react';
import { Link, useNavigate } from 'react-router';

const getInitials = (name = "") =>
    name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join("")

function NavBar() {
    const [logoLoaded, setLogoLoaded] = useState(true)
    const { user, logout, darkMode, setDarkMode, setTriggerCurtain, setIsOpen, setMode } = useStore()
    const navigate = useNavigate()

    const handleThemeToggle = (isSelected) => {
        setTriggerCurtain(true)
        setDarkMode(isSelected)
    }

    const handleUserAction = (key) => {
        if (key !== "logout") return
        logout()
        navigate("/")
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
                    {user ? (
                        <Select
                            aria-label="Menú de usuario"
                            selectedKey={null}
                            onSelectionChange={handleUserAction}
                            className="w-52"
                        >
                            <Select.Trigger className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent-soft transition-colors">
                                <Avatar size="sm" className="shrink-0">
                                    <Avatar.Fallback>{getInitials(user.username) || "U"}</Avatar.Fallback>
                                </Avatar>
                                <span className="truncate text-sm font-medium">{user.username}</span>
                                <Select.Indicator />
                            </Select.Trigger>
                            <Select.Popover>
                                <ListBox>
                                    <ListBox.Item id="logout" textValue="Cerrar sesión">
                                        <LogOut className="size-4" />
                                        Cerrar sesión
                                        <ListBox.ItemIndicator />
                                    </ListBox.Item>
                                </ListBox>
                            </Select.Popover>
                        </Select>
                    ) : (
                        <ul className='flex gap-2'>
                            <li>
                                <Button
                                    className='px-3 py-2 flex rounded-md text-sm font-medium hover:bg-transparent hover:text-accent hover:scale-105 transition-all duration-150'
                                    variant='ghost'
                                    onPress={()=>[setIsOpen(true), setMode('login')]}
                                >
                                    Inicia ya!
                                </Button>
                            </li>
                            <li>
                                <Button
                                    className='px-3 py-2 flex rounded-md text-sm font-medium hover:bg-transparent hover:text-accent hover:scale-105 transition-all duration-150'
                                    variant='ghost'
                                    onPress={()=>[setIsOpen(true), setMode('register')]}
                                >
                                    No tienes cuenta?
                                </Button>
                            </li>
                        </ul>
                    )}
                </div>
            </div>
        </nav>
    )
}

export default NavBar
