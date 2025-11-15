using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ventasZapatiilasAPI.Data;
using ventasZapatiilasAPI.Models;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace ventasZapatiilasAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UsuarioController : ControllerBase
    {
        private readonly AppDbContext _context;

        public UsuarioController(AppDbContext context)
        {
            _context = context;
        }


        [HttpGet("ListarUsuario")]
        public async Task<ActionResult<IEnumerable<Usuario>>> ListasUsuario()
        {
            var usuarios = await _context.Usuarios.ToListAsync();
            return Ok(usuarios);//200 OK
        }

        [HttpPost("GuardarUsuario")]
        public async Task<ActionResult<Usuario>> GuardarUsuario(Usuario usuario)
        {
            usuario.fecha_registro = DateTime.Now;
            _context.Usuarios.Add(usuario);
            await _context.SaveChangesAsync();
            return StatusCode (StatusCodes.Status201Created, usuario);
        }




    }
}
