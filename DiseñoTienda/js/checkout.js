const API_CARRITO_URL = `${API_BASE_URL}/api/Carrito`;
const API_PEDIDO_URL = `${API_BASE_URL}/api/Pedido`;

let carritoActual = null;
let usuarioId = null;

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    if (!verificarSesion()) return;

    cargarDatosUsuario();
    cargarResumenCarrito();
    actualizarBadgeCarrito();

    const btnConfirmar = document.getElementById('confirmar-pedido-btn');
    if (btnConfirmar) {
        btnConfirmar.addEventListener('click', confirmarPedido);
    }
});

// ============================================
// CARGAR DATOS DEL USUARIO
// ============================================
function cargarDatosUsuario() {
    const email = localStorage.getItem('usuarioCorreo');
    usuarioId = parseInt(localStorage.getItem('usuarioId'));

    const emailEl = document.getElementById('usuario-email');
    const idEl = document.getElementById('usuario-id');

    if (emailEl) emailEl.textContent = email || 'No disponible';
    if (idEl) idEl.textContent = usuarioId || 'No disponible';

    if (!usuarioId) {
        mostrarError('No se pudo obtener la información del usuario');
    }
}

// ============================================
// CARGAR RESUMEN DEL CARRITO
// ============================================
async function cargarResumenCarrito() {
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
            mostrarNotificacion('Sesión expirada', false);
            setTimeout(() => window.location.href = 'Login.html', 1500);
            return;
        }

        if (!respuesta.ok) {
            throw new Error('Error al obtener el carrito');
        }

        const datos = await respuesta.json();

        if (!datos.productos || datos.productos.length === 0) {
            mostrarError('Tu carrito está vacío');
            setTimeout(() => window.location.href = 'Carrito.html', 2000);
            return;
        }

        carritoActual = datos;
        renderizarResumen(datos);

    } catch (error) {
        console.error('Error al cargar carrito:', error);
        mostrarError('Error al cargar el carrito');
        container.innerHTML = '<p class="error-text">No se pudo cargar el carrito</p>';
    }
}

// ============================================
// RENDERIZAR RESUMEN
// ============================================
function renderizarResumen(datos) {
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

    const subtotalEl = document.getElementById('subtotal-checkout');
    const totalEl = document.getElementById('total-checkout');

    if (subtotalEl) subtotalEl.textContent = `$${datos.totalPagar.toFixed(2)}`;
    if (totalEl) totalEl.textContent = `$${datos.totalPagar.toFixed(2)}`;
}

// ============================================
// CONFIRMAR PEDIDO
// ============================================
async function confirmarPedido() {
    if (!carritoActual || !carritoActual.productos || carritoActual.productos.length === 0) {
        mostrarNotificacion('El carrito está vacío', false);
        return;
    }

    if (!usuarioId) {
        mostrarNotificacion('Error: No se pudo identificar al usuario', false);
        return;
    }

    mostrarSeccion('loading');
    
    const token = obtenerToken();

    const items = carritoActual.productos.map(prod => ({
        idProducto: prod.idProducto,
        idVariante: prod.idVariante,
        cantidad: prod.cantidad
    }));

    const pedidoData = {
        idUsuario: usuarioId,
        items: items
    };

    try {
        const respuesta = await fetch(API_PEDIDO_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(pedidoData)
        });

        const resultado = await respuesta.json();

        if (respuesta.ok) {
            const pedido = resultado.pedido;
            
            if (pedido) {
                mostrarExito(pedido);
                
                setTimeout(() => actualizarBadgeCarrito(), 1000);
            } else {
                throw new Error('No se recibió información del pedido');
            }

        } else {
            const mensaje = resultado.mensaje || 'Error al procesar el pedido';
            mostrarError(mensaje);
        }

    } catch (error) {
        console.error('Error al confirmar pedido:', error);
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

    if (loading) loading.style.display = 'none';
    if (content) content.style.display = 'none';
    if (exito) exito.style.display = 'none';
    if (error) error.style.display = 'none';

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
    const errorMensajeEl = document.getElementById('error-mensaje');
    if (errorMensajeEl) {
        errorMensajeEl.textContent = mensaje;
    }

    mostrarSeccion('error');
    mostrarNotificacion(mensaje, false);
}