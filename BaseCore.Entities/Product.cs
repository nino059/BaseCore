using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace BaseCore.Entities
{
    public class Product
    {
        public int Id { get; set; }

        [Required, MaxLength(200)]
        public string Name { get; set; } = "";

        public decimal Price { get; set; }

        [MaxLength(500)]
        public string ImageUrl { get; set; } = "";

        [MaxLength(1000)]
        public string Description { get; set; } = "";

        public int CategoryId { get; set; }

        [MaxLength(450)]
        public string? SellerId { get; set; }

        // ── Thông tin nghệ thuật ──

        [MaxLength(200)]
        public string ArtistName { get; set; } = "";

        [MaxLength(100)]
        public string? Theme { get; set; }

        [MaxLength(100)]
        public string? Material { get; set; }

        // Kích thước tính bằng cm
        public int? Width  { get; set; }
        public int? Height { get; set; }

        // Pending | ForSale | Ordered | Sold | Rejected
        [MaxLength(20)]
        public string Status { get; set; } = "Pending";

        // Ghi chú của admin khi từ chối (Rejected)
        [MaxLength(500)]
        public string? AdminNote { get; set; }

        [JsonIgnore]
        public Category? Category { get; set; }
    }
}
