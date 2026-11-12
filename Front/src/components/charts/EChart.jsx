import { useEffect, useRef } from "react";
import * as echarts from "echarts/core";
import {
	BarChart,
	LineChart,
	PieChart,
	TreemapChart,
} from "echarts/charts";
import {
	AriaComponent,
	GridComponent,
	LegendComponent,
	MarkLineComponent,
	TitleComponent,
	TooltipComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";

echarts.use([
	BarChart,
	LineChart,
	PieChart,
	TreemapChart,
	AriaComponent,
	GridComponent,
	LegendComponent,
	MarkLineComponent,
	TitleComponent,
	TooltipComponent,
	CanvasRenderer,
]);

/**
 * Envoltorio minimalista de ECharts para React.
 * Se encarga de inicializar, actualizar, redimensionar y destruir la instancia.
 */
function EChart({
	option,
	height = 300,
	className = "",
	ariaLabel = "Gráfica del restaurante",
}) {
	const containerRef = useRef(null);
	const chartRef = useRef(null);

	useEffect(() => {
		const node = containerRef.current;
		if (!node) return undefined;

		const chart = echarts.init(node, null, { renderer: "canvas" });
		chartRef.current = chart;

		const observer = new ResizeObserver(() => chart.resize());
		observer.observe(node);

		const handleWindowResize = () => chart.resize();
		window.addEventListener("resize", handleWindowResize);

		return () => {
			window.removeEventListener("resize", handleWindowResize);
			observer.disconnect();
			chart.dispose();
			chartRef.current = null;
		};
	}, []);

	useEffect(() => {
		chartRef.current?.setOption(option, { notMerge: true });
	}, [option]);

	return (
		<div
			ref={containerRef}
			role="img"
			aria-label={ariaLabel}
			className={className}
			style={{ width: "100%", height }}
		/>
	);
}

export default EChart;
