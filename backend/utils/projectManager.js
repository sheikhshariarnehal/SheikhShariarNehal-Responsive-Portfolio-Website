const fs = require('fs').promises;
const path = require('path');

class ProjectManager {
  constructor() {
    // Path to the projects.json file in the main portfolio directory
    this.projectsPath = path.join(__dirname, '../../projects/projects.json');
    this.backupPath = path.join(__dirname, '../backups');
  }

  /**
   * Ensure backup directory exists
   */
  async ensureBackupDir() {
    try {
      await fs.access(this.backupPath);
    } catch (error) {
      await fs.mkdir(this.backupPath, { recursive: true });
    }
  }

  /**
   * Create a backup of the current projects.json file
   */
  async createBackup() {
    try {
      await this.ensureBackupDir();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFileName = `projects-backup-${timestamp}.json`;
      const backupFilePath = path.join(this.backupPath, backupFileName);
      
      const data = await fs.readFile(this.projectsPath, 'utf8');
      await fs.writeFile(backupFilePath, data, 'utf8');
      
      console.log(`Backup created: ${backupFileName}`);
      return backupFilePath;
    } catch (error) {
      console.error('Error creating backup:', error);
      throw new Error('Failed to create backup');
    }
  }

  /**
   * Read all projects from the JSON file
   */
  async getAllProjects() {
    try {
      const data = await fs.readFile(this.projectsPath, 'utf8');
      const projects = JSON.parse(data);
      
      // Add unique IDs if they don't exist
      return projects.map((project, index) => ({
        id: project.id || `project_${index + 1}`,
        ...project
      }));
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error('Projects file not found');
      }
      if (error instanceof SyntaxError) {
        throw new Error('Invalid JSON format in projects file');
      }
      throw new Error(`Error reading projects: ${error.message}`);
    }
  }

  /**
   * Get a single project by ID or index
   */
  async getProject(identifier) {
    const projects = await this.getAllProjects();
    
    // Try to find by ID first
    let project = projects.find(p => p.id === identifier);
    
    // If not found by ID, try by index
    if (!project) {
      const index = parseInt(identifier);
      if (!isNaN(index) && index >= 0 && index < projects.length) {
        project = projects[index];
      }
    }
    
    if (!project) {
      throw new Error('Project not found');
    }
    
    return project;
  }

  /**
   * Validate project data
   */
  validateProject(project) {
    const errors = [];
    
    if (!project.name || typeof project.name !== 'string' || project.name.trim() === '') {
      errors.push('Project name is required and must be a non-empty string');
    }
    
    if (!project.desc || typeof project.desc !== 'string' || project.desc.trim() === '') {
      errors.push('Project description is required and must be a non-empty string');
    }
    
    if (!project.category || typeof project.category !== 'string' || project.category.trim() === '') {
      errors.push('Project category is required and must be a non-empty string');
    }
    
    if (!project.image || typeof project.image !== 'string' || project.image.trim() === '') {
      errors.push('Project image is required and must be a non-empty string');
    }
    
    if (!project.links || typeof project.links !== 'object') {
      errors.push('Project links must be an object');
    } else {
      if (!project.links.view || typeof project.links.view !== 'string') {
        errors.push('Project view link is required and must be a string');
      }
      if (!project.links.code || typeof project.links.code !== 'string') {
        errors.push('Project code link is required and must be a string');
      }
    }
    
    return errors;
  }

  /**
   * Save projects array to JSON file
   */
  async saveProjects(projects) {
    try {
      // Create backup before saving
      await this.createBackup();
      
      // Remove IDs before saving (to maintain original format)
      const projectsToSave = projects.map(({ id, ...project }) => project);
      
      const jsonData = JSON.stringify(projectsToSave, null, 2);
      await fs.writeFile(this.projectsPath, jsonData, 'utf8');
      
      console.log('Projects saved successfully');
    } catch (error) {
      throw new Error(`Error saving projects: ${error.message}`);
    }
  }

  /**
   * Add a new project
   */
  async addProject(projectData) {
    const validationErrors = this.validateProject(projectData);
    if (validationErrors.length > 0) {
      throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
    }
    
    const projects = await this.getAllProjects();
    
    // Generate unique ID
    const newId = `project_${Date.now()}`;
    const newProject = {
      id: newId,
      ...projectData
    };
    
    projects.push(newProject);
    await this.saveProjects(projects);
    
    return newProject;
  }

  /**
   * Update an existing project
   */
  async updateProject(identifier, updateData) {
    const validationErrors = this.validateProject(updateData);
    if (validationErrors.length > 0) {
      throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
    }
    
    const projects = await this.getAllProjects();
    const projectIndex = projects.findIndex(p => p.id === identifier || projects.indexOf(p) === parseInt(identifier));
    
    if (projectIndex === -1) {
      throw new Error('Project not found');
    }
    
    // Preserve the original ID
    const updatedProject = {
      id: projects[projectIndex].id,
      ...updateData
    };
    
    projects[projectIndex] = updatedProject;
    await this.saveProjects(projects);
    
    return updatedProject;
  }

  /**
   * Delete a project
   */
  async deleteProject(identifier) {
    const projects = await this.getAllProjects();
    const projectIndex = projects.findIndex(p => p.id === identifier || projects.indexOf(p) === parseInt(identifier));
    
    if (projectIndex === -1) {
      throw new Error('Project not found');
    }
    
    const deletedProject = projects[projectIndex];
    projects.splice(projectIndex, 1);
    await this.saveProjects(projects);
    
    return deletedProject;
  }

  /**
   * Get projects by category
   */
  async getProjectsByCategory(category) {
    const projects = await this.getAllProjects();
    return projects.filter(project => project.category === category);
  }

  /**
   * Get all unique categories
   */
  async getCategories() {
    const projects = await this.getAllProjects();
    const categories = [...new Set(projects.map(project => project.category))];
    return categories.sort();
  }

  /**
   * Search projects by name or description
   */
  async searchProjects(query) {
    const projects = await this.getAllProjects();
    const searchTerm = query.toLowerCase();
    
    return projects.filter(project => 
      project.name.toLowerCase().includes(searchTerm) ||
      project.desc.toLowerCase().includes(searchTerm)
    );
  }
}

module.exports = new ProjectManager();
