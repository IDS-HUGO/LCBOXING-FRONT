class PerfilManager {
    constructor() {
        this.userData = null;
        this.apiHelper = new APIHelper();
        this.notificationManager = new NotificationManager();
        this.init();
    }

    init() {
        // Check authentication
        const token = localStorage.getItem('authToken');
        const userDataStr = localStorage.getItem('userData');
        
        if (!token || !userDataStr) {
            window.location.replace('login.html');
            return;
        }
        
        try {
            this.userData = JSON.parse(userDataStr);
            this.setupEventListeners();
            this.loadUserData();
            this.startClock();
        } catch (e) {
            console.error('Error loading user data:', e);
            window.location.replace('login.html');
        }
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-item[data-section]').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.getAttribute('data-section');
                this.showSection(section);
            });
        });
        
        // Logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }
        
        // Mobile menu
        const menuToggle = document.getElementById('menuToggle');
        const sidebar = document.querySelector('.sidebar');
        if (menuToggle && sidebar) {
            menuToggle.addEventListener('click', () => {
                sidebar.classList.toggle('active');
            });
        }
        
        // Forms
        const perfilForm = document.getElementById('perfilForm');
        if (perfilForm) {
            perfilForm.addEventListener('submit', (e) => this.handlePerfilSubmit(e));
        }
        
        const passwordForm = document.getElementById('passwordForm');
        if (passwordForm) {
            passwordForm.addEventListener('submit', (e) => this.handlePasswordSubmit(e));
        }
        
        const notificacionesForm = document.getElementById('notificacionesForm');
        if (notificacionesForm) {
            notificacionesForm.addEventListener('submit', (e) => this.handleNotificacionesSubmit(e));
        }
    }

    loadUserData() {
        // Update sidebar
        const userName = document.getElementById('userName');
        const userRole = document.getElementById('userRole');
        
        if (userName) {
            userName.textContent = this.userData.nombreCompleto || 
                `${this.userData.nombre} ${this.userData.apellidoPaterno}`;
        }
        
        if (userRole) {
            userRole.textContent = this.userData.rol || 'Usuario';
        }
        
        // Fill form
        const nombre = document.getElementById('nombre');
        const apellidoPaterno = document.getElementById('apellidoPaterno');
        const apellidoMaterno = document.getElementById('apellidoMaterno');
        const email = document.getElementById('email');
        const telefono = document.getElementById('telefono');
        const rol = document.getElementById('rol');
        
        if (nombre) nombre.value = this.userData.nombre || '';
        if (apellidoPaterno) apellidoPaterno.value = this.userData.apellidoPaterno || '';
        if (apellidoMaterno) apellidoMaterno.value = this.userData.apellidoMaterno || '';
        if (email) email.value = this.userData.email || '';
        if (telefono) telefono.value = this.userData.telefono || '';
        if (rol) rol.value = this.userData.rol || '';
        
        // Load notification preferences
        this.loadNotificationPreferences();
    }

    loadNotificationPreferences() {
        const preferencesStr = localStorage.getItem('notificationPreferences');
        if (preferencesStr) {
            try {
                const preferences = JSON.parse(preferencesStr);
                document.getElementById('notifEmail').checked = preferences.email !== false;
                document.getElementById('notifMembresias').checked = preferences.membresias !== false;
                document.getElementById('notifPagos').checked = preferences.pagos !== false;
                document.getElementById('notifAsistencias').checked = preferences.asistencias || false;
            } catch (e) {
                console.error('Error loading preferences:', e);
            }
        }
    }

    showSection(sectionId) {
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Show selected section
        const targetSection = document.getElementById(sectionId + '-section');
        if (targetSection) {
            targetSection.classList.add('active');
        }
        
        // Update navigation
        document.querySelectorAll('.nav-item[data-section]').forEach(item => {
            item.classList.remove('active');
        });
        
        const activeNav = document.querySelector(`[data-section="${sectionId}"]`);
        if (activeNav) {
            activeNav.classList.add('active');
        }
    }

    async handlePerfilSubmit(e) {
        e.preventDefault();
        
        const data = {
            nombre: document.getElementById('nombre').value.trim(),
            apellidoPaterno: document.getElementById('apellidoPaterno').value.trim(),
            apellidoMaterno: document.getElementById('apellidoMaterno').value.trim(),
            email: document.getElementById('email').value.trim(),
            telefono: document.getElementById('telefono').value.trim(),
            idRol: this.userData.idRol,
            fechaNacimiento: this.userData.fechaNacimiento,
            activo: true
        };
        
        try {
            const userId = this.userData.id || this.userData.idUsuario;
            await this.apiHelper.updateUser(userId, data);
            
            // Update userData
            Object.assign(this.userData, data);
            this.userData.nombreCompleto = `${data.nombre} ${data.apellidoPaterno} ${data.apellidoMaterno}`;
            localStorage.setItem('userData', JSON.stringify(this.userData));
            
            this.notificationManager.success('Perfil actualizado correctamente');
            this.loadUserData();
        } catch (error) {
            console.error('Error updating profile:', error);
            this.notificationManager.error('Error al actualizar perfil: ' + error.message);
        }
    }

    async handlePasswordSubmit(e) {
        e.preventDefault();
        
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        if (newPassword !== confirmPassword) {
            this.notificationManager.error('Las contraseñas no coinciden');
            return;
        }
        
        if (newPassword.length < 8) {
            this.notificationManager.error('La contraseña debe tener al menos 8 caracteres');
            return;
        }
        
        try {
            // Note: You'll need to implement a change password endpoint in your API
            // await this.apiHelper.changePassword({ currentPassword, newPassword });
            
            this.notificationManager.success('Contraseña actualizada correctamente');
            document.getElementById('passwordForm').reset();
        } catch (error) {
            console.error('Error updating password:', error);
            this.notificationManager.error('Error al actualizar contraseña: ' + error.message);
        }
    }

    handleNotificacionesSubmit(e) {
        e.preventDefault();
        
        const preferences = {
            email: document.getElementById('notifEmail').checked,
            membresias: document.getElementById('notifMembresias').checked,
            pagos: document.getElementById('notifPagos').checked,
            asistencias: document.getElementById('notifAsistencias').checked
        };
        
        // Save to localStorage
        localStorage.setItem('notificationPreferences', JSON.stringify(preferences));
        
        this.notificationManager.success('Preferencias guardadas correctamente');
    }

    startClock() {
        const updateClock = () => {
            const now = new Date();
            const timeString = now.toLocaleTimeString('es-MX', { 
                hour: '2-digit', 
                minute: '2-digit'
            });
            const clockElement = document.getElementById('clock');
            if (clockElement) {
                clockElement.textContent = timeString;
            }
        };
        
        updateClock();
        setInterval(updateClock, 1000);
    }

    logout() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        window.location.replace('login.html');
    }
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    new PerfilManager();
});
