using System.ComponentModel.DataAnnotations;

namespace ventasZapatiilasAPI.Models.DTO
{
    public class ActualizarEstadoPedidoDTO
    {
        [Required(ErrorMessage = "El estado es requerido")]
        [RegularExpression("^(Pendiente|Procesando|Enviado|Entregado|Cancelado)$",
           ErrorMessage = "Estado inválido")]
        public string Estado { get; set; } = string.Empty;
    }
}
