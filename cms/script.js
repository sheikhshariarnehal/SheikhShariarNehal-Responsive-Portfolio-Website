// CMS Dashboard JavaScript
class ProjectCMS {
    constructor() {
        this.projects = [];
        this.filteredProjects = [];
        this.currentEditIndex = -1;
        this.selectedProjects = new Set();
        
        this.init();
    }

    async init() {
        await this.loadProjects();
        this.setupEventListeners();
        this.updateStats();
        this.renderProjects();
    }

    // Load projects from JSON file
    async loadProjects() {
        try {
            this.showLoading(true);

            // Use Node.js API
            const response = await fetch('/api/projects');

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            this.projects = await response.json();
            this.filteredProjects = [...this.projects];
            this.showToast('Projects loaded successfully', 'success');
        } catch (error) {
            console.error('Error loading projects:', error);
            this.showToast('Failed to load projects. Make sure the Node.js server is running.', 'error');
            this.projects = [];
            this.filteredProjects = [];
        } finally {
            this.showLoading(false);
        }
    }

    // Save projects to JSON file
    async saveProjects() {
        try {
            // Use Node.js API
            const response = await fetch('/api/projects', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(this.projects)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            this.showToast(result.message || 'Projects saved successfully!', 'success');

            // Update localStorage backup
            localStorage.setItem('cms_projects_backup', JSON.stringify(this.projects));
            localStorage.setItem('cms_last_updated', new Date().toISOString());

        } catch (error) {
            console.error('Error saving projects:', error);
            this.showToast('Failed to save projects. Make sure the Node.js server is running.', 'error');
        }
    }

    // Download projects as JSON file
    downloadProjectsFile() {
        const dataStr = JSON.stringify(this.projects, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = 'projects.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    // Setup event listeners
    setupEventListeners() {
        // Modal controls
        document.getElementById('add-project-btn').addEventListener('click', () => this.openAddModal());
        document.getElementById('modal-close').addEventListener('click', () => this.closeModal());
        document.getElementById('cancel-btn').addEventListener('click', () => this.closeModal());
        
        // Form submission
        document.getElementById('project-form').addEventListener('submit', (e) => this.handleFormSubmit(e));
        
        // Search and filters
        document.getElementById('search-input').addEventListener('input', (e) => this.handleSearch(e.target.value));
        document.getElementById('category-filter').addEventListener('change', (e) => this.handleCategoryFilter(e.target.value));
        document.getElementById('sort-by').addEventListener('change', (e) => this.handleSort(e.target.value));
        
        // Bulk actions
        document.getElementById('select-all').addEventListener('change', (e) => this.handleSelectAll(e.target.checked));
        document.getElementById('delete-selected-btn').addEventListener('click', () => this.handleDeleteSelected());
        
        // Import/Export
        document.getElementById('import-btn').addEventListener('click', () => this.handleImport());
        document.getElementById('export-btn').addEventListener('click', () => this.downloadProjectsFile());
        document.getElementById('import-file').addEventListener('change', (e) => this.handleImportFile(e));
        
        // Image upload
        this.setupImageUpload();
        
        // Confirmation modal
        document.getElementById('confirm-cancel').addEventListener('click', () => this.closeConfirmModal());
        document.getElementById('confirm-ok').addEventListener('click', () => this.executeConfirmedAction());
        
        // Close modals on outside click
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal();
                this.closeConfirmModal();
            }
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
                this.closeConfirmModal();
            }
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                this.saveProjects();
            }
        });
    }

    // Setup image upload functionality
    setupImageUpload() {
        const uploadArea = document.getElementById('image-upload-area');
        const fileInput = document.getElementById('project-image');
        const preview = document.getElementById('image-preview');
        const previewImg = document.getElementById('preview-img');
        const removeBtn = document.getElementById('remove-image');
        const placeholder = uploadArea.querySelector('.upload-placeholder');

        // Click to upload
        uploadArea.addEventListener('click', () => fileInput.click());

        // File input change
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.handleImageFile(file);
            }
        });

        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                this.handleImageFile(file);
            }
        });

        // Remove image
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.clearImagePreview();
        });
    }

    // Handle image file
    async handleImageFile(file) {
        if (!file.type.startsWith('image/')) {
            this.showToast('Please select a valid image file', 'error');
            return;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            this.showToast('Image size should be less than 5MB', 'error');
            return;
        }

        // Show preview immediately
        const reader = new FileReader();
        reader.onload = (e) => {
            const preview = document.getElementById('image-preview');
            const previewImg = document.getElementById('preview-img');
            const placeholder = document.querySelector('.upload-placeholder');

            previewImg.src = e.target.result;
            preview.style.display = 'block';
            placeholder.style.display = 'none';
        };
        reader.readAsDataURL(file);

        // Store file for later upload
        this.selectedImageFile = file;
    }

    // Clear image preview
    clearImagePreview() {
        const preview = document.getElementById('image-preview');
        const previewImg = document.getElementById('preview-img');
        const placeholder = document.querySelector('.upload-placeholder');
        const fileInput = document.getElementById('project-image');
        
        previewImg.src = '';
        preview.style.display = 'none';
        placeholder.style.display = 'block';
        fileInput.value = '';
    }

    // Update dashboard statistics
    async updateStats() {
        try {
            const response = await fetch('/api/stats');
            if (response.ok) {
                const stats = await response.json();
                document.getElementById('total-projects').textContent = stats.totalProjects;
                document.getElementById('total-categories').textContent = stats.totalCategories;
                document.getElementById('last-updated').textContent =
                    new Date(stats.lastUpdated).toLocaleDateString();
            } else {
                // Fallback to local calculation
                const totalProjects = this.projects.length;
                const categories = [...new Set(this.projects.map(p => p.category))].length;
                const lastUpdated = localStorage.getItem('cms_last_updated');

                document.getElementById('total-projects').textContent = totalProjects;
                document.getElementById('total-categories').textContent = categories;
                document.getElementById('last-updated').textContent = lastUpdated
                    ? new Date(lastUpdated).toLocaleDateString()
                    : 'Never';
            }
        } catch (error) {
            console.error('Error updating stats:', error);
            // Fallback to local calculation
            const totalProjects = this.projects.length;
            const categories = [...new Set(this.projects.map(p => p.category))].length;

            document.getElementById('total-projects').textContent = totalProjects;
            document.getElementById('total-categories').textContent = categories;
            document.getElementById('last-updated').textContent = 'Error loading';
        }
    }

    // Show/hide loading state
    showLoading(show) {
        const loading = document.getElementById('loading');
        const table = document.getElementById('projects-table');
        
        if (show) {
            loading.style.display = 'block';
            table.style.display = 'none';
        } else {
            loading.style.display = 'none';
            table.style.display = 'table';
        }
    }

    // Show toast notification
    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const iconMap = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        
        toast.innerHTML = `
            <i class="toast-icon ${iconMap[type]}"></i>
            <span class="toast-message">${message}</span>
            <button class="toast-close"><i class="fas fa-times"></i></button>
        `;
        
        container.appendChild(toast);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 5000);
        
        // Manual close
        toast.querySelector('.toast-close').addEventListener('click', () => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        });
    }

    // Open add project modal
    openAddModal() {
        this.currentEditIndex = -1;
        document.getElementById('modal-title').textContent = 'Add New Project';
        document.getElementById('save-btn').innerHTML = '<i class="fas fa-save"></i> Save Project';
        this.clearForm();
        this.showModal();
    }

    // Open edit project modal
    openEditModal(index) {
        this.currentEditIndex = index;
        const project = this.projects[index];
        
        document.getElementById('modal-title').textContent = 'Edit Project';
        document.getElementById('save-btn').innerHTML = '<i class="fas fa-save"></i> Update Project';
        
        // Populate form
        document.getElementById('project-name').value = project.name;
        document.getElementById('project-desc').value = project.desc;
        document.getElementById('project-category').value = project.category;
        document.getElementById('project-view-link').value = project.links.view;
        document.getElementById('project-code-link').value = project.links.code;
        
        // Handle image preview for existing project
        if (project.image) {
            const preview = document.getElementById('image-preview');
            const previewImg = document.getElementById('preview-img');
            const placeholder = document.querySelector('.upload-placeholder');
            
            previewImg.src = `../assets/images/projects/${project.image}.png`;
            preview.style.display = 'block';
            placeholder.style.display = 'none';
        }
        
        this.showModal();
    }

    // Show modal
    showModal() {
        document.getElementById('project-modal').classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    // Close modal
    closeModal() {
        document.getElementById('project-modal').classList.remove('show');
        document.body.style.overflow = 'auto';
        this.clearForm();
    }

    // Clear form
    clearForm() {
        document.getElementById('project-form').reset();
        this.clearImagePreview();
        this.clearFormErrors();
        this.selectedImageFile = null;
    }

    // Clear form validation errors
    clearFormErrors() {
        const errorElements = document.querySelectorAll('.error-message');
        const formGroups = document.querySelectorAll('.form-group');

        errorElements.forEach(el => el.classList.remove('show'));
        formGroups.forEach(group => group.classList.remove('error'));
    }

    // Handle form submission
    async handleFormSubmit(e) {
        e.preventDefault();

        if (!this.validateForm()) {
            return;
        }

        const formData = new FormData(e.target);
        let imageName = this.generateImageName(formData.get('name'));

        try {
            // Upload image if selected
            if (this.selectedImageFile) {
                const uploadFormData = new FormData();
                uploadFormData.append('image', this.selectedImageFile);
                uploadFormData.append('projectName', formData.get('name').trim());

                const uploadResponse = await fetch('/api/upload', {
                    method: 'POST',
                    body: uploadFormData
                });

                if (uploadResponse.ok) {
                    const uploadResult = await uploadResponse.json();
                    imageName = uploadResult.filename;
                    this.showToast('Image uploaded successfully!', 'success');
                } else {
                    throw new Error('Failed to upload image');
                }
            }

            const projectData = {
                name: formData.get('name').trim(),
                desc: formData.get('desc').trim(),
                category: formData.get('category'),
                image: imageName,
                links: {
                    view: formData.get('viewLink').trim(),
                    code: formData.get('codeLink').trim()
                }
            };

            if (this.currentEditIndex === -1) {
                // Add new project
                this.projects.push(projectData);
                this.showToast('Project added successfully!', 'success');
            } else {
                // Update existing project
                this.projects[this.currentEditIndex] = projectData;
                this.showToast('Project updated successfully!', 'success');
            }

            await this.saveProjects();
            this.updateStats();
            this.applyFilters();
            this.renderProjects();
            this.closeModal();

        } catch (error) {
            console.error('Error saving project:', error);
            this.showToast('Failed to save project: ' + error.message, 'error');
        }
    }

    // Validate form
    validateForm() {
        this.clearFormErrors();
        let isValid = true;

        const name = document.getElementById('project-name').value.trim();
        const desc = document.getElementById('project-desc').value.trim();
        const category = document.getElementById('project-category').value;
        const viewLink = document.getElementById('project-view-link').value.trim();
        const codeLink = document.getElementById('project-code-link').value.trim();

        // Validate name
        if (!name) {
            this.showFieldError('name', 'Project name is required');
            isValid = false;
        } else if (name.length < 3) {
            this.showFieldError('name', 'Project name must be at least 3 characters');
            isValid = false;
        }

        // Validate description
        if (!desc) {
            this.showFieldError('desc', 'Description is required');
            isValid = false;
        } else if (desc.length < 10) {
            this.showFieldError('desc', 'Description must be at least 10 characters');
            isValid = false;
        }

        // Validate category
        if (!category) {
            this.showFieldError('category', 'Please select a category');
            isValid = false;
        }

        // Validate URLs
        if (!this.isValidUrl(viewLink)) {
            this.showFieldError('view-link', 'Please enter a valid URL');
            isValid = false;
        }

        if (!this.isValidUrl(codeLink)) {
            this.showFieldError('code-link', 'Please enter a valid URL');
            isValid = false;
        }

        return isValid;
    }

    // Show field error
    showFieldError(fieldName, message) {
        const errorElement = document.getElementById(`${fieldName}-error`);
        const formGroup = errorElement.closest('.form-group');

        errorElement.textContent = message;
        errorElement.classList.add('show');
        formGroup.classList.add('error');
    }

    // Validate URL
    isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    // Generate image name from project name
    generateImageName(projectName) {
        return projectName
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, '')
            .substring(0, 20);
    }

    // Handle search
    handleSearch(query) {
        this.searchQuery = query.toLowerCase();
        this.applyFilters();
        this.renderProjects();
    }

    // Handle category filter
    handleCategoryFilter(category) {
        this.categoryFilter = category;
        this.applyFilters();
        this.renderProjects();
    }

    // Handle sorting
    handleSort(sortBy) {
        this.sortBy = sortBy;
        this.applyFilters();
        this.renderProjects();
    }

    // Apply filters and sorting
    applyFilters() {
        let filtered = [...this.projects];

        // Apply search filter
        if (this.searchQuery) {
            filtered = filtered.filter(project =>
                project.name.toLowerCase().includes(this.searchQuery) ||
                project.desc.toLowerCase().includes(this.searchQuery) ||
                project.category.toLowerCase().includes(this.searchQuery)
            );
        }

        // Apply category filter
        if (this.categoryFilter) {
            filtered = filtered.filter(project => project.category === this.categoryFilter);
        }

        // Apply sorting
        if (this.sortBy) {
            filtered.sort((a, b) => {
                switch (this.sortBy) {
                    case 'name':
                        return a.name.localeCompare(b.name);
                    case 'category':
                        return a.category.localeCompare(b.category);
                    case 'date':
                        // For demo, we'll sort by array index (newest first)
                        return this.projects.indexOf(b) - this.projects.indexOf(a);
                    default:
                        return 0;
                }
            });
        }

        this.filteredProjects = filtered;
    }

    // Render projects table
    renderProjects() {
        const tbody = document.getElementById('projects-tbody');
        const noProjects = document.getElementById('no-projects');

        if (this.filteredProjects.length === 0) {
            tbody.innerHTML = '';
            noProjects.style.display = 'block';
            return;
        }

        noProjects.style.display = 'none';

        tbody.innerHTML = this.filteredProjects.map((project, index) => {
            const originalIndex = this.projects.indexOf(project);
            return `
                <tr>
                    <td>
                        <input type="checkbox" class="project-checkbox" data-index="${originalIndex}">
                    </td>
                    <td>
                        <img src="../assets/images/projects/${project.image}.png"
                             alt="${project.name}"
                             class="project-image"
                             onerror="this.src='../assets/images/favicon.png'">
                    </td>
                    <td>
                        <div class="project-name">${project.name}</div>
                    </td>
                    <td>
                        <div class="project-desc" title="${project.desc}">
                            ${project.desc}
                        </div>
                    </td>
                    <td>
                        <span class="category-badge category-${project.category}">
                            ${this.getCategoryLabel(project.category)}
                        </span>
                    </td>
                    <td>
                        <div class="project-links">
                            <a href="${project.links.view}" target="_blank" class="link-btn link-view">
                                <i class="fas fa-eye"></i> View
                            </a>
                            <a href="${project.links.code}" target="_blank" class="link-btn link-code">
                                <i class="fas fa-code"></i> Code
                            </a>
                        </div>
                    </td>
                    <td>
                        <div class="actions-cell">
                            <button class="btn btn-small btn-secondary" onclick="cms.openEditModal(${originalIndex})" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-small btn-danger" onclick="cms.deleteProject(${originalIndex})" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        // Setup checkbox listeners
        this.setupCheckboxListeners();
    }

    // Get category label
    getCategoryLabel(category) {
        const labels = {
            'mern': 'MERN Stack',
            'lamp': 'LAMP Stack',
            'basicweb': 'Basic Web',
            'android': 'Android App'
        };
        return labels[category] || category;
    }

    // Setup checkbox listeners
    setupCheckboxListeners() {
        const checkboxes = document.querySelectorAll('.project-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => this.handleProjectSelection());
        });
    }

    // Handle project selection
    handleProjectSelection() {
        const checkboxes = document.querySelectorAll('.project-checkbox');
        const selectedCount = document.querySelectorAll('.project-checkbox:checked').length;
        const deleteBtn = document.getElementById('delete-selected-btn');

        deleteBtn.disabled = selectedCount === 0;
        deleteBtn.textContent = selectedCount > 0
            ? `Delete Selected (${selectedCount})`
            : 'Delete Selected';

        // Update select all checkbox
        const selectAll = document.getElementById('select-all');
        selectAll.indeterminate = selectedCount > 0 && selectedCount < checkboxes.length;
        selectAll.checked = selectedCount === checkboxes.length && checkboxes.length > 0;
    }

    // Handle select all
    handleSelectAll(checked) {
        const checkboxes = document.querySelectorAll('.project-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = checked;
        });
        this.handleProjectSelection();
    }

    // Delete single project
    deleteProject(index) {
        const project = this.projects[index];
        this.showConfirmModal(
            'Delete Project',
            `Are you sure you want to delete "${project.name}"? This action cannot be undone.`,
            () => this.executeDeleteProject(index)
        );
    }

    // Execute delete project
    async executeDeleteProject(index) {
        try {
            this.projects.splice(index, 1);
            await this.saveProjects();
            this.updateStats();
            this.applyFilters();
            this.renderProjects();
            this.showToast('Project deleted successfully', 'success');
        } catch (error) {
            console.error('Error deleting project:', error);
            this.showToast('Failed to delete project', 'error');
        }
    }

    // Handle delete selected
    handleDeleteSelected() {
        const selectedCheckboxes = document.querySelectorAll('.project-checkbox:checked');
        const selectedCount = selectedCheckboxes.length;

        if (selectedCount === 0) return;

        this.showConfirmModal(
            'Delete Selected Projects',
            `Are you sure you want to delete ${selectedCount} selected project(s)? This action cannot be undone.`,
            () => this.executeDeleteSelected()
        );
    }

    // Execute delete selected
    async executeDeleteSelected() {
        try {
            const selectedCheckboxes = document.querySelectorAll('.project-checkbox:checked');
            const indicesToDelete = Array.from(selectedCheckboxes)
                .map(cb => parseInt(cb.dataset.index))
                .sort((a, b) => b - a); // Sort in descending order to avoid index issues

            indicesToDelete.forEach(index => {
                this.projects.splice(index, 1);
            });

            await this.saveProjects();
            this.updateStats();
            this.applyFilters();
            this.renderProjects();
            this.showToast(`${indicesToDelete.length} project(s) deleted successfully`, 'success');

            // Reset select all checkbox
            document.getElementById('select-all').checked = false;
            document.getElementById('delete-selected-btn').disabled = true;

        } catch (error) {
            console.error('Error deleting projects:', error);
            this.showToast('Failed to delete selected projects', 'error');
        }
    }

    // Show confirmation modal
    showConfirmModal(title, message, onConfirm) {
        document.getElementById('confirm-title').textContent = title;
        document.getElementById('confirm-message').textContent = message;
        document.getElementById('confirm-modal').classList.add('show');

        this.confirmAction = onConfirm;
    }

    // Close confirmation modal
    closeConfirmModal() {
        document.getElementById('confirm-modal').classList.remove('show');
        this.confirmAction = null;
    }

    // Execute confirmed action
    executeConfirmedAction() {
        if (this.confirmAction) {
            this.confirmAction();
            this.closeConfirmModal();
        }
    }

    // Handle import
    handleImport() {
        document.getElementById('import-file').click();
    }

    // Handle import file
    async handleImportFile(e) {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const text = await file.text();
            const importedProjects = JSON.parse(text);

            if (!Array.isArray(importedProjects)) {
                throw new Error('Invalid file format');
            }

            // Validate project structure
            const isValid = importedProjects.every(project =>
                project.name && project.desc && project.category &&
                project.links && project.links.view && project.links.code
            );

            if (!isValid) {
                throw new Error('Invalid project data structure');
            }

            this.showConfirmModal(
                'Import Projects',
                `This will replace all existing projects with ${importedProjects.length} imported project(s). Continue?`,
                () => this.executeImport(importedProjects)
            );

        } catch (error) {
            console.error('Error importing projects:', error);
            this.showToast('Failed to import projects. Please check the file format.', 'error');
        }

        // Reset file input
        e.target.value = '';
    }

    // Execute import
    async executeImport(importedProjects) {
        try {
            this.projects = importedProjects;
            await this.saveProjects();
            this.updateStats();
            this.applyFilters();
            this.renderProjects();
            this.showToast(`Successfully imported ${importedProjects.length} project(s)`, 'success');
        } catch (error) {
            console.error('Error executing import:', error);
            this.showToast('Failed to import projects', 'error');
        }
    }
}

// Initialize CMS when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.cms = new ProjectCMS();
});

// Service Worker for offline functionality (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}
