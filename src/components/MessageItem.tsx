import React, { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Bot, User as UserIcon } from 'lucide-react';
import { ChatMessage } from '@/types/chat';

interface MessageItemProps {
  message: ChatMessage;
  index: number;
}

export const MessageItem = memo(({ message, index }: MessageItemProps) => {
  return (
    <div
      key={message.id}
      className={`flex items-start space-x-3 ${
        message.is_bot ? "justify-start" : "justify-end"
      } animate-fade-in`}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {message.is_bot && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-dental-primary to-dental-secondary flex items-center justify-center shadow-md">
          <Bot className="w-4 h-4 text-white" />
        </div>
      )}
      
      <div
        className={`max-w-[80%] md:max-w-[70%] p-3 rounded-lg shadow-sm ${
          message.is_bot
            ? "bg-white border border-dental-primary/20 text-gray-800"
            : "bg-gradient-to-br from-dental-primary to-dental-secondary text-white"
        }`}
      >
        <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">
          {message.message}
        </div>
        
        {message.metadata?.urgency && (
          <div className="mt-2">
            <Badge 
              variant={message.metadata.urgency === 'emergency' ? 'destructive' : 'secondary'}
              className="text-xs"
            >
              {message.metadata.urgency === 'emergency' ? 'Urgence' : 
               message.metadata.urgency === 'high' ? 'Priorité élevée' : 
               'Priorité normale'}
            </Badge>
          </div>
        )}
        
        <div className="text-xs opacity-70 mt-1">
          {new Date(message.created_at).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </div>
      </div>
      
      {!message.is_bot && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-dental-accent to-dental-secondary flex items-center justify-center shadow-md">
          <UserIcon className="w-4 h-4 text-white" />
        </div>
      )}
    </div>
  );
});

MessageItem.displayName = 'MessageItem';