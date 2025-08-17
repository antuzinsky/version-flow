// Utility function to format BB code tags
export const formatBBCode = (text: string): string => {
  if (!text) return text;
  
  return text
    .replace(/\[b\](.*?)\[\/b\]/g, '<strong>$1</strong>')
    .replace(/\[i\](.*?)\[\/i\]/g, '<em>$1</em>')
    .replace(/\[u\](.*?)\[\/u\]/g, '<u>$1</u>')
    .replace(/\[s\](.*?)\[\/s\]/g, '<s>$1</s>')
    .replace(/\[url=(.*?)\](.*?)\[\/url\]/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-primary underline">$2</a>')
    .replace(/\[url\](.*?)\[\/url\]/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-primary underline">$1</a>')
    .replace(/\[color=(.*?)\](.*?)\[\/color\]/g, '<span style="color: $1">$2</span>')
    .replace(/\[size=(.*?)\](.*?)\[\/size\]/g, '<span style="font-size: $1">$2</span>')
    .replace(/\[center\](.*?)\[\/center\]/g, '<div style="text-align: center">$1</div>')
    .replace(/\[right\](.*?)\[\/right\]/g, '<div style="text-align: right">$1</div>')
    .replace(/\[left\](.*?)\[\/left\]/g, '<div style="text-align: left">$1</div>')
    .replace(/\[quote\](.*?)\[\/quote\]/g, '<blockquote class="border-l-4 border-primary/20 pl-4 italic text-muted-foreground">$1</blockquote>')
    .replace(/\[code\](.*?)\[\/code\]/g, '<code class="bg-muted px-2 py-1 rounded text-sm font-mono">$1</code>')
    .replace(/\[list\](.*?)\[\/list\]/gs, '<ul class="list-disc pl-6">$1</ul>')
    .replace(/\[list=1\](.*?)\[\/list\]/gs, '<ol class="list-decimal pl-6">$1</ol>')
    .replace(/\[\*\](.*?)(?=\[\*\]|\[\/list\])/g, '<li>$1</li>')
    .replace(/\n/g, '<br>');
};

// Add BB code formatting buttons to editor toolbar
export const insertBBCode = (
  content: string,
  selectionStart: number,
  selectionEnd: number,
  tag: string
): { newContent: string; newPosition: number } => {
  const selectedText = content.substring(selectionStart, selectionEnd);
  const openTag = `[${tag}]`;
  const closeTag = `[/${tag}]`;
  
  const newContent = 
    content.substring(0, selectionStart) + 
    openTag + selectedText + closeTag + 
    content.substring(selectionEnd);
  
  const newPosition = selectionStart + openTag.length + selectedText.length + closeTag.length;
  
  return { newContent, newPosition };
};