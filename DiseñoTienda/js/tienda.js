const API_PRODUCTOS_URL = `${API_BASE_URL}/api/Productos`;
const API_CARRITO_URL = `${API_BASE_URL}/api/Carrito`;

let seccionActual = "destacados";

const titulosPorSeccion = {
    'mujer': 'Zapatillas para Mujer',
    'hombre': 'Zapatillas para Hombre',
    'niños': 'Zapatillas para Niños',
    'destacados': 'Zapatillas Destacadas',
    'ofertas': 'Ofertas Especiales'
};

// ============================================
// AGREGAR AL CARRITO (CONECTADO AL BACKEND)
// ============================================
async function agregarAlCarrito(idProducto) {
    debugLog('CARRITO', `🛒 Intentando agregar producto ${idProducto}`);
    
    // Verificar sesión
    if (!verificarSesion()) {
        return;
    }

    const token = obtenerToken();

    try {
        debugLog('API', `📡 POST a AgregarAlCarrito - Producto: ${idProducto}`);
        
        const respuesta = await fetch(`${API_CARRITO_URL}/AgregarAlCarrito`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                idproducto: idProducto,
                cantidad: 1
            })
        });

        const datos = await respuesta.json();

        if (respuesta.ok) {
            debugLog('CARRITO', '✅ Producto agregado exitosamente');
            mostrarNotificacion(datos.mensaje || 'Producto agregado al carrito', true);
            actualizarBadgeCarrito();
        } else if (respuesta.status === 401) {
            debugLog('ERROR', '❌ Token expirado (401) al agregar producto');
            mostrarNotificacion('Sesión expirada. Por favor, inicia sesión nuevamente', false);
            localStorage.removeItem('token');
            setTimeout(() => {
                window.location.href = 'Login.html';
            }, 1500);
        } else {
            debugLog('ERROR', `❌ Error ${respuesta.status} al agregar producto`);
            mostrarNotificacion(datos.mensaje || 'Error al agregar producto', false);
        }

    } catch (error) {
        debugLog('ERROR', '❌ Error de conexión al agregar al carrito', error);
        console.error('Error al agregar al carrito:', error);
        mostrarNotificacion('Error de conexión. Intenta nuevamente', false);
    }
}

// ============================================
// CARGAR PRODUCTOS POR SECCIÓN
// ============================================
async function cargarProductos(seccion = 'destacados') {
    try {
        const contenedor = document.getElementById("productos-container");
        if (!contenedor) {
            debugLog('ERROR', '⚠️ Contenedor de productos no encontrado');
            return;
        }
        
        debugLog('API', `📦 Cargando productos de sección: ${seccion}`);
        contenedor.innerHTML = '<p class="mensaje-carga">Cargando productos...</p>';

        let url;
        if (seccion === 'destacados') {
            url = `${API_PRODUCTOS_URL}/destacados`;
        } else if (seccion === 'ofertas') {
            url = `${API_PRODUCTOS_URL}/ofertas`;
        } else {
            url = `${API_PRODUCTOS_URL}/seccion/${seccion}`;
        }

        const respuesta = await fetch(url);
        
        if (!respuesta.ok) {
            throw new Error(`Error ${respuesta.status}: ${respuesta.statusText}`);
        }

        const productos = await respuesta.json();
        debugLog('API', `✅ ${productos.length} productos cargados`);

        const tituloSeccion = document.getElementById("titulo-seccion");
        if (tituloSeccion) {
            tituloSeccion.textContent = titulosPorSeccion[seccion] || `Zapatillas - ${seccion}`;
        }

        contenedor.innerHTML = "";

        if (productos.length === 0) {
            contenedor.innerHTML = '<p class="mensaje-carga">No hay productos disponibles en esta sección.</p>';
            return;
        }

        productos.forEach(p => {
            const imagenUrl = p.urlImagen
                ? (p.urlImagen.startsWith("/") 
                    ? `${API_BASE_URL}${p.urlImagen}` 
                    : p.urlImagen)
                : "img/default.jpg";

            const card = document.createElement("div");
            card.classList.add("producto-card");

            card.innerHTML = `
                <img 
                    src="${imagenUrl}" 
                    class="producto-imagen"
                    onclick="verDetalle(${p.id})"
                    alt="${p.modelo}"
                >

                <span class="producto-etiqueta">${p.marca || 'Sin marca'}</span>

                <h3 
                    class="producto-nombre"
                    onclick="verDetalle(${p.id})"
                >
                    ${p.modelo || 'Sin nombre'}
                </h3>

                <p class="producto-precio">$${p.precio ? p.precio.toFixed(2) : '0.00'}</p>

                <p class="producto-categoria">${p.seccion || 'Sin categoría'}</p>

                <button class="producto-boton" onclick="agregarAlCarrito(${p.id})">
                    Agregar al carrito
                </button>
            `;

            contenedor.appendChild(card);
        });

    } catch (error) {
        debugLog('ERROR', '❌ Error al cargar productos', error);
        console.error("Error cargando productos:", error);
        const contenedor = document.getElementById("productos-container");
        if (contenedor) {
            contenedor.innerHTML = `
                <div class="mensaje-error">
                    <h3>Error al cargar productos</h3>
                    <p>${error.message}</p>
                    <p>Por favor, verifica que el servidor esté funcionando.</p>
                </div>
            `;
        }
    }
}

