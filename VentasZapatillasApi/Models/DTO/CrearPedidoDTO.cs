using System.ComponentModel.DataAnnotations;

namespace ventasZapatiilasAPI.Models.DTO
{
    public class CrearPedidoDTO
    {
        [Required(ErrorMessage = "El ID de usuario es requerido")]
        public int IdUsuario { get; set; }

        [Required(ErrorMessage = "Debe incluir al menos un producto")]
        [MinLength(1, ErrorMessage = "Debe incluir al menos un producto")]
        public List<ItemPedidoDTO> Items { get; set; } = new();
    }
}
