document.addEventListener('DOMContentLoaded', function() {
    loadModalsHTML();
});

// Cargar el HTML de los modales
function loadModalsHTML() {
    fetch('modals/modals-content.html')
        .then(response => response.text())
        .then(html => {
            document.getElementById('modalsContainer').innerHTML = html;
            initializeModalForms();
        })
        .catch(error => console.error('Error cargando modales:', error));
}

// Inicializar formularios de modales
function initializeModalForms() {
    // Formulario Atleta
    const atletaForm = document.getElementById('atletaForm');
    if (atletaForm) {
        atletaForm.addEventListener('submit', handleAtletaSubmit);
    }
    
    // Formulario Membresía
    const membresiaForm = document.getElementById('membresiaForm');
    if (membresiaForm) {
        membresiaForm.addEventListener('submit', handleMembresiaSubmit);
    }
    
    // Formulario Pago
    const pagoForm = document.getElementById('pagoForm');
    if (pagoForm) {
        pagoForm.addEventListener('submit', handlePagoSubmit);
    }
    
    // Formulario Asistencia
    const asistenciaForm = document.getElementById('asistenciaForm');
    if (asistenciaForm) {
        asistenciaForm.addEventListener('submit', handleAsistenciaSubmit);
    }
    
    // Formulario Salida
    const salidaForm = document.getElementById('salidaForm');
    if (salidaForm) {
        salidaForm.addEventListener('submit', handleSalidaSubmit);
    }
    
    // Formulario Usuario
    const usuarioForm = document.getElementById('usuarioForm');
    if (usuarioForm) {
        usuarioForm.addEventListener('submit', handleUsuarioSubmit);
    }
}

// ===================================
// MODAL: ATLETA
// ===================================
let editingAtletaId = null;

function openAtletaModal(atletaId = null) {
    editingAtletaId = atletaId;
    const modal = document.getElementById('atletaModal');
    const title = document.getElementById('atletaModalTitle');
    const form = document.getElementById('atletaForm');
    
    form.reset();
    
    if (atletaId) {
        title.textContent = 'Editar Atleta';
        loadAtletaData(atletaId);
    } else {
        title.textContent = 'Nuevo Atleta';
    }
    
    modal.style.display = 'flex';
}

function closeAtletaModal() {
    document.getElementById('atletaModal').style.display = 'none';
    editingAtletaId = null;
}

async function loadAtletaData(atletaId) {
    try {
        const atleta = await api.getAthleteById(atletaId);
        
        document.getElementById('atletaId').value = atleta.idAtleta || atleta.id;
        document.getElementById('atletaNombre').value = atleta.nombre;
        document.getElementById('atletaApellidoPaterno').value = atleta.apellidoPaterno;
        document.getElementById('atletaApellidoMaterno').value = atleta.apellidoMaterno;
        
        // Convertir timestamp a formato yyyy-MM-dd si es necesario
        let fechaNacimiento = atleta.fechaNacimiento;
        if (typeof fechaNacimiento === 'number') {
            fechaNacimiento = new Date(fechaNacimiento).toISOString().split('T')[0];
        }
        document.getElementById('atletaFechaNacimiento').value = fechaNacimiento;
        
        document.getElementById('atletaGenero').value = atleta.genero;
        document.getElementById('atletaEmail').value = atleta.email;
        document.getElementById('atletaTelefono').value = atleta.telefono;
        document.getElementById('atletaNotas').value = atleta.notas || '';
        
        try {
            const datosMedicos = await api.getAthleteMedicalData(atleta.idAtleta || atleta.id);
            if (datosMedicos) {
                document.getElementById('atletaTipoSangre').value = datosMedicos.tipoSangre || '';
                document.getElementById('atletaAlergias').value = datosMedicos.alergias || '';
                document.getElementById('atletaPadecimientos').value = datosMedicos.condicionesMedicas || '';
            }
        } catch (e) {
            console.log('No hay datos médicos registrados');
        }
        
        try {
            const contactos = await api.getAthleteContacts(atleta.idAtleta || atleta.id);
            if (contactos && contactos.length > 0) {
                const contacto = contactos[0];
                document.getElementById('contactoNombre').value = contacto.nombreContacto || '';
                document.getElementById('contactoParentesco').value = contacto.relacion || '';
                document.getElementById('contactoTelefono').value = contacto.telefonoContacto || '';
            }
        } catch (e) {
            console.log('No hay contactos de emergencia registrados');
        }
        
    } catch (error) {
        showNotification('Error al cargar datos del atleta', 'error');
        console.error(error);
    }
}

