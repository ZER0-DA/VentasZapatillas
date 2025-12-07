using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ventasZapatiilasAPI.Models
{
    [Table("ProductoVariantes")]
    public class ProductoVariante
    {
        [Key]
        [Column("id_variante")]
        public int IdVariante { get; set; }


        [Column("id_producto")]
        public int ProductoId { get; set; }

        [Required]
        [Column("talla")]
        public required decimal Talla { get; set; }

        [Column("stock")]
        public required int Stock { get; set; }

        [ForeignKey("ProductoId")]
        public  Producto? Producto { get; set; }
    }
}