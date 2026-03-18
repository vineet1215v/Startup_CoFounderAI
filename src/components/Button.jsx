import { motion } from 'framer-motion'
import './Button.css'

const Button = ({ children, variant = 'primary', size = 'md', className = '', ...props }) => {
    return (
        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`btn btn-${variant} btn-${size} ${className}`}
            {...props}
        >
            {children}
        </motion.button>
    )
}

export default Button
