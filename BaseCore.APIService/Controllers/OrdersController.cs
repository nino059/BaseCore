using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BaseCore.Entities;
using BaseCore.Repository.EFCore;
using System.Security.Claims;

namespace BaseCore.APIService.Controllers
{
    /// <summary>
    /// Order API Controller
    /// Teaching: RESTful API, Business Logic, Authentication (Bài 10, 11)
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class OrdersController : ControllerBase
    {
        private readonly IOrderRepositoryEF _orderRepository;
        private readonly IOrderDetailRepositoryEF _orderDetailRepository;
        private readonly IProductRepositoryEF _productRepository;

        public OrdersController(
            IOrderRepositoryEF orderRepository,
            IOrderDetailRepositoryEF orderDetailRepository,
            IProductRepositoryEF productRepository)
        {
            _orderRepository = orderRepository;
            _orderDetailRepository = orderDetailRepository;
            _productRepository = productRepository;
        }

        /// <summary>
        /// Get orders for current user
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetMyOrders()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var orders = await _orderRepository.GetByUserAsync(userId);
            return Ok(orders);
        }

        /// <summary>
        /// Get all orders (Admin only)
        /// </summary>
        [HttpGet("all")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAllOrders()
        {
            var orders = await _orderRepository.GetAllAsync();
            return Ok(orders);
        }

        /// <summary>
        /// Get order by ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var order = await _orderRepository.GetByIdAsync(id);
            if (order == null) return NotFound(new { message = "Order not found" });

            var details = await _orderDetailRepository.GetByOrderAsync(id);
            return Ok(new { order, details });
        }

        /// <summary>
        /// Create new order
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateOrderDto dto)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId) || !Guid.TryParse(userId, out var userGuid))
                return Unauthorized();

            // Validate products and calculate total
            decimal totalAmount = 0;
            var orderDetails = new List<OrderDetail>();

            foreach (var item in dto.Items)
            {
                var product = await _productRepository.GetByIdAsync(item.ProductId);
                if (product == null)
                    return BadRequest(new { message = $"Product {item.ProductId} not found" });

                if (product.Stock < item.Quantity)
                    return BadRequest(new { message = $"Insufficient stock for {product.Name}" });

                totalAmount += product.Price * item.Quantity;
                orderDetails.Add(new OrderDetail
                {
                    ProductId = item.ProductId,
                    Quantity = item.Quantity,
                    UnitPrice = product.Price
                });

                // Update stock, tự đánh OutOfStock nếu hết
                product.Stock -= item.Quantity;
                if (product.Stock <= 0) product.Status = "OutOfStock";
                await _productRepository.UpdateAsync(product);
            }

            var order = new Order
            {
                UserId = userId,
                OrderDate = DateTime.Now,
                TotalAmount = totalAmount,
                Status = "Pending",
                ShippingAddress = dto.ShippingAddress ?? "",
                PaymentMethod = dto.PaymentMethod ?? "COD",
                Note = dto.Note,
                Phone = dto.Phone
            };

            await _orderRepository.AddAsync(order);

            // Add order details
            foreach (var detail in orderDetails)
            {
                detail.OrderId = order.Id;
                await _orderDetailRepository.AddAsync(detail);
            }

            return CreatedAtAction(nameof(GetById), new { id = order.Id }, new { order, details = orderDetails });
        }

        /// <summary>
        /// Update order status — Artist only, with strict forward-only transition
        /// </summary>
        [HttpPut("{id}/status")]
        [Authorize(Roles = "Artist")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateStatusDto dto)
        {
            var artistId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(artistId)) return Unauthorized();

            var order = await _orderRepository.GetByIdAsync(id);
            if (order == null) return NotFound(new { message = "Đơn hàng không tìm thấy" });

            // Verify this artist has products in the order
            var details = await _orderDetailRepository.GetByOrderAsync(id);
            var hasArtistProduct = details.Any(d => d.Product?.SellerId == artistId);
            if (!hasArtistProduct)
                return Forbid();

            // Validate transition rules (forward-only, Cancelled allowed except from Completed)
            var validTransitions = new Dictionary<string, string[]>
            {
                ["Pending"]    = new[] { "Processing", "Cancelled" },
                ["Processing"] = new[] { "Shipping",   "Cancelled" },
                ["Shipping"]   = new[] { "Completed",  "Cancelled" },
                ["Completed"]  = Array.Empty<string>(),
                ["Cancelled"]  = Array.Empty<string>(),
            };

            if (!validTransitions.TryGetValue(order.Status, out var allowed) || !allowed.Contains(dto.Status))
                return BadRequest(new { message = $"Không thể chuyển từ '{order.Status}' sang '{dto.Status}'" });

            order.Status = dto.Status;
            await _orderRepository.UpdateAsync(order);

            return Ok(order);
        }

        /// <summary>
        /// Get orders containing artist's products — Artist only
        /// </summary>
        [HttpGet("artist")]
        [Authorize(Roles = "Artist")]
        public async Task<IActionResult> GetArtistOrders()
        {
            var artistId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(artistId)) return Unauthorized();

            var allOrders = await _orderRepository.GetAllAsync();
            var result = new List<object>();

            foreach (var order in allOrders)
            {
                var details = await _orderDetailRepository.GetByOrderAsync(order.Id);
                var artistDetails = details.Where(d => d.Product?.SellerId == artistId).ToList();
                if (artistDetails.Any())
                {
                    result.Add(new
                    {
                        order.Id,
                        order.UserId,
                        order.OrderDate,
                        order.Status,
                        order.ShippingAddress,
                        order.Phone,
                        items = artistDetails.Select(d => new
                        {
                            d.ProductId,
                            productName = d.Product?.Name ?? "",
                            d.Quantity,
                            d.UnitPrice,
                            total = d.Quantity * d.UnitPrice
                        })
                    });
                }
            }

            return Ok(result);
        }

        /// <summary>
        /// Cancel order
        /// </summary>
        [HttpPut("{id}/cancel")]
        public async Task<IActionResult> CancelOrder(int id)
        {
            var order = await _orderRepository.GetByIdAsync(id);
            if (order == null) return NotFound(new { message = "Order not found" });

            if (order.Status == "Completed")
                return BadRequest(new { message = "Cannot cancel completed order" });

            // Restore stock
            var details = await _orderDetailRepository.GetByOrderAsync(id);
            foreach (var detail in details)
            {
                var product = await _productRepository.GetByIdAsync(detail.ProductId);
                if (product != null)
                {
                    product.Stock += detail.Quantity;
                    if (product.Status == "OutOfStock" && product.Stock > 0)
                        product.Status = "Available";
                    await _productRepository.UpdateAsync(product);
                }
            }

            order.Status = "Cancelled";
            await _orderRepository.UpdateAsync(order);

            return Ok(new { message = "Order cancelled successfully", order });
        }
     
    }

    public class CreateOrderDto
    {
        public List<OrderItemDto> Items { get; set; } = new();
        public string? ShippingAddress { get; set; }
        public string? PaymentMethod { get; set; } = "COD";
        public string? Note { get; set; }
        public string? Phone { get; set; }
    }

    public class OrderItemDto
    {
        public int ProductId { get; set; }
        public int Quantity { get; set; }
    }

    public class UpdateStatusDto
    {
        public string Status { get; set; } = "";
    }
}