async function handleAtletaSubmit(e) {
    e.preventDefault();
    
    const atletaData = {
        nombre: document.getElementById('atletaNombre').value,
        apellidoPaterno: document.getElementById('atletaApellidoPaterno').value,
        apellidoMaterno: document.getElementById('atletaApellidoMaterno').value,
        fechaNacimiento: document.getElementById('atletaFechaNacimiento').value,
        genero: document.getElementById('atletaGenero').value,
        email: document.getElementById('atletaEmail').value,
        telefono: document.getElementById('atletaTelefono').value,
        notas: document.getElementById('atletaNotas').value,
        activo: true
    };
    
    try {
        let atletaId;
        
        if (editingAtletaId) {
            await api.updateAthlete(editingAtletaId, atletaData);
            atletaId = editingAtletaId;
            showNotification('Atleta actualizado exitosamente', 'success');
        } else {
            const response = await api.createAthlete(atletaData);
            atletaId = response.idAtleta || response.id;
            showNotification('Atleta creado exitosamente', 'success');
        }
        
        // Guardar datos médicos solo si hay al menos un campo lleno
        const tipoSangre = document.getElementById('atletaTipoSangre').value;
        const alergias = document.getElementById('atletaAlergias').value;
        const condicionesMedicas = document.getElementById('atletaPadecimientos').value;
        
        if (tipoSangre || alergias || condicionesMedicas) {
            const datosMedicos = {
                tipoSangre: tipoSangre || null,
                alergias: alergias || null,
                condicionesMedicas: condicionesMedicas || null
            };
            
            try {
                await api.updateAthleteMedicalData(atletaId, datosMedicos);
            } catch (e) {
                console.error('Error al guardar datos médicos:', e);
            }
        }
        
        // Guardar contacto de emergencia solo si hay nombre
        const contactoNombre = document.getElementById('contactoNombre').value;
        if (contactoNombre) {
            const contactoData = {
                nombreContacto: contactoNombre,
                relacion: document.getElementById('contactoParentesco').value || null,
                telefonoContacto: document.getElementById('contactoTelefono').value || null
            };
            
            try {
                await api.addAthleteContact(atletaId, contactoData);
            } catch (e) {
                console.error('Error al guardar contacto de emergencia:', e);
            }
        }
        
        closeAtletaModal();
        if (typeof loadAtletas === 'function') loadAtletas();
        if (typeof loadDashboardStats === 'function') loadDashboardStats();
        
    } catch (error) {
        showNotification('Error al guardar atleta: ' + error.message, 'error');
        console.error(error);
    }
}

// ===================================
// MODAL: MEMBRESÍA
// ===================================
let editingMembresiaId = null;

function openMembresiaModal(membresiaId = null) {
    console.log('openMembresiaModal llamada con ID:', membresiaId);
    editingMembresiaId = membresiaId;
    const modal = document.getElementById('membresiaModal');
    const title = document.getElementById('membresiaModalTitle');
    const form = document.getElementById('membresiaForm');
    
    if (!modal || !title || !form) {
        console.error('Elementos del modal no encontrados');
        return;
    }
    
    form.reset();
    
    // Limpiar estilos de error
    const fieldsToReset = ['membresiaAtleta', 'membresiaTipo', 'membresiaCosto'];
    fieldsToReset.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.style.borderColor = '';
            // Agregar listener para limpiar el borde rojo al cambiar
            element.addEventListener('change', function() {
                this.style.borderColor = '';
            }, { once: true });
        }
    });
    
    loadAtletasSelect('membresiaAtleta');
    loadTiposMembresiaSelect();
    
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('membresiaFechaInicio').value = today;
    
    if (membresiaId) {
        title.textContent = 'Editar Membresía';
        loadMembresiaData(membresiaId);
    } else {
        title.textContent = 'Nueva Membresía';
        document.getElementById('membresiaEstatus').value = '1';
    }
    
    modal.style.display = 'flex';
    console.log('Modal de membresía abierto');
}

function closeMembresiaModal() {
    document.getElementById('membresiaModal').style.display = 'none';
    editingMembresiaId = null;
}

