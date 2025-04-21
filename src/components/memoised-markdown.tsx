import { memo } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import {coldarkDark as theme } from 'react-syntax-highlighter/dist/esm/styles/prism';
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

export const MemoizedMarkdown = memo(
  ({ content, id }: { content: string; id: string }) => {
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({node, className, children, ...props}) {
            const match = /language-(\w+)/.exec(className || '');
            const isCodeBlock = match !== null;

            return isCodeBlock ? (
              <SyntaxHighlighter
              // @ts-ignore
                style={theme}
                language={match[1]}
                PreTag="div"
                customStyle={{
                  borderRadius: '4px',
                  padding: '1em',
                  margin: '0.5em 0',
                }}
                codeTagProps={{
                  style: {
                    fontSize: '0.9em',
                  },
                }}
                {...props}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <code className={cn(className, "bg-muted px-1 py-0.5 rounded text-sm")} {...props}>
                {children}
              </code>
            )
          },
          // Add styling for other GFM elements
          table: props => <div className="overflow-x-auto my-4"><table className="w-full border-collapse" {...props} /></div>,
          thead: props => <thead className="bg-muted/50" {...props} />,
          th: props => <th className="border border-border px-4 py-2 text-left font-semibold" {...props} />,
          td: props => <td className="border border-border px-4 py-2" {...props} />,

          // Style blockquotes
          blockquote: props => <blockquote className="border-l-4 border-primary/30 pl-4 italic text-muted-foreground my-4" {...props} />,

          // Style lists
          ul: props => <ul className="list-disc pl-6 my-2" {...props} />,
          ol: props => <ol className="list-decimal pl-6 my-2" {...props} />,

          // Style headings
          h1: props => <h1 className="text-2xl font-bold mt-6 mb-4" {...props} />,
          h2: props => <h2 className="text-xl font-bold mt-5 mb-3" {...props} />,
          h3: props => <h3 className="text-lg font-bold mt-4 mb-2" {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    );
  },
  (prevProps, nextProps) => prevProps.content === nextProps.content && prevProps.id === nextProps.id
);

MemoizedMarkdown.displayName = 'MemoizedMarkdown';