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
        console.log('👤 Usuario cargado:', user);
        console.log('🔑 Propiedades del usuario:', Object.keys(user));
        console.log('🎯 idRol:', user.idRol, 'Tipo:', typeof user.idRol);
        console.log('🎯 rol (texto):', user.rol);
        
        // Construir nombre completo
        const nombreCompleto = `${user.nombre || ''} ${user.apellidoPaterno || ''} ${user.apellidoMaterno || ''}`.trim() || user.nombreCompleto;
        
        // Determinar el rol - primero intenta con idRol, luego con rol (texto)
        let rolTexto = 'Usuario';
        if (user.idRol === 1 || user.idRol === '1') {
            rolTexto = 'Gerente';
        } else if (user.idRol === 2 || user.idRol === '2') {
            rolTexto = 'Staff';
        } else if (user.rol) {
            // Si no hay idRol pero hay rol como texto
            const rolUpper = user.rol.toUpperCase();
            if (rolUpper === 'GERENTE') {
                rolTexto = 'Gerente';
            } else if (rolUpper === 'STAFF') {
                rolTexto = 'Staff';
            } else {
                rolTexto = user.rol; // Usar el rol tal cual viene
            }
        }
        
        console.log('📋 Rol determinado:', rolTexto, 'desde idRol:', user.idRol, 'o rol:', user.rol);
        
        // Actualizar elementos del DOM
        const userNameElement = document.getElementById('userName');
        const userRoleElement = document.getElementById('userRole');
        
        if (userNameElement) {
            userNameElement.textContent = nombreCompleto;
            console.log('✅ Nombre actualizado en DOM:', nombreCompleto);
        }
        
        if (userRoleElement) {
            userRoleElement.textContent = rolTexto;
            console.log('✅ Rol actualizado en DOM:', rolTexto);
        }
        
    } catch (e) {
        console.error('❌ Error al parsear datos de usuario:', e);
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
        case 'reportes':
            loadReportes();
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
            // Convertir fechaVencimiento usando la función formatearFecha
            let fechaVencimiento = m.fechaVencimiento || m.fecha_vencimiento;
            fechaVencimiento = formatearFecha(fechaVencimiento);
            
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
                // Convertir fechaVencimiento usando formatearFecha
                let fechaVencimiento = m.fechaVencimiento || m.fecha_vencimiento;
                const fechaFormateada = formatearFecha(fechaVencimiento);
                
                // Convertir a formato ISO para cálculo de días
                let fechaISO = fechaVencimiento;
                if (Array.isArray(fechaVencimiento)) {
                    fechaISO = `${fechaVencimiento[0]}-${String(fechaVencimiento[1]).padStart(2, '0')}-${String(fechaVencimiento[2]).padStart(2, '0')}`;
                } else if (typeof fechaVencimiento === 'number') {
                    fechaISO = new Date(fechaVencimiento).toISOString().split('T')[0];
                }
                
                const hoy = new Date();
                const fin = new Date(fechaISO);
                const dias = Math.ceil((fin - hoy) / (1000 * 60 * 60 * 24));
                
                return `
                    <tr>
                        <td>${m.nombreAtleta || 'Atleta'}</td>
                        <td>${fechaFormateada}</td>
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
        console.log('📋 Atletas cargados:', atletas);
        
        if (atletas.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">No hay atletas registrados</td></tr>';
        } else {
            tbody.innerHTML = atletas.map(atleta => {
                // Obtener ID del atleta
                const id = atleta.idAtleta || atleta.id;
                
                // Construir nombre completo
                const nombre = atleta.nombre || '';
                const apellidoPaterno = atleta.apellidoPaterno || atleta.apellido_paterno || '';
                const apellidoMaterno = atleta.apellidoMaterno || atleta.apellido_materno || '';
                const nombreCompleto = `${nombre} ${apellidoPaterno} ${apellidoMaterno}`.trim();
                
                // Obtener email y teléfono
                const email = atleta.email || 'N/A';
                const telefono = atleta.telefono || 'N/A';
                
                // Convertir fechaNacimiento a formato legible
                let fechaNacimiento = atleta.fechaNacimiento || atleta.fecha_nacimiento;
                fechaNacimiento = formatearFecha(fechaNacimiento) || 'N/A';
                
                return `
                <tr>
                    <td>${nombreCompleto}</td>
                    <td>${email}</td>
                    <td>${telefono}</td>
                    <td>${fechaNacimiento}</td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="openAtletaModal(${id})" title="Editar atleta">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteAtleta(${id})" title="Eliminar atleta">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
            }).join('');
        }
        
    } catch (error) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Error al cargar atletas</td></tr>';
        console.error('❌ Error al cargar atletas:', error);
        showNotification('Error al cargar atletas: ' + error.message, 'error');
    }
}