async function loadMembresiaData(membresiaId) {
    try {
        const membresia = await api.getMembershipById(membresiaId);
        
        document.getElementById('membresiaId').value = membresia.idMembresia || membresia.id;
        document.getElementById('membresiaAtleta').value = membresia.idAtleta;
        document.getElementById('membresiaTipo').value = membresia.idTipoMembresia;
        document.getElementById('membresiaFechaInicio').value = membresia.fechaInicio;
        document.getElementById('membresiaFechaFin').value = membresia.fechaVencimiento;
        document.getElementById('membresiaCosto').value = membresia.precioPagado;
        document.getElementById('membresiaEstatus').value = membresia.idEstadoMembresia;
        document.getElementById('membresiaObservaciones').value = membresia.observaciones || '';
        
    } catch (error) {
        showNotification('Error al cargar datos de la membresía', 'error');
        console.error(error);
    }
}

function calculateMembresiaEnd() {
    const tipo = document.getElementById('membresiaTipo').value;
    const fechaInicio = document.getElementById('membresiaFechaInicio').value;
    
    if (!tipo || !fechaInicio) return;
    
    const fecha = new Date(fechaInicio + 'T00:00:00');
    
    switch(tipo) {
        case '1': // Diaria
            fecha.setDate(fecha.getDate() + 1);
            break;
        case '2': // Semanal
            fecha.setDate(fecha.getDate() + 7);
            break;
        case '3': // Mensual
            fecha.setMonth(fecha.getMonth() + 1);
            break;
        case '4': // Trimestral
            fecha.setMonth(fecha.getMonth() + 3);
            break;
        case '5': // Semestral
            fecha.setMonth(fecha.getMonth() + 6);
            break;
        case '6': // Anual
            fecha.setFullYear(fecha.getFullYear() + 1);
            break;
    }
    
    document.getElementById('membresiaFechaFin').value = fecha.toISOString().split('T')[0];
}

async function handleMembresiaSubmit(e) {
    e.preventDefault();
    
    const atletaSelect = document.getElementById('membresiaAtleta');
    const atletaValue = atletaSelect.value;
    const atletaSelectedIndex = atletaSelect.selectedIndex;
    const atletaSelectedOption = atletaSelect.options[atletaSelectedIndex];
    
    console.log('DEBUG Select Atleta:', {
        value: atletaValue,
        valueType: typeof atletaValue,
        selectedIndex: atletaSelectedIndex,
        selectedText: atletaSelectedOption ? atletaSelectedOption.text : 'N/A',
        totalOptions: atletaSelect.options.length,
        allOptions: Array.from(atletaSelect.options).map(opt => ({value: opt.value, text: opt.text}))
    });
    
    const idAtleta = parseInt(atletaValue);
    const idTipoMembresia = parseInt(document.getElementById('membresiaTipo').value);
    const precioPagado = parseFloat(document.getElementById('membresiaCosto').value);
    const idEstadoMembresia = parseInt(document.getElementById('membresiaEstatus').value);
    
    console.log('Valores del formulario:', {
        idAtleta,
        idTipoMembresia,
        precioPagado,
        idEstadoMembresia
    });
    
    // Validar que todos los campos requeridos tengan valores válidos
    if (!idAtleta || isNaN(idAtleta)) {
        console.error('Validación fallida: atleta no válido');
        const atletaSelect = document.getElementById('membresiaAtleta');
        atletaSelect.style.borderColor = 'red';
        atletaSelect.focus();
        showNotification('⚠️ Debe seleccionar un atleta de la lista', 'error');
        return;
    }
    
    if (!idTipoMembresia || isNaN(idTipoMembresia)) {
        const tipoSelect = document.getElementById('membresiaTipo');
        tipoSelect.style.borderColor = 'red';
        tipoSelect.focus();
        showNotification('⚠️ Debe seleccionar un tipo de membresía', 'error');
        return;
    }
    
    if (isNaN(precioPagado) || precioPagado <= 0) {
        const costoInput = document.getElementById('membresiaCosto');
        costoInput.style.borderColor = 'red';
        costoInput.focus();
        showNotification('⚠️ El costo debe ser mayor a 0', 'error');
        return;
    }
    
    // Limpiar estilos de error si la validación pasa
    document.getElementById('membresiaAtleta').style.borderColor = '';
    document.getElementById('membresiaTipo').style.borderColor = '';
    document.getElementById('membresiaCosto').style.borderColor = '';
    
    // Obtener el ID del usuario actual para idUsuarioRegistro
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    const idUsuarioRegistro = userData.idUsuario || userData.id || 1; // Fallback a 1 si no se encuentra
    
    const membresiaData = {
        idAtleta: idAtleta,
        idTipoMembresia: idTipoMembresia,
        fechaInicio: document.getElementById('membresiaFechaInicio').value,
        fechaVencimiento: document.getElementById('membresiaFechaFin').value,
        precioPagado: precioPagado,
        idEstadoMembresia: idEstadoMembresia,
        idUsuarioRegistro: idUsuarioRegistro,
        observaciones: document.getElementById('membresiaObservaciones').value || null
    };
    
    console.log('Datos de membresía a enviar:', membresiaData);
    
    try {
        if (editingMembresiaId) {
            const result = await api.updateMembership(editingMembresiaId, membresiaData);
            console.log('Respuesta actualización:', result);
            showNotification('Membresía actualizada exitosamente', 'success');
        } else {
            const result = await api.createMembership(membresiaData);
            console.log('Respuesta creación:', result);
            showNotification('Membresía creada exitosamente', 'success');
        }
        
        closeMembresiaModal();
        if (typeof loadMembresias === 'function') loadMembresias();
        if (typeof loadDashboardStats === 'function') loadDashboardStats();
        
    } catch (error) {
        console.error('Error completo al guardar membresía:', error);
        const errorMsg = error.message || 'Error desconocido';
        showNotification('Error al guardar membresía: ' + errorMsg, 'error');
    }
}

