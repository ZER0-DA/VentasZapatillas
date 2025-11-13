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



        // GET: api/productos
        [HttpGet]
        public ActionResult<IEnumerable<Productos>> Get()
        {
            return _context.Productos.ToList();
        }

        // GET: api/productos/PRO0001
        [HttpGet("{id}")]
        public ActionResult<Productos> Get(string id)
        {
            var producto = _context.Productos.Find(id);
            if (producto == null)
                return NotFound();

            return producto;
        }

        // POST: api/productos
        [HttpPost]
        public ActionResult<Productos> Post([FromBody] Productos producto)
        {
            _context.Productos.Add(producto);
            _context.SaveChanges();

            return CreatedAtAction(nameof(Get), new { id = producto.id_producto }, producto);
        }

        // PUT: api/productos/PRO0001
        [HttpPut("{id}")]
        public IActionResult Put(string id, [FromBody] Productos producto)
        {
            if (id != producto.id_producto)
                return BadRequest();

            _context.Entry(producto).State = EntityState.Modified;
            _context.SaveChanges();

            return NoContent();
        }

        // DELETE: api/productos/PRO0001
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
