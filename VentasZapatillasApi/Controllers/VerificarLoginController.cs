using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ventasZapatiilasAPI.Data;
using ventasZapatiilasAPI.Models.DTO;
using ventasZapatiilasAPI.Services;

namespace ventasZapatiilasAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class VerificarLoginController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ITokenService _tokenService;

        public VerificarLoginController(AppDbContext context, ITokenService tokenService)
        {
            _context = context;
            _tokenService = tokenService;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDTO login)
        {
     
            var usuario = await _context.Usuarios
                .FirstOrDefaultAsync(u => u.correo == login.Correo);

            if (usuario == null)
            {
                return Unauthorized(new { mensaje = "Usuario inválido" });
            }

           
            bool isPasswordValid = Seguridad.VerificarPassword(
                login.Password,
                usuario.password_hash
            );

            if (!isPasswordValid)
            {
                return Unauthorized(new { mensaje = "Contraseña incorrecta" });
            }

            string token = _tokenService.CrearToken(usuario);

            return Ok(new {
                mensaje = "Login exitoso",
                token = token, 
                usuarioId = usuario.id_usuario
            });
        }
    }
}