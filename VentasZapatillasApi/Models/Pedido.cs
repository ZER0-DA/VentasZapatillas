using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ventasZapatiilasAPI.Models
{

    [Table("Pedidos")]
    public class Pedido
    {
        [Key]
        [Column("id_pedido")]
        public int IdPedido { get; set; }

        [Column("id_usuario")]
        public int IdUsuario { get; set; }

        [Column("fecha_compra")]
        public DateTime FechaPedido { get; set; }

        [Column("total_pagado")]
        public decimal Total { get; set; }

        [Column("estado_pedido")]
        public string EstadoPedido { get; set; } = null!;


        [ForeignKey("IdUsuario")]
        public Usuario? Usuario { get; set; }
    }
}
