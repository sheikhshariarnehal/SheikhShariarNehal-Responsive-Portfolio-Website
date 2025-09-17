// Add project functionality
document.addEventListener('DOMContentLoaded', () => {
    // Initialize add project page
    initializeAddProjectPage();
    
    // Set up event listeners
    setupEventListeners();
});

function initializeAddProjectPage() {
    // Load user info
    loadUserInfo();
    
    // Set up file upload
    setupFileUpload();
    
    // Set up form validation
    setupFormValidation();
}

function loadUserInfo() {
    const user = authManager.getCurrentUser();
    if (user) {
        document.getElementById('username').textContent = user.username;
    }
}

function setupFileUpload() {
    const fileUploadArea = document.getElementById('fileUploadArea');
    const fileInput = document.getElementById('imageFile');
    const imagePreview = document.getElementById('imagePreview');
    const previewImg = document.getElementById('previewImg');
    const projectImageInput = document.getElementById('projectImage');
    const removeImageBtn = document.getElementById('removeImage');

    console.log('Setting up file upload...');
    console.log('Elements found:', {
        fileUploadArea: !!fileUploadArea,
        fileInput: !!fileInput,
        imagePreview: !!imagePreview,
        previewImg: !!previewImg,
        projectImageInput: !!projectImageInput
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

    // Also add click handler to the choose file button specifically
    const chooseFileBtn = fileUploadArea.querySelector('button');
    if (chooseFileBtn) {
        chooseFileBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Choose file button clicked');
            fileInput.click();
        });
    }

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
        console.log('File input changed, files:', e.target.files);
        if (e.target.files.length > 0) {
            console.log('Selected file:', e.target.files[0]);
            handleFileSelection(e.target.files[0]);
        }
    });

    // Remove image button
    removeImageBtn.addEventListener('click', () => {
        resetFileUpload();
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

            console.log('Uploading file:', file.name, 'Size:', file.size, 'Type:', file.type);

            const response = await fetch('/api/projects/upload', {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            });

            console.log('Upload response status:', response.status);

            const data = await response.json();
            console.log('Upload response data:', data);

            if (response.ok && data.success) {
                // Set the image filename
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
                throw new Error(data.message || data.error || 'Upload failed');
            }

        } catch (error) {
            console.error('Upload error:', error);
            showAlert(`Upload failed: ${error.message}`, 'danger');
            resetFileUpload();
        }
    }

    function resetFileUpload() {
        fileInput.value = '';
        projectImageInput.value = '';
        imagePreview.style.display = 'none';
        fileUploadArea.style.display = 'block';
        
        // Reset upload area content
        fileUploadArea.innerHTML = `
            <i class="fas fa-cloud-upload-alt fa-3x text-muted mb-3"></i>
            <h5>Upload Project Image</h5>
            <p class="text-muted mb-3">Drag and drop an image here, or click to select</p>
            <button type="button" class="btn btn-outline-primary" onclick="document.getElementById('imageFile').click()">
                <i class="fas fa-folder-open me-2"></i>Choose File
            </button>
            <div class="mt-2">
                <small class="text-muted">Supported formats: JPG, PNG, GIF, WebP (Max: 5MB)</small>
            </div>
        `;
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
    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', (e) => {
        e.preventDefault();
        
        if (confirm('Are you sure you want to logout?')) {
            authManager.logout();
        }
    });

    // Form submission
    document.getElementById('addProjectForm').addEventListener('submit', handleFormSubmit);

    // Reset button
    document.getElementById('resetBtn').addEventListener('click', () => {
        if (confirm('Are you sure you want to reset the form? All entered data will be lost.')) {
            resetForm();
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
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Creating Project...';
    submitBtn.disabled = true;
    
    try {
        const response = await apiRequest('/api/projects', {
            method: 'POST',
            body: JSON.stringify(projectData)
        });
        
        if (response && response.success) {
            showAlert('Project created successfully!', 'success');
            
            // Redirect after short delay
            setTimeout(() => {
                window.location.href = '/dashboard/projects';
            }, 1500);
        } else {
            throw new Error('Failed to create project');
        }
        
    } catch (error) {
        console.error('Create project error:', error);
        showAlert(`Failed to create project: ${error.message}`, 'danger');
        
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
    
    if (errors.length > 0) {
        showAlert(`Please fix the following errors:<br>• ${errors.join('<br>• ')}`, 'danger');
        return false;
    }
    
    return true;
}

function resetForm() {
    document.getElementById('addProjectForm').reset();
    document.getElementById('descCharCount').textContent = '0';
    
    // Reset file upload
    const removeBtn = document.getElementById('removeImage');
    if (removeBtn) {
        removeBtn.click();
    }
    
    // Clear validation states
    document.querySelectorAll('.is-invalid').forEach(el => {
        el.classList.remove('is-invalid');
    });
    
    showAlert('Form has been reset', 'info');
}

function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}