// ===================================
// MODAL: PAGO
// ===================================
function openPagoModal() {
    const modal = document.getElementById('pagoModal');
    const form = document.getElementById('pagoForm');
    
    form.reset();
    loadAtletasSelect('pagoAtleta');
    
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('pagoFecha').value = today;
    
    modal.style.display = 'flex';
}

function closePagoModal() {
    document.getElementById('pagoModal').style.display = 'none';
}

async function loadAtletaMembresias() {
    const atletaId = document.getElementById('pagoAtleta').value;
    const select = document.getElementById('pagoMembresia');
    
    select.innerHTML = '<option value="">Cargando...</option>';
    
    if (!atletaId) {
        select.innerHTML = '<option value="">Primero seleccione un atleta...</option>';
        return;
    }
    
    try {
        const membresias = await api.getMembershipsByAthlete(atletaId);
        console.log('Membresías del atleta:', membresias);
        
        if (membresias.length === 0) {
            select.innerHTML = '<option value="">No hay membresías para este atleta</option>';
            return;
        }
        
        select.innerHTML = '<option value="">Seleccionar membresía...</option>';
        membresias.forEach(m => {
            const option = document.createElement('option');
            // Usar idMembresia en lugar de id
            option.value = m.idMembresia || m.id;
            // Adaptar a los nombres de campos que devuelve el backend
            const tipo = m.nombreTipo || m.tipoMembresia || 'Membresía';
            const precio = m.precioPagado || m.costo || 0;
            const inicio = m.fechaInicio || '';
            const fin = m.fechaVencimiento || m.fechaFin || '';
            option.textContent = `${tipo} - $${precio} (${inicio} a ${fin})`;
            option.setAttribute('data-costo', precio);
            select.appendChild(option);
        });
        
        select.addEventListener('change', function() {
            const selectedOption = this.options[this.selectedIndex];
            const costo = selectedOption.getAttribute('data-costo');
            if (costo) {
                document.getElementById('pagoMonto').value = costo;
            }
        }, { once: true });
        
    } catch (error) {
        select.innerHTML = '<option value="">Error al cargar membresías</option>';
        console.error('Error cargando membresías:', error);
    }
}

