using System;
using System.ComponentModel.DataAnnotations;

namespace BaseCore.Entities
{
    public class UserAddress
    {
        public int Id { get; set; }

        [Required, MaxLength(450)]
        public string UserId { get; set; } = "";

        [Required, MaxLength(100)]
        public string FullName { get; set; } = "";

        [Required, MaxLength(20)]
        public string Phone { get; set; } = "";

        [Required, MaxLength(300)]
        public string AddressLine { get; set; } = "";

        [MaxLength(100)]
        public string? Ward { get; set; }

        [Required, MaxLength(100)]
        public string City { get; set; } = "";

        public bool IsDefault { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }
}