
const togglePassword = document.querySelector('#togglePassword');
const passwordInput = document.querySelector('#contrasena');

togglePassword.addEventListener('click', function () {

    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);

    this.classList.toggle('fa-eye')
    this.classList.toggle('fa-eye-slash');
});


const API_BASE_URL = 'https://localhost:7030'; 
const API_LOGIN_URL = `${API_BASE_URL}/api/VerificarLogin/login`; 


const loginForm = document.getElementById('loginForm');
const correoInput = document.getElementById('correo');
const contrasenaInput = document.getElementById('contrasena');
const mensajeEstado = document.getElementById('mensaje-estado');



function mostrarMensaje(texto, esExito = false) {
    mensajeEstado.textContent = texto;
    mensajeEstado.classList.remove('success', 'error');
    mensajeEstado.classList.add(esExito ? 'success' : 'error');
}



loginForm.addEventListener('submit', async (e) => {
    e.preventDefault(); 
    
    const correo = correoInput.value;
    const password = contrasenaInput.value; 
    
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
            mostrarMensaje(`${datosRespuesta.mensaje}`, true);
            
            // Almacena datos y redirige
            localStorage.setItem('usuarioCorreo', correo);
            localStorage.setItem('usuarioId', datosRespuesta.usuarioId);
            
            localStorage.setItem('sesion', 'activa');
            
            setTimeout(() => {
                window.location.href = 'Ventas.html';
            }, 800);
            
        } else {

            mostrarMensaje(`ERROR (${respuesta.status}): ${datosRespuesta.mensaje || 'Credenciales inválidas.'}`, false);

            
        }

    } catch (error) {
    
        mostrarMensaje('Error de red: No se pudo conectar con la API. Verifica CORS.', false);
        console.error('Error de fetch:', error);
    }
});