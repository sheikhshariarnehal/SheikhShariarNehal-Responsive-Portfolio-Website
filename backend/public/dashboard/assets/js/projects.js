// Projects management functionality
let allProjects = [];
let filteredProjects = [];
let currentPage = 1;
const projectsPerPage = 12;

document.addEventListener('DOMContentLoaded', async () => {
    // Initialize projects page
    await initializeProjectsPage();
    
    // Set up event listeners
    setupEventListeners();
});

async function initializeProjectsPage() {
    try {
        // Load user info
        loadUserInfo();
        
        // Load all projects
        await loadAllProjects();
        
        // Display projects
        displayProjects();
        
    } catch (error) {
        console.error('Projects page initialization error:', error);
        showAlert('Failed to load projects', 'danger');
    }
}

function loadUserInfo() {
    const user = authManager.getCurrentUser();
    if (user) {
        document.getElementById('username').textContent = user.username;
    }
}

async function loadAllProjects() {
    try {
        const response = await apiRequest('/api/projects');
        
        if (response && response.success) {
            allProjects = response.data;
            filteredProjects = [...allProjects];
        } else {
            throw new Error('Failed to load projects');
        }
        
    } catch (error) {
        console.error('Error loading projects:', error);
        allProjects = [];
        filteredProjects = [];
        throw error;
    }
}

