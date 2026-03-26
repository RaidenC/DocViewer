using System.Text.Json.Serialization;

namespace DocViewer.Domain.Entities;

public class Document
{
    public string Id { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;
    public string Channel { get; set; } = string.Empty;
    public string Client { get; set; } = string.Empty;
    public int Year { get; set; }
    public string Month { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public string Sender { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public Dictionary<string, object> Metadata { get; set; } = new();
}

public enum DocumentChannel
{
    Fax,
    Email,
    Scan,
    Ftp
}

public class DocumentMetadata
{
    [JsonPropertyName("receive_time")]
    public DateTime? date { get; set; }
    public string? sender { get; set; }
    public string? subject { get; set; }
    public string? content { get; set; }
}