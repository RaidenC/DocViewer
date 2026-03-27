using DocViewer.Application.Interfaces;
using DocViewer.Domain.Entities;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using OpenSearch.Client;

namespace DocViewer.Infrastructure.Services;

public class DataGenerator : IDataGenerator
{
    private readonly IOpenSearchClient _client;
    private readonly ILogger<DataGenerator> _logger;
    private readonly GenerateProgress _progress = new();
    private static readonly Random _random = new();
    private static readonly object _lock = new();

    private const string IndexName = "documents";

    // 50 Client Names
    private static readonly string[] ClientNames = new[]
    {
        "XYZ Motors", "Smith Family Trust", "ABC Corporation", "Johnson & Associates",
        "Williams Dental Group", "Brown Engineering", "Davis Medical Center",
        "Miller Insurance Agency", "Wilson & Sons", "Taylor Properties",
        "Anderson Consulting", "Thomas Partners", "Jackson Holdings",
        "White Construction", "Harris Law Firm", "Martin Real Estate",
        "Thompson Marketing", "Garcia Financial", "Martinez Dental",
        "Robinson Architects", "Clark Medical", "Lewis & Co",
        "Walker Engineering", "Hall Associates", "Allen Properties",
        "Young Consulting", "King Financial", "Wright Dental",
        "Green Law Firm", "Adams Marketing", "Nelson Construction",
        "Hill Medical", "Scott Real Estate", "Moore & Partners",
        "Taylor Holdings", "Jackson Financial", "Brown Dental",
        "Johnson Properties", "Williams Consulting", "Smith Engineering",
        "Davis Medical Group", "Miller Associates", "Wilson Construction",
        "Taylor Medical", "Anderson Real Estate", "Thomas Law Firm",
        "Jackson & Sons", "White Financial", "Harris Properties",
        "Martin Engineering", "Thompson Marketing Group"
    };

    // 100 Senders
    private static readonly string[] Senders = new[]
    {
        "John Smith", "Mary Johnson", "Robert Williams", "Patricia Brown", "Michael Jones",
        "Jennifer Garcia", "William Miller", "Linda Davis", "David Rodriguez", "Barbara Martinez",
        "Richard Wilson", "Elizabeth Anderson", "Joseph Taylor", "Susan Thomas", "Christopher Jackson",
        "Jessica White", "Matthew Harris", "Sarah Martin", "Daniel Thompson", "Karen Garcia",
        "Anthony Robinson", "Nancy Clark", "Mark Lewis", "Lisa Walker", "Paul Hall",
        "Sandra Allen", "Steven Young", "Andrew King", "Edward Wright", "Betty Green",
        "Brian Adams", "Helen Nelson", "George Hill", "Dorothy Scott", "Edward Moore",
        "Ruth Taylor", "Kevin Jackson", "Virginia Brown", "Jason Johnson", "Angela Williams",
        "Jeffrey Smith", "Sharon Davis", "Ryan Miller", "Carol Wilson", "Gary Anderson",
        "Michelle Thomas", "Joshua Jackson", "Kimberly White", "Eric Harris", "Donna Martin",
        "Timothy Thompson", "Laura Garcia", "Brandon Martinez", "Emily Robinson", "Adam Clark",
        "Megan Lewis", "Justin Walker", "Stephanie Hall", "Benjamin Allen", "Nicole Young",
        "Jonathan King", "Amanda Wright", "Jacob Green", "Heather Adams", "Nicholas Nelson",
        "Rachel Hill", "Tyler Scott", "Samantha Moore", "Austin Taylor", "Brittany Jackson",
        "Dylan Brown", "Amber Johnson", "Jordan Williams", "Morgan Smith", "Cameron Davis",
        "Taylor Miller", "Casey Wilson", "Quinn Anderson", "Riley Thomas", "Avery Jackson",
        "Parker White", "Hayden Harris", "Reese Martin", "Peyton Thompson", "Finley Garcia",
        "Emerson Martinez", "Rowan Robinson", "Sage Clark", "Phoenix Lewis", "Dakota Walker",
        "Hayley Allen", "Jaden Young", "Addison King", "Aubrey Wright", "Kendall Green",
        "Logan Adams", "Parker Nelson", "Alexis Hill", "Piper Scott", "Lyric Moore",
        "River Taylor", "Ariel Jackson", "Cameron Brown", "Drew Johnson", "Jamie Williams"
    };

