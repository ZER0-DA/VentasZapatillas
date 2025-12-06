using System.ComponentModel.DataAnnotations;

namespace ventasZapatiilasAPI.Models.DTO
{
    public class ItemPedidoDTO
    {
        [Required(ErrorMessage = "El ID del producto es requerido")]
        public int IdProducto { get; set; }

        [Required(ErrorMessage = "El ID de la variante es requerido")]
        public int IdVariante { get; set; }

        [Required(ErrorMessage = "La cantidad es requerida")]
        [Range(1, 100, ErrorMessage = "La cantidad debe estar entre 1 y 100")]
        public int Cantidad { get; set; }
    }
}
