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


        public VerificarLoginController(AppDbContext context)
        {
            _context = context;
        }


        [HttpPost("login")]

        public async Task<IActionResult> Login([FromBody] LoginDTO login)
        {

            var usuario = await _context.Usuarios
                .FirstOrDefaultAsync(u => u.correo == login.Correo);

            if (usuario == null)
            {
                return Unauthorized(new { mensaje = "Usurio invalido" });
            }


            bool isPasswordValid = Seguridad.VerificarPassword(
                login.Password,
                usuario.password_hash
            );



            if (!isPasswordValid)
            {
                return Unauthorized(new { mensaje = "Contraseña incorrecta" });
            }


            return Ok(new { mensaje = "Login exitoso", usuarioId = usuario.id_usuario, tipoUsuario = usuario.tipo_usuario });
        }
    }
}