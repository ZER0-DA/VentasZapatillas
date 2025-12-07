const API_PEDIDO_URL = `${API_BASE_URL}/api/Pedido`;

let pedidoActual = null;

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    if (!verificarSesion()) return;

    const urlParams = new URLSearchParams(window.location.search);
    const idPedido = urlParams.get('id');

    if (!idPedido) {
        mostrarError('No se especificó el pedido a mostrar');
        return;
    }

    cargarDetallePedido(parseInt(idPedido));
    actualizarBadgeCarrito();
});

// ============================================
// CARGAR DETALLE DEL PEDIDO
// ============================================
async function cargarDetallePedido(idPedido) {
    const token = obtenerToken();
    mostrarSeccion('loading');

    try {
        const respuesta = await fetch(`${API_PEDIDO_URL}/${idPedido}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (respuesta.status === 401) {
            mostrarNotificacion('Sesión expirada', false);
            setTimeout(() => window.location.href = 'Login.html', 1500);
            return;
        }

        if (!respuesta.ok) {
            throw new Error('Error al obtener el pedido');
        }

        const pedido = await respuesta.json();
        pedidoActual = pedido;
        renderizarDetalle(pedido);
        mostrarSeccion('content');

    } catch (error) {
        console.error('Error al cargar pedido:', error);
        mostrarError('No se pudo cargar el pedido');
    }
}

// ============================================
// RENDERIZAR DETALLE
// ============================================
function renderizarDetalle(pedido) {
    const numeroEl = document.getElementById('pedido-numero');
    const fechaEl = document.getElementById('pedido-fecha');

    if (numeroEl) {
        numeroEl.textContent = `Pedido #${pedido.idPedido.toString().padStart(6, '0')}`;
    }

    if (fechaEl) {
        const fecha = new Date(pedido.fechaPedido);
        const fechaFormateada = fecha.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        fechaEl.querySelector('span').textContent = fechaFormateada;
    }

    renderizarTimeline(pedido.estadoPedido);

    document.getElementById('cliente-nombre').textContent = pedido.nombreUsuario;
    document.getElementById('cliente-email').textContent = pedido.correoUsuario;
    document.getElementById('cliente-id').textContent = pedido.idUsuario;

    document.getElementById('resumen-items').textContent = pedido.detalles.length;
    document.getElementById('resumen-subtotal').textContent = `$${pedido.total.toFixed(2)}`;
    document.getElementById('resumen-total').textContent = `$${pedido.total.toFixed(2)}`;

    renderizarProductos(pedido.detalles);

    const btnCancelar = document.getElementById('btn-cancelar-pedido');
    if (btnCancelar) {
        btnCancelar.style.display = 
            (pedido.estadoPedido === 'Pendiente' || pedido.estadoPedido === 'Procesando') 
            ? 'inline-flex' 
            : 'none';
    }
}

// ============================================
// RENDERIZAR TIMELINE
// ============================================
function renderizarTimeline(estadoActual) {
    const timelineContainer = document.getElementById('timeline-container');
    const estadoBadge = document.getElementById('estado-actual-badge');

    if (!timelineContainer || !estadoBadge) return;

    const estados = [
        { nombre: 'Pendiente', icono: 'fas fa-clock', completado: false },
        { nombre: 'Procesando', icono: 'fas fa-cog', completado: false },
        { nombre: 'Enviado', icono: 'fas fa-truck', completado: false },
        { nombre: 'Entregado', icono: 'fas fa-check-circle', completado: false }
    ];

    let encontrado = false;
    estados.forEach(estado => {
        if (!encontrado) {
            estado.completado = true;
        }
        if (estado.nombre === estadoActual) {
            encontrado = true;
        }
    });

    if (estadoActual === 'Cancelado') {
        timelineContainer.innerHTML = `
            <div class="timeline-item cancelado">
                <i class="fas fa-times-circle"></i>
                <span>Cancelado</span>
            </div>
        `;
        estadoBadge.innerHTML = `
            <i class="fas fa-times-circle"></i>
            <span>Pedido Cancelado</span>
        `;
        estadoBadge.className = 'estado-badge-grande estado-cancelado';
        return;
    }

    timelineContainer.innerHTML = '';
    estados.forEach((estado, index) => {
        const item = document.createElement('div');
        item.className = `timeline-item ${estado.completado ? 'completado' : ''} ${estado.nombre === estadoActual ? 'actual' : ''}`;
        
        item.innerHTML = `
            <i class="${estado.icono}"></i>
            <span>${estado.nombre}</span>
        `;
        
        timelineContainer.appendChild(item);

        if (index < estados.length - 1) {
            const linea = document.createElement('div');
            linea.className = `timeline-line ${estado.completado ? 'completado' : ''}`;
            timelineContainer.appendChild(linea);
        }
    });

    const estadoConfig = obtenerConfigEstado(estadoActual);
    estadoBadge.innerHTML = `
        <i class="${estadoConfig.icono}"></i>
        <span>${estadoActual}</span>
    `;
    estadoBadge.className = `estado-badge-grande ${estadoConfig.clase}`;
}

function obtenerConfigEstado(estado) {
    const config = {
        'Pendiente': { clase: 'estado-pendiente', icono: 'fas fa-clock' },
        'Procesando': { clase: 'estado-procesando', icono: 'fas fa-cog fa-spin' },
        'Enviado': { clase: 'estado-enviado', icono: 'fas fa-truck' },
        'Entregado': { clase: 'estado-entregado', icono: 'fas fa-check-circle' },
        'Cancelado': { clase: 'estado-cancelado', icono: 'fas fa-times-circle' }
    };
    return config[estado] || config['Pendiente'];
}

// ============================================
// RENDERIZAR PRODUCTOS
// ============================================
function renderizarProductos(detalles) {
    const container = document.getElementById('productos-detalle-container');
    if (!container) return;

    container.innerHTML = '';

    detalles.forEach(detalle => {
        const productoCard = document.createElement('div');
        productoCard.className = 'producto-detalle-card';

        productoCard.innerHTML = `
            <div class="producto-detalle-info">
                <h4>${detalle.nombreProducto}</h4>
                <p class="producto-marca">${detalle.marcaProducto}</p>
                <p class="producto-talla">Talla: ${detalle.talla}</p>
            </div>
            <div class="producto-detalle-cantidad">
                <span class="cantidad-badge">${detalle.cantidad}x</span>
            </div>
            <div class="producto-detalle-precio">
                <p class="precio-unitario">$${detalle.precioUnitario.toFixed(2)}</p>
                <p class="subtotal">$${detalle.subtotal.toFixed(2)}</p>
            </div>
        `;

        container.appendChild(productoCard);
    });
}

// ============================================
// DESCARGAR FACTURA
// ============================================
async function descargarFactura() {
    if (!pedidoActual) {
        mostrarNotificacion('Error: No hay pedido disponible', false);
        return;
    }

    const token = obtenerToken();

    try {
        mostrarNotificacion('Generando factura...', true);

        const respuesta = await fetch(`${API_PEDIDO_URL}/${pedidoActual.idPedido}/factura/pdf`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!respuesta.ok) {
            throw new Error('Error al generar factura');
        }

        const blob = await respuesta.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Factura_${pedidoActual.idPedido.toString().padStart(6, '0')}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);

        mostrarNotificacion('Factura descargada exitosamente', true);

    } catch (error) {
        console.error('Error al descargar factura:', error);
        mostrarNotificacion('Error al descargar la factura', false);
    }
}

