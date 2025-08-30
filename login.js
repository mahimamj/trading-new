// Login Page JavaScript

// Tab switching functionality
const tabBtns = document.querySelectorAll('.tab-btn');
const authForms = document.querySelectorAll('.auth-form');

tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');
        
        // Update active tab button
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Update active form
        authForms.forEach(form => {
            form.classList.remove('active');
            if (form.id === `${targetTab}Form`) {
                form.classList.add('active');
            }
        });
    });
});

// Password visibility toggle
const togglePasswordBtns = document.querySelectorAll('.toggle-password');

togglePasswordBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const input = btn.parentElement.querySelector('input');
        const icon = btn.querySelector('i');
        
        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            input.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    });
});

// Form validation and submission
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');

// Login form handling
if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = this.querySelector('#loginEmail').value;
        const password = this.querySelector('#loginPassword').value;
        const remember = this.querySelector('input[name="remember"]').checked;
        
        // Validation
        if (!email || !password) {
            showNotification('Please fill in all fields.', 'error');
            return;
        }
        
        if (!isValidEmail(email)) {
            showNotification('Please enter a valid email address.', 'error');
            return;
        }
        
        // Simulate login process
        const submitBtn = this.querySelector('button[type="submit"]');
        submitBtn.classList.add('loading');
        submitBtn.textContent = 'Signing In...';
        
        setTimeout(() => {
            submitBtn.classList.remove('loading');
            submitBtn.textContent = 'Sign In';
            
            // Simulate successful login
            showNotification('Login successful! Redirecting to dashboard...', 'success');
            
            // Redirect to dashboard (demo)
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
        }, 2000);
    });
}

// Signup form handling
if (signupForm) {
    signupForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const name = this.querySelector('#signupName').value;
        const email = this.querySelector('#signupEmail').value;
        const phone = this.querySelector('#signupPhone').value;
        const password = this.querySelector('#signupPassword').value;
        const confirmPassword = this.querySelector('#signupConfirmPassword').value;
        const terms = this.querySelector('input[name="terms"]').checked;
        
        // Validation
        if (!name || !email || !phone || !password || !confirmPassword) {
            showNotification('Please fill in all fields.', 'error');
            return;
        }
        
        if (!isValidEmail(email)) {
            showNotification('Please enter a valid email address.', 'error');
            return;
        }
        
        if (password.length < 8) {
            showNotification('Password must be at least 8 characters long.', 'error');
            return;
        }
        
        if (password !== confirmPassword) {
            showNotification('Passwords do not match.', 'error');
            return;
        }
        
        if (!terms) {
            showNotification('Please accept the terms and conditions.', 'error');
            return;
        }
        
        // Simulate signup process
        const submitBtn = this.querySelector('button[type="submit"]');
        submitBtn.classList.add('loading');
        submitBtn.textContent = 'Creating Account...';
        
        setTimeout(() => {
            submitBtn.classList.remove('loading');
            submitBtn.textContent = 'Create Account';
            
            // Simulate successful signup
            showNotification('Account created successfully! Please check your email for verification.', 'success');
            
            // Reset form
            this.reset();
            
            // Switch to login tab
            document.querySelector('[data-tab="login"]').click();
        }, 2000);
    });
}

// Real-time password validation
const signupPassword = document.getElementById('signupPassword');
const signupConfirmPassword = document.getElementById('signupConfirmPassword');

if (signupPassword) {
    signupPassword.addEventListener('input', function() {
        validatePassword(this.value);
        validatePasswordMatch();
    });
}

if (signupConfirmPassword) {
    signupConfirmPassword.addEventListener('input', validatePasswordMatch);
}

