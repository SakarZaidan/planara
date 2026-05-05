using System.Text;
using System.Text.Json;
using HtmlAgilityPack;

namespace Planara.Services;

public class IkeaScraper : IIkeaScraper
{
    private readonly HttpClient _http;
    private readonly string _supabaseUrl;
    private readonly string _serviceKey;
    private readonly ILogger<IkeaScraper> _logger;

    private static readonly Dictionary<string, string> Categories = new()
    {
        ["sofas-fu003"] = "Sofa",
        ["beds-bur001"] = "Bed",
        ["wardrobes-19053"] = "Wardrobe",
        ["dining-tables-fu002"] = "Dining Table",
        ["armchairs-fu005"] = "Armchair",
        ["coffee-tables-10705"] = "Coffee Table",
        ["tv-storage-fu008"] = "TV & Storage",
        ["office-chairs-73065"] = "Office Chair",
    };

    private static readonly Dictionary<string, string[]> KeywordStyleMap = new()
    {
        ["oak"] = ["Natural", "Scandinavian"],
        ["bamboo"] = ["Natural", "Eco"],
        ["rattan"] = ["Natural", "Bohemian"],
        ["walnut"] = ["Natural", "Modern"],
        ["pine"] = ["Natural", "Rustic"],
        ["white"] = ["Scandinavian", "Minimalist"],
        ["grey"] = ["Modern", "Minimalist"],
        ["gray"] = ["Modern", "Minimalist"],
        ["black"] = ["Modern", "Industrial"],
        ["velvet"] = ["Glamour", "Luxe"],
        ["gold"] = ["Glamour", "Luxe"],
        ["linen"] = ["Natural", "Scandinavian"],
        ["fabric"] = ["Casual", "Modern"],
        ["leather"] = ["Modern", "Industrial"],
        ["glass"] = ["Modern", "Minimalist"],
        ["steel"] = ["Industrial", "Modern"],
        ["metal"] = ["Industrial", "Modern"],
        ["wooden"] = ["Natural", "Rustic"],
        ["dark"] = ["Modern", "Industrial"],
        ["light"] = ["Scandinavian", "Minimalist"],
    };

