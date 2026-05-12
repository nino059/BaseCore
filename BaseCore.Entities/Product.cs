using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace BaseCore.Entities
{
    public class Product
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(200)]
        public string Name { get; set; } = "";

        public decimal Price { get; set; }

        public int Stock { get; set; } = 1;

        public string ImageUrl { get; set; } = "";

        [MaxLength(2000)]
        public string Description { get; set; } = "";

        public int CategoryId { get; set; }

        // ── Các field bổ sung cho tranh ──
        [MaxLength(200)]
        public string ArtistName { get; set; } = "";

        [MaxLength(100)]
        public string Material { get; set; } = "";

        [MaxLength(100)]
        public string Dimensions { get; set; } = "";

        public int? Year { get; set; }

        // Available | Unavailable | OutOfStock
        [MaxLength(50)]
        public string Status { get; set; } = "Available";

        [JsonIgnore]
        public Category? Category { get; set; }
    }
}