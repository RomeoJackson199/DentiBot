import { useState } from "react";
import { Edit2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface EditableSectionProps {
  value: string;
  onSave: (value: string) => void;
  isEditing: boolean;
  multiline?: boolean;
  placeholder?: string;
  className?: string;
  editClassName?: string;
  children: React.ReactNode;
}

export function EditableSection({
  value,
  onSave,
  isEditing,
  multiline = false,
  placeholder = "Click to edit",
  className = "",
  editClassName = "",
  children,
}: EditableSectionProps) {
  const [isEditingLocal, setIsEditingLocal] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isHovered, setIsHovered] = useState(false);

  const handleStartEdit = () => {
    setEditValue(value);
    setIsEditingLocal(true);
  };

  const handleSave = () => {
    onSave(editValue);
    setIsEditingLocal(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditingLocal(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      handleCancel();
    } else if (e.key === "Enter" && !multiline && (e.metaKey || e.ctrlKey)) {
      handleSave();
    }
  };

  if (!isEditing) {
    return <>{children}</>;
  }

  if (isEditingLocal) {
    return (
      <div className={cn("relative", className)}>
        {multiline ? (
          <Textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={cn("min-h-[100px]", editClassName)}
            autoFocus
          />
        ) : (
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={editClassName}
            autoFocus
          />
        )}
        <div className="flex gap-2 mt-2">
          <Button size="sm" onClick={handleSave}>
            <Check className="h-4 w-4 mr-1" />
            Save
          </Button>
          <Button size="sm" variant="outline" onClick={handleCancel}>
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative group cursor-pointer transition-all",
        isHovered && "ring-2 ring-primary/50 ring-offset-2 rounded",
        className
      )}
      onClick={handleStartEdit}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
      {isHovered && (
        <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full p-1 shadow-lg">
          <Edit2 className="h-3 w-3" />
        </div>
      )}
    </div>
  );
}
