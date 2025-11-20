document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    initDashboard();
    startClock();
});

// Verificar autenticación
function checkAuth() {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');
    
    if (!token || !userData) {
        window.location.href = 'login.html';
        return;
    }
    
    try {
        const user = JSON.parse(userData);
        document.getElementById('userName').textContent = user.nombreCompleto || `${user.nombre} ${user.apellidoPaterno}`;
        document.getElementById('userRole').textContent = user.idRol === 1 ? 'Gerente' : 'Staff';
    } catch (e) {
        console.error('Error al parsear datos de usuario:', e);
        window.location.href = 'login.html';
    }
}

// Inicializar dashboard
function initDashboard() {
    setupNavigation();
    setupLogout();
    loadDashboardStats();
    showSection('dashboard');
}

// Navegación
function setupNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('data-section');
            showSection(section);
        });
    });
    
    const menuToggle = document.getElementById('menuToggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', function() {
            document.querySelector('.sidebar').classList.toggle('active');
        });
    }
}

// Mostrar sección
function showSection(sectionId) {
    // Actualizar título
    const titles = {
        'dashboard': 'Dashboard',
        'atletas': 'Atletas',
        'membresias': 'Membresías',
        'pagos': 'Pagos',
        'asistencias': 'Asistencias',
        'usuarios': 'Usuarios',
        'reportes': 'Reportes'
    };
    
    document.getElementById('headerTitle').textContent = titles[sectionId] || 'Dashboard';
    
    // Ocultar todas las secciones
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Mostrar sección seleccionada
    const targetSection = document.getElementById(`section-${sectionId}`);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Actualizar navegación activa
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    const activeNav = document.querySelector(`[data-section="${sectionId}"]`);
    if (activeNav) {
        activeNav.classList.add('active');
    }
    
    // Cargar datos de la sección
    switch(sectionId) {
        case 'dashboard':
            loadDashboardStats();
            loadAlerts();
            loadAtletasEnBox();
            loadVencimientos();
            break;
        case 'atletas':
            loadAtletas();
            break;
        case 'membresias':
            loadMembresias();
            break;
        case 'pagos':
            loadPagos();
            break;
        case 'asistencias':
            // Inicializar campo de fecha con fecha actual
            const filterFechaAsistencia = document.getElementById('filterFechaAsistencia');
            if (filterFechaAsistencia && !filterFechaAsistencia.value) {
                filterFechaAsistencia.value = new Date().toISOString().split('T')[0];
            }
            loadAsistencias();
            break;
        case 'usuarios':
            loadUsuarios();
            break;
    }
}

// Cerrar sesión
function setupLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            localStorage.removeItem('authToken');
            localStorage.removeItem('userData');
            window.location.href = 'login.html';
        });
    }
}

// Reloj
function startClock() {
    function updateClock() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const clockElement = document.getElementById('clock');
        if (clockElement) {
            clockElement.textContent = `${hours}:${minutes}`;
        }
    }
    
    updateClock();
    setInterval(updateClock, 60000);
}

// ===================================
// ESTADÍSTICAS DEL DASHBOARD
// ===================================
async function loadDashboardStats() {
    try {
        // Atletas activos
        const atletas = await api.getActiveAthletes();
        const statAtletasActivos = document.getElementById('statAtletasActivos');
        if (statAtletasActivos) statAtletasActivos.textContent = atletas.length;
        
        // Membresías vigentes
        const membresias = await api.getMemberships();
        const vigentes = membresias.filter(m => m.idEstadoMembresia === 1 || m.nombreEstado === 'Activa');
        const statMembresiasVigentes = document.getElementById('statMembresiasVigentes');
        if (statMembresiasVigentes) statMembresiasVigentes.textContent = vigentes.length;
        
        // Asistencias hoy
        const today = new Date().toISOString().split('T')[0];
        const asistencias = await api.getAttendanceByDate(today);
        const statAsistenciasHoy = document.getElementById('statAsistenciasHoy');
        if (statAsistenciasHoy) statAsistenciasHoy.textContent = asistencias.length;
        
        // Ingresos hoy
        const pagos = await api.getPayments();
        const pagosHoy = pagos.filter(p => p.fechaPago === today);
        const ingresos = pagosHoy.reduce((sum, p) => sum + parseFloat(p.monto), 0);
        const statIngresosHoy = document.getElementById('statIngresosHoy');
        if (statIngresosHoy) statIngresosHoy.textContent = `$${ingresos.toFixed(2)}`;
        
    } catch (error) {
        console.error('Error al cargar estadísticas:', error);
    }
}

