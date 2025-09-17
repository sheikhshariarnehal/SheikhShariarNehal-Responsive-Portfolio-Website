// Configuration for production deployment
const CONFIG = {
    // API Configuration - Replace with your actual Render URL
    API_BASE_URL: 'https://portfolio-backend-xyz.onrender.com/api',
    
    // Environment
    ENVIRONMENT: 'production',
    
    // Features
    FEATURES: {
        CONTACT_FORM: true,
        ANALYTICS: true,
        PWA: true
    },
    
    // Social Links
    SOCIAL_LINKS: {
        GITHUB: 'https://github.com/sheikhshariarnehal',
        LINKEDIN: 'https://www.linkedin.com/in/sheikh-shariar-nehal-473166268/',
        EMAIL: 'mailto:your-email@example.com'
    },
    
    // SEO Configuration
    SEO: {
        TITLE: 'Sheikh Shariar Nehal - Portfolio',
        DESCRIPTION: 'Full Stack Developer specializing in modern web technologies',
        KEYWORDS: 'web developer, full stack, javascript, react, node.js',
        AUTHOR: 'Sheikh Shariar Nehal',
        URL: 'https://your-portfolio.vercel.app'
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
} else {
    window.CONFIG = CONFIG;
}
