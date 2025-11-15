using Microsoft.AspNetCore.Mvc;
using ventasZapatiilasAPI.Data;
using ventasZapatiilasAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace ventasZapatiilasAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProductosController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ProductosController(AppDbContext context)
        {
            _context = context;
        }

        //obtener todos los productos
        [HttpGet]
        public ActionResult<IEnumerable<Productos>> Get()
        {
            return _context.Productos.ToList();
        }
      

        
        [HttpDelete("{id}")]
        public IActionResult Delete(string id)
        {
            var producto = _context.Productos.Find(id);
            if (producto == null)
                return NotFound();

            _context.Productos.Remove(producto);
            _context.SaveChanges();

            return NoContent();
        }
    }
}