// ===================================
// ALERTAS
// ===================================
async function loadAlerts() {
    const alertsList = document.getElementById('alertsList');
    if (!alertsList) return;
    
    alertsList.innerHTML = '<div class="loading">Cargando alertas...</div>';
    
    try {
        const alerts = [];
        
        // Membresías próximas a vencer
        const vencimientos = await api.getExpiringMemberships(7);
        vencimientos.forEach(m => {
            // Convertir fechaVencimiento según su tipo
            let fechaVencimiento = m.fechaVencimiento || m.fecha_vencimiento;
            
            if (Array.isArray(fechaVencimiento)) {
                // Array [2025, 11, 20] -> "2025-11-20"
                fechaVencimiento = `${fechaVencimiento[0]}-${String(fechaVencimiento[1]).padStart(2, '0')}-${String(fechaVencimiento[2]).padStart(2, '0')}`;
            } else if (typeof fechaVencimiento === 'number') {
                // Timestamp -> "YYYY-MM-DD"
                fechaVencimiento = new Date(fechaVencimiento).toISOString().split('T')[0];
            }
            
            alerts.push({
                type: 'warning',
                message: `Membresía de ${m.nombreAtleta || 'Atleta'} vence el ${fechaVencimiento}`,
                icon: 'fa-exclamation-triangle'
            });
        });
        
        if (alerts.length === 0) {
            alertsList.innerHTML = '<p class="text-muted">No hay alertas pendientes</p>';
        } else {
            alertsList.innerHTML = alerts.map(alert => `
                <div class="alert alert-${alert.type}">
                    <i class="fas ${alert.icon}"></i>
                    <span>${alert.message}</span>
                </div>
            `).join('');
        }
        
    } catch (error) {
        alertsList.innerHTML = '<p class="text-danger">Error al cargar alertas</p>';
        console.error(error);
    }
}

