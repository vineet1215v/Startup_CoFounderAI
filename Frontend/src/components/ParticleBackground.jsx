import { useEffect, useRef } from 'react'
import './ParticleBackground.css'

const ParticleBackground = ({ count = 50, speed = 0.5 }) => {
    const containerRef = useRef(null)

    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        // Create particles
        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div')
            particle.className = 'particle'
            
            // Random initial position
            const x = Math.random() * 100
            const y = Math.random() * 100
            const size = Math.random() * 3 + 1
            const duration = Math.random() * 20 + 10
            const delay = Math.random() * 5
            
            particle.style.cssText = `
                left: ${x}%;
                top: ${y}%;
                width: ${size}px;
                height: ${size}px;
                animation-duration: ${duration}s;
                animation-delay: ${delay}s;
            `
            
            container.appendChild(particle)
        }

        // Cleanup
        return () => {
            container.innerHTML = ''
        }
    }, [count])

    return <div ref={containerRef} className="particle-background"></div>
}

export default ParticleBackground
