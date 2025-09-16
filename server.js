const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs-extra');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use(express.static('.'));

// File paths
const PROJECTS_FILE = path.join(__dirname, 'projects', 'projects.json');
const IMAGES_DIR = path.join(__dirname, 'assets', 'images', 'projects');

// Ensure directories exist
async function ensureDirectories() {
    try {
        await fs.ensureDir(path.dirname(PROJECTS_FILE));
        await fs.ensureDir(IMAGES_DIR);
        
        // Create empty projects.json if it doesn't exist
        if (!await fs.pathExists(PROJECTS_FILE)) {
            await fs.writeJson(PROJECTS_FILE, [], { spaces: 2 });
            console.log('Created empty projects.json file');
        }
    } catch (error) {
        console.error('Error ensuring directories:', error);
    }
}

// Configure multer for image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, IMAGES_DIR);
    },
    filename: (req, file, cb) => {
        const projectName = req.body.projectName || 'project';
        const sanitizedName = projectName
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, '')
            .substring(0, 20);
        
        const ext = path.extname(file.originalname);
        cb(null, `${sanitizedName}${ext}`);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPG and PNG are allowed.'));
        }
    }
});

// API Routes

// Get all projects
app.get('/api/projects', async (req, res) => {
    try {
        const projects = await fs.readJson(PROJECTS_FILE);
        res.json(projects);
    } catch (error) {
        console.error('Error reading projects:', error);
        res.status(500).json({ error: 'Failed to load projects' });
    }
});

// Save all projects
app.post('/api/projects', async (req, res) => {
    try {
        const projects = req.body;
        
        // Validate projects array
        if (!Array.isArray(projects)) {
            return res.status(400).json({ error: 'Projects must be an array' });
        }
        
        // Validate each project structure
        for (const project of projects) {
            if (!project.name || !project.desc || !project.category || 
                !project.links || !project.links.view || !project.links.code) {
                return res.status(400).json({ error: 'Invalid project structure' });
            }
        }
        
        // Create backup
        const backupFile = `${PROJECTS_FILE}.backup.${Date.now()}`;
        if (await fs.pathExists(PROJECTS_FILE)) {
            await fs.copy(PROJECTS_FILE, backupFile);
        }
        
        // Save projects
        await fs.writeJson(PROJECTS_FILE, projects, { spaces: 2 });
        
        res.json({
            success: true,
            message: 'Projects saved successfully',
            count: projects.length,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error saving projects:', error);
        res.status(500).json({ error: 'Failed to save projects' });
    }
});

// Upload image
app.post('/api/upload', upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file provided' });
        }
        
        const filename = path.parse(req.file.filename).name; // Without extension
        
        res.json({
            success: true,
            message: 'Image uploaded successfully',
            filename: filename,
            originalName: req.file.originalname,
            size: req.file.size,
            path: `/assets/images/projects/${req.file.filename}`
        });
        
    } catch (error) {
        console.error('Error uploading image:', error);
        res.status(500).json({ error: 'Failed to upload image' });
    }
});

// Delete image
app.delete('/api/images/:filename', async (req, res) => {
    try {
        const filename = req.params.filename;
        const extensions = ['.png', '.jpg', '.jpeg'];
        
        let deleted = false;
        for (const ext of extensions) {
            const filePath = path.join(IMAGES_DIR, filename + ext);
            if (await fs.pathExists(filePath)) {
                await fs.remove(filePath);
                deleted = true;
                break;
            }
        }
        
        if (deleted) {
            res.json({ success: true, message: 'Image deleted successfully' });
        } else {
            res.status(404).json({ error: 'Image not found' });
        }
        
    } catch (error) {
        console.error('Error deleting image:', error);
        res.status(500).json({ error: 'Failed to delete image' });
    }
});

// Get project statistics
app.get('/api/stats', async (req, res) => {
    try {
        const projects = await fs.readJson(PROJECTS_FILE);
        const categories = [...new Set(projects.map(p => p.category))];
        const categoryStats = {};
        
        projects.forEach(project => {
            categoryStats[project.category] = (categoryStats[project.category] || 0) + 1;
        });
        
        res.json({
            totalProjects: projects.length,
            totalCategories: categories.length,
            categories: categories,
            categoryStats: categoryStats,
            lastUpdated: (await fs.stat(PROJECTS_FILE)).mtime
        });
        
    } catch (error) {
        console.error('Error getting stats:', error);
        res.status(500).json({ error: 'Failed to get statistics' });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Serve CMS dashboard
app.get('/cms', (req, res) => {
    res.sendFile(path.join(__dirname, 'cms', 'index.html'));
});

// Serve test page
app.get('/cms/test', (req, res) => {
    res.sendFile(path.join(__dirname, 'cms', 'test.html'));
});

// Default route - serve portfolio
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Error handling middleware
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
        }
    }
    
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Start server
async function startServer() {
    await ensureDirectories();
    
    app.listen(PORT, () => {
        console.log(`🚀 Portfolio CMS Server running on http://localhost:${PORT}`);
        console.log(`📊 CMS Dashboard: http://localhost:${PORT}/cms`);
        console.log(`🧪 Test Page: http://localhost:${PORT}/cms/test`);
        console.log(`🌐 Portfolio: http://localhost:${PORT}`);
        console.log(`📁 Projects API: http://localhost:${PORT}/api/projects`);
    });
}

startServer().catch(console.error);
