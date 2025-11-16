// *** CONFIGURACIÓN DE LA API: ¡ACTUALIZA ESTA URL! ***
const API_BASE_URL = 'https://localhost:7030'; 
const API_LOGIN_URL = `${API_BASE_URL}/api/VerificarLogin/login`; 

// Referencias del DOM
const loginForm = document.getElementById('loginForm');
const correoInput = document.getElementById('correo');
const contrasenaInput = document.getElementById('contrasena');
const mensajeEstado = document.getElementById('mensaje-estado');

function mostrarMensaje(texto, esExito = false) {
    mensajeEstado.textContent = texto;
    // Remueve las clases anteriores y añade la clase de estado
    mensajeEstado.classList.remove('success', 'error');
    mensajeEstado.classList.add(esExito ? 'success' : 'error');
}

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault(); 
    
    const correo = correoInput.value;
    const password = contrasenaInput.value; // Mapea a 'password' en el JSON
    
    const datosLogin = {
        correo: correo, 
        password: password 
    };
    
    mostrarMensaje('Conectando...', false); 
    
    try {
        const respuesta = await fetch(API_LOGIN_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosLogin) 
        });

        const datosRespuesta = await respuesta.json();

        if (respuesta.ok) {
            // ÉXITO (Status 200 OK)
            mostrarMensaje(`✅ ${datosRespuesta.mensaje}`, true);
            
            // Almacena datos y redirige
            localStorage.setItem('usuarioCorreo', correo);
            localStorage.setItem('usuarioId', datosRespuesta.usuarioId);
            
            setTimeout(() => {
                window.location.href = 'pantallaPrincipa.html';
            }, 800);
            
        } else {
            // FALLO (Status 401 Unauthorized)
            mostrarMensaje(`❌ ERROR (${respuesta.status}): ${datosRespuesta.mensaje || 'Credenciales inválidas.'}`, false);
        }

    } catch (error) {
        // Error de red o CORS
        mostrarMensaje('🔴 Error de red: No se pudo conectar con la API. Verifica CORS.', false);
        console.error('Error de fetch:', error);
    }
});