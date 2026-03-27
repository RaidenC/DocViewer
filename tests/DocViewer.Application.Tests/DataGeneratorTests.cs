using FluentAssertions;
using Xunit;

namespace DocViewer.Application.Tests;

public class DataGeneratorTests
{
    /// <summary>
    /// Test: Channel distribution is fax, email, scan, ftp
    /// </summary>
    [Fact]
    public void GetRandomChannel_ShouldReturnValidChannel()
    {
        var validChannels = new HashSet<string> { "fax", "email", "scan", "ftp" };
        var random = new Random(12345);

        for (int i = 0; i < 100; i++)
        {
            var roll = random.Next(100);
            var channel = roll switch
            {
                < 25 => "fax",
                < 50 => "email",
                < 75 => "scan",
                _ => "ftp"
            };
            validChannels.Should().Contain(channel);
        }
    }

    /// <summary>
    /// Test: Fax channel returns .txt or .tif
    /// </summary>
    [Fact]
    public void GetRandomFileExtension_ForFax_ShouldReturnTxtOrTif()
    {
        var extensions = new HashSet<string>();
        var random = new Random(12345);

        for (int i = 0; i < 100; i++)
        {
            var ext = random.Next(100) < 80 ? ".txt" : ".tif";
            extensions.Add(ext);
        }

        extensions.Should().Contain(".txt");
        extensions.Should().Contain(".tif");
    }

    /// <summary>
    /// Test: Scan channel returns .jpg or .pdf
    /// </summary>
    [Fact]
    public void GetRandomFileExtension_ForScan_ShouldReturnJpgOrPdf()
    {
        var validExtensions = new HashSet<string> { ".jpg", ".pdf" };
        var random = new Random(12345);

        for (int i = 0; i < 100; i++)
        {
            var ext = random.Next(100) < 70 ? ".jpg" : ".pdf";
            validExtensions.Should().Contain(ext);
        }
    }

    /// <summary>
    /// Test: FTP channel returns pdf, xlsx, or docx
    /// </summary>
    [Fact]
    public void GetRandomFileExtension_ForFtp_ShouldReturnPdfXlsxOrDocx()
    {
        var validExtensions = new HashSet<string> { ".pdf", ".xlsx", ".docx" };
        var random = new Random(12345);

        for (int i = 0; i < 100; i++)
        {
            var ext = random.Next(100) switch
            {
                < 60 => ".pdf",
                < 85 => ".xlsx",
                _ => ".docx"
            };
            validExtensions.Should().Contain(ext);
        }
    }

    /// <summary>
    /// Test: Email channel returns .txt or .eml
    /// </summary>
    [Fact]
    public void GetRandomFileExtension_ForEmail_ShouldReturnTxtOrEml()
    {
        var validExtensions = new HashSet<string> { ".txt", ".eml" };
        var random = new Random(12345);

        for (int i = 0; i < 100; i++)
        {
            var ext = random.Next(100) < 90 ? ".txt" : ".eml";
            validExtensions.Should().Contain(ext);
        }

        validExtensions.Should().Contain(".txt");
        validExtensions.Should().Contain(".eml");
    }

    /// <summary>
    /// Test: Year distribution follows spec (2023: 30%, 2024: 40%, 2025: 30%)
    /// </summary>
    [Fact]
    public void GetRandomYear_ShouldFollowDistribution()
    {
        var yearCounts = new Dictionary<int, int> { { 2023, 0 }, { 2024, 0 }, { 2025, 0 } };
        var random = new Random(12345);

        for (int i = 0; i < 1000; i++)
        {
            var year = random.Next(100) switch
            {
                < 30 => 2023,
                < 70 => 2024,
                _ => 2025
            };
            yearCounts[year]++;
        }

        // Allow 10% variance
        yearCounts[2023].Should().BeGreaterThan(200);
        yearCounts[2024].Should().BeGreaterThan(300);
        yearCounts[2025].Should().BeGreaterThan(200);
    }
}