    // 1000 Subject Templates
    private static readonly string[] Subjects = new[]
    {
        "Invoice #{0}", "Payment Reminder #{0}", "Statement for Account #{0}",
        "Order Confirmation #{0}", "Shipping Notification #{0}", "Delivery Receipt #{0}",
        "Contract Review #{0}", "Quote Request #{0}", "Proposal for Services #{0}",
        "Meeting Minutes #{0}", "Quarterly Report #{0}", "Annual Review #{0}",
        "Budget Proposal #{0}", "Project Update #{0}", "Status Report #{0}",
        "Client Agreement #{0}", "Vendor Contract #{0}", "Partnership Proposal #{0}",
        "Sales Report #{0}", "Marketing Analysis #{0}", "Financial Summary #{0}",
        "Tax Document #{0}", "Insurance Claim #{0}", "Legal Notice #{0}",
        "Compliance Report #{0}", "Audit Results #{0}", "Performance Review #{0}",
        "Training Materials #{0}", "Policy Update #{0}", "Procedure Manual #{0}",
        "Employee Handbook #{0}", "Safety Guidelines #{0}", "Technical Specification #{0}",
        "System Requirements #{0}", "Architecture Design #{0}", "Implementation Plan #{0}",
        "Testing Report #{0}", "Deployment Guide #{0}", "User Manual #{0}",
        "API Documentation #{0}", "Release Notes #{0}", "Known Issues #{0}",
        "Bug Report #{0}", "Feature Request #{0}", "Enhancement Proposal #{0}",
        "Change Request #{0}", "Incident Report #{0}", "Maintenance Schedule #{0}",
        "System Alert #{0}", "Security Advisory #{0}", "Privacy Policy #{0}",
        "Terms of Service #{0}", "Service Agreement #{0}", "Warranty Information #{0}",
        "Product Catalog #{0}", "Price List #{0}", "Special Offer #{0}",
        "Promotional Email #{0}", "Newsletter #{0}", "Announcement #{0}",
        "Press Release #{0}", "Media Kit #{0}", "Brand Guidelines #{0}",
        "Logo Request #{0}", "Marketing Campaign #{0}", "Social Media Strategy #{0}",
        "Content Calendar #{0}", "Blog Post #{0}", "Article Draft #{0}",
        "Press Coverage #{0}", "Event Invitation #{0}", "Conference Schedule #{0}",
        "Workshop Registration #{0}", "Webinar Confirmation #{0}", "Training Registration #{0}",
        "Certification Details #{0}", "License Renewal #{0}", "Subscription Update #{0}",
        "Account Settings #{0}", "Profile Update #{0}", "Password Reset #{0}",
        "Security Notification #{0}", "Login Alert #{0}", "Access Request #{0}",
        "Permission Grant #{0}", "Role Assignment #{0}", "Team Addition #{0}",
        "Project Assignment #{0}", "Task Notification #{0}", "Deadline Reminder #{0}",
        "Meeting Invitation #{0}", "Calendar Update #{0}", "Travel Itinerary #{0}",
        "Expense Report #{0}", "Reimbursement Request #{0}", "Purchase Order #{0}",
        "Vendor Invoice #{0}", "Payment Receipt #{0}", "Credit Memo #{0}",
        "Refund Processed #{0}", "Account Balance #{0}", "Transaction History #{0}",
        "Wire Transfer #{0}", "ACH Notification #{0}", "Check Image #{0}",
        "Bank Statement #{0}", "Investment Report #{0}", "Portfolio Update #{0}",
        "Market Analysis #{0}", "Stock Quote #{0}", "Dividend Notice #{0}",
        "Asset Valuation #{0}", "Risk Assessment #{0}", "Compliance Audit #{0}"
    };