function displayProjects() {
    const container = document.getElementById('projectsContainer');
    
    if (filteredProjects.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="fas fa-folder-open fa-4x text-muted mb-3"></i>
                <h4 class="text-muted">No projects found</h4>
                <p class="text-muted">Try adjusting your search criteria or add a new project.</p>
                <a href="/dashboard/add-project" class="btn btn-primary">
                    <i class="fas fa-plus me-2"></i>Add New Project
                </a>
            </div>
        `;
        updatePagination(0);
        return;
    }
    
    // Calculate pagination
    const startIndex = (currentPage - 1) * projectsPerPage;
    const endIndex = startIndex + projectsPerPage;
    const projectsToShow = filteredProjects.slice(startIndex, endIndex);
    
    // Generate project cards
    const projectsHTML = projectsToShow.map(project => `
        <div class="col-lg-4 col-md-6 mb-4">
            <div class="card project-card h-100">
                <div class="project-image-container mb-3">
                    <img src="${getProjectImageUrl(project.image)}"
                         alt="${escapeHtml(project.name)}"
                         class="project-image"
                         onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZSBOb3QgRm91bmQ8L3RleHQ+PC9zdmc+'">
                </div>
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-3">
                        <h5 class="card-title mb-0">${escapeHtml(project.name)}</h5>
                        ${getCategoryBadge(project.category)}
                    </div>

                    <p class="card-text text-muted small mb-3">${truncateText(project.desc, 120)}</p>
                    
                    <div class="mb-3">
                        <div class="row g-2">
                            <div class="col-6">
                                <a href="${project.links.view}" target="_blank" class="btn btn-sm btn-outline-primary w-100" title="View Project">
                                    <i class="fas fa-external-link-alt me-1"></i>View
                                </a>
                            </div>
                            <div class="col-6">
                                <a href="${project.links.code}" target="_blank" class="btn btn-sm btn-outline-secondary w-100" title="View Code">
                                    <i class="fas fa-code me-1"></i>Code
                                </a>
                            </div>
                        </div>
                    </div>
                    
                    <div class="d-flex gap-2">
                        <a href="/dashboard/edit-project/${project.id}" class="btn btn-primary btn-sm flex-fill">
                            <i class="fas fa-edit me-1"></i>Edit
                        </a>
                        <button class="btn btn-danger btn-sm flex-fill" onclick="showDeleteModal('${project.id}', '${escapeHtml(project.name)}')">
                            <i class="fas fa-trash me-1"></i>Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = projectsHTML;
    updatePagination(filteredProjects.length);
}

function updatePagination(totalProjects) {
    const pagination = document.getElementById('pagination');
    const totalPages = Math.ceil(totalProjects / projectsPerPage);
    
    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }
    
    let paginationHTML = '';
    
    // Previous button
    paginationHTML += `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPage - 1})">
                <i class="fas fa-chevron-left"></i>
            </a>
        </li>
    `;
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            paginationHTML += `
                <li class="page-item ${i === currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="changePage(${i})">${i}</a>
                </li>
            `;
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            paginationHTML += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        }
    }
    
    // Next button
    paginationHTML += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPage + 1})">
                <i class="fas fa-chevron-right"></i>
            </a>
        </li>
    `;
    
    pagination.innerHTML = paginationHTML;
}

function changePage(page) {
    const totalPages = Math.ceil(filteredProjects.length / projectsPerPage);
    
    if (page < 1 || page > totalPages) return;
    
    currentPage = page;
    displayProjects();
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function applyFilters() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    const categoryFilter = document.getElementById('categoryFilter').value;
    const sortBy = document.getElementById('sortBy').value;
    
    // Filter projects
    filteredProjects = allProjects.filter(project => {
        const matchesSearch = !searchTerm || 
            project.name.toLowerCase().includes(searchTerm) ||
            project.desc.toLowerCase().includes(searchTerm);
        
        const matchesCategory = !categoryFilter || project.category === categoryFilter;
        
        return matchesSearch && matchesCategory;
    });
    
    // Sort projects
    filteredProjects.sort((a, b) => {
        switch (sortBy) {
            case 'name':
                return a.name.localeCompare(b.name);
            case 'name-desc':
                return b.name.localeCompare(a.name);
            case 'category':
                return a.category.localeCompare(b.category) || a.name.localeCompare(b.name);
            default:
                return 0;
        }
    });
    
    // Reset to first page
    currentPage = 1;
    
    // Display filtered results
    displayProjects();
}

function clearFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('categoryFilter').value = '';
    document.getElementById('sortBy').value = 'name';
    
    filteredProjects = [...allProjects];
    currentPage = 1;
    displayProjects();
}

function setupEventListeners() {
    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', (e) => {
        e.preventDefault();
        
        if (confirm('Are you sure you want to logout?')) {
            authManager.logout();
        }
    });
    
    // Search and filter inputs
    document.getElementById('searchInput').addEventListener('input', debounce(applyFilters, 300));
    document.getElementById('categoryFilter').addEventListener('change', applyFilters);
    document.getElementById('sortBy').addEventListener('change', applyFilters);
    document.getElementById('clearFilters').addEventListener('click', clearFilters);
    
    // Delete modal
    document.getElementById('confirmDeleteBtn').addEventListener('click', confirmDelete);
}

// Delete modal functions
let projectToDelete = null;

function showDeleteModal(projectId, projectName) {
    projectToDelete = projectId;
    document.getElementById('deleteProjectName').textContent = projectName;
    
    const modal = new bootstrap.Modal(document.getElementById('deleteModal'));
    modal.show();
}

async function confirmDelete() {
    if (!projectToDelete) return;
    
    const confirmBtn = document.getElementById('confirmDeleteBtn');
    const originalText = confirmBtn.innerHTML;
    
    try {
        confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Deleting...';
        confirmBtn.disabled = true;
        
        const response = await apiRequest(`/api/projects/${projectToDelete}`, {
            method: 'DELETE'
        });
        
        if (response && response.success) {
            showAlert('Project deleted successfully!', 'success');
            
            // Remove from local arrays
            allProjects = allProjects.filter(p => p.id !== projectToDelete);
            filteredProjects = filteredProjects.filter(p => p.id !== projectToDelete);
            
            // Refresh display
            displayProjects();
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('deleteModal'));
            modal.hide();
        } else {
            throw new Error('Delete failed');
        }
        
    } catch (error) {
        console.error('Delete error:', error);
        showAlert('Failed to delete project', 'danger');
    } finally {
        confirmBtn.innerHTML = originalText;
        confirmBtn.disabled = false;
        projectToDelete = null;
    }
}

// Utility functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
}

function getProjectImageUrl(imageName) {
    if (!imageName) {
        return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';
    }

    // Primary path - use the assets/images/projects directory
    return `/images/projects/${imageName}.png`;
}
