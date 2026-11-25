import portada from "../../assets/portada.png";
import { Button } from "@heroui/react";
import ManageCard from "../../components/landing/ManageCard";
import menu from "../../assets/menu.jpg";
import pedidos from "../../assets/pedidos.png";
import ventas from "../../assets/ventas.png";
import ScrollIndicator from "../../components/globals/ScrollIndicator";
import useStore from '../../store/useStore'


function LandingPage() {

    const { setIsOpen, setMode } = useStore()


    return (
        <article className="flex flex-col min-h-screen w-screen max-w-screen relative bg-background overflow-hidden">
            <ScrollIndicator />
            <div className="Portada flex relative w-screen h-[calc(100vh-4rem)]">
                <div className="w-full h-full absolute bg-linear-to-b from-transparent via-white/10 to-background z-20" />
                <img src={portada} alt="Portada" loading="lazy" className="absolute w-full h-full object-fill z-10" />
                <div className="flex flex-col z-30 justify-end items-center pb-20 gap-4 w-full">
                    <h1 className="text-6xl font-bold w-1/2 text-center"
                        style={{ fontFamily: "'Advercase', serif" }}>
                        Tu restaurante, bajo control. Todo desde un solo lugar.
                    </h1>
                    <p className="w-1/2 text-center">
                        Descubre una nueva forma de disfrutar y gestionar tu experiencia gastronómica. Explora menús, descubre platillos, realiza pedidos y consulta su estado en tiempo real. Si administras un restaurante, también podrás gestionar pedidos, organizar tu menú, supervisar tus ventas y mantener cada detalle bajo control. Regístrate y descubre todo lo que SIGR tiene para ofrecerte.
                    </p>
                    <Button onPress={()=>[setIsOpen(true), setMode('login')]}>
                        Empieza a administrar sin demora
                    </Button>
                </div>
            </div>
            <div className="flex px-40 py-10 overflow-hidden flex-col relative">
                <div>
                    <h2 className="text-4xl text-accent"
                        style={{ fontFamily: "'Advercase', serif" }}>
                        Que puedes gestionar
                    </h2>
                    <div className="flex gap-10 overflow-hidden p-10 items-center justify-center flex-wrap">
                        <ManageCard title={"Menú"} image={menu}>
                            Crea, edita y organiza tu menú fácilmente. Administra platos, precios y disponibilidad para mantener tu oferta siempre actualizada.
                        </ManageCard>
                        <ManageCard title={"Pedidos"} image={pedidos}>
                            Organiza y supervisa todos los pedidos desde un solo lugar. Mantén cada solicitud bajo control y agiliza el flujo de trabajo de tu restaurante.
                        </ManageCard>
                        <ManageCard title={"Ventas"} image={ventas}>
                            Consulta tus ventas, analiza tus ingresos y lleva un seguimiento de tus resultados para tomar mejores decisiones.
                        </ManageCard>
                    </div>
                </div>
                <hr />
                <div className="flex gap-10 overflow-hidden p-10 items-center justify-center flex-wrap relative">
                    <h3 className="text-4xl text-accent"
                        style={{ fontFamily: "'Advercase', serif" }}>
                        Como funciona
                    </h3>
                    <div className="w-full max-w-full min-w-0 flex flex-col md:flex-row gap-8">
                        <div className="flex gap-6 flex-col border-2 border-border p-8 flex-1 min-w-0" style={{borderRadius: "50px"}}>
                            <h4 className="text-2xl font-bold">Gestion</h4>
                            <div>
                                <h5 className="text-2xl font-medium">
                                    1. Organiza tu restaurante
                                </h5>
                                <p>
                                    Configura tu restaurante desde un solo lugar. Crea categorías, registra tus platos, actualiza precios y administra la disponibilidad de cada producto. También puedes gestionar los usuarios de tu equipo y asignarles las herramientas necesarias para facilitar el trabajo diario.
                                </p>
                            </div>
                            <div>
                                <h5 className="text-2xl font-medium">
                                    2. Gestiona el servicio
                                </h5>
                                <p>
                                    Mantén todos tus pedidos organizados y supervisa su estado durante cada etapa de la atención. Registra nuevas solicitudes, consulta los pedidos pendientes y controla cuáles están en preparación o listos para entregar. Así tendrás una visión más clara del funcionamiento de tu restaurante y evitarás
                                </p>
                            </div>
                            <div>
                                <h5 className="text-2xl font-medium">
                                    3. Revisa tus resultados
                                </h5>
                                <p>
                                    Lleva un seguimiento de la actividad comercial de tu restaurante. Consulta las ventas realizadas, revisa los ingresos del día y administra los movimientos de caja para mantener un registro organizado de tus operaciones. Utiliza esta información para conocer el rendimiento de tu negocio y tomar decisiones con mayor claridad.
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-6 flex-col border-2 border-border p-8 flex-1 min-w-0" style={{borderRadius: "50px"}}>
                            <h4 className="text-2xl font-bold">Pedidos</h4>
                            <div>
                                <h5 className="text-2xl font-medium">
                                    1. Explora el menú
                                </h5>
                                <p>
                                    Descubre los platillos que tenemos para ti. Explora nuestro menú, conoce los ingredientes, consulta los precios y encuentra las opciones que más se adapten a tus gustos. Elige entre nuestras diferentes preparaciones y encuentra algo delicioso para disfrutar.
                                </p>
                            </div>
                            <div>
                                <h5 className="text-2xl font-medium">
                                    2. Realiza tu pedido
                                </h5>
                                <p>
                                    Selecciona tus platillos favoritos, personaliza tu pedido y confirma lo que deseas disfrutar. Agrega los productos que quieras y realiza tu solicitud de manera sencilla y rápida, sin complicaciones y desde un solo lugar.
                                </p>
                            </div>
                            <div>
                                <h5 className="text-2xl font-medium">
                                    3. Sigue tu pedido
                                </h5>
                                <p>
                                    Mantente al tanto de tu pedido en cada etapa de preparación. Consulta su estado, conoce cuándo comienza su elaboración y revisa el tiempo estimado que falta para tenerlo listo. Así podrás organizar tu tiempo y saber cuándo estará preparado para disfrutarlo.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="bg-background-inverse min-h-100 w-full flex flex-wrap items-center justify-evenly p-10 ">
                <div className="gap-10 flex flex-col items-center justify-center">
                    <img src="/favicon.svg" alt="" className="h-80 w-80" />
                    <span className="text-background">© 2026 Punto y Sazón</span>
                </div>
                <div className="flex flex-col gap-4 items-center justify-center">
                    <div className="flex flex-col gap-4 items-center">
                        <p className="text-background">Una forma sencilla de gestionar el día a día.</p>
                        <div className="flex gap-4">
                            <Button className={"bg-background hover:bg-accent hover:text-field-focus"} variant="ghost">Inicio</Button>
                            <Button className={"bg-background hover:bg-accent hover:text-field-focus"} variant="ghost">Ayuda</Button>
                            <Button className={"bg-background hover:bg-accent hover:text-field-focus"} variant="ghost">Contacto</Button>
                        </div>
                    </div>
                    <div className="flex flex-col gap-4 items-center">
                        <span className="text-background">¿Listo para organizar mejor tu restaurante?</span>
                        <Button>Iniciar sesión</Button>
                    </div>
                    <p className="text-background">Todo lo esencial de tu restaurante, en un solo lugar.</p>
                </div>
            </div>
        </article>
    )
}

export default LandingPage;