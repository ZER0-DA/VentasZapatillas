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

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            


        modelBuilder.Entity<ProductoVariante>()
                .HasOne(v => v.Producto)
                .WithMany(p => p.Variantes)
                .HasForeignKey(v => v.ProductoId)
                .OnDelete(DeleteBehavior.Cascade);


            modelBuilder.Entity<Producto>()
                .HasIndex(p => p.Seccion);

            modelBuilder.Entity<Producto>()
                .HasIndex(p => p.EsDestacado);

            modelBuilder.Entity<ProductoVariante>()
                .HasIndex(v => v.ProductoId);
        }
    }
}