async function handlePagoSubmit(e) {
    e.preventDefault();
    
    const idMembresia = parseInt(document.getElementById('pagoMembresia').value);
    const monto = parseFloat(document.getElementById('pagoMonto').value);
    const metodoPagoText = document.getElementById('pagoMetodo').value;
    
    // Validar campos requeridos
    if (!idMembresia || isNaN(idMembresia)) {
        showNotification('⚠️ Debe seleccionar una membresía', 'error');
        return;
    }
    
    if (isNaN(monto) || monto <= 0) {
        showNotification('⚠️ El monto debe ser mayor a 0', 'error');
        return;
    }
    
    if (!metodoPagoText) {
        showNotification('⚠️ Debe seleccionar un método de pago', 'error');
        return;
    }
    
    // Mapear texto del método de pago a ID
    const metodoPagoMap = {
        'Efectivo': 1,
        'EFECTIVO': 1,
        'Tarjeta': 2,
        'TARJETA_DEBITO': 2,
        'TARJETA_CREDITO': 3,
        'Transferencia': 4,
        'TRANSFERENCIA': 4,
        'PAYPAL': 5,
        'Otro': 6,
        'OTRO': 6
    };
    
    const idMetodoPago = metodoPagoMap[metodoPagoText] || 1;
    
    // Obtener ID del usuario actual
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    const idUsuarioRegistro = userData.idUsuario || userData.id || 1;
    
    const pagoData = {
        idMembresia: idMembresia,
        idMetodoPago: idMetodoPago,
        monto: monto,
        fechaPago: document.getElementById('pagoFecha').value,
        concepto: 'Pago de membresía',
        referencia: document.getElementById('pagoReferencia').value || null,
        notas: document.getElementById('pagoObservaciones').value || null,
        idUsuarioRegistro: idUsuarioRegistro
    };
    
    console.log('Datos de pago a enviar:', pagoData);
    
    try {
        await api.createPayment(pagoData);
        showNotification('Pago registrado exitosamente', 'success');
        
        closePagoModal();
        if (typeof loadPagos === 'function') loadPagos();
        if (typeof loadDashboardStats === 'function') loadDashboardStats();
        
    } catch (error) {
        showNotification('Error al registrar pago: ' + error.message, 'error');
        console.error(error);
    }
}

// ===================================
// MODAL: ASISTENCIA
// ===================================
function openAsistenciaModal() {
    const modal = document.getElementById('asistenciaModal');
    const form = document.getElementById('asistenciaForm');
    
    form.reset();
    loadAtletasSelect('asistenciaAtleta');
    
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toTimeString().slice(0, 5);
    
    document.getElementById('asistenciaFecha').value = today;
    document.getElementById('asistenciaHoraEntrada').value = now;
    
    modal.style.display = 'flex';
}

function closeAsistenciaModal() {
    document.getElementById('asistenciaModal').style.display = 'none';
}

async function handleAsistenciaSubmit(e) {
    e.preventDefault();
    
    const idAtleta = parseInt(document.getElementById('asistenciaAtleta').value);
    
    // Validar que se haya seleccionado un atleta
    if (!idAtleta || isNaN(idAtleta)) {
        showNotification('⚠️ Debe seleccionar un atleta', 'error');
        return;
    }
    
    // Obtener ID del usuario actual
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    const idUsuarioRegistroEntrada = userData.idUsuario || userData.id || 1;
    
    try {
        // Primero obtener las membresías activas del atleta
        const membresias = await api.getMembershipsByAthlete(idAtleta);
        
        if (!membresias || membresias.length === 0) {
            showNotification('⚠️ El atleta no tiene membresías activas', 'error');
            return;
        }
        
        // Usar la membresía más reciente activa
        const membresiaActiva = membresias.find(m => m.idEstadoMembresia === 1) || membresias[0];
        
        // Obtener valores del formulario
        const horaEntrada = document.getElementById('asistenciaHoraEntrada').value;
        const fechaAsistencia = document.getElementById('asistenciaFecha').value;
        
        const asistenciaData = {
            idAtleta: idAtleta,
            idMembresia: membresiaActiva.idMembresia || membresiaActiva.id,
            fechaAsistencia: fechaAsistencia,
            horaEntrada: `${horaEntrada}:00`,
            idUsuarioRegistroEntrada: idUsuarioRegistroEntrada,
            observaciones: document.getElementById('asistenciaObservaciones').value || null
        };
        
        console.log('Datos de asistencia a enviar:', asistenciaData);
        
        await api.registerEntry(asistenciaData);
        showNotification('✅ Entrada registrada exitosamente', 'success');
        
        closeAsistenciaModal();
        if (typeof loadAsistencias === 'function') loadAsistencias();
        if (typeof loadDashboardStats === 'function') loadDashboardStats();
        
    } catch (error) {
        showNotification('Error al registrar entrada: ' + error.message, 'error');
        console.error('Error completo:', error);
    }
}

// ===================================
// MODAL: REGISTRAR SALIDA
// ===================================
let editingSalidaId = null;

