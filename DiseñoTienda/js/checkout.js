const API_CARRITO_URL = `${API_BASE_URL}/api/Carrito`;
const API_PEDIDO_URL = `${API_BASE_URL}/api/Pedido`;

let carritoActual = null;
let usuarioId = null;

// ============================================
// INICIALIZACIÓN
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    debugLog('CHECKOUT', '🚀 Iniciando checkout...');
    
    if (!verificarSesion()) {
        debugLog('ERROR', '❌ Sin sesión - redirigiendo');
        return;
    }

    cargarDatosUsuario();
    cargarResumenCarrito();
    actualizarBadgeCarrito();

    // Conectar botón de confirmar pedido
    const btnConfirmar = document.getElementById('confirmar-pedido-btn');
    if (btnConfirmar) {
        btnConfirmar.addEventListener('click', confirmarPedido);
    }
});

// ============================================
// CARGAR DATOS DEL USUARIO
// ============================================

function cargarDatosUsuario() {
    debugLog('CHECKOUT', '📋 Cargando datos del usuario...');
    
    const email = localStorage.getItem('usuarioCorreo');
    usuarioId = parseInt(localStorage.getItem('usuarioId'));

    debugLog('CHECKOUT', `Usuario: ${email}, ID: ${usuarioId}`);

    const emailEl = document.getElementById('usuario-email');
    const idEl = document.getElementById('usuario-id');

    if (emailEl) emailEl.textContent = email || 'No disponible';
    if (idEl) idEl.textContent = usuarioId || 'No disponible';

    if (!usuarioId) {
        debugLog('ERROR', '❌ No se pudo obtener el ID de usuario');
        mostrarError('No se pudo obtener la información del usuario');
    }
}

// ============================================
// CARGAR RESUMEN DEL CARRITO
// ============================================

async function cargarResumenCarrito() {
    debugLog('CHECKOUT', '🛒 Obteniendo carrito...');
    
    const token = obtenerToken();
    const container = document.getElementById('productos-resumen-container');
    
    if (!container) return;
    
    container.innerHTML = '<p class="loading-text">Cargando productos...</p>';

    try {
        const respuesta = await fetch(`${API_CARRITO_URL}/ObtenerCarrito`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (respuesta.status === 401) {
            debugLog('ERROR', '❌ Token expirado');
            mostrarNotificacion('Sesión expirada', false);
            setTimeout(() => window.location.href = 'Login.html', 1500);
            return;
        }

        if (!respuesta.ok) {
            throw new Error('Error al obtener el carrito');
        }

        const datos = await respuesta.json();
        debugLog('CHECKOUT', '✅ Carrito obtenido', datos);

        // Validar que hay productos
        if (!datos.productos || datos.productos.length === 0) {
            debugLog('CHECKOUT', '⚠️ Carrito vacío');
            mostrarError('Tu carrito está vacío');
            setTimeout(() => window.location.href = 'Carrito.html', 2000);
            return;
        }

        carritoActual = datos;
        renderizarResumen(datos);

    } catch (error) {
        debugLog('ERROR', '❌ Error al cargar carrito', error);
        mostrarError('Error al cargar el carrito');
        container.innerHTML = '<p class="error-text">No se pudo cargar el carrito</p>';
    }
}

// ============================================
// RENDERIZAR RESUMEN
// ============================================

function renderizarResumen(datos) {
    debugLog('CHECKOUT', '🎨 Renderizando resumen...');
    
    const container = document.getElementById('productos-resumen-container');
    if (!container) return;

    container.innerHTML = '';

    datos.productos.forEach(item => {
        const productoCard = document.createElement('div');
        productoCard.className = 'producto-resumen-item';

        const imageUrl = item.imagen 
            ? (item.imagen.startsWith("/") ? `${API_BASE_URL}${item.imagen}` : item.imagen)
            : "img/default.jpg";

        productoCard.innerHTML = `
            <img src="${imageUrl}" alt="${item.modelo}" class="producto-resumen-img">
            <div class="producto-resumen-info">
                <h4>${item.marca} - ${item.modelo}</h4>
                <p class="producto-resumen-precio">$${item.precio.toFixed(2)} × ${item.cantidad}</p>
            </div>
            <div class="producto-resumen-total">
                $${item.subtotal.toFixed(2)}
            </div>
        `;

        container.appendChild(productoCard);
    });

    // Actualizar totales
    const subtotalEl = document.getElementById('subtotal-checkout');
    const totalEl = document.getElementById('total-checkout');

    if (subtotalEl) subtotalEl.textContent = `$${datos.totalPagar.toFixed(2)}`;
    if (totalEl) totalEl.textContent = `$${datos.totalPagar.toFixed(2)}`;

    debugLog('CHECKOUT', `✅ Total: $${datos.totalPagar.toFixed(2)}`);
}

// ============================================
// CONFIRMAR PEDIDO
// ============================================

async function confirmarPedido() {
    debugLog('CHECKOUT', '🚀 Confirmando pedido...');

    if (!carritoActual || !carritoActual.productos || carritoActual.productos.length === 0) {
        debugLog('ERROR', '❌ No hay productos en el carrito');
        mostrarNotificacion('El carrito está vacío', false);
        return;
    }

    if (!usuarioId) {
        debugLog('ERROR', '❌ No hay ID de usuario');
        mostrarNotificacion('Error: No se pudo identificar al usuario', false);
        return;
    }

    // Mostrar loading
    mostrarSeccion('loading');
    
    const token = obtenerToken();

    // Preparar datos del pedido
    const items = carritoActual.productos.map(prod => ({
        idProducto: prod.idProducto,
        idVariante: prod.idVariante,
        cantidad: prod.cantidad
    }));

    const pedidoData = {
        idUsuario: usuarioId,
        items: items
    };

    debugLog('CHECKOUT', '📦 Datos del pedido', pedidoData);

    try {
        const respuesta = await fetch(API_PEDIDO_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(pedidoData)
        });

        debugLog('API', `Respuesta: ${respuesta.status} ${respuesta.statusText}`);

        const resultado = await respuesta.json();
        debugLog('API', 'Datos de respuesta', resultado);

        if (respuesta.ok) {
            debugLog('CHECKOUT', '✅ Pedido creado exitosamente', resultado);
            
            // Extraer el pedido de la respuesta
            const pedido = resultado.pedido;
            
            if (pedido) {
                mostrarExito(pedido);
                
                // Actualizar badge del carrito (ahora debería estar vacío)
                setTimeout(() => {
                    actualizarBadgeCarrito();
                }, 1000);
            } else {
                throw new Error('No se recibió información del pedido');
            }

        } else {
            debugLog('ERROR', '❌ Error al crear pedido', resultado);
            const mensaje = resultado.mensaje || 'Error al procesar el pedido';
            mostrarError(mensaje);
        }

    } catch (error) {
        debugLog('ERROR', '❌ Excepción al confirmar pedido', error);
        mostrarError(`Error: ${error.message || 'No se pudo conectar con el servidor'}`);
    }
}

