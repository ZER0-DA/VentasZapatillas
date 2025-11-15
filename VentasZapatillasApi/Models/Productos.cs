using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ventasZapatiilasAPI.Models
{
    [Table("Productos")]
    public class Productos
    {
        [Key]
        public int id_producto { get; set; }   

        [Required]
        [Column(TypeName = "varchar(100)")]
        public string nombre_modelo { get; set; } = string.Empty;

        [Required]
        [Column(TypeName = "varchar(50)")]
        public string marca { get; set; } = string.Empty;

        [Required]
        [Column(TypeName = "decimal(4,2)")]
        public decimal talla { get; set; }

        [Required]
        [Column(TypeName = "decimal(10,2)")]
        public decimal precio { get; set; }

        [Required]
        public int stock { get; set; }

        [Column(TypeName = "varchar(300)")]
        public string? url_imagen { get; set; }

        [Column(TypeName = "datetime2")]
        public DateTime fecha_creacion { get; set; }
    }
}
