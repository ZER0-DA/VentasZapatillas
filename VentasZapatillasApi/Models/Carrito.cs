using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ventasZapatiilasAPI.Models
{
    [Table("carrito")]
    public class Carrito
    {
        [Key]
        [Column("id_carrito")]
        public int IdCarrito { get; set; }

        [Column("id_usuario")]
        public int IdUsuario { get; set; }

        [Column("id_producto")]
        public int IdProducto { get; set; }

        [Column("id_variante")]
        public int IdVariante { get; set; }

        [Column("cantidad")]
        public int Cantidad { get; set; }

        [Column("fecha_agregado")]
        public DateTime FechaAgregado { get; set; }

        [ForeignKey("IdUsuario")]
        public Usuario? Usuario { get; set; }

        [ForeignKey("IdProducto")]
        public  required Producto Producto { get; set; }

        [ForeignKey("IdVariante")]
        public ProductoVariante Variante { get; set; }=  null!;
    }
}