function openSalidaModal(asistenciaId, atletaNombre, horaEntrada) {
    editingSalidaId = asistenciaId;
    const modal = document.getElementById('salidaModal');
    const form = document.getElementById('salidaForm');
    
    form.reset();
    
    document.getElementById('salidaAsistenciaId').value = asistenciaId;
    document.getElementById('salidaAtletaNombre').textContent = atletaNombre;
    document.getElementById('salidaHoraEntrada').textContent = horaEntrada;
    
    const now = new Date().toTimeString().slice(0, 5);
    document.getElementById('salidaHoraSalida').value = now;
    
    modal.style.display = 'flex';
}

function closeSalidaModal() {
    document.getElementById('salidaModal').style.display = 'none';
    editingSalidaId = null;
}

async function handleSalidaSubmit(e) {
    e.preventDefault();
    
    // Convertir hora al formato HH:mm:ss que java.sql.Time puede parsear
    const horaSalidaValue = document.getElementById('salidaHoraSalida').value;
    
    try {
        await api.updateAttendance(editingSalidaId, {
            horaSalida: `${horaSalidaValue}:00`
        });
        
        showNotification('Salida registrada exitosamente', 'success');
        
        closeSalidaModal();
        if (typeof loadAsistencias === 'function') loadAsistencias();
        if (typeof loadDashboardStats === 'function') loadDashboardStats();
        
    } catch (error) {
        showNotification('Error al registrar salida: ' + error.message, 'error');
        console.error(error);
    }
}

// ===================================
// MODAL: USUARIO
// ===================================
let editingUsuarioId = null;

function openUsuarioModal(usuarioId = null) {
    editingUsuarioId = usuarioId;
    const modal = document.getElementById('usuarioModal');
    const title = document.getElementById('usuarioModalTitle');
    const form = document.getElementById('usuarioForm');
    const passwordField = document.getElementById('usuarioPassword');
    const passwordRequired = document.getElementById('passwordRequired');
    
    form.reset();
    
    if (usuarioId) {
        title.textContent = 'Editar Usuario';
        passwordField.removeAttribute('required');
        if (passwordRequired) passwordRequired.style.display = 'none';
        loadUsuarioData(usuarioId);
    } else {
        title.textContent = 'Nuevo Usuario';
        passwordField.setAttribute('required', 'required');
        if (passwordRequired) passwordRequired.style.display = 'inline';
    }
    
    modal.style.display = 'flex';
}

function closeUsuarioModal() {
    document.getElementById('usuarioModal').style.display = 'none';
    editingUsuarioId = null;
}

async function loadUsuarioData(usuarioId) {
    try {
        const usuario = await api.getUserById(usuarioId);
        
        // Manejar diferentes formatos de respuesta del backend
        const id = usuario.idUsuario || usuario.id_usuario || usuario.id;
        const nombre = usuario.nombre || '';
        const apellidoPaterno = usuario.apellidoPaterno || usuario.apellido_paterno || '';
        const apellidoMaterno = usuario.apellidoMaterno || usuario.apellido_materno || '';
        const email = usuario.email || '';
        const telefono = usuario.telefono || '';
        const fechaNacimiento = usuario.fechaNacimiento || usuario.fecha_nacimiento || '';
        const idRol = usuario.idRol || usuario.id_rol || 2;
        
        document.getElementById('usuarioId').value = id;
        document.getElementById('usuarioNombre').value = nombre;
        document.getElementById('usuarioApellidoPaterno').value = apellidoPaterno;
        document.getElementById('usuarioApellidoMaterno').value = apellidoMaterno;
        document.getElementById('usuarioEmail').value = email;
        document.getElementById('usuarioTelefono').value = telefono;
        document.getElementById('usuarioFechaNacimiento').value = fechaNacimiento;
        document.getElementById('usuarioRol').value = idRol;
        
    } catch (error) {
        showNotification('Error al cargar datos del usuario', 'error');
        console.error(error);
    }
}

