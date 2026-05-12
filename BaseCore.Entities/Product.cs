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

        public int Stock { get; set; } = 1;

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
        public string? Technique { get; set; }

        [MaxLength(50)]
        public string? Size { get; set; }

        public int? Year { get; set; }

        [MaxLength(100)]
        public string? Material { get; set; }

        public bool IsOriginal { get; set; } = true;

        [MaxLength(50)]
        public string? Condition { get; set; }

        // Available | Unavailable | OutOfStock
        [MaxLength(20)]
        public string Status { get; set; } = "Available";

        [JsonIgnore]
        public Category? Category { get; set; }
    }
}