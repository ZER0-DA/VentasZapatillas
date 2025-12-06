using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Runtime.InteropServices;

namespace ventasZapatiilasAPI.Models
{
    [Table("Productos")]
    public class Producto
    {
        [Key]
        [Column("id_producto")]
        public int IdProducto { get; set; }

        [Column("nombre_modelo")]
        public required string Modelo { get; set; } 

        [Column("marca")]
        public required string Marca { get; set; }

        [Column("precio")]
        public required decimal Precio { get; set; }

        [Column("url_imagen")]
        public required string UrlImagen { get; set; } 

        [Column ("fecha_creacion")]
        public DateTime FechaCreacion { get; set; }

        [Column ("seccion")]
        public required string Seccion { get; set; }

        [Column ("descripcion")]
        public string? Descripcion { get; set; } 

        [Column ("es_destacado")]
        public bool EsDestacado { get; set; } = false;

        [Column ("en_oferta")]
        public bool EnOferta { get; set; } = false;

        [Column ("porcentaje_descuento")]
        public decimal?  PorcentajeDescuento { get; set; }

        public ICollection<ProductoVariante> Variantes { get; set; } = new List<ProductoVariante>();
    }
}