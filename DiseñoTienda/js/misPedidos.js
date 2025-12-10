const API_PEDIDO_URL = `${API_BASE_URL}/api/Pedido`;

let pedidosOriginales = [];
let pedidosFiltrados = [];
let pedidoAcancelar = null;

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    if (!verificarSesion()) return;

    cargarPedidos();
    actualizarBadgeCarrito();
});

// ============================================
// CARGAR PEDIDOS
// ============================================
async function cargarPedidos() {
    const token = obtenerToken();
    const usuarioId = localStorage.getItem('usuarioId');

    if (!usuarioId) {
        mostrarError('No se pudo identificar al usuario');
        return;
    }

    mostrarSeccion('loading');

    try {
        const respuesta = await fetch(`${API_PEDIDO_URL}/usuario/${usuarioId}`, {
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
            throw new Error('Error al obtener pedidos');
        }

        const pedidos = await respuesta.json();
        pedidosOriginales = pedidos;
        pedidosFiltrados = pedidos;

        if (pedidos.length === 0) {
            mostrarSeccion('sin-pedidos');
        } else {
            renderizarPedidos(pedidos);
            mostrarSeccion('lista');
        }

    } catch (error) {
        console.error('Error al cargar pedidos:', error);
        mostrarError('Error al cargar los pedidos');
    }
}

// ============================================
// RENDERIZAR PEDIDOS
// ============================================
function renderizarPedidos(pedidos) {
    const container = document.getElementById('pedidos-lista');
    if (!container) return;

    container.innerHTML = '';

    pedidos.forEach(pedido => {
        const pedidoCard = crearPedidoCard(pedido);
        container.appendChild(pedidoCard);
    });
}

function crearPedidoCard(pedido) {
    const card = document.createElement('div');
    card.className = 'pedido-card';

    const fecha = new Date(pedido.fechaPedido);
    const fechaFormateada = fecha.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const estadoClass = obtenerClaseEstado(pedido.estadoPedido);
    const estadoIcono = obtenerIconoEstado(pedido.estadoPedido);

    card.innerHTML = `
        <div class="pedido-header">
            <div class="pedido-info-principal">
                <h3>
                    <i class="fas fa-receipt"></i> 
                    Pedido #${pedido.idPedido.toString().padStart(6, '0')}
                </h3>
                <p class="pedido-fecha">
                    <i class="far fa-calendar-alt"></i> ${fechaFormateada}
                </p>
            </div>
            <span class="pedido-estado ${estadoClass}">
                <i class="${estadoIcono}"></i>
                ${pedido.estadoPedido}
            </span>
        </div>

        <div class="pedido-body">
            <div class="pedido-detalle-row">
                <div class="pedido-stat">
                    <i class="fas fa-box"></i>
                    <div>
                        <span class="stat-label">Artículos</span>
                        <span class="stat-value">${pedido.cantidadItems}</span>
                    </div>
                </div>
                <div class="pedido-stat">
                    <i class="fas fa-dollar-sign"></i>
                    <div>
                        <span class="stat-label">Total</span>
                        <span class="stat-value">$${pedido.total.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            <div class="pedido-acciones">
                <a href="detallePedido.html?id=${pedido.idPedido}" class="btn-ver-detalle">
                    <i class="fas fa-eye"></i> Ver Detalle
                </a>
                <button onclick="descargarFactura(${pedido.idPedido})" class="btn-factura">
                    <i class="fas fa-file-pdf"></i> Factura PDF
                </button>
                ${pedido.estadoPedido === 'Pendiente' || pedido.estadoPedido === 'Procesando' 
                    ? `<button onclick="abrirModalCancelar(${pedido.idPedido})" class="btn-cancelar">
                        <i class="fas fa-times-circle"></i> Cancelar
                    </button>` 
                    : ''}
            </div>
        </div>
    `;

    return card;
}

// ============================================
// UTILIDADES DE ESTADOS
// ============================================
function obtenerClaseEstado(estado) {
    const estados = {
        'Pendiente': 'estado-pendiente',
        'Procesando': 'estado-procesando',
        'Enviado': 'estado-enviado',
        'Entregado': 'estado-entregado',
        'Cancelado': 'estado-cancelado'
    };
    return estados[estado] || 'estado-pendiente';
}

function obtenerIconoEstado(estado) {
    const iconos = {
        'Pendiente': 'fas fa-clock',
        'Procesando': 'fas fa-cog fa-spin',
        'Enviado': 'fas fa-truck',
        'Entregado': 'fas fa-check-circle',
        'Cancelado': 'fas fa-times-circle'
    };
    return iconos[estado] || 'fas fa-clock';
}

// ============================================
// FILTROS Y ORDENAMIENTO
// ============================================
function filtrarPedidos() {
    const filtroEstado = document.getElementById('filtro-estado').value;

    if (filtroEstado === 'todos') {
        pedidosFiltrados = [...pedidosOriginales];
    } else {
        pedidosFiltrados = pedidosOriginales.filter(p => p.estadoPedido === filtroEstado);
    }

    if (pedidosFiltrados.length === 0) {
        mostrarSeccion('sin-pedidos');
        document.querySelector('.sin-pedidos-card h3').textContent = 'No hay pedidos con ese estado';
    } else {
        renderizarPedidos(pedidosFiltrados);
        mostrarSeccion('lista');
    }
}

function ordenarPedidos() {
    const ordenarPor = document.getElementById('ordenar-por').value;

    switch(ordenarPor) {
        case 'reciente':
            pedidosFiltrados.sort((a, b) => new Date(b.fechaPedido) - new Date(a.fechaPedido));
            break;
        case 'antiguo':
            pedidosFiltrados.sort((a, b) => new Date(a.fechaPedido) - new Date(b.fechaPedido));
            break;
        case 'mayor-precio':
            pedidosFiltrados.sort((a, b) => b.total - a.total);
            break;
        case 'menor-precio':
            pedidosFiltrados.sort((a, b) => a.total - b.total);
            break;
    }

    renderizarPedidos(pedidosFiltrados);
}

// ============================================
// DESCARGAR FACTURA
// ============================================
async function descargarFactura(idPedido) {
    const token = obtenerToken();

    try {
        mostrarNotificacion('Generando factura...', true);

        const respuesta = await fetch(`${API_PEDIDO_URL}/${idPedido}/factura/pdf`, {
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
        a.download = `Factura_${idPedido.toString().padStart(6, '0')}.pdf`;
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
// CANCELAR PEDIDO
// ============================================
function abrirModalCancelar(idPedido) {
    pedidoAcancelar = idPedido;
    
    const modal = document.getElementById('modal-cancelar');
    const pedidoIdEl = document.getElementById('modal-pedido-id');
    
    if (pedidoIdEl) {
        pedidoIdEl.textContent = `#${idPedido.toString().padStart(6, '0')}`;
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
    // ✅ NO resetear pedidoAcancelar aquí
}

async function confirmarCancelacion() {
    if (!pedidoAcancelar) return;

    const idPedido = pedidoAcancelar; // ✅ Guardar en variable local
    const token = obtenerToken();

    try {
        cerrarModalCancelar();
        mostrarNotificacion('Cancelando pedido...', true);

        const respuesta = await fetch(`${API_PEDIDO_URL}/${idPedido}/cancelar`, {
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
        
        pedidoAcancelar = null; // ✅ Resetear DESPUÉS de usar
        setTimeout(() => cargarPedidos(), 1000);

    } catch (error) {
        console.error('Error al cancelar pedido:', error);
        mostrarNotificacion(`Error: ${error.message}`, false);
        pedidoAcancelar = null; // ✅ Resetear también en error
    }
}

// ============================================
// MOSTRAR SECCIONES
// ============================================
function mostrarSeccion(seccion) {
    const loading = document.getElementById('loading-pedidos');
    const lista = document.getElementById('pedidos-lista');
    const sinPedidos = document.getElementById('sin-pedidos');
    const error = document.getElementById('error-pedidos');

    if (loading) loading.style.display = 'none';
    if (lista) lista.style.display = 'none';
    if (sinPedidos) sinPedidos.style.display = 'none';
    if (error) error.style.display = 'none';

    switch(seccion) {
        case 'loading':
            if (loading) loading.style.display = 'flex';
            break;
        case 'lista':
            if (lista) lista.style.display = 'grid';
            break;
        case 'sin-pedidos':
            if (sinPedidos) sinPedidos.style.display = 'flex';
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