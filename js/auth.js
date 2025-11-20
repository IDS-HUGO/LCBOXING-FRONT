const API_BASE_URL = 'https://34.233.25.135:7000';

function showError(message, elementId = 'errorMessage') {
    const errorDiv = document.getElementById(elementId);
    const errorText = document.getElementById('errorText');
    if (errorDiv && errorText) {
        errorText.textContent = message;
        errorDiv.style.display = 'flex';
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
    }
}

function showLoading(show = true) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.display = show ? 'flex' : 'none';
    }
}

function saveToken(token) {
    localStorage.setItem('authToken', token);
}

function getToken() {
    return localStorage.getItem('authToken');
}

function removeToken() {
    localStorage.removeItem('authToken');
}

function saveUserData(userData) {
    localStorage.setItem('userData', JSON.stringify(userData));
}

function getUserData() {
    const data = localStorage.getItem('userData');
    return data ? JSON.parse(data) : null;
}

function redirectToDashboard(role) {
    // Redirigir según el rol del usuario
    console.log('Redirecting to dashboard for role:', role);
    
    let dashboardUrl = 'dashboard-staff.html'; // default
    
    if (role === 'GERENTE' || role === 'Gerente' || role === 'gerente' || role === 1) {
        dashboardUrl = 'dashboard-gerente.html';
    } else if (role === 'Staff' || role === 'STAFF' || role === 'staff' || role === 2) {
        dashboardUrl = 'dashboard-staff.html';
    }
    
    console.log('Redirecting to:', dashboardUrl);
    window.location.replace(dashboardUrl);
}


if (document.getElementById('loginForm')) {
    const loginForm = document.getElementById('loginForm');
    
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        
        // Validaciones básicas
        if (!email || !password) {
            showError('Por favor, completa todos los campos');
            return;
        }
        
        if (!isValidEmail(email)) {
            showError('Por favor, ingresa un correo válido');
            return;
        }
        
        showLoading(true);
        
        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Error al iniciar sesión');
            }
            
            // Guardar token y datos del usuario
            console.log('Login response:', data);
            saveToken(data.token);
            saveUserData(data.usuario);
            
            // Verificar que se guardó correctamente
            console.log('Token saved:', localStorage.getItem('authToken') ? 'Yes' : 'No');
            console.log('UserData saved:', localStorage.getItem('userData') ? 'Yes' : 'No');
            
            // Mostrar mensaje de éxito
            console.log('Login exitoso:', data.usuario);
            
            // Redirigir según el rol inmediatamente
            redirectToDashboard(data.usuario.rol);
            
        } catch (error) {
            console.error('Error:', error);
            showError(error.message || 'Error al conectar con el servidor');
        } finally {
            showLoading(false);
        }
    });
}

// ==========================================
// REGISTER FUNCTIONALITY
// ==========================================

if (document.getElementById('registerForm')) {
    const registerForm = document.getElementById('registerForm');
    
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Obtener valores del formulario
        const formData = {
            idRol: parseInt(document.getElementById('idRol').value),
            nombre: document.getElementById('nombre').value.trim(),
            apellidoPaterno: document.getElementById('apellidoPaterno').value.trim(),
            apellidoMaterno: document.getElementById('apellidoMaterno').value.trim(),
            email: document.getElementById('email').value.trim(),
            telefono: document.getElementById('telefono').value.trim(),
            fechaNacimiento: document.getElementById('fechaNacimiento').value,
            password: document.getElementById('password').value
        };
        
        const confirmPassword = document.getElementById('confirmPassword').value;
        const termsAccepted = document.querySelector('input[name="terms"]').checked;
        
        // Validaciones
        if (!formData.idRol) {
            showError('Por favor, selecciona un tipo de usuario');
            return;
        }
        
        if (!formData.nombre || !formData.apellidoPaterno || !formData.apellidoMaterno) {
            showError('Por favor, completa tu nombre completo');
            return;
        }
        
        if (!isValidEmail(formData.email)) {
            showError('Por favor, ingresa un correo válido');
            return;
        }
        
        if (!isValidPhone(formData.telefono)) {
            showError('Por favor, ingresa un teléfono válido (10 dígitos)');
            return;
        }
        
        if (!formData.fechaNacimiento) {
            showError('Por favor, ingresa tu fecha de nacimiento');
            return;
        }
        
        if (formData.password.length < 8) {
            showError('La contraseña debe tener al menos 8 caracteres');
            return;
        }
        
        if (formData.password !== confirmPassword) {
            showError('Las contraseñas no coinciden');
            return;
        }
        
        if (!termsAccepted) {
            showError('Debes aceptar los términos y condiciones');
            return;
        }
        
        showLoading(true);
        
        try {
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Error al registrar usuario');
            }
            
            // Guardar token y datos del usuario
            saveToken(data.token);
            saveUserData(data.usuario);
            
            // Mostrar mensaje de éxito
            console.log('Registro exitoso:', data.usuario);
            
            // Redirigir según el rol
            setTimeout(() => {
                redirectToDashboard(data.usuario.rol);
            }, 500);
            
        } catch (error) {
            console.error('Error:', error);
            showError(error.message || 'Error al conectar con el servidor');
        } finally {
            showLoading(false);
        }
    });
}

// ==========================================
// VALIDATION HELPERS
// ==========================================

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidPhone(phone) {
    const phoneRegex = /^[0-9]{10}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
}

// ==========================================
// AUTH CHECK FOR PROTECTED PAGES
// ==========================================

function checkAuth() {
    const token = getToken();
    const currentPage = window.location.pathname.split('/').pop();
    
    // Si está en una página de dashboard y no hay token, redirigir a login
    if ((currentPage.includes('dashboard')) && !token) {
        window.location.href = 'login.html';
        return false;
    }
    
    return true;
}

// ==========================================
// LOGOUT FUNCTIONALITY
// ==========================================

function logout() {
    removeToken();
    localStorage.removeItem('userData');
    window.location.href = 'login.html';
}

// Verificar autenticación al cargar páginas protegidas
if (window.location.pathname.includes('dashboard')) {
    checkAuth();
}

// ==========================================
// EXPORT FOR USE IN OTHER FILES
// ==========================================

window.authAPI = {
    getToken,
    getUserData,
    logout,
    checkAuth,
    redirectToDashboard,
    API_BASE_URL
};
