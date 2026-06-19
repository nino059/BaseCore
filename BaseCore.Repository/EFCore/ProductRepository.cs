using Microsoft.EntityFrameworkCore;
using BaseCore.Entities;

namespace BaseCore.Repository.EFCore
{
    /// <summary>
    /// Product Repository using Entity Framework Core
    /// </summary>
    public class ProductPriceAggregate
    {
        public int Count { get; set; }
        public decimal TotalPrice { get; set; }
        public decimal AveragePrice => Count > 0 ? TotalPrice / Count : 0;
    }

    public class ProductPriceStatsResult
    {
        public ProductPriceAggregate All { get; set; } = new();
        public ProductPriceAggregate ForSale { get; set; } = new();
    }

    public interface IProductRepositoryEF : IRepository<Product>
    {
        Task<(List<Product> Products, int TotalCount)> SearchAsync(
            string? keyword,
            int? categoryId,
            int page,
            int pageSize,
            bool publicOnly = false,
            string? sellerId = null,
            string? status = null,
            string? sortBy = null);
        Task<List<Product>> GetByCategoryAsync(int categoryId);
        Task<ProductPriceStatsResult> GetPriceStatsAsync(bool publicOnly = false, string? sellerId = null);
    }

    public class ProductRepositoryEF : Repository<Product>, IProductRepositoryEF
    {
        public ProductRepositoryEF(AppDbContext context) : base(context)
        {
        }

        private static IQueryable<Product> ApplyScope(IQueryable<Product> query, bool publicOnly, string? sellerId)
        {
            if (!string.IsNullOrEmpty(sellerId))
            {
                query = query.Where(p => p.SellerId == sellerId);
                if (publicOnly)
                    query = query.Where(p =>
                        p.Status == "ForSale" || p.Status == "Available"
                        || p.Status == "Ordered" || p.Status == "Sold" || p.Status == "OutOfStock");
            }
            else if (publicOnly)
            {
                query = query.Where(p =>
                    p.Status == "ForSale" || p.Status == "Available"
                    || p.Status == "Ordered" || p.Status == "Sold" || p.Status == "OutOfStock");
            }

            return query;
        }

        public async Task<(List<Product> Products, int TotalCount)> SearchAsync(
            string? keyword,
            int? categoryId,
            int page,
            int pageSize,
            bool publicOnly = false,
            string? sellerId = null,
            string? status = null,
            string? sortBy = null)
        {
            var query = ApplyScope(_dbSet.Include(p => p.Category).AsQueryable(), publicOnly, sellerId);

            if (!string.IsNullOrEmpty(status))
                query = query.Where(p => p.Status == status);

            if (!string.IsNullOrEmpty(keyword))
            {
                keyword = keyword.ToLower();
                query = query.Where(p =>
                    p.Name.ToLower().Contains(keyword) ||
                    (p.ArtistName != null && p.ArtistName.ToLower().Contains(keyword)) ||
                    (p.Description != null && p.Description.ToLower().Contains(keyword)));
            }

            if (categoryId.HasValue && categoryId > 0)
                query = query.Where(p => p.CategoryId == categoryId);

            var totalCount = await query.CountAsync();

            var ordered = sortBy switch
            {
                "price_asc"  => query.OrderBy(p => p.Price).ThenByDescending(p => p.Id),
                "price_desc" => query.OrderByDescending(p => p.Price).ThenByDescending(p => p.Id),
                _            => query.OrderByDescending(p => p.Id)
            };

            var products = await ordered
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (products, totalCount);
        }

        public async Task<ProductPriceStatsResult> GetPriceStatsAsync(bool publicOnly = false, string? sellerId = null)
        {
            var baseQuery = ApplyScope(_dbSet.AsQueryable(), publicOnly, sellerId);

            var allCount = await baseQuery.CountAsync();
            var allTotal = allCount > 0
                ? await baseQuery.SumAsync(p => p.Price)
                : 0m;

            var forSaleQuery = baseQuery.Where(p => p.Status == "ForSale" || p.Status == "Available");
            var forSaleCount = await forSaleQuery.CountAsync();
            var forSaleTotal = forSaleCount > 0
                ? await forSaleQuery.SumAsync(p => p.Price)
                : 0m;

            return new ProductPriceStatsResult
            {
                All = new ProductPriceAggregate { Count = allCount, TotalPrice = allTotal },
                ForSale = new ProductPriceAggregate { Count = forSaleCount, TotalPrice = forSaleTotal },
            };
        }

        public async Task<List<Product>> GetByCategoryAsync(int categoryId)
        {
            return await _dbSet
                .Where(p => p.CategoryId == categoryId)
                .Include(p => p.Category)
                .ToListAsync();
        }
    }
}
