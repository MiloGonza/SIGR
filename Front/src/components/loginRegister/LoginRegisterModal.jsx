import { Button, Input, ListBox, Modal, Select } from "@heroui/react";
import { LogIn, UserRoundPlus } from "lucide-react";
import login from "../../assets/Login.jpg"
import { motion, AnimatePresence } from 'motion/react'
import { useRef, useEffect, useState } from "react"
import { useForm, Controller } from "react-hook-form"

const rols = [
  { id: "cliente", name: "Cliente" },
  { id: "mesero", name: "Mesero" },
  { id: "administrador", name: "Administrador" },
];

const ADMIN_ROLE = "administrador"
const WAITER_ROLE = "mesero"

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const loginDefaults = { email: "", password: "" }
const registerDefaults = { rol: "", email: "", password: "", passwordConfirm: "", nombreLocal: "" }

const emailRules = {
  required: "Correo es obligatorio",
  pattern: { value: EMAIL_PATTERN, message: "Correo inválido" },
}

const passwordRules = {
  required: "Contraseña es obligatoria",
  minLength: { value: 6, message: "La contraseña debe tener al menos 6 caracteres" },
}

const errorInputClass = "border-red-500 focus:border-red-500"

function LoginRegisterModal({ isOpen, setIsOpen, mode, setMode }) {
  const loginFormRef = useRef()
  const registerFormRef = useRef()

  // Rol seleccionado, sincronizado con el formulario desde el Controller.
  const [selectedRolId, setSelectedRolId] = useState("")

  const loginForm = useForm({
    defaultValues: loginDefaults,
    mode: "onChange",
    shouldFocusError: true,
  })

  const registerForm = useForm({
    defaultValues: registerDefaults,
    mode: "onChange",
    // Enfocamos manualmente para respetar el orden visual de los campos.
    shouldFocusError: false,
  })

  const { errors: loginErrors, isSubmitting: isLoggingIn } = loginForm.formState
  const { errors: registerErrors, isSubmitting: isRegistering } = registerForm.formState

  // Limpiar formularios y errores al cambiar de pestaña (omitir el primer montaje)
  const isFirstMount = useRef(true)
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false
      return
    }
    loginForm.reset(loginDefaults)
    registerForm.reset(registerDefaults)
    setSelectedRolId("")
  }, [mode, loginForm, registerForm])

  const handleLoginSubmit = (data) => {
    console.log("Login data:", data);
  }

  const handleRegisterSubmit = (data) => {
    console.log("Register data:", data);
  }

  const switchToLogin = () => setMode("login")
  const switchToRegister = () => setMode("register")

  // Enfocar el primer error según el orden visual del formulario
  const focusFirstRegisterError = (formErrors) => {
    const fieldOrder = ["rol"]
    if (registerForm.getValues("rol") === ADMIN_ROLE) fieldOrder.push("nombreLocal")
    fieldOrder.push("email", "password", "passwordConfirm")

    const firstError = fieldOrder.find((field) => formErrors[field])
    if (firstError) registerForm.setFocus(firstError)
  }

  const handleRegisterFormSubmit = registerForm.handleSubmit(handleRegisterSubmit, focusFirstRegisterError)

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
                          <br />
                          <br />
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
                        style={{
                          width: '50%',
                          left: mode === 'login' ? 0 : '50%',
                          backgroundColor: 'var(--accent)',
                        }}
                      />
                      <Button
                        onPress={switchToLogin}
                        variant="ghost"
                        className={`flex-1 relative z-10 ${mode === 'login' ? 'btn-selected text-accent-foreground' : 'text-field-foreground hover:bg-accent-soft'}`}>
                        Iniciar sesión
                      </Button>
                      <Button
                        onPress={switchToRegister}
                        variant="ghost"
                        className={`flex-1 relative z-10 ${mode === 'register' ? 'btn-selected text-accent-foreground' : 'text-field-foreground hover:bg-accent-soft'}`}>
                        Registrarse
                      </Button>
                    </div>
                    <div className="flex w-full px-4">
                      {mode == "login" ? (
                        <form ref={loginFormRef} id="login-form" noValidate onSubmit={loginForm.handleSubmit(handleLoginSubmit)} className="flex flex-col gap-2 w-full Login h-80 justify-center">
                          <div className="flex flex-col gap-2 w-full">
                            <label className="font-bold text-lg text-background-inverse" htmlFor="email">Correo</label>
                            <Input
                              {...loginForm.register("email", emailRules)}
                              type="email"
                              id="email"
                              className={loginErrors.email ? errorInputClass : ""}
                            />
                            {loginErrors.email && <span className="text-red-500 text-sm">{loginErrors.email.message}</span>}
                          </div>
                          <div className="flex flex-col gap-2 w-full">
                            <label className="font-bold text-lg text-background-inverse" htmlFor="password">Contraseña</label>
                            <Input
                              {...loginForm.register("password", passwordRules)}
                              type="password"
                              id="password"
                              className={loginErrors.password ? errorInputClass : ""}
                            />
                            {loginErrors.password && <span className="text-red-500 text-sm">{loginErrors.password.message}</span>}
                          </div>
                          <div className="flex w-full justify-end gap-2 pt-2">
                            <Button onPress={() => setIsOpen(false)} slot="close" variant="secondary">Cancel</Button>
                            <Button type="submit" isDisabled={isLoggingIn} className="py-2 bg-accent text-accent-foreground rounded-md hover:bg-accent-soft transition-colors">Iniciar sesión</Button>
                          </div>
                        </form>
                      ) : (
                        <form
                          ref={registerFormRef}
                          id="register-form"
                          noValidate
                          onSubmit={(e) => {
                            // Los meseros no pueden registrarse: se bloquea el envío
                            // antes de validar campos que están ocultos.
                            if (registerForm.getValues("rol") === WAITER_ROLE) {
                              e.preventDefault()
                              return
                            }
                            handleRegisterFormSubmit(e)
                          }}
                          className="flex flex-col gap-2 w-full register h-fit">
                          <div className="flex flex-col gap-2 w-full">
                            <label className="flex-1 font-bold text-lg text-background-inverse" htmlFor="rol">Rol</label>
                            <Controller
                              name="rol"
                              control={registerForm.control}
                              rules={{ required: "Selecciona un rol" }}
                              render={({ field, fieldState }) => (
                                <Select
                                  placeholder="Selecciona un rol"
                                  selectedKey={field.value || null}
                                  onSelectionChange={(roleId) => {
                                    const nextRol = roleId ?? ""
                                    field.onChange(nextRol)
                                    setSelectedRolId(nextRol)
                                    if (nextRol !== ADMIN_ROLE) {
                                      registerForm.setValue("nombreLocal", "", { shouldValidate: false, shouldDirty: false })
                                      registerForm.clearErrors("nombreLocal")
                                    }
                                    if (nextRol === WAITER_ROLE) {
                                      registerForm.clearErrors(["email", "password", "passwordConfirm", "nombreLocal"])
                                    }
                                  }}
                                  onBlur={field.onBlur}
                                  isInvalid={!!fieldState.error}
                                >
                                  <Select.Trigger
                                    ref={field.ref}
                                    id="rol"
                                    className={fieldState.error ? errorInputClass : ""}>
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
                              )}
                            />
                            {registerErrors.rol && <span className="text-red-500 text-sm">{registerErrors.rol.message}</span>}
                          </div>

                          {selectedRolId === "administrador" ? (
                            <>
                              <div className="flex flex-col gap-2 w-full">
                                <label className="flex-1 font-bold text-lg text-background-inverse" htmlFor="nombreLocal">Nombre del local</label>
                                <Input
                                  {...registerForm.register("nombreLocal", {
                                    validate: (value) => {
                                      if (registerForm.getValues("rol") !== ADMIN_ROLE) return true
                                      return (value ?? "").trim().length > 0 || "El nombre del local es obligatorio para administrador"
                                    },
                                  })}
                                  type="text"
                                  id="nombreLocal"
                                  placeholder="Nombre del local"
                                  className={registerErrors.nombreLocal ? errorInputClass : ""}
                                />
                                {registerErrors.nombreLocal && <span className="text-red-500 text-sm">{registerErrors.nombreLocal.message}</span>}
                              </div>
                              <div className="flex flex-col gap-2 w-full">
                                <label className="flex-1 font-bold text-lg text-background-inverse" htmlFor="email">Correo</label>
                                <Input
                                  {...registerForm.register("email", emailRules)}
                                  type="email"
                                  id="email"
                                  className={registerErrors.email ? errorInputClass : ""}
                                />
                                {registerErrors.email && <span className="text-red-500 text-sm">{registerErrors.email.message}</span>}
                              </div>
                              <div className="flex flex-col gap-2 w-full">
                                <label className="flex-1 font-bold text-lg text-background-inverse" htmlFor="password">Contraseña</label>
                                <Input
                                  {...registerForm.register("password", passwordRules)}
                                  type="password"
                                  id="password"
                                  className={registerErrors.password ? errorInputClass : ""}
                                />
                                {registerErrors.password && <span className="text-red-500 text-sm">{registerErrors.password.message}</span>}
                              </div>
                              <div className="flex flex-col gap-2 w-full">
                                <label className="flex-1 font-bold text-lg text-background-inverse" htmlFor="passwordConfirm">Confirmar contraseña</label>
                                <Input
                                  {...registerForm.register("passwordConfirm", {
                                    required: "Confirma tu contraseña",
                                    deps: ["password"],
                                    validate: (value) => value === registerForm.getValues("password") || "Las contraseñas no coinciden",
                                  })}
                                  type="password"
                                  id="passwordConfirm"
                                  className={registerErrors.passwordConfirm ? errorInputClass : ""}
                                />
                                {registerErrors.passwordConfirm && <span className="text-red-500 text-sm">{registerErrors.passwordConfirm.message}</span>}
                              </div>
                            </>
                          ) : selectedRolId === "mesero" ? (
                            <div className="flex flex-col gap-2 w-full h-80 justify-center items-center text-center p-4">
                              <span className="text-red-600 font-semibold text-lg">⚠ No puedes registrarte como mesero</span>
                              <span className="text-gray-600 text-sm mt-2">Comunícate con el administrador del local</span>
                            </div>
                          ) : (
                            <>
                              <div className="flex flex-col gap-2 w-full">
                                <label className="flex-1 font-bold text-lg text-background-inverse" htmlFor="email">Correo</label>
                                <Input
                                  {...registerForm.register("email", emailRules)}
                                  type="email"
                                  id="email"
                                  className={registerErrors.email ? errorInputClass : ""}
                                />
                                {registerErrors.email && <span className="text-red-500 text-sm">{registerErrors.email.message}</span>}
                              </div>
                              <div className="flex flex-col gap-2 w-full">
                                <label className="flex-1 font-bold text-lg text-background-inverse" htmlFor="password">Contraseña</label>
                                <Input
                                  {...registerForm.register("password", passwordRules)}
                                  type="password"
                                  id="password"
                                  className={registerErrors.password ? errorInputClass : ""}
                                />
                                {registerErrors.password && <span className="text-red-500 text-sm">{registerErrors.password.message}</span>}
                              </div>
                              <div className="flex flex-col gap-2 w-full">
                                <label className="flex-1 font-bold text-lg text-background-inverse" htmlFor="passwordConfirm">Confirmar contraseña</label>
                                <Input
                                  {...registerForm.register("passwordConfirm", {
                                    required: "Confirma tu contraseña",
                                    deps: ["password"],
                                    validate: (value) => value === registerForm.getValues("password") || "Las contraseñas no coinciden",
                                  })}
                                  type="password"
                                  id="passwordConfirm"
                                  className={registerErrors.passwordConfirm ? errorInputClass : ""}
                                />
                                {registerErrors.passwordConfirm && <span className="text-red-500 text-sm">{registerErrors.passwordConfirm.message}</span>}
                              </div>
                              <div className="flex flex-col gap-2 w-full"></div>
                            </>
                          )}

                          <div className="flex w-full justify-end gap-2 pt-2">
                            <Button onPress={() => setIsOpen(false)} slot="close" variant="secondary">Cancel</Button>
                            {selectedRolId !== "mesero" && (
                              <Button type="submit" isDisabled={isRegistering} className="py-2 bg-accent text-accent-foreground rounded-md hover:bg-accent-soft transition-colors">Registrarse</Button>
                            )}
                          </div>
                        </form>
                      )}
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
