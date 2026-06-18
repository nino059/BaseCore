using Microsoft.EntityFrameworkCore;
using BaseCore.Entities;

namespace BaseCore.Repository
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Product> Products { get; set; }
        public DbSet<Category> Categories { get; set; }
        public DbSet<Order> Orders { get; set; }
        public DbSet<OrderDetail> OrderDetails { get; set; }
        public DbSet<BlogPost> BlogPosts { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<UserAddress> UserAddresses { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.UserName).HasMaxLength(50).IsRequired();
                entity.Property(e => e.Password).HasMaxLength(255).IsRequired();
                entity.Property(e => e.Name).HasMaxLength(100);
                entity.Property(e => e.Email).HasMaxLength(100);
                entity.Property(e => e.Phone).HasMaxLength(20);
                entity.Property(e => e.Bio).HasMaxLength(2000).IsRequired(false);
                entity.HasIndex(e => e.UserName).IsUnique();
            });

            modelBuilder.Entity<Category>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).HasMaxLength(100).IsRequired();
                entity.Property(e => e.Description).HasMaxLength(500);
                entity.Property(e => e.Slug).HasMaxLength(100);
                entity.Property(e => e.Icon).HasMaxLength(10);
                entity.Property(e => e.Color).HasMaxLength(20).HasDefaultValue("#6366f1");
            });

            modelBuilder.Entity<Product>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).HasMaxLength(200).IsRequired();
                entity.Property(e => e.Price).HasPrecision(18, 2);
                entity.Property(e => e.Description).HasMaxLength(1000);
                entity.Property(e => e.ImageUrl).HasMaxLength(500);
                entity.Property(e => e.ArtistName).HasMaxLength(200);
                entity.Property(e => e.Status).HasMaxLength(20).HasDefaultValue("Pending");
                entity.Property(e => e.AdminNote).HasMaxLength(500).IsRequired(false);
                entity.Property(e => e.Theme).HasMaxLength(100);
                entity.Property(e => e.Material).HasMaxLength(100);
                entity.Property(e => e.SellerId).HasMaxLength(450);

                entity.HasOne(e => e.Category)
                      .WithMany(c => c.Products)
                      .HasForeignKey(e => e.CategoryId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<Order>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.TotalAmount).HasPrecision(18, 2);
                entity.Property(e => e.ShippingAddress).HasMaxLength(500);
                entity.Property(e => e.PaymentMethod).HasMaxLength(20).HasDefaultValue("COD");
                entity.Property(e => e.Note).HasMaxLength(500);
                entity.Property(e => e.Phone).HasMaxLength(20);
                entity.Property(e => e.CustomerName).HasMaxLength(100);
                entity.HasMany(e => e.OrderDetails)
                      .WithOne(d => d.Order)
                      .HasForeignKey(d => d.OrderId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<OrderDetail>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.UnitPrice).HasPrecision(18, 2);

                entity.HasOne(e => e.Product)
                      .WithMany()
                      .HasForeignKey(e => e.ProductId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<BlogPost>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Title).HasMaxLength(300).IsRequired();
                entity.Property(e => e.Excerpt).HasMaxLength(600);
                entity.Property(e => e.Category).HasMaxLength(100);
                entity.Property(e => e.AuthorId).HasMaxLength(450).IsRequired();
                entity.Property(e => e.AuthorName).HasMaxLength(200);
                entity.Property(e => e.CoverImageUrl).HasMaxLength(500);
                entity.Property(e => e.Status).HasMaxLength(20).HasDefaultValue("Pending");
            });

            modelBuilder.Entity<Notification>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.UserId).HasMaxLength(450).IsRequired();
                entity.Property(e => e.Title).HasMaxLength(200).IsRequired();
                entity.Property(e => e.Message).HasMaxLength(500).IsRequired();
                entity.Property(e => e.Type).HasMaxLength(20).IsRequired();
                entity.Property(e => e.RefId).HasMaxLength(50).IsRequired(false);
                entity.HasIndex(e => new { e.UserId, e.CreatedAt });
            });

            modelBuilder.Entity<UserAddress>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.UserId).HasMaxLength(450).IsRequired();
                entity.Property(e => e.FullName).HasMaxLength(100).IsRequired();
                entity.Property(e => e.Phone).HasMaxLength(20).IsRequired();
                entity.Property(e => e.AddressLine).HasMaxLength(300).IsRequired();
                entity.Property(e => e.Ward).HasMaxLength(100);
                entity.Property(e => e.City).HasMaxLength(100).IsRequired();
                entity.HasIndex(e => new { e.UserId, e.IsDefault });
            });

            // ✅ KHÔNG seed data ở đây — data đã có sẵn trong DB
        }
    }
}