async function handleUsuarioSubmit(e) {
    e.preventDefault();
    
    const usuarioData = {
        nombre: document.getElementById('usuarioNombre').value,
        apellidoPaterno: document.getElementById('usuarioApellidoPaterno').value,
        apellidoMaterno: document.getElementById('usuarioApellidoMaterno').value,
        email: document.getElementById('usuarioEmail').value,
        telefono: document.getElementById('usuarioTelefono').value,
        fechaNacimiento: document.getElementById('usuarioFechaNacimiento').value,
        idRol: parseInt(document.getElementById('usuarioRol').value)
    };
    
    const password = document.getElementById('usuarioPassword').value;
    if (password) {
        usuarioData.password = password;
    }
    
    try {
        if (editingUsuarioId) {
            await api.updateUser(editingUsuarioId, usuarioData);
            showNotification('Usuario actualizado exitosamente', 'success');
        } else {
            await api.register(usuarioData);
            showNotification('Usuario creado exitosamente', 'success');
        }
        
        closeUsuarioModal();
        if (typeof loadUsuarios === 'function') loadUsuarios();
        
    } catch (error) {
        showNotification('Error al guardar usuario: ' + error.message, 'error');
        console.error(error);
    }
}

// ===================================
// MODAL: CONFIRMAR ELIMINACIÓN
// ===================================
let confirmCallback = null;

function openConfirmModal(message, callback) {
    confirmCallback = callback;
    document.getElementById('confirmMessage').textContent = message;
    document.getElementById('confirmModal').style.display = 'flex';
    
    document.getElementById('confirmButton').onclick = function() {
        if (confirmCallback) confirmCallback();
        closeConfirmModal();
    };
}

function closeConfirmModal() {
    document.getElementById('confirmModal').style.display = 'none';
    confirmCallback = null;
}

// ===================================
// FUNCIONES AUXILIARES
// ===================================

async function loadAtletasSelect(selectId) {
    const select = document.getElementById(selectId);
    if (!select) {
        console.error(`Select element not found: ${selectId}`);
        return;
    }
    
    select.innerHTML = '<option value="">Cargando...</option>';
    
    try {
        const atletas = await api.getActiveAthletes();
        console.log(`Atletas cargados para ${selectId}:`, atletas);
        
        // Debug: ver estructura del primer atleta
        if (atletas.length > 0) {
            console.log('Estructura del primer atleta:', atletas[0]);
            console.log('Claves disponibles:', Object.keys(atletas[0]));
        }
        
        select.innerHTML = '<option value="">Seleccionar atleta...</option>';
        atletas.forEach(atleta => {
            const option = document.createElement('option');
            // Intentar diferentes nombres de propiedad para el ID
            const atletaId = atleta.idAtleta || atleta.id || atleta.ID;
            option.value = atletaId;
            option.textContent = `${atleta.nombre} ${atleta.apellidoPaterno} ${atleta.apellidoMaterno}`;
            console.log(`Agregando opción: value=${option.value}, text=${option.textContent}`);
            select.appendChild(option);
        });
        
        console.log(`Select ${selectId} ahora tiene ${select.options.length} opciones`);
        
    } catch (error) {
        select.innerHTML = '<option value="">Error al cargar atletas</option>';
        console.error(`Error cargando atletas para ${selectId}:`, error);
    }
}

async function loadTiposMembresiaSelect() {
    const select = document.getElementById('membresiaTipo');
    if (!select) {
        console.error('Select de tipos de membresía no encontrado');
        return;
    }
    
    select.innerHTML = '<option value="">Cargando tipos...</option>';
    
    try {
        const tipos = await api.getMembershipTypes();
        console.log('Tipos de membresía desde backend:', tipos);
        
        select.innerHTML = '<option value="">Seleccionar tipo...</option>';
        tipos.forEach(tipo => {
            const option = document.createElement('option');
            const tipoId = tipo.idTipoMembresia || tipo.id;
            option.value = tipoId;
            option.textContent = tipo.nombre || tipo.nombreTipo || tipo.tipo;
            console.log(`Tipo membresía: id=${option.value}, nombre=${option.textContent}`);
            select.appendChild(option);
        });
        
        console.log(`Tipos de membresía cargados: ${select.options.length - 1}`);
        
    } catch (error) {
        console.error('Error cargando tipos de membresía:', error);
        // Fallback a tipos estáticos si el endpoint no existe
        console.log('Usando tipos de membresía estáticos como fallback');
        select.innerHTML = `
            <option value="">Seleccionar tipo...</option>
            <option value="1">Diaria</option>
            <option value="2">Semanal</option>
            <option value="3">Mensual</option>
            <option value="4">Trimestral</option>
            <option value="5">Semestral</option>
            <option value="6">Anual</option>
        `;
    }
}

window.addEventListener('click', function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
});

// Notificaciones
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    setTimeout(() => notification.classList.add('show'), 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}
