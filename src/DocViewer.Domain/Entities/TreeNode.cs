namespace DocViewer.Domain.Entities;

public class TreeNode
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Path { get; set; } = string.Empty;
    public bool IsDirectory { get; set; }
    public List<TreeNode> Children { get; set; } = new();
}