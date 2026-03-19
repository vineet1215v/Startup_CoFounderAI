import { useState } from 'react'
import { motion } from 'framer-motion'
import './FounderInput.css'

const FounderInput = ({ onSubmit = () => {} }) => {
    const [input, setInput] = useState('')
    const [isExpanded, setIsExpanded] = useState(false)
    const [selectedType, setSelectedType] = useState('idea')

    const handleSubmit = (e) => {
        e.preventDefault()
        if (input.trim()) {
            onSubmit(input)
            setInput('')
            setIsExpanded(false)
            setSelectedType('idea')
        }
    }

    const inputTypes = [
        { value: 'idea', label: '💡 New Idea', color: '#8b5cf6' },
        { value: 'challenge', label: '⚔️ Challenge', color: '#ef4444' },
        { value: 'feedback', label: '📝 Feedback', color: '#3b82f6' },
        { value: 'question', label: '❓ Question', color: '#f59e0b' }
    ]

    return (
        <div className="founder-input">
            <motion.form
                className={`input-form ${isExpanded ? 'expanded' : ''}`}
                onSubmit={handleSubmit}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                <div className="input-header">
                    <h3>Your Boardroom Input</h3>
                    <p className="input-hint">Direct the collective intelligence</p>
                </div>

                {/* Input Type Selector */}
                <motion.div
                    className="input-types"
                    initial={false}
                    animate={{ height: isExpanded ? 'auto' : 0, opacity: isExpanded ? 1 : 0 }}
                    transition={{ duration: 0.3 }}
                >
                    {inputTypes.map((type) => (
                        <motion.button
                            key={type.value}
                            type="button"
                            className={`type-btn ${selectedType === type.value ? 'selected' : ''}`}
                            onClick={() => setSelectedType(type.value)}
                            style={{
                                borderColor: selectedType === type.value ? type.color : 'var(--glass-border)'
                            }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <span className="type-label">{type.label}</span>
                        </motion.button>
                    ))}
                </motion.div>

                {/* Main Input Area */}
                <div className="input-wrapper">
                    <motion.textarea
                        className="message-input"
                        placeholder="Share your thoughts, ask questions, or challenge assumptions..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onFocus={() => setIsExpanded(true)}
                        onBlur={() => {
                            if (!input.trim()) setIsExpanded(false)
                        }}
                        rows={isExpanded ? 4 : 1}
                        animate={{ borderColor: isExpanded ? 'var(--accent-color)' : 'var(--glass-border)' }}
                        transition={{ duration: 0.2 }}
                    />

                    {/* Action Buttons */}
                    <motion.div
                        className="input-actions"
                        initial={false}
                        animate={{ opacity: isExpanded ? 1 : 0, y: isExpanded ? 0 : -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        <div className="action-hints">
                            {isExpanded && (
                                <>
                                    <span className="hint">💬 Type to start discussion</span>
                                    <span className="hint">⌘ Enter to submit</span>
                                </>
                            )}
                        </div>

                        <div className="action-buttons">
                            <motion.button
                                type="button"
                                className="cancel-btn"
                                onClick={() => {
                                    setInput('')
                                    setIsExpanded(false)
                                }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                animate={{ display: isExpanded ? 'block' : 'none' }}
                            >
                                Cancel
                            </motion.button>

                            <motion.button
                                type="submit"
                                className="submit-btn"
                                disabled={!input.trim()}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <span className="submit-icon">✓</span>
                                <span className="submit-text">Submit to Board</span>
                            </motion.button>
                        </div>
                    </motion.div>
                </div>

                {/* Input Type Badge */}
                <motion.div
                    className="type-badge"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: isExpanded ? 1 : 0 }}
                >
                    <span>{inputTypes.find(t => t.value === selectedType)?.label}</span>
                </motion.div>
            </motion.form>

            {/* Character Count */}
            <motion.div
                className="input-footer"
                initial={{ opacity: 0 }}
                animate={{ opacity: isExpanded ? 1 : 0 }}
            >
                <span className="char-count">{input.length} characters</span>
            </motion.div>
        </div>
    )
}

export default FounderInput