    private static readonly string[] Channels = { "fax", "email", "scan", "ftp" };

    // File extensions per channel with probabilities
    private static readonly Dictionary<string, (string[] Extensions, int[] Weights)> FileExtensionsByChannel = new()
    {
        ["fax"] = (new[] { "txt", "tif" }, new[] { 80, 20 }),
        ["email"] = (new[] { "txt", "eml" }, new[] { 90, 10 }),
        ["scan"] = (new[] { "jpg", "pdf" }, new[] { 70, 30 }),
        ["ftp"] = (new[] { "pdf", "xlsx", "docx" }, new[] { 60, 25, 15 })
    };

    public DataGenerator(IConfiguration configuration, ILogger<DataGenerator> logger)
    {
        _logger = logger;

        var uri = configuration["OpenSearch:Uri"] ?? "http://localhost:9200";
        var settings = new ConnectionSettings(new Uri(uri))
            .DefaultIndex(IndexName)
            .EnableDebugMode();

        _client = new OpenSearchClient(settings);
    }

    public Task<GenerateProgress> GetProgressAsync()
    {
        return Task.FromResult(new GenerateProgress
        {
            TotalDocuments = _progress.TotalDocuments,
            DocumentsGenerated = _progress.DocumentsGenerated,
            IsComplete = _progress.IsComplete,
            Error = _progress.Error
        });
    }

    public async Task<int> GenerateDocumentsAsync(int count, IProgress<int>? progress, CancellationToken cancellationToken)
    {
        _progress.TotalDocuments = count;
        _progress.DocumentsGenerated = 0;
        _progress.IsComplete = false;
        _progress.Error = null;

        var semaphore = new SemaphoreSlim(10); // 10 parallel tasks
        var tasks = new List<Task>();
        var batchSize = 1000;
        var batches = (int)Math.Ceiling((double)count / batchSize);
        var documentsGenerated = 0;

        _logger.LogInformation("Starting generation of {Count} documents in {Batches} batches", count, batches);

        for (var batchNum = 0; batchNum < batches; batchNum++)
        {
            await semaphore.WaitAsync(cancellationToken);

            var task = Task.Run(async () =>
            {
                try
                {
                    var batchDocsCount = Math.Min(batchSize, count - (batchNum * batchSize));
                    var documents = GenerateBatch(batchDocsCount, batchNum * batchSize);

                    await IndexBatchAsync(documents, cancellationToken);

                    lock (_lock)
                    {
                        documentsGenerated += batchDocsCount;
                        _progress.DocumentsGenerated = documentsGenerated;

                        // Report progress every 50K documents
                        if (documentsGenerated % 50000 < batchSize)
                        {
                            _logger.LogInformation("Generated {Count} / {Total} documents", documentsGenerated, count);
                            progress?.Report(documentsGenerated);
                        }
                    }
                }
                catch (Exception ex)
                {
                    lock (_lock)
                    {
                        _progress.Error = ex.Message;
                    }
                    _logger.LogError(ex, "Error generating batch {BatchNum}", batchNum);
                }
                finally
                {
                    semaphore.Release();
                }
            }, cancellationToken);

            tasks.Add(task);
        }

        await Task.WhenAll(tasks);

        _progress.IsComplete = true;
        progress?.Report(count);
        _logger.LogInformation("Generation complete: {Count} documents", documentsGenerated);

        return documentsGenerated;
    }

    private List<Document> GenerateBatch(int count, int startIndex)
    {
        var documents = new List<Document>(count);

        for (var i = 0; i < count; i++)
        {
            var document = GenerateDocument(startIndex + i);
            documents.Add(document);
        }

        return documents;
    }

