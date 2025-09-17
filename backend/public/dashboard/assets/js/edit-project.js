// Edit project functionality
let currentProject = null;

document.addEventListener('DOMContentLoaded', () => {
    // Get project ID from URL
    const urlParts = window.location.pathname.split('/');
    const projectId = urlParts[urlParts.length - 1];

    console.log('URL parts:', urlParts);
    console.log('Project ID from URL:', projectId);

    if (!projectId || projectId === 'edit-project') {
        console.error('No project ID found in URL');
        showErrorState();
        return;
    }

    // Initialize edit project page
    initializeEditProjectPage(projectId);
});

async function initializeEditProjectPage(projectId) {
    try {
        // Load project data
        await loadProjectData(projectId);
        
        // Set up event listeners
        setupEventListeners();
        
        // Set up file upload
        setupFileUpload();
        
        // Set up form validation
        setupFormValidation();
        
        // Show the form
        document.getElementById('loadingState').style.display = 'none';
        document.getElementById('editFormContainer').style.display = 'block';
        
    } catch (error) {
        console.error('Error initializing edit page:', error);
        showErrorState();
    }
}

async function loadProjectData(projectId) {
    try {
        console.log('Loading project data for ID:', projectId);

        const response = await fetch(`/api/projects/${projectId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Project data received:', data);

        if (data && data.success) {
            currentProject = data.data;
            populateForm(currentProject);
        } else {
            throw new Error(data.message || 'Project not found');
        }
    } catch (error) {
        console.error('Error loading project:', error);
        throw error;
    }
}

function populateForm(project) {
    // Set form values
    document.getElementById('projectId').value = project.id;
    document.getElementById('projectName').value = project.name;
    document.getElementById('projectCategory').value = project.category;
    document.getElementById('projectDescription').value = project.desc;
    document.getElementById('projectViewLink').value = project.links.view;
    document.getElementById('projectCodeLink').value = project.links.code;
    document.getElementById('projectImage').value = project.image;
    
    // Update character count
    const descCharCount = document.getElementById('descCharCount');
    descCharCount.textContent = project.desc.length;
    
    // Show current image
    showCurrentImage(project.image);
}

function showCurrentImage(imageName) {
    const imagePreview = document.getElementById('imagePreview');
    const previewImg = document.getElementById('previewImg');
    const fileUploadArea = document.getElementById('fileUploadArea');

    if (!imageName) {
        return;
    }

    // Set image source - use the main assets directory
    const imagePath = `/images/projects/${imageName}.png`;

    // Try to load the image
    let imageLoaded = false;
    
    const img = new Image();
    img.onload = function() {
        previewImg.src = imagePath;
        imagePreview.style.display = 'block';
        fileUploadArea.style.display = 'none';
        imageLoaded = true;
    };
    img.onerror = function() {
        // If no image found, show placeholder
        previewImg.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZSBOb3QgRm91bmQ8L3RleHQ+PC9zdmc+';
        imagePreview.style.display = 'block';
        fileUploadArea.style.display = 'none';
    };
    img.src = imagePath;
}

function setupFileUpload() {
    const fileUploadArea = document.getElementById('fileUploadArea');
    const fileInput = document.getElementById('imageFile');
    const imagePreview = document.getElementById('imagePreview');
    const previewImg = document.getElementById('previewImg');
    const projectImageInput = document.getElementById('projectImage');
    const removeImageBtn = document.getElementById('removeImage');

    // Drag and drop events
    fileUploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        fileUploadArea.classList.add('dragover');
    });

    fileUploadArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        fileUploadArea.classList.remove('dragover');
    });

    fileUploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        fileUploadArea.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileSelection(files[0]);
        }
    });

    // File input change
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileSelection(e.target.files[0]);
        }
    });

    // Remove/change image button
    removeImageBtn.addEventListener('click', () => {
        showUploadArea();
    });

    // Make upload area clickable
    fileUploadArea.addEventListener('click', (e) => {
        // Prevent clicking on buttons from triggering file dialog
        if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
            return;
        }
        console.log('Upload area clicked, opening file dialog');
        fileInput.click();
    });

    function handleFileSelection(file) {
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            showAlert('Invalid file type. Please select a JPG, PNG, GIF, or WebP image.', 'danger');
            return;
        }

        // Validate file size (5MB)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            showAlert('File size too large. Please select an image smaller than 5MB.', 'danger');
            return;
        }

        // Upload file
        uploadImage(file);
    }

    async function uploadImage(file) {
        const formData = new FormData();
        formData.append('image', file);

        try {
            // Show loading state
            fileUploadArea.innerHTML = `
                <div class="text-center py-4">
                    <div class="spinner-border text-primary mb-3" role="status">
                        <span class="visually-hidden">Uploading...</span>
                    </div>
                    <p class="text-muted">Uploading image...</p>
                </div>
            `;

            const response = await fetch('/api/projects/upload', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Set the new image filename
                projectImageInput.value = data.data.filename;
                
                // Show preview
                const reader = new FileReader();
                reader.onload = (e) => {
                    previewImg.src = e.target.result;
                    imagePreview.style.display = 'block';
                };
                reader.readAsDataURL(file);

                // Hide upload area
                fileUploadArea.style.display = 'none';

                showAlert('Image uploaded successfully!', 'success');
            } else {
                throw new Error(data.message || 'Upload failed');
            }

        } catch (error) {
            console.error('Upload error:', error);
            showAlert(`Upload failed: ${error.message}`, 'danger');
            showUploadArea();
        }
    }

    function showUploadArea() {
        fileInput.value = '';
        imagePreview.style.display = 'none';
        fileUploadArea.style.display = 'block';
        
        // Reset upload area content
        fileUploadArea.innerHTML = `
            <i class="fas fa-cloud-upload-alt fa-3x text-muted mb-3"></i>
            <h5>Upload New Project Image</h5>
            <p class="text-muted mb-3">Drag and drop an image here, or click to select</p>
            <button type="button" class="btn btn-outline-primary" id="chooseFileBtn">
                <i class="fas fa-folder-open me-2"></i>Choose File
            </button>
            <div class="mt-2">
                <small class="text-muted">Supported formats: JPG, PNG, GIF, WebP (Max: 5MB)</small>
            </div>
        `;

        // Add click handler to the new button
        const chooseFileBtn = fileUploadArea.querySelector('#chooseFileBtn');
        if (chooseFileBtn) {
            chooseFileBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Choose file button clicked');
                fileInput.click();
            });
        }
    }
}

function setupFormValidation() {
    const descriptionTextarea = document.getElementById('projectDescription');
    const charCount = document.getElementById('descCharCount');

    // Character count for description
    descriptionTextarea.addEventListener('input', () => {
        const length = descriptionTextarea.value.length;
        charCount.textContent = length;
        
        if (length > 1000) {
            charCount.classList.add('text-danger');
        } else {
            charCount.classList.remove('text-danger');
        }
    });

    // URL validation
    const urlInputs = ['projectViewLink', 'projectCodeLink'];
    urlInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        input.addEventListener('blur', () => {
            if (input.value && !isValidUrl(input.value)) {
                input.classList.add('is-invalid');
            } else {
                input.classList.remove('is-invalid');
            }
        });
    });
}

function setupEventListeners() {
    // Form submission
    document.getElementById('editProjectForm').addEventListener('submit', handleFormSubmit);
    
    // Cancel button
    document.getElementById('cancelBtn').addEventListener('click', () => {
        if (confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
            window.location.href = '/dashboard/projects';
        }
    });
    
    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', (e) => {
        e.preventDefault();

        if (confirm('Are you sure you want to logout?')) {
            authManager.logout();
        }
    });
}

async function handleFormSubmit(e) {
    e.preventDefault();

    const form = e.target;
    const formData = new FormData(form);
    const submitBtn = document.getElementById('submitBtn');

    // Validate form
    if (!validateForm(formData)) {
        return;
    }

    // Prepare project data
    const projectData = {
        name: formData.get('name').trim(),
        desc: formData.get('desc').trim(),
        category: formData.get('category'),
        image: formData.get('image'),
        links: {
            view: formData.get('viewLink').trim(),
            code: formData.get('codeLink').trim()
        }
    };

    // Show loading state
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Updating Project...';
    submitBtn.disabled = true;

    try {
        const projectId = formData.get('id');
        const response = await fetch(`/api/projects/${projectId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(projectData)
        });

        const data = await response.json();

        if (response.ok && data.success) {
            showAlert('Project updated successfully!', 'success');

            // Redirect after short delay
            setTimeout(() => {
                window.location.href = '/dashboard/projects';
            }, 1500);
        } else {
            throw new Error(data.message || 'Failed to update project');
        }

    } catch (error) {
        console.error('Update project error:', error);
        showAlert(`Failed to update project: ${error.message}`, 'danger');

        // Reset button state
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

function validateForm(formData) {
    const errors = [];

    // Required fields
    const requiredFields = {
        'name': 'Project name',
        'desc': 'Description',
        'category': 'Category',
        'image': 'Project image',
        'viewLink': 'View link',
        'codeLink': 'Code link'
    };

    for (const [field, label] of Object.entries(requiredFields)) {
        const value = formData.get(field);
        if (!value || value.trim() === '') {
            errors.push(`${label} is required`);
        }
    }

    // Validate URLs
    const viewLink = formData.get('viewLink');
    const codeLink = formData.get('codeLink');

    if (viewLink && !isValidUrl(viewLink)) {
        errors.push('View link must be a valid URL');
    }

    if (codeLink && !isValidUrl(codeLink)) {
        errors.push('Code link must be a valid URL');
    }

    // Validate description length
    const description = formData.get('desc');
    if (description && description.length > 1000) {
        errors.push('Description must be less than 1000 characters');
    }

    // Show errors if any
    if (errors.length > 0) {
        showAlert(errors.join('<br>'), 'danger');
        return false;
    }

    return true;
}

function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

function showAlert(message, type = 'info') {
    const alertContainer = document.getElementById('alert-container');
    const alertId = 'alert-' + Date.now();

    const alertHtml = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert" id="${alertId}">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;

    alertContainer.innerHTML = alertHtml;

    // Auto-dismiss success alerts
    if (type === 'success') {
        setTimeout(() => {
            const alert = document.getElementById(alertId);
            if (alert) {
                const bsAlert = new bootstrap.Alert(alert);
                bsAlert.close();
            }
        }, 5000);
    }
}

function showErrorState() {
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('editFormContainer').style.display = 'none';
    document.getElementById('errorState').style.display = 'block';
}
