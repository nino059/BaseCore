using System.ComponentModel.DataAnnotations;

namespace BaseCore.Entities
{
    public class BlogPost
    {
        public int Id { get; set; }

        [Required, MaxLength(300)]
        public string Title { get; set; } = "";

        [MaxLength(600)]
        public string Excerpt { get; set; } = "";

        public string Content { get; set; } = "";

        [MaxLength(100)]
        public string Category { get; set; } = "";

        [Required, MaxLength(450)]
        public string AuthorId { get; set; } = "";

        [MaxLength(200)]
        public string AuthorName { get; set; } = "";

        [MaxLength(500)]
        public string? CoverImageUrl { get; set; }

        // Pending | Published | Rejected
        [MaxLength(20)]
        public string Status { get; set; } = "Pending";

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? PublishedAt { get; set; }
    }
}