function validatePassword(password) {
    const inputGroup = signupPassword.parentElement;
    const existingIndicator = inputGroup.parentElement.querySelector('.password-strength');
    
    if (existingIndicator) {
        existingIndicator.remove();
    }
    
    if (password.length === 0) return;
    
    const strengthIndicator = document.createElement('div');
    strengthIndicator.className = 'password-strength';
    
    const strengthBar = document.createElement('div');
    strengthBar.className = 'password-strength-bar';
    
    let strength = 0;
    let strengthClass = 'weak';
    
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    
    if (strength >= 4) {
        strengthClass = 'strong';
        strengthBar.style.width = '100%';
    } else if (strength >= 2) {
        strengthClass = 'medium';
        strengthBar.style.width = '66%';
    } else {
        strengthClass = 'weak';
        strengthBar.style.width = '33%';
    }
    
    strengthBar.classList.add(strengthClass);
    strengthIndicator.appendChild(strengthBar);
    
    inputGroup.parentElement.appendChild(strengthIndicator);
}

function validatePasswordMatch() {
    const password = signupPassword.value;
    const confirmPassword = signupConfirmPassword.value;
    const confirmInputGroup = signupConfirmPassword.parentElement;
    
    // Remove existing error/success states
    confirmInputGroup.classList.remove('error', 'success');
    const existingMessage = confirmInputGroup.parentElement.querySelector('.error-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    if (confirmPassword.length === 0) return;
    
    if (password !== confirmPassword) {
        confirmInputGroup.classList.add('error');
        
        const errorMessage = document.createElement('div');
        errorMessage.className = 'error-message';
        errorMessage.innerHTML = '<i class="fas fa-exclamation-circle"></i> Passwords do not match';
        confirmInputGroup.parentElement.appendChild(errorMessage);
    } else {
        confirmInputGroup.classList.add('success');
    }
}

// Social login buttons
const socialBtns = document.querySelectorAll('.social-btn');

socialBtns.forEach(btn => {
    btn.addEventListener('click', function(e) {
        e.preventDefault();
        
        const platform = this.classList.contains('google') ? 'Google' : 'Facebook';
        showNotification(`Redirecting to ${platform} login...`, 'info');
        
        // Simulate social login redirect
        setTimeout(() => {
            showNotification(`${platform} login is not implemented in this demo.`, 'error');
        }, 2000);
    });
});

// Email validation function
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Notification system (reuse from main script)
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close">&times;</button>
        </div>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#00ff88' : type === 'error' ? '#ff6b35' : '#00d4ff'};
        color: #0a0e1a;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        z-index: 10000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 400px;
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 5000);
    
    // Close button functionality
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    });
}

// Add some interactive effects
document.addEventListener('DOMContentLoaded', () => {
    // Add focus effects to input fields
    const inputs = document.querySelectorAll('.input-group input');
    
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.style.transform = 'scale(1.02)';
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.style.transform = 'scale(1)';
        });
    });
    
    // Add hover effects to social buttons
    socialBtns.forEach(btn => {
        btn.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-3px) scale(1.05)';
        });
        
        btn.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
    
    // Add ripple effect to buttons
    const buttons = document.querySelectorAll('.btn, .social-btn');
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                left: ${x}px;
                top: ${y}px;
                background: rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                transform: scale(0);
                animation: ripple 0.6s linear;
                pointer-events: none;
            `;
            
            this.style.position = 'relative';
            this.style.overflow = 'hidden';
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
});

// Add CSS for ripple animation if not already present
if (!document.querySelector('#ripple-style')) {
    const style = document.createElement('style');
    style.id = 'ripple-style';
    style.textContent = `
        @keyframes ripple {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}

// Form field animations
const formGroups = document.querySelectorAll('.form-group');

formGroups.forEach((group, index) => {
    group.style.opacity = '0';
    group.style.transform = 'translateY(20px)';
    group.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    
    setTimeout(() => {
        group.style.opacity = '1';
        group.style.transform = 'translateY(0)';
    }, 100 + index * 100);
});

// Add some visual feedback for form interactions
document.addEventListener('DOMContentLoaded', () => {
    // Highlight active form field
    const inputs = document.querySelectorAll('.input-group input');
    
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.style.borderColor = 'var(--primary-color)';
            this.parentElement.style.boxShadow = '0 0 0 3px rgba(0, 212, 255, 0.1)';
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.style.borderColor = 'var(--border-color)';
            this.parentElement.style.boxShadow = 'none';
        });
    });
});
