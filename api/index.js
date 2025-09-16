const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs-extra');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use(express.static(path.join(__dirname, '..')));
app.use('/assets', express.static(path.join(__dirname, '..', 'assets')));
app.use('/projects', express.static(path.join(__dirname, '..', 'projects')));
app.use('/experience', express.static(path.join(__dirname, '..', 'experience')));
app.use('/cms', express.static(path.join(__dirname, '..', 'cms')));

// File paths
const PROJECTS_FILE = path.join(__dirname, '..', 'projects', 'projects.json');
const IMAGES_DIR = path.join(__dirname, '..', 'assets', 'images', 'projects');

// Ensure directories exist
async function ensureDirectories() {
    try {
        await fs.ensureDir(path.dirname(PROJECTS_FILE));
        await fs.ensureDir(IMAGES_DIR);
        
        // Create empty projects.json if it doesn't exist
        if (!await fs.pathExists(PROJECTS_FILE)) {
            await fs.writeJson(PROJECTS_FILE, [], { spaces: 2 });
        }
    } catch (error) {
        console.error('Error ensuring directories:', error);
    }
}

// Initialize directories
ensureDirectories();

// Configure multer for image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, IMAGES_DIR);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const name = path.basename(file.originalname, ext);
        cb(null, `${name}-${uniqueSuffix}${ext}`);
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
            cb(new Error('Invalid file type. Only JPEG, JPG, and PNG are allowed.'));
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
        console.error('Error loading projects:', error);
        res.status(500).json({ error: 'Failed to load projects' });
    }
});

// Save all projects
app.post('/api/projects', async (req, res) => {
    try {
        const projects = req.body;
        
        // Create backup
        const backupFile = `${PROJECTS_FILE}.backup.${Date.now()}`;
        if (await fs.pathExists(PROJECTS_FILE)) {
            await fs.copy(PROJECTS_FILE, backupFile);
        }
        
        // Save new data
        await fs.writeJson(PROJECTS_FILE, projects, { spaces: 2 });
        res.json({ success: true, message: 'Projects saved successfully' });
    } catch (error) {
        console.error('Error saving projects:', error);
        res.status(500).json({ error: 'Failed to save projects' });
    }
});

// Upload image
app.post('/api/upload', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        
        const filename = req.file.filename;
        const imageUrl = `/assets/images/projects/${filename}`;
        
        res.json({ 
            success: true, 
            filename: filename,
            url: imageUrl,
            message: 'Image uploaded successfully' 
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
        const imagePath = path.join(IMAGES_DIR, filename);
        
        if (await fs.pathExists(imagePath)) {
            await fs.remove(imagePath);
            res.json({ success: true, message: 'Image deleted successfully' });
        } else {
            res.status(404).json({ error: 'Image not found' });
        }
    } catch (error) {
        console.error('Error deleting image:', error);
        res.status(500).json({ error: 'Failed to delete image' });
    }
});

// Get statistics
app.get('/api/stats', async (req, res) => {
    try {
        const projects = await fs.readJson(PROJECTS_FILE);
        const stats = {
            totalProjects: projects.length,
            categories: [...new Set(projects.map(p => p.category))].length,
            lastUpdated: new Date().toISOString()
        };
        res.json(stats);
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

// Serve main pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

app.get('/projects', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'projects', 'index.html'));
});

app.get('/experience', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'experience', 'index.html'));
});

app.get('/cms', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'cms', 'index.html'));
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
    // For API routes, return JSON
    if (req.path.startsWith('/api/')) {
        res.status(404).json({ error: 'API route not found' });
    } else {
        // For regular routes, serve 404.html
        res.status(404).sendFile(path.join(__dirname, '..', '404.html'));
    }
});

module.exports = app;
