using Microsoft.EntityFrameworkCore;
using ventasZapatiilasAPI.Models;

namespace ventasZapatiilasAPI.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<Producto> Productos { get; set; }
        public DbSet<ProductoVariante> ProductoVariantes { get; set; }
        public DbSet<Usuario> Usuarios { get; set; }
        public DbSet<Carrito> Carrito { get; set; }
        public DbSet<Pedido> Pedidos { get; set; }
        public DbSet<DetallePedido> DetallePedidos { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Relación Producto - ProductoVariante
            modelBuilder.Entity<ProductoVariante>()
                .HasOne(v => v.Producto)
                .WithMany(p => p.Variantes)
                .HasForeignKey(v => v.ProductoId)
                .OnDelete(DeleteBehavior.Cascade);

            // Relación Pedido - Usuario
            modelBuilder.Entity<Pedido>()
                .HasOne(p => p.Usuario)
                .WithMany()
                .HasForeignKey(p => p.IdUsuario)
                .OnDelete(DeleteBehavior.Restrict);

            // Relación DetallePedido - Pedido
            modelBuilder.Entity<DetallePedido>()
                .HasOne(d => d.Pedido)
                .WithMany()
                .HasForeignKey(d => d.IdPedido)
                .OnDelete(DeleteBehavior.Cascade);

            // Relación DetallePedido - Producto
            modelBuilder.Entity<DetallePedido>()
                .HasOne(d => d.Producto)
                .WithMany()
                .HasForeignKey(d => d.IdProducto)
                .OnDelete(DeleteBehavior.Restrict);

            // Relación DetallePedido - ProductoVariante
            modelBuilder.Entity<DetallePedido>()
                .HasOne(d => d.Variante)
                .WithMany()
                .HasForeignKey(d => d.IdVariante)
                .OnDelete(DeleteBehavior.Restrict);

            // Índices para optimizar consultas
            modelBuilder.Entity<Producto>()
                .HasIndex(p => p.Seccion);

            modelBuilder.Entity<Producto>()
                .HasIndex(p => p.EsDestacado);

            modelBuilder.Entity<ProductoVariante>()
                .HasIndex(v => v.ProductoId);

            modelBuilder.Entity<Pedido>()
                .HasIndex(p => p.IdUsuario);

            modelBuilder.Entity<Pedido>()
                .HasIndex(p => p.FechaPedido);

            modelBuilder.Entity<DetallePedido>()
                .HasIndex(d => d.IdPedido);
        }
    }
}