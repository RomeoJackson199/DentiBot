import ReactMarkdown from 'react-markdown';

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="prose prose-sm max-w-none">
      <ReactMarkdown
        components={{
        // Headings
        h1: ({ children }) => <h1 className="text-2xl font-bold mb-4">{children}</h1>,
        h2: ({ children }) => <h2 className="text-xl font-semibold mb-3">{children}</h2>,
        h3: ({ children }) => <h3 className="text-lg font-semibold mb-2">{children}</h3>,
        
        // Lists
        ul: ({ children }) => <ul className="list-disc list-inside space-y-1 my-2">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 my-2">{children}</ol>,
        li: ({ children }) => <li className="ml-2">{children}</li>,
        
        // Text formatting
        strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
        em: ({ children }) => <em className="italic">{children}</em>,
        
        // Code
        code: ({ children, className }) => {
          const isInline = !className;
          return isInline ? (
            <code className="px-1.5 py-0.5 rounded bg-muted text-sm font-mono">{children}</code>
          ) : (
            <code className="block p-3 rounded-lg bg-muted text-sm font-mono overflow-x-auto my-2">{children}</code>
          );
        },
        
        // Paragraphs
        p: ({ children }) => <p className="mb-3 leading-relaxed">{children}</p>,
        
        // Links
        a: ({ children, href }) => (
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            {children}
          </a>
        ),
        
        // Blockquotes
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-primary pl-4 italic my-2 text-muted-foreground">
            {children}
          </blockquote>
        ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
