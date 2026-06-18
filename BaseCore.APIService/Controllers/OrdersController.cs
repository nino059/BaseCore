using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BaseCore.Entities;
using BaseCore.Repository;
using BaseCore.Repository.EFCore;
using BaseCore.APIService.Helpers;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace BaseCore.APIService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class OrdersController : ControllerBase
    {
        private readonly IOrderRepositoryEF _orderRepository;
        private readonly IOrderDetailRepositoryEF _orderDetailRepository;
        private readonly IProductRepositoryEF _productRepository;
        private readonly AppDbContext _db;

        public OrdersController(
            IOrderRepositoryEF orderRepository,
            IOrderDetailRepositoryEF orderDetailRepository,
            IProductRepositoryEF productRepository,
            AppDbContext db)
        {
            _orderRepository = orderRepository;
            _orderDetailRepository = orderDetailRepository;
            _productRepository = productRepository;
            _db = db;
        }

        [HttpGet]
        public async Task<IActionResult> GetMyOrders()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var orders = await _orderRepository.GetByUserAsync(userId);
            var result = new List<object>();

            foreach (var order in orders)
            {
                var details = await _orderDetailRepository.GetByOrderAsync(order.Id);
                result.Add(ToOrderDto(order, details));
            }

            return Ok(result);
        }

        [HttpGet("all")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAllOrders()
        {
            var orders = await _orderRepository.GetAllAsync();
            var orderIds = orders.Select(o => o.Id).ToList();
            var userIds = orders.Select(o => o.UserId).Distinct().ToList();

            var users = await _db.Users
                .Where(u => userIds.Contains(u.Id))
                .ToDictionaryAsync(u => u.Id);

            var addressNames = (await _db.UserAddresses
                .Where(a => userIds.Contains(a.UserId))
                .ToListAsync())
                .GroupBy(a => a.UserId)
                .ToDictionary(
                    g => g.Key,
                    g => g.OrderByDescending(a => a.IsDefault).ThenByDescending(a => a.Id).First().FullName);

            var allDetails = await _db.OrderDetails
                .Include(d => d.Product)
                .Where(d => orderIds.Contains(d.OrderId))
                .ToListAsync();

            var detailsByOrder = allDetails
                .GroupBy(d => d.OrderId)
                .ToDictionary(g => g.Key, g => g.ToList());

            var result = orders.Select(o => {
                users.TryGetValue(o.UserId, out var u);
                addressNames.TryGetValue(o.UserId, out var addressName);
                var details = detailsByOrder.GetValueOrDefault(o.Id, new List<OrderDetail>());
                var customerName = ResolveCustomerName(o, u, addressName);
                var phone = !string.IsNullOrWhiteSpace(o.Phone) ? o.Phone : u?.Phone ?? "";
                return new {
                    o.Id, o.UserId, o.OrderDate, o.TotalAmount, o.Status,
                    o.ShippingAddress, o.PaymentMethod, o.Note,
                    Phone = phone,
                    customerName,
                    userPhone = phone,
                    items = details.Select(d => new {
                        d.ProductId,
                        productName = d.Product?.Name ?? "",
                        imageUrl    = d.Product?.ImageUrl ?? "",
                        d.UnitPrice,
                    }),
                };
            });
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var callerId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var callerRole = User.FindFirst(ClaimTypes.Role)?.Value;

            var order = await _orderRepository.GetByIdAsync(id);
            if (order == null)
                return NotFound(new { message = "Khong tim thay don hang" });

            var details = await _orderDetailRepository.GetByOrderAsync(id);
            var canView = callerRole == "Admin"
                || order.UserId == callerId
                || details.Any(d => d.Product?.SellerId == callerId);

            if (!canView)
                return Forbid();

            var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == order.UserId);
            var addressName = await _db.UserAddresses
                .Where(a => a.UserId == order.UserId)
                .OrderByDescending(a => a.IsDefault)
                .ThenByDescending(a => a.Id)
                .Select(a => a.FullName)
                .FirstOrDefaultAsync();
            return Ok(ToOrderDto(order, details, user, addressName));
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateOrderDto dto)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            if (dto?.Items == null || dto.Items.Count == 0)
                return BadRequest(new { message = "Don hang phai co it nhat mot san pham" });

            var duplicatedProductId = dto.Items
                .GroupBy(i => i.ProductId)
                .FirstOrDefault(g => g.Count() > 1)?.Key;
            if (duplicatedProductId.HasValue)
                return BadRequest(new { message = $"San pham {duplicatedProductId.Value} bi lap trong don hang" });

            await using var transaction = await _db.Database.BeginTransactionAsync(System.Data.IsolationLevel.Serializable);

            decimal totalAmount = 0;
            var orderDetails = new List<OrderDetail>();
            var productsToUpdate = new List<Product>();

            foreach (var item in dto.Items)
            {
                var product = await _productRepository.GetByIdAsync(item.ProductId);
                if (product == null)
                    return BadRequest(new { message = $"Khong tim thay san pham {item.ProductId}" });

                if (!IsSellableProductStatus(product.Status))
                    return BadRequest(new { message = $"Tranh '{product.Name}' hien khong the dat mua (trang thai: {product.Status})" });

                var salePrice = product.Price;
                totalAmount += salePrice;

                orderDetails.Add(new OrderDetail
                {
                    ProductId = item.ProductId,
                    Quantity = 1,
                    UnitPrice = salePrice
                });
                productsToUpdate.Add(product);
            }

            var distinctSellerIds = productsToUpdate
                .Select(p => p.SellerId ?? string.Empty)
                .Distinct()
                .ToList();
            if (distinctSellerIds.Count > 1)
                return BadRequest(new { message = "Moi don hang chi duoc chua tranh cua mot hoa si. Vui long tach don theo tung hoa si." });

            var order = new Order
            {
                UserId = userId,
                OrderDate = DateTime.Now,
                TotalAmount = totalAmount,
                Status = "Pending",
                ShippingAddress = dto.ShippingAddress ?? "",
                PaymentMethod = dto.PaymentMethod ?? "COD",
                Note = dto.Note,
                Phone = dto.Phone,
                CustomerName = dto.CustomerName?.Trim()
            };

            await _orderRepository.AddAsync(order);

            foreach (var (detail, product) in orderDetails.Zip(productsToUpdate))
            {
                detail.OrderId = order.Id;
                await _orderDetailRepository.AddAsync(detail);

                product.Status = "Ordered";
                await _productRepository.UpdateAsync(product);
            }

            var artistGroups = productsToUpdate
                .Where(p => !string.IsNullOrEmpty(p.SellerId))
                .GroupBy(p => p.SellerId!)
                .Select(g => new { SellerId = g.Key, Names = g.Select(p => p.Name).ToList() })
                .ToList();

            await transaction.CommitAsync();

            foreach (var group in artistGroups)
            {
                var names = string.Join(", ", group.Names.Select(name => $"\"{name}\""));
                await TryCreateNotificationAsync(
                    group.SellerId,
                    "Don hang moi",
                    $"Don #{order.Id} vua duoc dat - tranh {names}.",
                    "order",
                    order.Id.ToString());
            }

            return CreatedAtAction(nameof(GetById), new { id = order.Id }, new
            {
                id = order.Id,
                orderId = order.Id,
                order,
                details = orderDetails,
                items = orderDetails.Select(ToItemDto)
            });
        }

        [HttpPut("{id}/status")]
        [Authorize(Roles = "Artist")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateStatusDto dto)
        {
            var artistId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(artistId))
                return Unauthorized();

            var order = await _orderRepository.GetByIdAsync(id);
            if (order == null)
                return NotFound(new { message = "Khong tim thay don hang" });

            var details = await _orderDetailRepository.GetByOrderAsync(id);
            var artistDetails = details.Where(d => d.Product?.SellerId == artistId).ToList();
            if (!artistDetails.Any())
                return Forbid();

            var validTransitions = new Dictionary<string, string[]>
            {
                ["Pending"] = new[] { "Processing", "Cancelled" },
                ["Processing"] = new[] { "Shipping", "Cancelled" },
                ["Shipping"] = new[] { "Completed", "Cancelled" },
                ["Completed"] = Array.Empty<string>(),
                ["Cancelled"] = Array.Empty<string>(),
            };

            if (!validTransitions.TryGetValue(order.Status, out var allowed) || !allowed.Contains(dto.Status))
                return BadRequest(new { message = $"Khong the chuyen tu '{order.Status}' sang '{dto.Status}'" });

            await using var transaction = await _db.Database.BeginTransactionAsync();

            order.Status = dto.Status;
            await _orderRepository.UpdateAsync(order);

            if (dto.Status == "Completed")
            {
                foreach (var detail in artistDetails)
                {
                    var product = await _productRepository.GetByIdAsync(detail.ProductId);
                    if (product != null)
                    {
                        product.Status = "Sold";
                        await _productRepository.UpdateAsync(product);
                    }
                }
            }
            else if (dto.Status == "Cancelled")
            {
                foreach (var detail in artistDetails)
                {
                    var product = await _productRepository.GetByIdAsync(detail.ProductId);
                    if (product != null && product.Status == "Ordered")
                    {
                        product.Status = "ForSale";
                        await _productRepository.UpdateAsync(product);
                    }
                }
            }

            await transaction.CommitAsync();

            var statusLabel = dto.Status switch
            {
                "Processing" => "Dang xu ly",
                "Shipping" => "Dang giao hang",
                "Completed" => "Da giao thanh cong",
                "Cancelled" => "Da bi huy",
                _ => dto.Status
            };

            await TryCreateNotificationAsync(
                order.UserId,
                $"Don hang #{order.Id}: {statusLabel}",
                $"Don hang #{order.Id} cua ban da chuyen sang trang thai \"{statusLabel}\".",
                "order",
                order.Id.ToString());

            return Ok(order);
        }

        [HttpGet("artist")]
        [Authorize(Roles = "Artist")]
        public async Task<IActionResult> GetArtistOrders()
        {
            var artistId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(artistId))
                return Unauthorized();

            var allOrders = await _orderRepository.GetAllAsync();
            var result = new List<object>();

            var userIds = allOrders.Select(o => o.UserId).Distinct().ToList();
            var users = await _db.Users
                .Where(u => userIds.Contains(u.Id))
                .ToDictionaryAsync(u => u.Id);

            var addressNames = (await _db.UserAddresses
                .Where(a => userIds.Contains(a.UserId))
                .ToListAsync())
                .GroupBy(a => a.UserId)
                .ToDictionary(
                    g => g.Key,
                    g => g.OrderByDescending(a => a.IsDefault).ThenByDescending(a => a.Id).First().FullName);

            foreach (var order in allOrders)
            {
                var details = await _orderDetailRepository.GetByOrderAsync(order.Id);
                var artistDetails = details.Where(d => d.Product?.SellerId == artistId).ToList();
                if (!artistDetails.Any())
                    continue;

                users.TryGetValue(order.UserId, out var buyer);
                addressNames.TryGetValue(order.UserId, out var addressName);
                result.Add(new
                {
                    order.Id,
                    order.UserId,
                    customerName = ResolveCustomerName(order, buyer, addressName),
                    order.OrderDate,
                    order.Status,
                    order.ShippingAddress,
                    order.Phone,
                    items = artistDetails.Select(d => new
                    {
                        d.ProductId,
                        productName = d.Product?.Name ?? "",
                        productStatus = NormalizeProductStatus(d.Product?.Status),
                        d.UnitPrice
                    })
                });
            }

            return Ok(result);
        }

        [HttpPut("{id}/cancel")]
        public async Task<IActionResult> CancelOrder(int id)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var callerRole = User.FindFirst(ClaimTypes.Role)?.Value;

            var order = await _orderRepository.GetByIdAsync(id);
            if (order == null)
                return NotFound(new { message = "Khong tim thay don hang" });

            var cancelDetails = await _orderDetailRepository.GetByOrderAsync(id);
            var callerOwnsAnyProduct = cancelDetails.Any(d => d.Product?.SellerId == userId);

            if (callerRole != "Admin" && order.UserId != userId && !(callerRole == "Artist" && callerOwnsAnyProduct))
                return Forbid();

            if (order.Status == "Completed")
                return BadRequest(new { message = "Khong the huy don hang da hoan thanh" });

            if (order.Status == "Cancelled")
                return BadRequest(new { message = "Don hang da duoc huy roi" });

            await using var transaction = await _db.Database.BeginTransactionAsync();

            foreach (var detail in cancelDetails)
            {
                var product = await _productRepository.GetByIdAsync(detail.ProductId);
                if (product != null && (product.Status == "Ordered" || product.Status == "Shipping"))
                {
                    product.Status = "ForSale";
                    await _productRepository.UpdateAsync(product);
                }
            }

            order.Status = "Cancelled";
            await _orderRepository.UpdateAsync(order);
            await transaction.CommitAsync();

            if (callerRole != "Artist")
            {
                var artistIds = cancelDetails
                    .Where(d => !string.IsNullOrEmpty(d.Product?.SellerId))
                    .Select(d => d.Product!.SellerId!)
                    .Distinct();

                foreach (var artistId in artistIds)
                {
                    await TryCreateNotificationAsync(
                        artistId,
                        $"Don hang #{order.Id} bi huy",
                        $"Nguoi mua da huy don hang #{order.Id}.",
                        "order",
                        order.Id.ToString());
                }
            }
            else
            {
                await TryCreateNotificationAsync(
                    order.UserId,
                    $"Don hang #{order.Id} bi huy",
                    $"Don hang #{order.Id} da bi huy boi hoa si.",
                    "order",
                    order.Id.ToString());
            }

            return Ok(new { message = "Da huy don hang thanh cong", order });
        }

        private static object ToOrderDto(Order order, List<OrderDetail> details, User? user = null, string? addressFullName = null)
        {
            var customerName = ResolveCustomerName(order, user, addressFullName);
            var phone = !string.IsNullOrWhiteSpace(order.Phone) ? order.Phone : user?.Phone ?? "";
            return new
            {
                order.Id,
                order.UserId,
                order.OrderDate,
                order.TotalAmount,
                order.Status,
                order.ShippingAddress,
                order.PaymentMethod,
                order.Note,
                Phone = phone,
                customerName,
                userPhone = phone,
                items = details.Select(ToItemDto),
            };
        }

        private static string ResolveCustomerName(Order order, User? user, string? addressFullName = null)
        {
            if (!string.IsNullOrWhiteSpace(order.CustomerName))
                return order.CustomerName.Trim();

            if (!string.IsNullOrWhiteSpace(addressFullName))
                return addressFullName.Trim();

            if (user == null || string.IsNullOrWhiteSpace(user.Name))
                return "";

            var displayName = user.Name.Trim();
            var login = user.UserName?.Trim() ?? "";

            // Không dùng username đăng nhập làm tên khách (vd: "user", "nguyenphuongtay")
            if (!string.IsNullOrEmpty(login) &&
                string.Equals(displayName, login, StringComparison.OrdinalIgnoreCase))
                return "";

            return displayName;
        }

        private static object ToItemDto(OrderDetail detail) => new
        {
            detail.ProductId,
            productName = detail.Product?.Name ?? "",
            imageUrl = detail.Product?.ImageUrl ?? "",
            artistName = detail.Product?.ArtistName ?? "",
            detail.UnitPrice,
            price = detail.UnitPrice,
            detail.Quantity,
            productStatus = NormalizeProductStatus(detail.Product?.Status),
        };

        private static bool IsSellableProductStatus(string? status)
            => status == "ForSale" || status == "Available";

        private static string NormalizeProductStatus(string? status)
            => status == "Available" ? "ForSale" : status ?? "";

        private async Task TryCreateNotificationAsync(string userId, string title, string message, string type, string? refId = null)
        {
            try
            {
                await NotificationHelper.CreateAsync(_db, userId, title, message, type, refId);
            }
            catch
            {
                foreach (var entry in _db.ChangeTracker.Entries<Notification>().Where(e => e.State == EntityState.Added).ToList())
                    entry.State = EntityState.Detached;
            }
        }
    }

    public class CreateOrderDto
    {
        public List<OrderItemDto> Items { get; set; } = new();
        public string? ShippingAddress { get; set; }
        public string? PaymentMethod { get; set; } = "COD";
        public string? Note { get; set; }
        public string? Phone { get; set; }
        public string? CustomerName { get; set; }
    }

    public class OrderItemDto
    {
        public int ProductId { get; set; }
    }

    public class UpdateStatusDto
    {
        public string Status { get; set; } = "";
    }
}
