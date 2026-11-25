import { useEffect, useRef, useState } from "react"
import { Skeleton } from "@heroui/react"

// Tiempo máximo que esperamos una imagen después de entrar en pantalla.
// Si tarda más, mostramos el degradado con el icono en lugar de la imagen.
const IMAGE_TIMEOUT_MS = 10000

function LazyImage({
	src,
	alt = "",
	className = "",
	imageClassName = "",
	fallback = null,
	rootMargin = "240px",
}) {
	const containerRef = useRef(null)
	const [inView, setInView] = useState(
		() => typeof IntersectionObserver === "undefined",
	)
	const [status, setStatus] = useState("idle")

	useEffect(() => {
		const node = containerRef.current
		if (!node || typeof IntersectionObserver === "undefined") return

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries.some((entry) => entry.isIntersecting)) {
					setInView(true)
					observer.disconnect()
				}
			},
			{ rootMargin },
		)

		observer.observe(node)
		return () => observer.disconnect()
	}, [rootMargin])

	useEffect(() => {
		if (!inView || !src) return

		const timeout = setTimeout(() => {
			setStatus((current) => (current === "idle" ? "fallback" : current))
		}, IMAGE_TIMEOUT_MS)

		return () => clearTimeout(timeout)
	}, [inView, src])

	const showImage = inView && Boolean(src) && status !== "fallback"
	const showFallback = !src || status === "fallback"
	const showSkeleton = !showFallback && status !== "loaded"

	return (
		<div
			ref={containerRef}
			className={`relative overflow-hidden ${className}`}
		>
			{showImage && (
				<img
					src={src}
					alt={alt}
					loading="lazy"
					decoding="async"
					onLoad={() => setStatus("loaded")}
					onError={() => setStatus("fallback")}
					className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
						status === "loaded" ? "opacity-100" : "opacity-0"
					} ${imageClassName}`}
				/>
			)}
			{showSkeleton && (
				<Skeleton className="absolute inset-0 h-full w-full rounded-none" />
			)}
			{(!src || status === "fallback") && fallback}
		</div>
	)
}

export default LazyImage
