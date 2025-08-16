import { useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

interface ComposeAttachmentProps {
  conversationId: string;
  messageId?: string;
  onUploaded?: (path: string) => void;
}

export function ComposeAttachment({ conversationId, onUploaded }: ComposeAttachmentProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const onPick = () => inputRef.current?.click();

  const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const key = `conversations/${conversationId}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from('message-attachments').upload(key, file, { upsert: false, contentType: file.type });
      if (error) throw error;
      onUploaded?.(key);
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <input ref={inputRef} type="file" className="hidden" onChange={onChange} accept="image/*,application/pdf" />
      <Button variant="outline" size="sm" onClick={onPick} disabled={uploading}>
        {uploading ? 'Uploading…' : 'Attach'}
      </Button>
    </>
  );
}