// ============================================
// MOSTRAR SECCIÓN Y ACTUALIZAR NAV
// ============================================
function mostrarSeccion(seccion, event) {
    if (event) {
        event.preventDefault();
    }

    debugLog('NAV', `📂 Cambiando a sección: ${seccion}`);
    seccionActual = seccion;

    // Actualizar enlaces activos
    document.querySelectorAll('.main-nav a').forEach(link => {
        link.classList.remove('active');
    });

    if (event && event.target) {
        event.target.classList.add('active');
    } else {
        const link = document.querySelector(`[data-seccion="${seccion}"]`);
        if (link) {
            link.classList.add('active');
        }
    }

    cargarProductos(seccion);
}

// ============================================
// VER DETALLE DE PRODUCTO
// ============================================
function verDetalle(id) {
    debugLog('NAV', `🔍 Navegando a detalle del producto ${id}`);
    window.location.href = `DetalleProducto.html?id=${id}`;
}

// ============================================
// BUSCADOR DE PRODUCTOS
// ============================================
function inicializarBuscador() {
    const buscador = document.getElementById('buscador');
    if (!buscador) {
        debugLog('ERROR', '⚠️ Buscador no encontrado en el DOM');
        return;
    }
    
    debugLog('NAV', '🔍 Buscador inicializado');
    
    buscador.addEventListener('input', function(e) {
        const termino = e.target.value.toLowerCase();
        const cards = document.querySelectorAll('.producto-card');
        
        let visibles = 0;
        cards.forEach(card => {
            const nombre = card.querySelector('.producto-nombre').textContent.toLowerCase();
            const marca = card.querySelector('.producto-etiqueta').textContent.toLowerCase();
            
            if (nombre.includes(termino) || marca.includes(termino)) {
                card.style.display = 'block';
                visibles++;
            } else {
                card.style.display = 'none';
            }
        });
        
        if (DEBUG_MODE && termino) {
            debugLog('NAV', `🔍 Búsqueda: "${termino}" - ${visibles} resultados`);
        }
    });
}

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    debugLog('SESION', '═══════════════════════════════════════');
    debugLog('SESION', '🏪 VENTAS.HTML (TIENDA) - CARGANDO...');
    debugLog('SESION', '═══════════════════════════════════════');
    
    // Verificar token al inicio
    const token = obtenerToken();
    if (!token) {
        debugLog('ERROR', '❌ No hay token - la página debería redirigir a Login');
    }
    
    // Verificar si estamos en la página de productos
    const contenedor = document.getElementById('productos-container');
    
    if (contenedor) {
        debugLog('NAV', '✅ Contenedor de productos encontrado');
        
        // Leer parámetro de URL para sección
        const urlParams = new URLSearchParams(window.location.search);
        const seccionUrl = urlParams.get('seccion') || 'destacados';
        
        debugLog('NAV', `📂 Cargando sección: ${seccionUrl}`);
        
        cargarProductos(seccionUrl);
        mostrarSeccion(seccionUrl, null);
        inicializarBuscador();
    } else {
        debugLog('ERROR', '❌ No se encontró contenedor de productos - ¿Estás en Ventas.html?');
    }
    
    // Actualizar badge del carrito
    actualizarBadgeCarrito();
    
    debugLog('SESION', '═══════════════════════════════════════');
});