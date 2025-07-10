import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface NewChatButtonProps {
  onNewChat: () => void;
  className?: string;
}

export const NewChatButton = ({ onNewChat, className }: NewChatButtonProps) => {
  return (
    <Button
      onClick={onNewChat}
      variant="outline"
      size="sm"
      className={className}
    >
      <Plus className="h-4 w-4 mr-2" />
      New Chat
    </Button>
  );
};