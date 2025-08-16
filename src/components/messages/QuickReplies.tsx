import { Button } from '@/components/ui/button';

const DEFAULT_REPLIES = [
  'Please book an appointment.',
  'Take prescribed medication as directed.',
  'Can you share a recent photo/X-ray?'
];

interface QuickRepliesProps {
  onSelect: (text: string) => void;
  replies?: string[];
}

export function QuickReplies({ onSelect, replies = DEFAULT_REPLIES }: QuickRepliesProps) {
  return (
    <div className="flex flex-wrap gap-2 p-2">
      {replies.map((r) => (
        <Button key={r} size="sm" variant="secondary" onClick={() => onSelect(r)}>
          {r}
        </Button>
      ))}
    </div>
  );
}