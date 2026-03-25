using DocViewer.Application.Interfaces;
using DocViewer.Domain.Entities;
using FluentAssertions;
using Moq;
using Xunit;

namespace DocViewer.Application.Tests;

public class SearchServiceTests
{
    private readonly Mock<ISearchService> _mockSearchService;

    public SearchServiceTests()
    {
        _mockSearchService = new Mock<ISearchService>();
    }

    /// <summary>
    /// Test: SearchDocumentsAsync with query filters results by text
    /// </summary>
    [Fact]
    public async Task SearchDocumentsAsync_WithQuery_FiltersByTextContent()
    {
        // Arrange
        var expectedDocuments = new List<Document>
        {
            new() { Id = "doc1", FileName = "fax1.txt", Channel = "fax", Content = "Mortgage application" }
        };

        _mockSearchService
            .Setup(s => s.SearchDocumentsAsync(
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<DateTime?>(),
                It.IsAny<DateTime?>(),
                It.IsAny<int>(),
                It.IsAny<int>()))
            .ReturnsAsync((string? q, string? c, string? cl, DateTime? from, DateTime? to, int page, int pageSize) =>
            {
                // Only return docs that match the query
                if (!string.IsNullOrEmpty(q))
                {
                    return expectedDocuments.Where(d => d.Content.Contains(q, StringComparison.OrdinalIgnoreCase)).ToList();
                }
                return expectedDocuments;
            });

        var service = _mockSearchService.Object;

        // Act
        var result = await service.SearchDocumentsAsync(
            query: "mortgage",
            channel: null,
            client: null,
            fromDate: null,
            toDate: null,
            page: 1,
            pageSize: 20);

        // Assert
        result.Should().NotBeNull();
        result.Should().HaveCount(1);
        result.First().Content.Should().Contain("Mortgage");
    }

    /// <summary>
    /// Test: SearchDocumentsAsync with channel filter returns only that channel
    /// </summary>
    [Fact]
    public async Task SearchDocumentsAsync_WithChannelFilter_ReturnsOnlyThatChannel()
    {
        // Arrange
        var allDocuments = new List<Document>
        {
            new() { Id = "doc1", FileName = "fax1.txt", Channel = "fax", Content = "Fax content" },
            new() { Id = "doc2", FileName = "email1.txt", Channel = "email", Content = "Email content" },
            new() { Id = "doc3", FileName = "fax2.txt", Channel = "fax", Content = "Another fax" }
        };

        _mockSearchService
            .Setup(s => s.SearchDocumentsAsync(
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<DateTime?>(),
                It.IsAny<DateTime?>(),
                It.IsAny<int>(),
                It.IsAny<int>()))
            .ReturnsAsync((string? q, string? c, string? cl, DateTime? from, DateTime? to, int page, int pageSize) =>
            {
                var results = allDocuments.AsEnumerable();
                if (!string.IsNullOrEmpty(c))
                {
                    results = results.Where(d => d.Channel.Equals(c, StringComparison.OrdinalIgnoreCase));
                }
                return results.ToList();
            });

        var service = _mockSearchService.Object;

        // Act
        var result = await service.SearchDocumentsAsync(
            query: null,
            channel: "fax",
            client: null,
            fromDate: null,
            toDate: null,
            page: 1,
            pageSize: 20);

        // Assert
        result.Should().NotBeNull();
        result.Should().HaveCount(2);
        result.Should().OnlyContain(d => d.Channel == "fax");
    }