// ===================================
// ATLETAS EN BOX
// ===================================
async function loadAtletasEnBox() {
    const tbody = document.querySelector('#atletasEnBoxTable tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="3" class="text-center">Cargando...</td></tr>';
    
    try {
        const today = new Date().toISOString().split('T')[0];
        const asistencias = await api.getAttendanceByDate(today);
        const enBox = asistencias.filter(a => !a.horaSalida);
        
        document.getElementById('atletasEnBoxCount').textContent = enBox.length;
        
        if (enBox.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" class="text-center">No hay atletas en el box</td></tr>';
        } else {
            tbody.innerHTML = enBox.map(a => {
                const horaEntrada = a.horaEntrada || a.hora_entrada;
                const nombreAtleta = a.nombreAtleta || a.nombre_atleta || 'Atleta';
                
                // Calcular tiempo transcurrido
                const ahora = new Date();
                const [horas, minutos, segundos] = horaEntrada.split(':');
                const entrada = new Date();
                entrada.setHours(parseInt(horas), parseInt(minutos), parseInt(segundos || 0), 0);
                
                const diff = Math.floor((ahora - entrada) / 60000);
                const horasTranscurridas = Math.floor(diff / 60);
                const minutosTranscurridos = diff % 60;
                
                return `
                    <tr>
                        <td>${nombreAtleta}</td>
                        <td>${horaEntrada.slice(0, 5)}</td>
                        <td>${horasTranscurridas}h ${minutosTranscurridos}m</td>
                    </tr>
                `;
            }).join('');
        }
        
    } catch (error) {
        tbody.innerHTML = '<tr><td colspan="3" class="text-center text-danger">Error al cargar datos</td></tr>';
        console.error(error);
    }
}

// ===================================
// VENCIMIENTOS PRÓXIMOS
// ===================================
async function loadVencimientos() {
    const tbody = document.querySelector('#vencimientosTable tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="3" class="text-center">Cargando...</td></tr>';
    
    try {
        const vencimientos = await api.getExpiringMemberships(7);
        
        document.getElementById('vencimientosCount').textContent = vencimientos.length;
        
        if (vencimientos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" class="text-center">No hay vencimientos próximos</td></tr>';
        } else {
            tbody.innerHTML = vencimientos.map(m => {
                // Convertir fechaVencimiento según su tipo
                let fechaVencimiento = m.fechaVencimiento || m.fecha_vencimiento;
                
                if (Array.isArray(fechaVencimiento)) {
                    // Array [2025, 11, 20] -> "2025-11-20"
                    fechaVencimiento = `${fechaVencimiento[0]}-${String(fechaVencimiento[1]).padStart(2, '0')}-${String(fechaVencimiento[2]).padStart(2, '0')}`;
                } else if (typeof fechaVencimiento === 'number') {
                    // Timestamp -> "YYYY-MM-DD"
                    fechaVencimiento = new Date(fechaVencimiento).toISOString().split('T')[0];
                }
                
                const hoy = new Date();
                const fin = new Date(fechaVencimiento);
                const dias = Math.ceil((fin - hoy) / (1000 * 60 * 60 * 24));
                
                return `
                    <tr>
                        <td>${m.nombreAtleta || 'Atleta'}</td>
                        <td>${fechaVencimiento}</td>
                        <td><span class="badge ${dias <= 3 ? 'danger' : 'warning'}">${dias} días</span></td>
                    </tr>
                `;
            }).join('');
        }
        
    } catch (error) {
        tbody.innerHTML = '<tr><td colspan="3" class="text-center text-danger">Error al cargar datos</td></tr>';
        console.error(error);
    }
}

// ===================================
// ATLETAS
// ===================================
async function loadAtletas() {
    const tbody = document.querySelector('#atletasTable tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="6" class="text-center"><div class="loading"><i class="fas fa-spinner fa-spin"></i> Cargando atletas...</div></td></tr>';
    
    try {
        const atletas = await api.getAthletes();
        
        if (atletas.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">No hay atletas registrados</td></tr>';
        } else {
            tbody.innerHTML = atletas.map(atleta => {
                // Convertir fechaNacimiento si viene como array
                let fechaNacimiento = atleta.fechaNacimiento || atleta.fecha_nacimiento;
                if (Array.isArray(fechaNacimiento)) {
                    fechaNacimiento = formatearFecha(fechaNacimiento);
                }
                
                return `
                <tr>
                    <td>${atleta.idAtleta || atleta.id}</td>
                    <td>${atleta.nombre} ${atleta.apellidoPaterno} ${atleta.apellidoMaterno}</td>
                    <td>${atleta.email}</td>
                    <td>${atleta.telefono}</td>
                    <td>${fechaNacimiento}</td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="openAtletaModal(${atleta.idAtleta || atleta.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteAtleta(${atleta.idAtleta || atleta.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
            }).join('');
        }
        
    } catch (error) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Error al cargar atletas</td></tr>';
        console.error(error);
    }
}

async function deleteAtleta(id) {
    openConfirmModal('¿Está seguro de eliminar este atleta?', async function() {
        try {
            await api.deleteAthlete(id);
            showNotification('Atleta eliminado exitosamente', 'success');
            loadAtletas();
            loadDashboardStats();
        } catch (error) {
            showNotification('Error al eliminar atleta: ' + error.message, 'error');
        }
    });
}

// ===================================
// MEMBRESÍAS
// ===================================
async function loadMembresias() {
    const tbody = document.querySelector('#membresiasTable tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="8" class="text-center"><div class="loading"><i class="fas fa-spinner fa-spin"></i> Cargando membresías...</div></td></tr>';
    
    try {
        const membresias = await api.getMemberships();
        
        if (membresias.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center">No hay membresías registradas</td></tr>';
        } else {
            tbody.innerHTML = membresias.map(m => {
                const statusClass = m.nombreEstado === 'Activa' ? 'success' : m.nombreEstado === 'Vencida' ? 'danger' : 'warning';
                
                // Convertir fechas si vienen como array
                let fechaInicio = m.fechaInicio || m.fecha_inicio;
                if (Array.isArray(fechaInicio)) {
                    fechaInicio = formatearFecha(fechaInicio);
                }
                
                let fechaVencimiento = m.fechaVencimiento || m.fecha_vencimiento;
                if (Array.isArray(fechaVencimiento)) {
                    fechaVencimiento = formatearFecha(fechaVencimiento);
                }
                
                return `
                    <tr>
                        <td>${m.idMembresia || m.id}</td>
                        <td>${m.nombreAtleta || `Atleta #${m.idAtleta}`}</td>
                        <td>${m.nombreTipo || 'N/A'}</td>
                        <td>${fechaInicio}</td>
                        <td>${fechaVencimiento}</td>
                        <td>$${m.precioPagado || 0}</td>
                        <td><span class="badge ${statusClass}">${m.nombreEstado || 'N/A'}</span></td>
                        <td>
                            <button class="btn btn-sm btn-primary" onclick="openMembresiaModal(${m.idMembresia || m.id})">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="deleteMembresia(${m.idMembresia || m.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
        }
        
    } catch (error) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center text-danger">Error al cargar membresías</td></tr>';
        console.error(error);
    }
}

async function deleteMembresia(id) {
    openConfirmModal('¿Está seguro de eliminar esta membresía?', async function() {
        try {
            await api.deleteMembership(id);
            showNotification('Membresía eliminada exitosamente', 'success');
            loadMembresias();
            loadDashboardStats();
        } catch (error) {
            showNotification('Error al eliminar membresía: ' + error.message, 'error');
        }
    });
}

// ===================================
// PAGOS
// ===================================
async function loadPagos() {
    const tbody = document.querySelector('#pagosTable tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="7" class="text-center"><div class="loading"><i class="fas fa-spinner fa-spin"></i> Cargando pagos...</div></td></tr>';
    
    try {
        const pagos = await api.getPayments();
        console.log('Pagos cargados:', pagos);
        
        if (pagos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">No hay pagos registrados</td></tr>';
        } else {
            tbody.innerHTML = pagos.map(p => {
                // Adaptar a los nombres de campos que devuelve el backend
                const idPago = p.idPago || p.id;
                const nombreAtleta = p.nombreAtleta || 'N/A';
                const concepto = p.concepto || p.referencia || 'Pago de membresía';
                const monto = parseFloat(p.monto || 0).toFixed(2);
                const nombreMetodo = p.nombreMetodo || p.metodoPago || 'N/A';
                const fechaPago = p.fechaPago ? new Date(p.fechaPago).toLocaleDateString('es-MX') : 'N/A';
                
                return `
                    <tr>
                        <td>${idPago}</td>
                        <td>${nombreAtleta}</td>
                        <td>${concepto}</td>
                        <td>$${monto}</td>
                        <td>${nombreMetodo}</td>
                        <td>${fechaPago}</td>
                        <td>
                            <button class="btn btn-sm btn-danger" onclick="deletePago(${idPago})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
        }
        
    } catch (error) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Error al cargar pagos</td></tr>';
        console.error(error);
    }
}

async function deletePago(id) {
    openConfirmModal('¿Está seguro de eliminar este pago?', async function() {
        try {
            await api.deletePayment(id);
            showNotification('Pago eliminado exitosamente', 'success');
            loadPagos();
            loadDashboardStats();
        } catch (error) {
            showNotification('Error al eliminar pago: ' + error.message, 'error');
        }
    });
}

// ===================================
// ASISTENCIAS
// ===================================
async function loadAsistencias() {
    const tbody = document.querySelector('#asistenciasTable tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="8" class="text-center"><div class="loading"><i class="fas fa-spinner fa-spin"></i> Cargando asistencias...</div></td></tr>';
    
    try {
        const filterDate = document.getElementById('filterFechaAsistencia');
        const fecha = filterDate ? filterDate.value : new Date().toISOString().split('T')[0];
        
        console.log('📅 Cargando asistencias para fecha:', fecha);
        const asistencias = await api.getAttendanceByDate(fecha);
        console.log('✅ Asistencias obtenidas:', asistencias);
        
        console.log('📝 Cantidad de asistencias:', asistencias.length);
        
        if (asistencias.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center">No hay asistencias registradas</td></tr>';
        } else {
            tbody.innerHTML = asistencias.map(a => {
                // Manejar diferentes formatos de respuesta del backend
                const id = a.id || a.idAsistencia || a.id_asistencia;
                const nombreAtleta = a.nombreAtleta || a.nombre_atleta || `Atleta #${a.idAtleta || a.id_atleta}`;
                
                // Convertir fecha si viene como array [2025, 11, 18] a string "2025-11-18"
                let fecha = a.fecha || a.fechaAsistencia || a.fecha_asistencia;
                if (Array.isArray(fecha)) {
                    fecha = `${fecha[0]}-${String(fecha[1]).padStart(2, '0')}-${String(fecha[2]).padStart(2, '0')}`;
                }
                
                const horaEntrada = a.horaEntrada || a.hora_entrada;
                const horaSalida = a.horaSalida || a.hora_salida;
                
                const estado = horaSalida ? 'Completado' : 'En box';
                const duracion = horaSalida ? calcularDuracion(horaEntrada, horaSalida) : '-';
                
                return `
                    <tr>
                        <td>${id}</td>
                        <td>${nombreAtleta}</td>
                        <td>${fecha}</td>
                        <td>${horaEntrada ? horaEntrada.slice(0, 5) : '-'}</td>
                        <td>${horaSalida ? horaSalida.slice(0, 5) : '-'}</td>
                        <td>${duracion}</td>
                        <td><span class="badge ${horaSalida ? 'success' : 'warning'}">${estado}</span></td>
                        <td>
                            ${!horaSalida ? `
                                <button class="btn btn-sm btn-warning" onclick="openSalidaModal(${id}, '${nombreAtleta}', '${horaEntrada ? horaEntrada.slice(0, 5) : ''}')">
                                    <i class="fas fa-sign-out-alt"></i> Salida
                                </button>
                            ` : ''}
                            <button class="btn btn-sm btn-danger" onclick="deleteAsistencia(${id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
        }
        
    } catch (error) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center text-danger">Error al cargar asistencias</td></tr>';
        console.error(error);
    }
}

function calcularDuracion(entrada, salida) {
    const e = new Date(`2000-01-01T${entrada}`);
    const s = new Date(`2000-01-01T${salida}`);
    const diff = Math.floor((s - e) / 60000);
    const horas = Math.floor(diff / 60);
    const minutos = diff % 60;
    return `${horas}h ${minutos}m`;
}

// Helper: Convertir fecha de array a string
function formatearFecha(fecha) {
    if (Array.isArray(fecha)) {
        // Array [2025, 11, 20] -> "2025-11-20"
        return `${fecha[0]}-${String(fecha[1]).padStart(2, '0')}-${String(fecha[2]).padStart(2, '0')}`;
    } else if (typeof fecha === 'number') {
        // Timestamp -> "YYYY-MM-DD"
        return new Date(fecha).toISOString().split('T')[0];
    }
    return fecha;
}

async function deleteAsistencia(id) {
    openConfirmModal('¿Está seguro de eliminar esta asistencia?', async function() {
        try {
            await api.deleteAttendance(id);
            showNotification('Asistencia eliminada exitosamente', 'success');
            loadAsistencias();
            loadDashboardStats();
        } catch (error) {
            showNotification('Error al eliminar asistencia: ' + error.message, 'error');
        }
    });
}

// ===================================
// USUARIOS
// ===================================
async function loadUsuarios() {
    const tbody = document.querySelector('#usuariosTable tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="7" class="text-center"><div class="loading"><i class="fas fa-spinner fa-spin"></i> Cargando usuarios...</div></td></tr>';
    
    try {
        const usuarios = await api.getUsers();
        
        if (usuarios.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">No hay usuarios registrados</td></tr>';
        } else {
            tbody.innerHTML = usuarios.map(u => {
                // Manejar diferentes formatos de respuesta del backend
                const id = u.idUsuario || u.id_usuario || u.id;
                const nombre = u.nombre || '';
                const apellidoPaterno = u.apellidoPaterno || u.apellido_paterno || '';
                const apellidoMaterno = u.apellidoMaterno || u.apellido_materno || '';
                const email = u.email || '';
                const idRol = u.idRol || u.id_rol || 2;
                const activo = u.activo !== undefined ? u.activo : true;
                
                const rol = idRol === 1 ? 'Gerente' : 'Staff';
                const estado = activo ? 'Activo' : 'Inactivo';
                
                return `
                    <tr>
                        <td>${id}</td>
                        <td>${nombre} ${apellidoPaterno} ${apellidoMaterno}</td>
                        <td>${email}</td>
                        <td><span class="badge ${idRol === 1 ? 'primary' : 'info'}">${rol}</span></td>
                        <td><span class="badge ${activo ? 'success' : 'secondary'}">${estado}</span></td>
                        <td>-</td>
                        <td>
                            <button class="btn btn-sm btn-primary" onclick="openUsuarioModal(${id})">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="deleteUsuario(${id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
        }
        
    } catch (error) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Error al cargar usuarios</td></tr>';
        console.error(error);
    }
}

async function deleteUsuario(id) {
    openConfirmModal('¿Está seguro de eliminar este usuario?', async function() {
        try {
            await api.deleteUser(id);
            showNotification('Usuario eliminado exitosamente', 'success');
            loadUsuarios();
        } catch (error) {
            showNotification('Error al eliminar usuario: ' + error.message, 'error');
        }
    });
}

// ===================================
// BÚSQUEDA
// ===================================
const searchAtleta = document.getElementById('searchAtleta');
if (searchAtleta) {
    searchAtleta.addEventListener('input', function() {
        const filter = this.value.toLowerCase();
        const rows = document.querySelectorAll('#atletasTable tbody tr');
        
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(filter) ? '' : 'none';
        });
    });
}
