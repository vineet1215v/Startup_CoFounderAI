import { motion } from 'framer-motion'
import './Button.css'

const Button = ({ 
    children, 
    size = 'md', 
    variant = 'primary',
    className = '',
    onClick,
    disabled = false,
    type = 'button',
    ...props 
}) => {
    return (
        <motion.button
            className={`btn btn-${size} btn-${variant} ${className}`}
            onClick={onClick}
            disabled={disabled}
            type={type}
            whileHover={{ scale: disabled ? 1 : 1.05 }}
            whileTap={{ scale: disabled ? 1 : 0.95 }}
            {...props}
        >
            {children}
        </motion.button>
    )
}

export default Button
