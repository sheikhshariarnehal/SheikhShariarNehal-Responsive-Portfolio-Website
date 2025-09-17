// Login page functionality
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const loginBtn = document.getElementById('loginBtn');
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');

    // Toggle password visibility
    togglePassword.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        
        const icon = togglePassword.querySelector('i');
        icon.classList.toggle('fa-eye');
        icon.classList.toggle('fa-eye-slash');
    });

    // Handle login form submission
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(loginForm);
        const username = formData.get('username').trim();
        const password = formData.get('password');

        // Basic validation
        if (!username || !password) {
            showAlert('Please fill in all fields', 'danger');
            return;
        }

        // Show loading state
        const originalText = loginBtn.innerHTML;
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Signing In...';
        showLoading(loginBtn);

        try {
            const result = await authManager.login(username, password);
            
            if (result.success) {
                showAlert('Login successful! Redirecting...', 'success');
                
                // Redirect after short delay
                setTimeout(() => {
                    window.location.href = '/dashboard/admin';
                }, 1000);
            } else {
                showAlert(result.error, 'danger');
            }
        } catch (error) {
            console.error('Login error:', error);
            showAlert('An unexpected error occurred. Please try again.', 'danger');
        } finally {
            // Reset button state
            loginBtn.innerHTML = originalText;
            showLoading(loginBtn, false);
        }
    });

    // Add enter key support for form fields
    document.querySelectorAll('#loginForm input').forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                loginForm.dispatchEvent(new Event('submit'));
            }
        });
    });

    // Add focus effects
    document.querySelectorAll('.form-control').forEach(input => {
        input.addEventListener('focus', () => {
            input.parentElement.classList.add('focused');
        });
        
        input.addEventListener('blur', () => {
            input.parentElement.classList.remove('focused');
        });
    });
});
