
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace BaseCore.Entities
{
    public class Order
    {
        public int Id { get; set; }

        public string UserId { get; set; }

        public DateTime OrderDate { get; set; } = DateTime.UtcNow;

        public decimal TotalAmount { get; set; }

        public string Status { get; set; } // Pending, Completed, Cancelled

        [MaxLength(500)]
        public string ShippingAddress { get; set; }

        [MaxLength(20)]
        public string? PaymentMethod { get; set; } = "COD"; // COD | BANKING

        [MaxLength(500)]
        public string? Note { get; set; }

        [MaxLength(20)]
        public string? Phone { get; set; }

        public List<OrderDetail> OrderDetails { get; set; }
    }
}