    public IkeaScraper(HttpClient http, IConfiguration config, ILogger<IkeaScraper> logger)
    {
        _http = http;
        _supabaseUrl = config["Supabase:Url"] ?? throw new InvalidOperationException("Supabase:Url not configured");
        _serviceKey = config["Supabase:ServiceKey"] ?? throw new InvalidOperationException("Supabase:ServiceKey not configured");
        _logger = logger;

        _http.DefaultRequestHeaders.Add("User-Agent",
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36");
        _http.DefaultRequestHeaders.Add("Accept-Language", "en-US,en;q=0.9");
    }

    public async Task<int> ScrapeAndUpsertAsync(CancellationToken ct = default)
    {
        var items = new List<object>();

        foreach (var (slug, categoryLabel) in Categories)
        {
            try
            {
                var url = $"https://www.ikea.com/kw/en/cat/{slug}/";
                var html = await _http.GetStringAsync(url, ct);

                var doc = new HtmlDocument();
                doc.LoadHtml(html);

                var cards = doc.DocumentNode.SelectNodes("//article[contains(@class,'plp-fragment')]")
                    ?? doc.DocumentNode.SelectNodes("//div[contains(@class,'pip-product-compact')]")
                    ?? doc.DocumentNode.SelectNodes("//*[@data-ref-id]");

                if (cards == null)
                {
                    _logger.LogWarning("No product cards found for category {Category}", categoryLabel);
                    continue;
                }

                foreach (var card in cards.Take(30))
                {
                    var name = card.SelectSingleNode(".//*[contains(@class,'pip-header-section__title')]")?.InnerText.Trim()
                        ?? card.SelectSingleNode(".//h2")?.InnerText.Trim()
                        ?? card.SelectSingleNode(".//h3")?.InnerText.Trim();

                    var priceText = card.SelectSingleNode(".//*[contains(@class,'pip-price__integer')]")?.InnerText.Trim()
                        ?? card.SelectSingleNode(".//*[contains(@class,'plp-price')]")?.InnerText.Trim();

                    var productUrl = card.SelectSingleNode(".//a[contains(@href,'/kw/en/p/')]")?.GetAttributeValue("href", null)
                        ?? card.SelectSingleNode(".//a")?.GetAttributeValue("href", null);

                    var imageUrl = card.SelectSingleNode(".//img")?.GetAttributeValue("src", null)
                        ?? card.SelectSingleNode(".//img")?.GetAttributeValue("data-src", null);

                    if (string.IsNullOrWhiteSpace(name)) continue;

                    var sku = productUrl?.Split('/').LastOrDefault(s => s.Length > 0) ?? Guid.NewGuid().ToString("N")[..8];
                    decimal.TryParse(priceText?.Replace(",", "").Replace("KD", "").Trim(), out var price);

                    if (!string.IsNullOrEmpty(productUrl) && !productUrl.StartsWith("http"))
                        productUrl = "https://www.ikea.com" + productUrl;

                    items.Add(new
                    {
                        id = Guid.NewGuid().ToString(),
                        sku,
                        name,
                        series = name.Split(' ').First().ToUpperInvariant(),
                        price_kwd = price > 0 ? price : 0,
                        category = categoryLabel,
                        description = $"{name} - {categoryLabel}",
                        product_url = productUrl ?? "",
                        image_url = imageUrl ?? "",
                        style_tags = DeriveStyleTags(name),
                        last_synced = DateTime.UtcNow,
                    });
                }

                _logger.LogInformation("Scraped {Count} items from {Category}", cards.Count, categoryLabel);
                await Task.Delay(500, ct);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to scrape category {Category}", categoryLabel);
            }
        }

        if (items.Count == 0) return 0;
        return await UpsertAsync(items, ct);
    }

    public async Task<int> SeedAsync(CancellationToken ct = default)
    {
        var items = GetSeedData();
        return await UpsertAsync(items, ct);
    }

    private async Task<int> UpsertAsync(List<object> items, CancellationToken ct)
    {
        var json = JsonSerializer.Serialize(items);
        var req = new HttpRequestMessage(HttpMethod.Post, $"{_supabaseUrl}/rest/v1/ikea_catalog")
        {
            Content = new StringContent(json, Encoding.UTF8, "application/json"),
        };
        req.Headers.Add("apikey", _serviceKey);
        req.Headers.Add("Authorization", $"Bearer {_serviceKey}");
        req.Headers.Add("Prefer", "resolution=merge-duplicates,return=minimal");

        var res = await _http.SendAsync(req, ct);
        if (!res.IsSuccessStatusCode)
        {
            var err = await res.Content.ReadAsStringAsync(ct);
            _logger.LogError("Upsert failed: {Error}", err);
            return 0;
        }

        return items.Count;
    }

    private static string[] DeriveStyleTags(string name)
    {
        var lower = name.ToLowerInvariant();
        var tags = new HashSet<string>();
        foreach (var (keyword, styles) in KeywordStyleMap)
        {
            if (lower.Contains(keyword))
                foreach (var s in styles) tags.Add(s);
        }
        if (tags.Count == 0) tags.Add("Modern");
        return tags.ToArray();
    }

    private static List<object> GetSeedData() =>
    [
        // Sofas
        new { id = "a1000001-0000-0000-0000-000000000001", sku = "KIVIK-001", name = "KIVIK Sofa", series = "KIVIK", price_kwd = 249.000m, category = "Sofa", description = "3-seat sofa with a comfortable, resilient seat cushion that quickly regains its shape.", product_url = "https://www.ikea.com/kw/en/p/kivik-sofa/", image_url = "https://www.ikea.com/kw/en/images/products/kivik-sofa-tibbleby-beige-grey__0775179_pe757883_s5.jpg", style_tags = new[] { "Modern", "Casual" }, last_synced = DateTime.UtcNow },
        new { id = "a1000001-0000-0000-0000-000000000002", sku = "EKTORP-001", name = "EKTORP Sofa", series = "EKTORP", price_kwd = 189.000m, category = "Sofa", description = "Classic shaped sofa with a comfortable seat depth and removable covers.", product_url = "https://www.ikea.com/kw/en/p/ektorp-sofa/", image_url = "https://www.ikea.com/kw/en/images/products/ektorp-sofa-hallarp-grey__0938485_pe793718_s5.jpg", style_tags = new[] { "Scandinavian", "Classic" }, last_synced = DateTime.UtcNow },
        new { id = "a1000001-0000-0000-0000-000000000003", sku = "VIMLE-001", name = "VIMLE 3-seat sofa", series = "VIMLE", price_kwd = 329.000m, category = "Sofa", description = "A generously sized sofa that adapts to your lifestyle with modular design.", product_url = "https://www.ikea.com/kw/en/p/vimle-sofa/", image_url = "https://www.ikea.com/kw/en/images/products/vimle-3-seat-sofa-gunnared-medium-grey__0774984_pe757676_s5.jpg", style_tags = new[] { "Modern", "Minimalist" }, last_synced = DateTime.UtcNow },
        new { id = "a1000001-0000-0000-0000-000000000004", sku = "LANDSKRONA-001", name = "LANDSKRONA Sofa", series = "LANDSKRONA", price_kwd = 459.000m, category = "Sofa", description = "Genuine leather sofa with a timeless design and solid wood legs.", product_url = "https://www.ikea.com/kw/en/p/landskrona-sofa/", image_url = "https://www.ikea.com/kw/en/images/products/landskrona-3-seat-sofa-grann-bomstad-dark-brown-wood__0763369_pe752028_s5.jpg", style_tags = new[] { "Modern", "Industrial", "Luxe" }, last_synced = DateTime.UtcNow },

        // Beds
        new { id = "a1000001-0000-0000-0000-000000000005", sku = "MALM-001", name = "MALM Bed frame", series = "MALM", price_kwd = 89.000m, category = "Bed", description = "Clean lines with a simple, clean-lined design in white-stained oak veneer.", product_url = "https://www.ikea.com/kw/en/p/malm-bed-frame/", image_url = "https://www.ikea.com/kw/en/images/products/malm-bed-frame-high-white-stained-oak-veneer__0638588_pe698836_s5.jpg", style_tags = new[] { "Scandinavian", "Minimalist" }, last_synced = DateTime.UtcNow },
        new { id = "a1000001-0000-0000-0000-000000000006", sku = "HEMNES-BED-001", name = "HEMNES Bed frame", series = "HEMNES", price_kwd = 119.000m, category = "Bed", description = "Solid wood bed frame with a traditional design and built-in storage.", product_url = "https://www.ikea.com/kw/en/p/hemnes-bed-frame/", image_url = "https://www.ikea.com/kw/en/images/products/hemnes-bed-frame-white-stain__0637676_pe698404_s5.jpg", style_tags = new[] { "Rustic", "Natural", "Classic" }, last_synced = DateTime.UtcNow },
        new { id = "a1000001-0000-0000-0000-000000000007", sku = "BRIMNES-BED-001", name = "BRIMNES Bed frame with storage", series = "BRIMNES", price_kwd = 149.000m, category = "Bed", description = "Bed frame with 4 large drawers for ample storage under the bed.", product_url = "https://www.ikea.com/kw/en/p/brimnes-bed-frame/", image_url = "https://www.ikea.com/kw/en/images/products/brimnes-bed-frame-with-storage-white__0638302_pe698748_s5.jpg", style_tags = new[] { "Modern", "Minimalist" }, last_synced = DateTime.UtcNow },
        new { id = "a1000001-0000-0000-0000-000000000008", sku = "LEIRVIK-001", name = "LEIRVIK Bed frame", series = "LEIRVIK", price_kwd = 79.000m, category = "Bed", description = "Metal bed frame with a romantic, traditional look.", product_url = "https://www.ikea.com/kw/en/p/leirvik-bed-frame/", image_url = "https://www.ikea.com/kw/en/images/products/leirvik-bed-frame-white__0638591_pe698840_s5.jpg", style_tags = new[] { "Classic", "Glamour" }, last_synced = DateTime.UtcNow },

        // Dining Tables
        new { id = "a1000001-0000-0000-0000-000000000009", sku = "EKEDALEN-001", name = "EKEDALEN Extendable table", series = "EKEDALEN", price_kwd = 139.000m, category = "Dining Table", description = "Extendable oak veneer dining table that seats 4-6 people.", product_url = "https://www.ikea.com/kw/en/p/ekedalen-extendable-table/", image_url = "https://www.ikea.com/kw/en/images/products/ekedalen-extendable-table-oak__0527228_pe644041_s5.jpg", style_tags = new[] { "Natural", "Scandinavian" }, last_synced = DateTime.UtcNow },
        new { id = "a1000001-0000-0000-0000-000000000010", sku = "MORBYLÁNGA-001", name = "MÖRBYLÅNGA Table", series = "MÖRBYLÅNGA", price_kwd = 249.000m, category = "Dining Table", description = "Solid oak table with visible wood grain and a sturdy construction.", product_url = "https://www.ikea.com/kw/en/p/morbylanga-table/", image_url = "https://www.ikea.com/kw/en/images/products/morbylanga-table-oak-veneer-brown__0638695_pe698896_s5.jpg", style_tags = new[] { "Natural", "Rustic", "Modern" }, last_synced = DateTime.UtcNow },
        new { id = "a1000001-0000-0000-0000-000000000011", sku = "LISABO-001", name = "LISABO Table", series = "LISABO", price_kwd = 99.000m, category = "Dining Table", description = "Ash veneer dining table with tapered legs and a simple, modern look.", product_url = "https://www.ikea.com/kw/en/p/lisabo-table/", image_url = "https://www.ikea.com/kw/en/images/products/lisabo-table-ash-veneer__0583462_pe668173_s5.jpg", style_tags = new[] { "Scandinavian", "Minimalist" }, last_synced = DateTime.UtcNow },

        // Wardrobes
        new { id = "a1000001-0000-0000-0000-000000000012", sku = "PAX-001", name = "PAX Wardrobe", series = "PAX", price_kwd = 199.000m, category = "Wardrobe", description = "Customisable wardrobe with frames, doors, and interior organisers.", product_url = "https://www.ikea.com/kw/en/p/pax-wardrobe/", image_url = "https://www.ikea.com/kw/en/images/products/pax-wardrobe-white__0613445_pe686497_s5.jpg", style_tags = new[] { "Modern", "Minimalist", "Scandinavian" }, last_synced = DateTime.UtcNow },
        new { id = "a1000001-0000-0000-0000-000000000013", sku = "HEMNES-WAR-001", name = "HEMNES Wardrobe with 2 doors", series = "HEMNES", price_kwd = 169.000m, category = "Wardrobe", description = "Solid wood wardrobe with a classic design and painted white surface.", product_url = "https://www.ikea.com/kw/en/p/hemnes-wardrobe/", image_url = "https://www.ikea.com/kw/en/images/products/hemnes-wardrobe-with-2-sliding-doors-white-stain__0637645_pe698384_s5.jpg", style_tags = new[] { "Classic", "Natural", "Rustic" }, last_synced = DateTime.UtcNow },
        new { id = "a1000001-0000-0000-0000-000000000014", sku = "BRIMNES-WAR-001", name = "BRIMNES Wardrobe with 3 doors", series = "BRIMNES", price_kwd = 219.000m, category = "Wardrobe", description = "Wardrobe with mirrored doors and adjustable shelves for flexible storage.", product_url = "https://www.ikea.com/kw/en/p/brimnes-wardrobe/", image_url = "https://www.ikea.com/kw/en/images/products/brimnes-wardrobe-with-3-doors-white__0638305_pe698751_s5.jpg", style_tags = new[] { "Modern", "Minimalist" }, last_synced = DateTime.UtcNow },

        // Coffee Tables
        new { id = "a1000001-0000-0000-0000-000000000015", sku = "LACK-001", name = "LACK Coffee table", series = "LACK", price_kwd = 19.000m, category = "Coffee Table", description = "Simple, affordable coffee table with a clean design in black-brown finish.", product_url = "https://www.ikea.com/kw/en/p/lack-coffee-table/", image_url = "https://www.ikea.com/kw/en/images/products/lack-coffee-table-black-brown__0638595_pe698843_s5.jpg", style_tags = new[] { "Minimalist", "Modern" }, last_synced = DateTime.UtcNow },
        new { id = "a1000001-0000-0000-0000-000000000016", sku = "HEMNES-CT-001", name = "HEMNES Coffee table", series = "HEMNES", price_kwd = 89.000m, category = "Coffee Table", description = "Solid pine coffee table with a lift-top lid and storage drawer.", product_url = "https://www.ikea.com/kw/en/p/hemnes-coffee-table/", image_url = "https://www.ikea.com/kw/en/images/products/hemnes-coffee-table-white-stain__0638317_pe698760_s5.jpg", style_tags = new[] { "Rustic", "Natural", "Classic" }, last_synced = DateTime.UtcNow },
        new { id = "a1000001-0000-0000-0000-000000000017", sku = "STOCKHOLM-001", name = "STOCKHOLM Coffee table", series = "STOCKHOLM", price_kwd = 149.000m, category = "Coffee Table", description = "Walnut veneer coffee table with elegant tapered legs and a lower shelf.", product_url = "https://www.ikea.com/kw/en/p/stockholm-coffee-table/", image_url = "https://www.ikea.com/kw/en/images/products/stockholm-coffee-table-walnut-veneer__0638696_pe698897_s5.jpg", style_tags = new[] { "Natural", "Modern", "Luxe" }, last_synced = DateTime.UtcNow },
        new { id = "a1000001-0000-0000-0000-000000000018", sku = "LISTERBY-001", name = "LISTERBY Coffee table", series = "LISTERBY", price_kwd = 59.000m, category = "Coffee Table", description = "Oak veneer coffee table with a lower shelf for extra storage.", product_url = "https://www.ikea.com/kw/en/p/listerby-coffee-table/", image_url = "https://www.ikea.com/kw/en/images/products/listerby-coffee-table-oak__0697158_pe721972_s5.jpg", style_tags = new[] { "Natural", "Scandinavian" }, last_synced = DateTime.UtcNow },

        // Office Chairs
        new { id = "a1000001-0000-0000-0000-000000000019", sku = "MARKUS-001", name = "MARKUS Office chair", series = "MARKUS", price_kwd = 129.000m, category = "Office Chair", description = "Ergonomic office chair with built-in lumbar support and adjustable height.", product_url = "https://www.ikea.com/kw/en/p/markus-office-chair/", image_url = "https://www.ikea.com/kw/en/images/products/markus-office-chair-vissle-dark-grey__0703596_pe724677_s5.jpg", style_tags = new[] { "Modern", "Minimalist" }, last_synced = DateTime.UtcNow },
        new { id = "a1000001-0000-0000-0000-000000000020", sku = "FLINTAN-001", name = "FLINTAN Office chair", series = "FLINTAN", price_kwd = 79.000m, category = "Office Chair", description = "Modern office chair with synchro tilt mechanism and breathable mesh back.", product_url = "https://www.ikea.com/kw/en/p/flintan-office-chair/", image_url = "https://www.ikea.com/kw/en/images/products/flintan-office-chair-beige__1151705_pe886082_s5.jpg", style_tags = new[] { "Scandinavian", "Modern" }, last_synced = DateTime.UtcNow },
        new { id = "a1000001-0000-0000-0000-000000000021", sku = "HATTEFJALL-001", name = "HATTEFJÄLL Office chair", series = "HATTEFJÄLL", price_kwd = 199.000m, category = "Office Chair", description = "High-back office chair with leather upholstery and executive design.", product_url = "https://www.ikea.com/kw/en/p/hattefjall-office-chair/", image_url = "https://www.ikea.com/kw/en/images/products/hattefjaell-office-chair-with-armrests-gunnared-beige__0782278_pe760658_s5.jpg", style_tags = new[] { "Luxe", "Modern" }, last_synced = DateTime.UtcNow },

        // Armchairs
        new { id = "a1000001-0000-0000-0000-000000000022", sku = "POANG-001", name = "POÄNG Armchair", series = "POÄNG", price_kwd = 69.000m, category = "Armchair", description = "Iconic bentwood armchair with resilient high back and removable seat cushion.", product_url = "https://www.ikea.com/kw/en/p/poang-armchair/", image_url = "https://www.ikea.com/kw/en/images/products/poaeng-armchair-birch-veneer-knisa-light-beige__0638507_pe698795_s5.jpg", style_tags = new[] { "Scandinavian", "Natural", "Classic" }, last_synced = DateTime.UtcNow },
        new { id = "a1000001-0000-0000-0000-000000000023", sku = "STRANDMON-001", name = "STRANDMON Wing chair", series = "STRANDMON", price_kwd = 149.000m, category = "Armchair", description = "High-back wing chair with a traditional silhouette and comfortable padding.", product_url = "https://www.ikea.com/kw/en/p/strandmon-wing-chair/", image_url = "https://www.ikea.com/kw/en/images/products/strandmon-wing-chair-nordvalla-dark-grey__0638487_pe698781_s5.jpg", style_tags = new[] { "Classic", "Glamour" }, last_synced = DateTime.UtcNow },
        new { id = "a1000001-0000-0000-0000-000000000024", sku = "EKOLSUND-001", name = "EKOLSUND Recliner", series = "EKOLSUND", price_kwd = 219.000m, category = "Armchair", description = "Recliner with adjustable back and footrest, upholstered in genuine leather.", product_url = "https://www.ikea.com/kw/en/p/ekolsund-recliner/", image_url = "https://www.ikea.com/kw/en/images/products/ekolsund-recliner-gunnared-dark-grey__0711892_pe728629_s5.jpg", style_tags = new[] { "Modern", "Casual" }, last_synced = DateTime.UtcNow },

        // TV & Storage
        new { id = "a1000001-0000-0000-0000-000000000025", sku = "BESTA-001", name = "BESTÅ TV unit", series = "BESTÅ", price_kwd = 109.000m, category = "TV & Storage", description = "Modular TV storage system with doors and drawers for a neat look.", product_url = "https://www.ikea.com/kw/en/p/besta-tv-unit/", image_url = "https://www.ikea.com/kw/en/images/products/besta-tv-unit-with-doors-white-selsviken-high-gloss-white__0638310_pe698753_s5.jpg", style_tags = new[] { "Modern", "Minimalist" }, last_synced = DateTime.UtcNow },
        new { id = "a1000001-0000-0000-0000-000000000026", sku = "KALLAX-001", name = "KALLAX Shelf unit", series = "KALLAX", price_kwd = 49.000m, category = "TV & Storage", description = "Versatile shelf unit that can be used as a room divider or TV stand.", product_url = "https://www.ikea.com/kw/en/p/kallax-shelf-unit/", image_url = "https://www.ikea.com/kw/en/images/products/kallax-shelf-unit-white__0638607_pe698854_s5.jpg", style_tags = new[] { "Scandinavian", "Minimalist" }, last_synced = DateTime.UtcNow },
    ];
}
