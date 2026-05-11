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
        public DbSet<Role> Roles { get; set; }
        public DbSet<UserRole> UserRoles { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure User entity
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.UserName).HasMaxLength(50).IsRequired();
                entity.Property(e => e.Password).HasMaxLength(255).IsRequired();
                entity.Property(e => e.Name).HasMaxLength(100);
                entity.Property(e => e.Email).HasMaxLength(100);
                entity.Property(e => e.Phone).HasMaxLength(20);
                entity.HasIndex(e => e.UserName).IsUnique();
            });

            // Configure Category entity
            modelBuilder.Entity<Category>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).HasMaxLength(100).IsRequired();
                entity.Property(e => e.Description).HasMaxLength(500);
                entity.Property(e => e.Slug).HasMaxLength(100);
                entity.Property(e => e.Icon).HasMaxLength(10);
            });

            // Configure Product entity
            modelBuilder.Entity<Product>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).HasMaxLength(200).IsRequired();
                entity.Property(e => e.Price).HasPrecision(18, 2);
                entity.Property(e => e.Description).HasMaxLength(1000);
                entity.Property(e => e.ImageUrl).HasMaxLength(500);

                entity.HasOne(e => e.Category)
                      .WithMany(c => c.Products)
                      .HasForeignKey(e => e.CategoryId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // Configure Order entity
            modelBuilder.Entity<Order>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.TotalAmount).HasPrecision(18, 2);
                entity.Property(e => e.ShippingAddress).HasMaxLength(500);
                entity.HasMany(e => e.OrderDetails)
                      .WithOne(d => d.Order)
                      .HasForeignKey(d => d.OrderId);
            });

            // Configure OrderDetail entity
            modelBuilder.Entity<OrderDetail>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.UnitPrice).HasPrecision(18, 2);

                entity.HasOne(e => e.Order)
                      .WithMany()
                      .HasForeignKey(e => e.OrderId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.Product)
                      .WithMany()
                      .HasForeignKey(e => e.ProductId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            SeedData(modelBuilder);
        }

        private void SeedData(ModelBuilder modelBuilder)
        {
            // ✅ Seed danh mục tranh Việt Nam
            modelBuilder.Entity<Category>().HasData(
                new Category { Id = 1, Name = "Tranh Đông Hồ",    Description = "Dòng tranh dân gian truyền thống từ làng Đông Hồ, Bắc Ninh",     Slug = "tranh-dong-ho",    Icon = "🎎" },
                new Category { Id = 2, Name = "Tranh Thủy Mặc",   Description = "Tranh phong cách thủy mặc Á Đông, dùng mực trên giấy xuyến chỉ",  Slug = "tranh-thuy-mac",   Icon = "🖌️" },
                new Category { Id = 3, Name = "Tranh Sơn Dầu",    Description = "Tranh vẽ bằng màu sơn dầu trên toan vải hoặc gỗ",                  Slug = "tranh-son-dau",    Icon = "🎨" },
                new Category { Id = 4, Name = "Tranh Lụa",        Description = "Tranh vẽ trên nền lụa, kỹ thuật truyền thống Việt Nam",             Slug = "tranh-lua",        Icon = "🪆" },
                new Category { Id = 5, Name = "Tranh Sơn Mài",    Description = "Tranh sơn mài độc đáo với nhiều lớp sơn thiên nhiên",               Slug = "tranh-son-mai",    Icon = "✨" },
                new Category { Id = 6, Name = "Tranh Acrylic",    Description = "Tranh màu acrylic hiện đại, màu sắc tươi sáng, bền màu",            Slug = "tranh-acrylic",    Icon = "🖼️" },
                new Category { Id = 7, Name = "Tranh Khắc Gỗ",   Description = "Nghệ thuật khắc in trên gỗ, nét chạm tinh xảo",                   Slug = "tranh-khac-go",    Icon = "🪵" },
                new Category { Id = 8, Name = "Tranh Màu Nước",   Description = "Tranh vẽ bằng màu nước, trong sáng và nhẹ nhàng",                  Slug = "tranh-mau-nuoc",   Icon = "💧" }
            );

            // ✅ Seed sản phẩm mẫu tranh (ImageUrl để trống, admin sẽ upload sau)
            modelBuilder.Entity<Product>().HasData(
                new Product { Id = 1, Name = "Đám cưới chuột",         Price = 450000,  Stock = 5,  CategoryId = 1, Description = "Tranh Đông Hồ kinh điển, cảnh đám cưới chuột rước dâu đầy màu sắc",    ImageUrl = "" },
                new Product { Id = 2, Name = "Gà trống Đông Hồ",       Price = 350000,  Stock = 8,  CategoryId = 1, Description = "Tranh Đông Hồ hình gà trống - biểu tượng may mắn đầu năm",             ImageUrl = "" },
                new Product { Id = 3, Name = "Tùng - Trúc - Mai",       Price = 1200000, Stock = 3,  CategoryId = 2, Description = "Bộ tranh thủy mặc 3 tấm, mực nho trên giấy xuyến chỉ cao cấp",         ImageUrl = "" },
                new Product { Id = 4, Name = "Hồ Hoàn Kiếm",           Price = 2500000, Stock = 2,  CategoryId = 3, Description = "Tranh sơn dầu phong cảnh hồ Hoàn Kiếm mùa thu lá đỏ",                  ImageUrl = "" },
                new Product { Id = 5, Name = "Thiếu nữ bên hoa sen",    Price = 3200000, Stock = 2,  CategoryId = 4, Description = "Tranh lụa thiếu nữ Việt trong tà áo dài trắng bên đầm sen",             ImageUrl = "" },
                new Product { Id = 6, Name = "Rồng vàng sơn mài",       Price = 5500000, Stock = 1,  CategoryId = 5, Description = "Tranh sơn mài rồng vàng trên nền đen, kích thước 60x90cm",              ImageUrl = "" },
                new Product { Id = 7, Name = "Phong cảnh làng quê",     Price = 1800000, Stock = 4,  CategoryId = 6, Description = "Tranh acrylic cảnh đồng lúa xanh, mái nhà tranh Việt Nam",              ImageUrl = "" },
                new Product { Id = 8, Name = "Hổ phù khắc gỗ",         Price = 980000,  Stock = 6,  CategoryId = 7, Description = "Tranh khắc gỗ hổ phù trấn trạch, gỗ mít tự nhiên",                     ImageUrl = "" }
            );
        }
    }
}