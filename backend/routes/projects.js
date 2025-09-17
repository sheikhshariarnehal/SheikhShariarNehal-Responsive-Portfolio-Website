const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const projectManager = require('../utils/projectManager');
// const auth = require('../middleware/auth'); // Authentication disabled
const { uploadMiddleware } = require('../middleware/upload');
const path = require('path');
const fs = require('fs').promises;

const router = express.Router();

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// GET /api/projects - Get all projects (public endpoint)
router.get('/', 
  [
    query('category').optional().isString().trim(),
    query('search').optional().isString().trim(),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 })
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      let projects;
      
      if (req.query.search) {
        projects = await projectManager.searchProjects(req.query.search);
      } else if (req.query.category) {
        projects = await projectManager.getProjectsByCategory(req.query.category);
      } else {
        projects = await projectManager.getAllProjects();
      }
      
      // Apply pagination if specified
      const limit = parseInt(req.query.limit);
      const offset = parseInt(req.query.offset) || 0;
      
      if (limit) {
        const total = projects.length;
        projects = projects.slice(offset, offset + limit);
        
        return res.json({
          success: true,
          data: projects,
          pagination: {
            total,
            limit,
            offset,
            hasMore: offset + limit < total
          }
        });
      }
      
      res.json({
        success: true,
        data: projects,
        total: projects.length
      });
    } catch (error) {
      console.error('Error fetching projects:', error);
      res.status(500).json({
        error: 'Failed to fetch projects',
        message: error.message
      });
    }
  }
);

// GET /api/projects/categories - Get all categories (public endpoint)
router.get('/categories', async (req, res) => {
  try {
    const categories = await projectManager.getCategories();
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      error: 'Failed to fetch categories',
      message: error.message
    });
  }
});

// GET /api/projects/:id - Get single project (public endpoint)
router.get('/:id',
  [
    param('id').notEmpty().withMessage('Project ID is required')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const project = await projectManager.getProject(req.params.id);
      res.json({
        success: true,
        data: project
      });
    } catch (error) {
      console.error('Error fetching project:', error);
      const statusCode = error.message === 'Project not found' ? 404 : 500;
      res.status(statusCode).json({
        error: 'Failed to fetch project',
        message: error.message
      });
    }
  }
);

// POST /api/projects - Create new project (no auth required)
router.post('/',
  [
    body('name')
      .notEmpty()
      .withMessage('Project name is required')
      .isLength({ min: 1, max: 200 })
      .withMessage('Project name must be between 1 and 200 characters'),
    body('desc')
      .notEmpty()
      .withMessage('Project description is required')
      .isLength({ min: 10, max: 1000 })
      .withMessage('Project description must be between 10 and 1000 characters'),
    body('category')
      .notEmpty()
      .withMessage('Project category is required')
      .isIn(['basicweb', 'mern', 'android', 'lamp'])
      .withMessage('Category must be one of: basicweb, mern, android, lamp'),
    body('image')
      .notEmpty()
      .withMessage('Project image is required')
      .isString()
      .withMessage('Image must be a string'),
    body('links.view')
      .notEmpty()
      .withMessage('View link is required')
      .isURL({ require_protocol: true })
      .withMessage('View link must be a valid URL'),
    body('links.code')
      .notEmpty()
      .withMessage('Code link is required')
      .isURL({ require_protocol: true })
      .withMessage('Code link must be a valid URL')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const projectData = {
        name: req.body.name.trim(),
        desc: req.body.desc.trim(),
        category: req.body.category,
        image: req.body.image.trim(),
        links: {
          view: req.body.links.view.trim(),
          code: req.body.links.code.trim()
        }
      };
      
      const newProject = await projectManager.addProject(projectData);
      
      res.status(201).json({
        success: true,
        message: 'Project created successfully',
        data: newProject
      });
    } catch (error) {
      console.error('Error creating project:', error);
      res.status(400).json({
        error: 'Failed to create project',
        message: error.message
      });
    }
  }
);

