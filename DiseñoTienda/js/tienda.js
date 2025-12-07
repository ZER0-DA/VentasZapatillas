const API_PRODUCTOS_URL = `${API_BASE_URL}/api/Productos`;

let seccionActual = "destacados";

const titulosPorSeccion = {
    'mujer': 'Zapatillas para Mujer',
    'hombre': 'Zapatillas para Hombre',
    'niños': 'Zapatillas para Niños',
    'destacados': 'Zapatillas Destacadas',
    'ofertas': 'Ofertas Especiales'
};

// ============================================
// CARGAR PRODUCTOS POR SECCIÓN
// ============================================
async function cargarProductos(seccion = 'destacados') {
    try {
        const contenedor = document.getElementById("productos-container");
        if (!contenedor) return;
        
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

                <button class="producto-boton" onclick="verDetalle(${p.id})">
                    Ver opciones
                </button>
            `;

            contenedor.appendChild(card);
        });

    } catch (error) {
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

    seccionActual = seccion;

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
    window.location.href = `DetalleProducto.html?id=${id}`;
}

// ============================================
// BUSCADOR DE PRODUCTOS
// ============================================
function inicializarBuscador() {
    const buscador = document.getElementById('buscador');
    if (!buscador) return;
    
    buscador.addEventListener('input', function(e) {
        const termino = e.target.value.toLowerCase();
        const cards = document.querySelectorAll('.producto-card');
        
        cards.forEach(card => {
            const nombre = card.querySelector('.producto-nombre').textContent.toLowerCase();
            const marca = card.querySelector('.producto-etiqueta').textContent.toLowerCase();
            
            if (nombre.includes(termino) || marca.includes(termino)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    });
}

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    const contenedor = document.getElementById('productos-container');
    
    if (contenedor) {
        const urlParams = new URLSearchParams(window.location.search);
        const seccionUrl = urlParams.get('seccion') || 'destacados';
        
        cargarProductos(seccionUrl);
        mostrarSeccion(seccionUrl, null);
        inicializarBuscador();
    }
    
    actualizarBadgeCarrito();
});