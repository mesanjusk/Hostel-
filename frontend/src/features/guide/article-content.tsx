function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i} className="text-foreground font-semibold">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

export function ArticleContent({ content }: { content: string }) {
  const blocks = content.trim().split(/\n\s*\n/);

  return (
    <div className="flex flex-col gap-4">
      {blocks.map((block, i) => {
        const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
        const isList = lines.every((l) => l.startsWith("- "));
        const isHeading = lines.length === 1 && lines[0].startsWith("## ");

        if (isHeading) {
          return (
            <h3 key={i} className="font-display mt-2 text-lg font-semibold">
              {renderInline(lines[0].replace(/^##\s*/, ""))}
            </h3>
          );
        }

        if (isList) {
          return (
            <ul key={i} className="text-muted-foreground flex flex-col gap-2 pl-1 text-sm leading-relaxed">
              {lines.map((line, j) => (
                <li key={j} className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>{renderInline(line.replace(/^-\s*/, ""))}</span>
                </li>
              ))}
            </ul>
          );
        }

        return (
          <p key={i} className="text-muted-foreground text-sm leading-relaxed">
            {renderInline(lines.join(" "))}
          </p>
        );
      })}
    </div>
  );
}