// ============================================
// MOSTRAR SECCIONES
// ============================================

function mostrarSeccion(seccion) {
    const loading = document.getElementById('loading-section');
    const content = document.getElementById('checkout-content');
    const exito = document.getElementById('exito-section');
    const error = document.getElementById('error-section');

    // Ocultar todas
    if (loading) loading.style.display = 'none';
    if (content) content.style.display = 'none';
    if (exito) exito.style.display = 'none';
    if (error) error.style.display = 'none';

    // Mostrar la solicitada
    switch(seccion) {
        case 'loading':
            if (loading) loading.style.display = 'flex';
            break;
        case 'content':
            if (content) content.style.display = 'block';
            break;
        case 'exito':
            if (exito) exito.style.display = 'flex';
            break;
        case 'error':
            if (error) error.style.display = 'flex';
            break;
    }
}

function mostrarExito(pedido) {
    debugLog('CHECKOUT', '🎉 Mostrando éxito', pedido);
    
    const numeroPedidoEl = document.getElementById('numero-pedido');
    const totalPedidoEl = document.getElementById('total-pedido');

    if (numeroPedidoEl) {
        numeroPedidoEl.textContent = `#${pedido.idPedido.toString().padStart(6, '0')}`;
    }
    if (totalPedidoEl) {
        totalPedidoEl.textContent = `$${pedido.total.toFixed(2)}`;
    }

    mostrarSeccion('exito');
    mostrarNotificacion('¡Pedido realizado con éxito! 🎉', true);
}

function mostrarError(mensaje) {
    debugLog('CHECKOUT', '❌ Mostrando error', mensaje);
    
    const errorMensajeEl = document.getElementById('error-mensaje');
    if (errorMensajeEl) {
        errorMensajeEl.textContent = mensaje;
    }

    mostrarSeccion('error');
    mostrarNotificacion(mensaje, false);
}