async function deleteAtleta(id) {
    openConfirmModal('¿Está seguro de eliminar este atleta? Esta acción no se puede deshacer.', async function() {
        try {
            await api.deleteAthlete(id);
            showNotification('✅ ATLETA ELIMINADO CORRECTAMENTE', 'success');
            loadAtletas();
            loadDashboardStats();
        } catch (error) {
            console.error('❌ Error al eliminar atleta:', error);
            showNotification('❌ ERROR AL ELIMINAR ATLETA: ' + error.message, 'error');
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
        console.log('📋 Membresías cargadas:', membresias);
        
        if (membresias.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center">No hay membresías registradas</td></tr>';
        } else {
            tbody.innerHTML = membresias.map(m => {
                // Obtener ID
                const id = m.idMembresia || m.id;
                
                // Obtener nombre del atleta
                const nombreAtleta = m.nombreAtleta || m.nombre_atleta || `Atleta #${m.idAtleta || m.id_atleta || 'N/A'}`;
                
                // Obtener tipo de membresía
                const nombreTipo = m.nombreTipo || m.nombre_tipo || m.tipoMembresia || 'N/A';
                
                // Convertir fechas si vienen como array, timestamp o string
                let fechaInicio = m.fechaInicio || m.fecha_inicio;
                if (Array.isArray(fechaInicio)) {
                    fechaInicio = formatearFecha(fechaInicio);
                } else if (typeof fechaInicio === 'number') {
                    fechaInicio = formatearFecha(fechaInicio);
                } else if (typeof fechaInicio === 'string' && fechaInicio.includes('-')) {
                    fechaInicio = formatearFecha(fechaInicio);
                } else if (!fechaInicio) {
                    fechaInicio = 'N/A';
                }
                
                let fechaVencimiento = m.fechaVencimiento || m.fecha_vencimiento;
                if (Array.isArray(fechaVencimiento)) {
                    fechaVencimiento = formatearFecha(fechaVencimiento);
                } else if (typeof fechaVencimiento === 'number') {
                    fechaVencimiento = formatearFecha(fechaVencimiento);
                } else if (typeof fechaVencimiento === 'string' && fechaVencimiento.includes('-')) {
                    fechaVencimiento = formatearFecha(fechaVencimiento);
                } else if (!fechaVencimiento) {
                    fechaVencimiento = 'N/A';
                }
                
                // Obtener precio pagado (Sesiones)
                const precioPagado = parseFloat(m.precioPagado || m.precio_pagado || 0).toFixed(2);
                
                // Obtener estado
                const nombreEstado = m.nombreEstado || m.nombre_estado || 'N/A';
                const statusClass = nombreEstado === 'Activa' ? 'success' : nombreEstado === 'Vencida' ? 'danger' : 'warning';
                
                return `
                    <tr>
                        <td>${nombreAtleta}</td>
                        <td>${nombreTipo}</td>
                        <td>${fechaInicio}</td>
                        <td>${fechaVencimiento}</td>
                        <td>$${precioPagado}</td>
                        <td><span class="badge ${statusClass}">${nombreEstado}</span></td>
                        <td>
                            <button class="btn btn-sm btn-primary" onclick="openMembresiaModal(${id})" title="Editar membresía">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="deleteMembresia(${id})" title="Eliminar membresía">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
        }
        
    } catch (error) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center text-danger">Error al cargar membresías</td></tr>';
        console.error('❌ Error al cargar membresías:', error);
        showNotification('Error al cargar membresías: ' + error.message, 'error');
    }
}

async function deleteMembresia(id) {
    openConfirmModal('¿Está seguro de eliminar esta membresía? Esta acción no se puede deshacer.', async function() {
        try {
            await api.deleteMembership(id);
            showNotification('✅ MEMBRESÍA ELIMINADA CORRECTAMENTE', 'success');
            loadMembresias();
            loadDashboardStats();
        } catch (error) {
            console.error('❌ Error al eliminar membresía:', error);
            showNotification('❌ ERROR AL ELIMINAR MEMBRESÍA: ' + error.message, 'error');
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
                
                // Formatear fecha correctamente
                let fechaPago = p.fechaPago || p.fecha_pago;
                if (fechaPago) {
                    fechaPago = formatearFecha(fechaPago);
                } else {
                    fechaPago = 'N/A';
                }
                
                return `
                    <tr>
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
    openConfirmModal('¿Está seguro de eliminar este pago? Esta acción no se puede deshacer.', async function() {
        try {
            await api.deletePayment(id);
            showNotification('✅ PAGO ELIMINADO CORRECTAMENTE', 'success');
            loadPagos();
            loadDashboardStats();
        } catch (error) {
            console.error('❌ Error al eliminar pago:', error);
            showNotification('❌ ERROR AL ELIMINAR PAGO: ' + error.message, 'error');
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
    console.log('📅 Formateando fecha:', fecha, 'Tipo:', typeof fecha);
    
    if (!fecha) {
        return 'N/A';
    }
    
    if (Array.isArray(fecha)) {
        // Array [2025, 11, 20] -> "20/11/2025" formato DD/MM/YYYY
        const dia = String(fecha[2]).padStart(2, '0');
        const mes = String(fecha[1]).padStart(2, '0');
        const anio = fecha[0];
        const resultado = `${dia}/${mes}/${anio}`;
        console.log('✅ Array convertido a:', resultado);
        return resultado;
    } 
    
    if (typeof fecha === 'number') {
        // Timestamp -> "DD/MM/YYYY"
        const date = new Date(fecha);
        const dia = String(date.getDate()).padStart(2, '0');
        const mes = String(date.getMonth() + 1).padStart(2, '0');
        const anio = date.getFullYear();
        const resultado = `${dia}/${mes}/${anio}`;
        console.log('✅ Timestamp convertido a:', resultado);
        return resultado;
    } 
    
    if (typeof fecha === 'string') {
        // String "2025-11-20" -> "20/11/2025"
        if (fecha.includes('-')) {
            const partes = fecha.split('-');
            if (partes.length === 3) {
                const resultado = `${partes[2]}/${partes[1]}/${partes[0]}`;
                console.log('✅ String convertido a:', resultado);
                return resultado;
            }
        }
        // Si ya está en formato DD/MM/YYYY, retornarlo tal cual
        if (fecha.includes('/')) {
            console.log('✅ Fecha ya formateada:', fecha);
            return fecha;
        }
    }
    
    console.log('⚠️ No se pudo formatear, retornando:', fecha);
    return fecha;
}

async function deleteAsistencia(id) {
    openConfirmModal('¿Está seguro de eliminar esta asistencia? Esta acción no se puede deshacer.', async function() {
        try {
            await api.deleteAttendance(id);
            showNotification('✅ ASISTENCIA ELIMINADA CORRECTAMENTE', 'success');
            loadAsistencias();
            loadDashboardStats();
            loadAtletasEnBox();
        } catch (error) {
            console.error('❌ Error al eliminar asistencia:', error);
            showNotification('❌ ERROR AL ELIMINAR ASISTENCIA: ' + error.message, 'error');
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
    openConfirmModal('¿Está seguro de eliminar este usuario? Esta acción no se puede deshacer.', async function() {
        try {
            await api.deleteUser(id);
            showNotification('✅ Usuario eliminado exitosamente', 'success');
            loadUsuarios();
        } catch (error) {
            console.error('❌ Error al eliminar usuario:', error);
            showNotification('❌ Error al eliminar usuario: ' + error.message, 'error');
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

// ===================================
// REPORTES Y GRÁFICAS
// ===================================
let chartInstances = {};

async function loadReportes() {
    try {
        const periodo = document.getElementById('reportPeriodo')?.value || 30;
        
        // Cargar datos
        const [pagos, asistencias, membresias, atletas] = await Promise.all([
            api.getPayments(),
            api.getAttendances(),
            api.getMemberships(),
            api.getAthletes()
        ]);
        
        // Procesar datos para gráficas
        generarGraficaIngresos(pagos, periodo);
        generarGraficaAsistencias(asistencias, periodo);
        generarGraficaMembresias(membresias);
        generarGraficaEstadoMembresias(membresias);
        generarGraficaMetodosPago(pagos);
        generarGraficaAtletas(atletas, periodo);
        generarEstadisticasDetalladas(asistencias, membresias, atletas);
        
    } catch (error) {
        console.error('Error al cargar reportes:', error);
        showNotification('❌ ERROR AL CARGAR REPORTES: ' + error.message, 'error');
    }
}

function generarGraficaIngresos(pagos, periodo) {
    const ctx = document.getElementById('ingresosChart');
    if (!ctx) return;
    
    // Filtrar por período
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - periodo);
    
    const pagosFiltrados = pagos.filter(p => {
        const fecha = new Date(p.fecha || p.fechaPago);
        return fecha >= fechaLimite;
    });
    
    // Agrupar por día
    const ingresosPorDia = {};
    let totalIngresos = 0;
    
    pagosFiltrados.forEach(pago => {
        const fecha = formatearFecha(pago.fecha || pago.fechaPago);
        const monto = parseFloat(pago.monto) || 0;
        
        if (!ingresosPorDia[fecha]) {
            ingresosPorDia[fecha] = 0;
        }
        ingresosPorDia[fecha] += monto;
        totalIngresos += monto;
    });
    
    const labels = Object.keys(ingresosPorDia).sort();
    const data = labels.map(label => ingresosPorDia[label]);
    
    // Actualizar total
    document.getElementById('totalIngresos').textContent = `$${totalIngresos.toFixed(2)}`;
    
    // Destruir gráfica anterior si existe
    if (chartInstances.ingresos) {
        chartInstances.ingresos.destroy();
    }
    
    // Crear gráfica
    chartInstances.ingresos = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Ingresos ($)',
                data: data,
                borderColor: '#BF092F',
                backgroundColor: 'rgba(191, 9, 47, 0.1)',
                tension: 0.4,
                fill: true,
                borderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return '$' + context.parsed.y.toFixed(2);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value;
                        }
                    }
                }
            }
        }
    });
}

function generarGraficaAsistencias(asistencias, periodo) {
    const ctx = document.getElementById('asistenciasChart');
    if (!ctx) return;
    
    // Filtrar por período
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - periodo);
    
    const asistenciasFiltradas = asistencias.filter(a => {
        const fecha = new Date(a.fecha);
        return fecha >= fechaLimite;
    });
    
    // Agrupar por día
    const asistenciasPorDia = {};
    
    asistenciasFiltradas.forEach(asistencia => {
        const fecha = formatearFecha(asistencia.fecha);
        if (!asistenciasPorDia[fecha]) {
            asistenciasPorDia[fecha] = 0;
        }
        asistenciasPorDia[fecha]++;
    });
    
    const labels = Object.keys(asistenciasPorDia).sort();
    const data = labels.map(label => asistenciasPorDia[label]);
    
    // Actualizar total
    document.getElementById('totalAsistencias').textContent = asistenciasFiltradas.length;
    
    // Destruir gráfica anterior
    if (chartInstances.asistencias) {
        chartInstances.asistencias.destroy();
    }
    
    // Crear gráfica
    chartInstances.asistencias = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Asistencias',
                data: data,
                backgroundColor: '#3B9797',
                borderColor: '#16476A',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

function generarGraficaMembresias(membresias) {
    const ctx = document.getElementById('membresiasChart');
    if (!ctx) return;
    
    // Agrupar por tipo
    const tipoMembresia = {};
    
    membresias.forEach(m => {
        const tipo = m.tipoMembresia || 'Desconocido';
        if (!tipoMembresia[tipo]) {
            tipoMembresia[tipo] = 0;
        }
        tipoMembresia[tipo]++;
    });
    
    const labels = Object.keys(tipoMembresia);
    const data = Object.values(tipoMembresia);
    
    // Actualizar total
    document.getElementById('totalMembresias').textContent = membresias.length;
    
    // Destruir gráfica anterior
    if (chartInstances.membresias) {
        chartInstances.membresias.destroy();
    }
    
    // Crear gráfica
    chartInstances.membresias = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    '#BF092F',
                    '#132440',
                    '#16476A',
                    '#3B9797',
                    '#28a745',
                    '#ffc107'
                ],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function generarGraficaEstadoMembresias(membresias) {
    const ctx = document.getElementById('estadoMembresiasChart');
    if (!ctx) return;
    
    // Contar por estado
    const estados = {
        'Activas': 0,
        'Vencidas': 0,
        'Suspendidas': 0
    };
    
    const hoy = new Date();
    
    membresias.forEach(m => {
        const vencimiento = new Date(m.fechaVencimiento || m.fecha_vencimiento);
        
        if (m.estado === 3 || m.estado === '3') {
            estados['Suspendidas']++;
        } else if (vencimiento < hoy) {
            estados['Vencidas']++;
        } else {
            estados['Activas']++;
        }
    });
    
    // Destruir gráfica anterior
    if (chartInstances.estadoMembresias) {
        chartInstances.estadoMembresias.destroy();
    }
    
    // Crear gráfica
    chartInstances.estadoMembresias = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(estados),
            datasets: [{
                data: Object.values(estados),
                backgroundColor: [
                    '#28a745',
                    '#dc3545',
                    '#ffc107'
                ],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function generarGraficaMetodosPago(pagos) {
    const ctx = document.getElementById('metodosPagoChart');
    if (!ctx) return;
    
    // Contar por método
    const metodos = {};
    const metodosNombre = {
        1: 'Efectivo',
        2: 'Tarjeta',
        3: 'Transferencia'
    };
    
    pagos.forEach(p => {
        const metodo = metodosNombre[p.metodoPago] || metodosNombre[p.metodo_pago] || 'Otro';
        if (!metodos[metodo]) {
            metodos[metodo] = 0;
        }
        metodos[metodo]++;
    });
    
    // Destruir gráfica anterior
    if (chartInstances.metodosPago) {
        chartInstances.metodosPago.destroy();
    }
    
    // Crear gráfica
    chartInstances.metodosPago = new Chart(ctx, {
        type: 'polarArea',
        data: {
            labels: Object.keys(metodos),
            datasets: [{
                data: Object.values(metodos),
                backgroundColor: [
                    'rgba(191, 9, 47, 0.7)',
                    'rgba(59, 151, 151, 0.7)',
                    'rgba(22, 71, 106, 0.7)'
                ],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function generarGraficaAtletas(atletas, periodo) {
    const ctx = document.getElementById('atletasChart');
    if (!ctx) return;
    
    // Filtrar atletas nuevos por período
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - periodo);
    
    const atletasNuevos = atletas.filter(a => {
        const fechaRegistro = new Date(a.fechaRegistro || a.fecha_registro || Date.now());
        return fechaRegistro >= fechaLimite;
    });
    
    // Agrupar por semana
    const atletasPorSemana = {};
    
    atletasNuevos.forEach(atleta => {
        const fecha = new Date(atleta.fechaRegistro || atleta.fecha_registro || Date.now());
        const semana = `Sem ${Math.ceil((fecha.getDate()) / 7)}`;
        
        if (!atletasPorSemana[semana]) {
            atletasPorSemana[semana] = 0;
        }
        atletasPorSemana[semana]++;
    });
    
    const labels = Object.keys(atletasPorSemana).sort();
    const data = labels.map(label => atletasPorSemana[label]);
    
    // Actualizar total
    document.getElementById('totalAtletasNuevos').textContent = atletasNuevos.length;
    
    // Destruir gráfica anterior
    if (chartInstances.atletas) {
        chartInstances.atletas.destroy();
    }
    
    // Crear gráfica
    chartInstances.atletas = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Atletas Nuevos',
                data: data,
                backgroundColor: '#132440',
                borderColor: '#BF092F',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

function generarEstadisticasDetalladas(asistencias, membresias, atletas) {
    // Atleta más asistente
    const asistenciasPorAtleta = {};
    asistencias.forEach(a => {
        const atletaId = a.idAtleta || a.id_atleta;
        if (!asistenciasPorAtleta[atletaId]) {
            asistenciasPorAtleta[atletaId] = 0;
        }
        asistenciasPorAtleta[atletaId]++;
    });
    
    let maxAsistencias = 0;
    let topAtletaId = null;
    for (const id in asistenciasPorAtleta) {
        if (asistenciasPorAtleta[id] > maxAsistencias) {
            maxAsistencias = asistenciasPorAtleta[id];
            topAtletaId = id;
        }
    }
    
    const topAtleta = atletas.find(a => (a.idAtleta || a.id) == topAtletaId);
    const topAtletaEl = document.getElementById('topAtleta');
    if (topAtletaEl && topAtleta) {
        topAtletaEl.textContent = `${topAtleta.nombre} ${topAtleta.apellidoPaterno || ''} (${maxAsistencias} asistencias)`;
    }
    
    // Hora pico (hora con más entradas)
    const horasPico = {};
    asistencias.forEach(a => {
        if (a.horaEntrada || a.hora_entrada) {
            const hora = (a.horaEntrada || a.hora_entrada).split(':')[0];
            if (!horasPico[hora]) {
                horasPico[hora] = 0;
            }
            horasPico[hora]++;
        }
    });
    
    let maxHora = 0;
    let horaPico = '00:00';
    for (const hora in horasPico) {
        if (horasPico[hora] > maxHora) {
            maxHora = horasPico[hora];
            horaPico = `${hora}:00`;
        }
    }
    
    const horaPicoEl = document.getElementById('horaPico');
    if (horaPicoEl) {
        horaPicoEl.textContent = `${horaPico} hrs (${maxHora} entradas)`;
    }
    
    // Tasa de asistencia
    const membresiasTotales = membresias.length;
    const asistenciasUltimos7Dias = asistencias.filter(a => {
        const fecha = new Date(a.fecha);
        const hace7Dias = new Date();
        hace7Dias.setDate(hace7Dias.getDate() - 7);
        return fecha >= hace7Dias;
    }).length;
    
    const tasaAsistencia = membresiasTotales > 0 
        ? ((asistenciasUltimos7Dias / (membresiasTotales * 7)) * 100).toFixed(1)
        : 0;
    
    const tasaAsistenciaEl = document.getElementById('tasaAsistencia');
    if (tasaAsistenciaEl) {
        tasaAsistenciaEl.textContent = `${tasaAsistencia}% (últimos 7 días)`;
    }
    
    // Membresías por vencer (próximos 7 días)
    const hoy = new Date();
    const en7Dias = new Date();
    en7Dias.setDate(en7Dias.getDate() + 7);
    
    const porVencer = membresias.filter(m => {
        const vencimiento = new Date(m.fechaVencimiento || m.fecha_vencimiento);
        return vencimiento >= hoy && vencimiento <= en7Dias;
    }).length;
    
    const membresiasVencerEl = document.getElementById('membresiasVencer');
    if (membresiasVencerEl) {
        membresiasVencerEl.textContent = `${porVencer} membresías`;
    }
}

// Cargar reportes cuando se cambie el período
const reportPeriodo = document.getElementById('reportPeriodo');
if (reportPeriodo) {
    reportPeriodo.addEventListener('change', loadReportes);
}