    private Document GenerateDocument(int index)
    {
        var channel = GetRandomChannel();
        var clientName = ClientNames[_random.Next(ClientNames.Length)];
        var year = GetRandomYear();
        var month = GetRandomMonth();
        var date = GetRandomDate(year);
        var sender = Senders[_random.Next(Senders.Length)];
        var subject = string.Format(Subjects[_random.Next(Subjects.Length)], index + 1);
        var content = GenerateLoremIpsum();
        var fileExtension = GetRandomFileExtension(channel);

        return new Document
        {
            Id = Guid.NewGuid().ToString(),
            FileName = $"doc_{index + 1:D8}.{fileExtension}",
            FilePath = $"/documents/{year}/{month}/{clientName}/doc_{index + 1:D8}.{fileExtension}",
            Channel = channel,
            Client = clientName,
            clientName = clientName,
            Year = year,
            Month = month,
            Date = date,
            Sender = sender,
            Subject = subject,
            Content = content,
            FileExtension = fileExtension
        };
    }

    private string GetRandomChannel()
    {
        // 25% each: fax, email, scan, ftp
        return Channels[_random.Next(Channels.Length)];
    }

    private int GetRandomYear()
    {
        // 2023(30%), 2024(40%), 2025(30%)
        var value = _random.Next(100);
        if (value < 30) return 2023;
        if (value < 70) return 2024;
        return 2025;
    }

    private string GetRandomMonth()
    {
        // 2024-01 to 2024-12
        var month = _random.Next(1, 13);
        return $"2024-{month:D2}";
    }

    private DateTime GetRandomDate(int year)
    {
        var start = new DateTime(year, 1, 1);
        var daysInYear = DateTime.IsLeapYear(year) ? 366 : 365;
        return start.AddDays(_random.Next(daysInYear));
    }

    private string GetRandomFileExtension(string channel)
    {
        var (extensions, weights) = FileExtensionsByChannel[channel];
        var totalWeight = weights.Sum();
        var randomValue = _random.Next(totalWeight);
        var cumulative = 0;

        for (var i = 0; i < extensions.Length; i++)
        {
            cumulative += weights[i];
            if (randomValue < cumulative)
            {
                return extensions[i];
            }
        }

        return extensions[0];
    }

    private string GenerateLoremIpsum()
    {
        var length = _random.Next(500, 2001);
        var words = new[] { "lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit",
            "sed", "do", "eiusmod", "tempor", "incididunt", "ut", "labore", "et", "dolore", "magna", "aliqua",
            "ut", "enim", "ad", "minim", "veniam", "quis", "nostrud", "exercitation", "ullamco", "laboris",
            "nisi", "ut", "aliquip", "ex", "ea", "commodo", "consequat", "duis", "aute", "irure", "dolor",
            "in", "reprehenderit", "in", "voluptate", "velit", "esse", "cillum", "dolore", "eu", "fugiat",
            "nulla", "pariatur", "excepteur", "sint", "occaecat", "cupidatat", "non", "proident", "sunt",
            "in", "culpa", "qui", "officia", "deserunt", "mollit", "anim", "id", "est", "laborum" };

        var result = new List<string>();
        while (result.Sum(w => w.Length + 1) < length)
        {
            result.Add(words[_random.Next(words.Length)]);
        }

        var text = string.Join(" ", result);
        return char.ToUpper(text[0]) + text.Substring(1) + ".";
    }

    private async Task IndexBatchAsync(List<Document> documents, CancellationToken cancellationToken)
    {
        var bulkResponse = await _client.BulkAsync(b => b
            .Index(IndexName)
            .IndexMany(documents),
            cancellationToken);

        if (!bulkResponse.IsValid)
        {
            throw new Exception($"Bulk indexing failed: {bulkResponse.DebugInformation}");
        }
    }
}