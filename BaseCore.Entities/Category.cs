using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
namespace BaseCore.Entities
{
    public class Category
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = "";

        [MaxLength(500)]
        public string Description { get; set; } = "";

        [MaxLength(100)]
        public string Slug { get; set; } = "";

        [MaxLength(10)]
        public string Icon { get; set; } = "";

        [MaxLength(20)]
        public string Color { get; set; } = "#6366f1";

        [JsonIgnore]

        public ICollection<Product> Products { get; set; } = new List<Product>();
    }
}