// PUT /api/projects/:id - Update project (no auth required)
router.put('/:id',
  [
    param('id').notEmpty().withMessage('Project ID is required'),
    body('name')
      .notEmpty()
      .withMessage('Project name is required')
      .isLength({ min: 1, max: 200 })
      .withMessage('Project name must be between 1 and 200 characters'),
    body('desc')
      .notEmpty()
      .withMessage('Project description is required')
      .isLength({ min: 10, max: 1000 })
      .withMessage('Project description must be between 10 and 1000 characters'),
    body('category')
      .notEmpty()
      .withMessage('Project category is required')
      .isIn(['basicweb', 'mern', 'android', 'lamp'])
      .withMessage('Category must be one of: basicweb, mern, android, lamp'),
    body('image')
      .notEmpty()
      .withMessage('Project image is required')
      .isString()
      .withMessage('Image must be a string'),
    body('links.view')
      .notEmpty()
      .withMessage('View link is required')
      .isURL({ require_protocol: true })
      .withMessage('View link must be a valid URL'),
    body('links.code')
      .notEmpty()
      .withMessage('Code link is required')
      .isURL({ require_protocol: true })
      .withMessage('Code link must be a valid URL')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const projectData = {
        name: req.body.name.trim(),
        desc: req.body.desc.trim(),
        category: req.body.category,
        image: req.body.image.trim(),
        links: {
          view: req.body.links.view.trim(),
          code: req.body.links.code.trim()
        }
      };
      
      const updatedProject = await projectManager.updateProject(req.params.id, projectData);
      
      res.json({
        success: true,
        message: 'Project updated successfully',
        data: updatedProject
      });
    } catch (error) {
      console.error('Error updating project:', error);
      const statusCode = error.message === 'Project not found' ? 404 : 400;
      res.status(statusCode).json({
        error: 'Failed to update project',
        message: error.message
      });
    }
  }
);

// DELETE /api/projects/:id - Delete project (no auth required)
router.delete('/:id',
  [
    param('id').notEmpty().withMessage('Project ID is required')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const deletedProject = await projectManager.deleteProject(req.params.id);

      res.json({
        success: true,
        message: 'Project deleted successfully',
        data: deletedProject
      });
    } catch (error) {
      console.error('Error deleting project:', error);
      const statusCode = error.message === 'Project not found' ? 404 : 500;
      res.status(statusCode).json({
        error: 'Failed to delete project',
        message: error.message
      });
    }
  }
);

// POST /api/projects/upload - Upload project image (no auth required)
router.post('/upload',
  uploadMiddleware,
  async (req, res) => {
    try {
      console.log('Upload request received');
      console.log('Request file:', req.file);
      console.log('Request body:', req.body);

      if (!req.file) {
        console.log('No file in request');
        return res.status(400).json({
          error: 'No file uploaded',
          message: 'Please select an image file to upload'
        });
      }

      console.log('File uploaded successfully:', req.file.filename);

      // Return the filename without extension (as used in projects.json)
      const filename = path.basename(req.file.filename, path.extname(req.file.filename));

      res.json({
        success: true,
        message: 'Image uploaded successfully',
        data: {
          filename: filename,
          originalName: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype,
          path: req.file.path
        }
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      res.status(500).json({
        error: 'Upload failed',
        message: error.message
      });
    }
  }
);

// GET /api/projects/images - List all project images (no auth required)
router.get('/images/list', async (req, res) => {
  try {
    const imagesPath = path.join(__dirname, '../../assets/images/projects');

    try {
      const files = await fs.readdir(imagesPath);
      const imageFiles = files
        .filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
        .map(file => ({
          filename: path.basename(file, path.extname(file)),
          fullName: file,
          extension: path.extname(file)
        }));

      res.json({
        success: true,
        data: imageFiles,
        total: imageFiles.length
      });
    } catch (error) {
      if (error.code === 'ENOENT') {
        res.json({
          success: true,
          data: [],
          total: 0,
          message: 'Images directory not found'
        });
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('Error listing images:', error);
    res.status(500).json({
      error: 'Failed to list images',
      message: error.message
    });
  }
});

// DELETE /api/projects/images/:filename - Delete project image (no auth required)
router.delete('/images/:filename',
  [
    param('filename').notEmpty().withMessage('Filename is required')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const filename = req.params.filename;
      const imagesPath = path.join(__dirname, '../../assets/images/projects');

      // Find the actual file (with extension)
      const files = await fs.readdir(imagesPath);
      const targetFile = files.find(file =>
        path.basename(file, path.extname(file)) === filename
      );

      if (!targetFile) {
        return res.status(404).json({
          error: 'Image not found',
          message: 'The specified image file does not exist'
        });
      }

      const filePath = path.join(imagesPath, targetFile);
      await fs.unlink(filePath);

      res.json({
        success: true,
        message: 'Image deleted successfully',
        data: {
          filename: filename,
          deletedFile: targetFile
        }
      });
    } catch (error) {
      console.error('Error deleting image:', error);
      const statusCode = error.code === 'ENOENT' ? 404 : 500;
      res.status(statusCode).json({
        error: 'Failed to delete image',
        message: error.message
      });
    }
  }
);

module.exports = router;