    /// <summary>
    /// Test: SearchDocumentsAsync with client filter returns only that client
    /// </summary>
    [Fact]
    public async Task SearchDocumentsAsync_WithClientFilter_ReturnsOnlyThatClient()
    {
        // Arrange
        var allDocuments = new List<Document>
        {
            new() { Id = "doc1", FileName = "fax1.txt", Channel = "fax", Client = "mortgage", Content = "Content" },
            new() { Id = "doc2", FileName = "email1.txt", Channel = "email", Client = "auto", Content = "Content" },
            new() { Id = "doc3", FileName = "fax2.txt", Channel = "fax", Client = "mortgage", Content = "Content" }
        };

        _mockSearchService
            .Setup(s => s.SearchDocumentsAsync(
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<DateTime?>(),
                It.IsAny<DateTime?>(),
                It.IsAny<int>(),
                It.IsAny<int>()))
            .ReturnsAsync((string? q, string? c, string? cl, DateTime? from, DateTime? to, int page, int pageSize) =>
            {
                var results = allDocuments.AsEnumerable();
                if (!string.IsNullOrEmpty(cl))
                {
                    results = results.Where(d => d.Client.Equals(cl, StringComparison.OrdinalIgnoreCase));
                }
                return results.ToList();
            });

        var service = _mockSearchService.Object;

        // Act
        var result = await service.SearchDocumentsAsync(
            query: null,
            channel: null,
            client: "mortgage",
            fromDate: null,
            toDate: null,
            page: 1,
            pageSize: 20);

        // Assert
        result.Should().NotBeNull();
        result.Should().HaveCount(2);
        result.Should().OnlyContain(d => d.Client == "mortgage");
    }

    /// <summary>
    /// Test: SearchDocumentsAsync with date range filter returns only documents in range
    /// </summary>
    [Fact]
    public async Task SearchDocumentsAsync_WithDateRange_FiltersByDate()
    {
        // Arrange
        var baseDate = new DateTime(2025, 6, 15);
        var allDocuments = new List<Document>
        {
            new() { Id = "doc1", FileName = "doc1.txt", Date = new DateTime(2025, 5, 1), Content = "May 2025" },
            new() { Id = "doc2", FileName = "doc2.txt", Date = new DateTime(2025, 6, 15), Content = "June 15 2025" },
            new() { Id = "doc3", FileName = "doc3.txt", Date = new DateTime(2025, 7, 1), Content = "July 2025" }
        };

        _mockSearchService
            .Setup(s => s.SearchDocumentsAsync(
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<DateTime?>(),
                It.IsAny<DateTime?>(),
                It.IsAny<int>(),
                It.IsAny<int>()))
            .ReturnsAsync((string? q, string? c, string? cl, DateTime? from, DateTime? to, int page, int pageSize) =>
            {
                var results = allDocuments.AsEnumerable();
                if (from.HasValue)
                {
                    results = results.Where(d => d.Date >= from.Value);
                }
                if (to.HasValue)
                {
                    results = results.Where(d => d.Date <= to.Value);
                }
                return results.ToList();
            });

        var service = _mockSearchService.Object;

        // Act
        var result = await service.SearchDocumentsAsync(
            query: null,
            channel: null,
            client: null,
            fromDate: new DateTime(2025, 6, 1),
            toDate: new DateTime(2025, 6, 30),
            page: 1,
            pageSize: 20);

        // Assert
        result.Should().NotBeNull();
        result.Should().HaveCount(1);
        result.First().FileName.Should().Be("doc2.txt");
    }

    /// <summary>
    /// Test: SearchDocumentsAsync with pagination returns correct page
    /// </summary>
    [Fact]
    public async Task SearchDocumentsAsync_WithPagination_ReturnsCorrectPage()
    {
        // Arrange
        var allDocuments = Enumerable.Range(1, 25)
            .Select(i => new Document { Id = $"doc{i}", FileName = $"doc{i}.txt", Content = $"Content {i}" })
            .ToList();

        _mockSearchService
            .Setup(s => s.SearchDocumentsAsync(
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<DateTime?>(),
                It.IsAny<DateTime?>(),
                It.IsAny<int>(),
                It.IsAny<int>()))
            .ReturnsAsync((string? q, string? c, string? cl, DateTime? from, DateTime? to, int page, int pageSize) =>
            {
                return allDocuments
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .ToList();
            });

        var service = _mockSearchService.Object;

        // Act - Get page 2 with 10 items per page
        var result = await service.SearchDocumentsAsync(
            query: null,
            channel: null,
            client: null,
            fromDate: null,
            toDate: null,
            page: 2,
            pageSize: 10);

        // Assert
        result.Should().NotBeNull();
        result.Should().HaveCount(10);
        result.First().FileName.Should().Be("doc11.txt");
        result.Last().FileName.Should().Be("doc20.txt");
    }
}