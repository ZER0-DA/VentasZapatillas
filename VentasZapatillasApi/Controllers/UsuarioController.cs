using Microsoft.AspNetCore.Mvc;
using ventasZapatiilasAPI.Models;
using ventasZapatiilasAPI.Services;

namespace ventasZapatiilasAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UsuarioController : ControllerBase
    {
        private readonly UsuarioService _usuarioService;
        private string nombre;

        public UsuarioController(UsuarioService usuarioService) => _usuarioService = usuarioService;



        [HttpPost("login")]
        public IActionResult Login([FromBody] Login request)
        {
            var usuario = _usuarioService.GetUsuarioPorCorreo(request.Correo);

            if (usuario == null)
                return Unauthorized(new { mensaje = "Correo no registrado" });

            if (!_usuarioService.ValidarContrasena(request.Password, usuario.password_hash))
                return Unauthorized(new { mensaje = "Contraseña incorrecta" });

            return Ok(new
            {
                mensaje = 
                nombre = usuario.nombre,
                id = usuario.id_usuario
            });
        }

        [HttpPost("registro")]
        public IActionResult Registrar([FromBody] Usuario nuevo)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var existente = _usuarioService.GetUsuarioPorCorreo(nuevo.correo);
            if (existente != null)
                return Conflict(new { mensaje = "El correo ya está registrado." });

            var creado = _usuarioService.CrearUsuario(nuevo);
            return Ok(new { mensaje = "Usuario registrado con éxito ✅", id = creado.id_usuario });
        }
    }
}
