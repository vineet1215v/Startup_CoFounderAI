import { motion } from 'framer-motion'

const blogPosts = [
    { id: 1, title: 'How Multi-Agent Systems are Revolutionizing Startups', date: 'Feb 10, 2026', category: 'AI Trends' },
    { id: 2, title: 'Top 5 Automation Strategies for 2026', date: 'Feb 05, 2026', category: 'Guides' },
    { id: 3, title: 'Integrating AI Co-Founders: A Case Study', date: 'Jan 28, 2026', category: 'Case Studies' },
]

const Blog = () => {
    return (
        <div className="blog-page container">
            <div className="section-header">
                <span className="badge-new glass">Blog</span>
                <h1>Latest Insights in <span className="gradient-text">AI & Automation</span></h1>
            </div>

            <div className="blog-grid">
                {blogPosts.map((post, i) => (
                    <motion.div
                        key={post.id}
                        initial={{ opacity: 0, y: 20, rotate: -2 }}
                        whileInView={{ opacity: 1, y: 0, rotate: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: i * 0.1 }}
                        whileHover={{ scale: 1.05, rotate: 1 }}
                        className="blog-card glass"
                    >
                        <span className="blog-category">{post.category}</span>
                        <h3>{post.title}</h3>
                        <p className="blog-date">{post.date}</p>
                        <a href="#" className="read-more">Read More ↗</a>
                    </motion.div>
                ))}
            </div>
        </div>
    )
}

export default Blog
