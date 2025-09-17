const express = require('express');
const path = require('path');

const app = express();
const PORT = 5001;

// Static file serving for project images
app.use('/images/projects', express.static(path.join(__dirname, '../assets/images/projects')));

// Test route
app.get('/', (req, res) => {
    res.json({ message: 'Test server running!', port: PORT });
});

// Test image route
app.get('/test-images', (req, res) => {
    const fs = require('fs');
    const imagesPath = path.join(__dirname, '../assets/images/projects');
    
    try {
        const files = fs.readdirSync(imagesPath);
        res.json({ 
            message: 'Images found',
            path: imagesPath,
            files: files.slice(0, 5) // Show first 5 files
        });
    } catch (error) {
        res.json({ 
            error: 'Could not read images directory',
            path: imagesPath,
            message: error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Test server running on port ${PORT}`);
    console.log(`📱 Test URL: http://localhost:${PORT}`);
    console.log(`🖼️  Images URL: http://localhost:${PORT}/images/projects/`);
});
