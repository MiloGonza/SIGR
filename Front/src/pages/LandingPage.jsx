import portada from "../assets/portada.png";
import { Button } from "@heroui/react";
import ManageCard from "../components/landing/ManageCard";
import menu from "../assets/menu.jpg";
import pedidos from "../assets/pedidos.png";
import ventas from "../assets/ventas.png";
import ScrollIndicator from "../components/ScrollIndicator";


function LandingPage() {
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
                        Optimiza la administración de tu restaurante con herramientas diseñadas para simplificar tus operaciones. Gestiona pedidos, organiza tu menú, supervisa tus ventas y mantén cada detalle bajo control. Regístrate y descubre una forma más inteligente de administrar tu negocio.
                    </p>
                    <Button>
                        Empieza a administrar sin demora
                    </Button>
                </div>
            </div>
            <div className="flex px-40 py-10 overflow-hidden flex-col">
                <div>
                    <h2 className="text-4xl"
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
                <div className="flex gap-10 overflow-hidden p-10 items-center justify-center flex-wrap">
                    <h3 className="text-4xl"
                        style={{ fontFamily: "'Advercase', serif" }}>
                        Como funciona
                    </h3>
                    <div>
                        <p>
                            Lorem ipsum dolor sit amet consectetur adipisicing elit. Natus, animi fuga saepe quibusdam autem ex nisi alias iure iusto impedit aut esse, enim veniam temporibus. Earum suscipit tempore nam molestias!
                            Illum, ipsum voluptas commodi laudantium dolorum sed animi perspiciatis. Doloribus, voluptatibus ex quam corrupti quod delectus placeat velit, vitae quas architecto officiis, culpa sed neque quo odio maxime minima cumque.
                            Natus vero dicta magni voluptatem accusantium eius fugiat neque, rem veniam iure doloribus saepe corrupti temporibus beatae sint id eum ad maxime! Odit in laboriosam magnam iusto maxime et voluptate?
                            Ex omnis sit architecto mollitia, labore nulla perferendis, repudiandae nobis velit ad facere! Iusto exercitationem commodi itaque ducimus ipsam in corrupti perspiciatis doloremque voluptatem, deserunt laborum labore, architecto minus praesentium.
                            Suscipit nam illo distinctio optio voluptatibus odit iure nemo, aut cum voluptates ipsa, vero fugiat inventore earum quod, facilis velit amet quae nisi accusantium. Minus fugiat quis nulla quae maxime!
                        </p>
                    </div>
                </div>
            </div>
            <div className="bg-background-inverse h-100 w-full flex items-center justify-center gap-80">
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