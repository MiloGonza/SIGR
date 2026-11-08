import { Button, Input, ListBox, Modal, Select } from "@heroui/react";
import { LogIn, UserRoundPlus } from "lucide-react";
import login from "../../assets/Login.jpg"
import { motion, AnimatePresence } from 'motion/react'
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

const loginSchema = z.object({
  email: z.string().email("Correo inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
})

const registerSchema = z.object({
  rol: z.string().min(1, "Selecciona un rol"),
  email: z.string().email("Correo inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  passwordConfirm: z.string(),
}).refine((data) => data.password === data.passwordConfirm, {
  message: "Las contraseñas no coinciden",
  path: ["passwordConfirm"],
})

function LoginRegisterModal({ isOpen, setIsOpen, mode, setMode }) {

    const [rol, setRol] = useState()

    const rols = [
        {
            id: "cliente",
            name: "Cliente",
        },
        {
            id: "mesero",
            name: "Mesero",
        },
        {
            id: "administrador",
            name: "Administrador",
        },
    ];

    const loginForm = useForm({
      resolver: zodResolver(loginSchema),
      defaultValues: { email: "", password: "" },
    })

    const registerForm = useForm({
      resolver: zodResolver(registerSchema),
      defaultValues: { rol: "", email: "", password: "", passwordConfirm: "" },
    })

    const onLogin = (data) => {
      console.log("Login data:", data)
    }

    const onRegister = (data) => {
      console.log("Register data:", data)
    }

    return (
        <>
            <style>{`
                .btn-selected:hover {
                    background-color: transparent !important;
                    color: var(--accent-foreground) !important;
                }
            `}</style>
            <Modal.Backdrop
                variant="blur"
                isOpen={isOpen}
                onOpenChange={setIsOpen}>
                <Modal.Container>
                    <Modal.Dialog className="flex w-200 min-w-200 relative overflow-hidden">
                        <Modal.Header className="flex! flex-row! gap-2">
                            <AnimatePresence mode="wait" initial="false">
                                {mode === 'login' ? (
                                    <motion.div key="loginicon"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.3 }}>
                                        <Modal.Icon className="bg-accent-soft text-accent-soft-foreground">
                                            <LogIn className="size-10 p-2" />
                                        </Modal.Icon>
                                    </motion.div>
                                ) : (
                                    <motion.div key="registericon"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.3 }}>
                                        <Modal.Icon className="bg-accent-soft text-accent-soft-foreground">
                                            <UserRoundPlus className="size-10 p-2" />
                                        </Modal.Icon>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            <AnimatePresence mode="wait" initial="false">
                                {mode === 'login' ? (
                                    <motion.div key="logintext"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.3 }}>
                                        <Modal.Heading className="font-bold text-4xl"
                                            style={{ fontFamily: "'Advercase', serif" }}>
                                            Bienvenido
                                        </Modal.Heading>
                                    </motion.div>
                                ) : (
                                    <motion.div key="registertext"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.3 }}>
                                        <Modal.Heading className="font-bold text-4xl"
                                            style={{ fontFamily: "'Advercase', serif" }}>
                                            Registrate ahora
                                        </Modal.Heading>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </Modal.Header>
                        <Modal.Body>
                            <div className="flex gap-2 h-full w-full overflow-hidden">
                                <AnimatePresence mode="wait">
                                    <motion.div key={"imageform"}
                                        initial={{ x: 0 }}
                                        animate={{ x: mode == "register" ? "100%" : "0%" }}
                                        className="bg-accent w-1/2 flex relative justify-center items-center z-100">
                                        <img className="absolute w-full h-full object-fill"
                                            src={login}
                                            alt={login.split("/").pop().split(".")[0]} />
                                        {
                                            mode == "login" ?
                                                <span className="flex text-center font-medium p-4 z-10 text-black backdrop-blur-md">
                                                    Ingresa tus datos y se detectara automaticamente tu rol en Punto y Sazón
                                                </span>
                                                :
                                                <span className="flex text-center font-medium p-4 z-10 text-black backdrop-blur-md">
                                                    Ya sea que quieras descubrir nuevos sabores y realizar pedidos, o administrar tu restaurante y hacer crecer tu negocio, tenemos un espacio para ti.
                                                    <br/>
                                                    <br/>
                                                    Selecciona tu rol, crea tu cuenta y comienza a disfrutar de todo lo que tenemos para ofrecerte.
                                                </span>
                                        }
                                    </motion.div>
                                    <motion.div key={"form"}
                                        initial={{ x: 0 }}
                                        animate={{ x: mode == "register" ? "-105%" : "0%" }}
                                        className="w-1/2 flex flex-col gap-2 relative">
                                        <div className="relative w-full flex overflow-hidden bg-accent-background">
                                            <motion.div
                                                className="absolute h-full z-0"
                                                layout
                                                style={
                                                    {
                                                        width: '50%',
                                                        left: mode === 'login' ? 0 : '50%',
                                                        backgroundColor: 'var(--accent)',
                                                    }
                                                }
                                            />
                                            <Button
                                                onPress={() => setMode("login")}
                                                variant="ghost"
                                                className={`flex-1 relative z-10 ${mode === 'login' ? 'btn-selected text-accent-foreground' : 'text-field-foreground hover:bg-accent-soft'}`}>
                                                Iniciar sesión
                                            </Button>
                                            <Button
                                                onPress={() => setMode("register")}
                                                variant="ghost"
                                                className={`flex-1 relative z-10 ${mode === 'register' ? 'btn-selected text-accent-foreground' : 'text-field-foreground hover:bg-accent-soft'}`}>
                                                Registrarse
                                            </Button>
                                        </div>
                                        <div className="flex w-full px-4">
                                            {mode == "login"
                                                ?
                                                <form onSubmit={loginForm.handleSubmit(onLogin)} className="flex flex-col gap-2 w-full Login h-80 justify-center">
                                                    <div className="flex flex-col gap-2 w-full">
                                                        <label
                                                            className="font-bold text-lg text-background-inverse"
                                                            htmlFor="email">
                                                            Correo
                                                        </label>
                                                        <Input {...loginForm.register("email")} type="email" id="email" name="email" />
                                                        {loginForm.formState.errors.email && (
                                                            <span className="text-red-500 text-sm">{loginForm.formState.errors.email.message}</span>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col gap-2 w-full">
                                                        <label
                                                            className="font-bold text-lg text-background-inverse"
                                                            htmlFor="password">
                                                            Contraseña
                                                        </label>
                                                        <Input {...loginForm.register("password")} type="password" id="password" name="password" />
                                                        {loginForm.formState.errors.password && (
                                                            <span className="text-red-500 text-sm">{loginForm.formState.errors.password.message}</span>
                                                        )}
                                                    </div>
                                                </form>
                                                :
                                                <form onSubmit={registerForm.handleSubmit(onRegister)} className="flex flex-col gap-2 w-full register h-80">
                                                    <div className="flex flex-col gap-2 w-full">
                                                        <label
                                                            className="flex-1 font-bold text-lg text-background-inverse"
                                                            htmlFor="rol">
                                                            Rol
                                                        </label>
                                                        <Select
                                                            placeholder="Selecciona un rol"
                                                            value={rol}
                                                            onChange={(value) => {
                                                              setRol(value)
                                                              registerForm.setValue("rol", value?.id ?? "")
                                                            }}
                                                        >
                                                            <Select.Trigger>
                                                                <Select.Value />
                                                                <Select.Indicator />
                                                            </Select.Trigger>
                                                            <Select.Popover>
                                                                <ListBox>
                                                                    {rols.map((state) => (
                                                                        <ListBox.Item key={state.id} id={state.id} textValue={state.name}>
                                                                            {state.name}
                                                                            <ListBox.ItemIndicator />
                                                                        </ListBox.Item>
                                                                    ))}
                                                                </ListBox>
                                                            </Select.Popover>
                                                        </Select>
                                                        {registerForm.formState.errors.rol && (
                                                            <span className="text-red-500 text-sm">{registerForm.formState.errors.rol.message}</span>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col gap-2 w-full">
                                                        <label
                                                            className="flex-1 font-bold text-lg text-background-inverse"
                                                            htmlFor="email">
                                                            Correo
                                                        </label>
                                                        <Input {...registerForm.register("email")} type="email" id="email" name="email" />
                                                        {registerForm.formState.errors.email && (
                                                            <span className="text-red-500 text-sm">{registerForm.formState.errors.email.message}</span>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col gap-2 w-full">
                                                        <label
                                                            className="flex-1 font-bold text-lg text-background-inverse"
                                                            htmlFor="password">
                                                            Contraseña
                                                        </label>
                                                        <Input {...registerForm.register("password")} type="password" id="password" name="password" />
                                                        {registerForm.formState.errors.password && (
                                                            <span className="text-red-500 text-sm">{registerForm.formState.errors.password.message}</span>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col gap-2 w-full">
                                                        <label
                                                            className="flex-1 font-bold text-lg text-background-inverse"
                                                            htmlFor="passwordConfirm">
                                                            Confirmar contraseña
                                                        </label>
                                                        <Input {...registerForm.register("passwordConfirm")} type="password" id="passwordConfirm" name="passwordConfirm" />
                                                        {registerForm.formState.errors.passwordConfirm && (
                                                            <span className="text-red-500 text-sm">{registerForm.formState.errors.passwordConfirm.message}</span>
                                                        )}
                                                    </div>
                                                </form>
                                            }
                                        </div>
                                        <div className="flex w-full justify-end gap-2">
                                            <Button
                                                onPress={() => setIsOpen(false)}
                                                slot="close"
                                                variant="secondary">
                                                Cancel
                                            </Button>
                                            {
                                                mode == "login" ?
                                                    <Button slot="close" onPress={loginForm.handleSubmit(onLogin)}>
                                                        Iniciar sesión
                                                    </Button>
                                                    :
                                                    <Button slot="close" onPress={registerForm.handleSubmit(onRegister)}>
                                                        registrarse
                                                    </Button>
                                            }
                                        </div>
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                        </Modal.Body>
                    </Modal.Dialog>
                </Modal.Container >
            </Modal.Backdrop >
        </>
    )
}

export default LoginRegisterModal;