// ============================================
// REENVIAR FACTURA
// ============================================
async function reenviarFactura() {
    if (!pedidoActual) {
        mostrarNotificacion('Error: No hay pedido disponible', false);
        return;
    }

    const token = obtenerToken();

    try {
        mostrarNotificacion('Enviando factura por email...', true);

        const respuesta = await fetch(`${API_PEDIDO_URL}/${pedidoActual.idPedido}/reenviar-factura`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!respuesta.ok) {
            throw new Error('Error al reenviar factura');
        }

        mostrarNotificacion('Factura reenviada exitosamente. Revisa tu correo.', true);

    } catch (error) {
        console.error('Error al reenviar factura:', error);
        mostrarNotificacion('Error al reenviar la factura', false);
    }
}

// ============================================
// CANCELAR PEDIDO
// ============================================
function abrirModalCancelar() {
    if (!pedidoActual) return;

    const modal = document.getElementById('modal-cancelar');
    const numeroEl = document.getElementById('modal-pedido-numero');
    const totalEl = document.getElementById('modal-pedido-total');

    if (numeroEl) {
        numeroEl.textContent = `#${pedidoActual.idPedido.toString().padStart(6, '0')}`;
    }
    if (totalEl) {
        totalEl.textContent = `$${pedidoActual.total.toFixed(2)}`;
    }

    if (modal) {
        modal.style.display = 'flex';
    }
}

function cerrarModalCancelar() {
    const modal = document.getElementById('modal-cancelar');
    if (modal) {
        modal.style.display = 'none';
    }
}

async function confirmarCancelacion() {
    if (!pedidoActual) return;

    const token = obtenerToken();

    try {
        cerrarModalCancelar();
        mostrarNotificacion('Cancelando pedido...', true);

        const respuesta = await fetch(`${API_PEDIDO_URL}/${pedidoActual.idPedido}/cancelar`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!respuesta.ok) {
            const errorData = await respuesta.json();
            throw new Error(errorData.mensaje || 'Error al cancelar pedido');
        }

        mostrarNotificacion('Pedido cancelado exitosamente. Stock restaurado.', true);
        
        setTimeout(() => location.reload(), 1500);

    } catch (error) {
        console.error('Error al cancelar pedido:', error);
        mostrarNotificacion(`Error: ${error.message}`, false);
    }
}

// ============================================
// MOSTRAR SECCIONES
// ============================================
function mostrarSeccion(seccion) {
    const loading = document.getElementById('loading-detalle');
    const content = document.getElementById('pedido-detalle-content');
    const error = document.getElementById('error-detalle');

    if (loading) loading.style.display = 'none';
    if (content) content.style.display = 'none';
    if (error) error.style.display = 'none';

    switch(seccion) {
        case 'loading':
            if (loading) loading.style.display = 'flex';
            break;
        case 'content':
            if (content) content.style.display = 'block';
            break;
        case 'error':
            if (error) error.style.display = 'flex';
            break;
    }
}

function mostrarError(mensaje) {
    const errorMensajeEl = document.getElementById('error-mensaje');
    if (errorMensajeEl) {
        errorMensajeEl.textContent = mensaje;
    }
    
    mostrarSeccion('error');
}

// Cerrar modal al hacer clic fuera
window.onclick = function(event) {
    const modal = document.getElementById('modal-cancelar');
    if (event.target === modal) {
        cerrarModalCancelar();
    }
}