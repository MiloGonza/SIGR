import { useEffect, useState } from "react";

function ScrollIndicator() {
    const [visible, setVisible] = useState(() => typeof window !== "undefined" && window.scrollY === 0);

    useEffect(() => {
        const updateVisibility = () => setVisible(window.scrollY === 0);
        window.addEventListener("scroll", updateVisibility, { passive: true });
        return () => window.removeEventListener("scroll", updateVisibility);
    }, []);

    return (
        <div
            className={`fixed bottom-6 right-6 z-50 pointer-events-none transition-all duration-500 ease-in-out ${
                visible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
            }`}
            aria-hidden="true"
        >
            <div className="animate-bounce">
                <svg className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
                </svg>
            </div>
        </div>
    );
}

export default ScrollIndicator;