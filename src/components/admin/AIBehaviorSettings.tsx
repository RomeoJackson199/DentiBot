import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bot, Sparkles, X } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AIBehaviorSettingsProps {
  systemBehavior: string;
  greeting: string;
  personalityTraits: string[];
  onSystemBehaviorChange: (value: string) => void;
  onGreetingChange: (value: string) => void;
  onPersonalityTraitsChange: (traits: string[]) => void;
  onTestChat: () => void;
}

export function AIBehaviorSettings({
  systemBehavior,
  greeting,
  personalityTraits,
  onSystemBehaviorChange,
  onGreetingChange,
  onPersonalityTraitsChange,
  onTestChat,
}: AIBehaviorSettingsProps) {
  const [newTrait, setNewTrait] = useState('');

  const addTrait = () => {
    if (newTrait.trim() && !personalityTraits.includes(newTrait.trim())) {
      onPersonalityTraitsChange([...personalityTraits, newTrait.trim()]);
      setNewTrait('');
    }
  };

  const removeTrait = (trait: string) => {
    onPersonalityTraitsChange(personalityTraits.filter((t) => t !== trait));
  };

  const suggestedTraits = [
    'Professional',
    'Friendly',
    'Empathetic',
    'Concise',
    'Detailed',
    'Casual',
    'Formal',
    'Warm',
    'Direct',
    'Patient',
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              AI Behavior Settings
            </CardTitle>
            <CardDescription>
              Customize how the AI assistant interacts with your customers
            </CardDescription>
          </div>
          <Button onClick={onTestChat} variant="outline" className="gap-2">
            <Sparkles className="h-4 w-4" />
            Test AI Chat
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="greeting" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="greeting">Greeting</TabsTrigger>
            <TabsTrigger value="behavior">Behavior</TabsTrigger>
            <TabsTrigger value="personality">Personality</TabsTrigger>
          </TabsList>

          <TabsContent value="greeting" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="greeting">Welcome Message</Label>
              <Textarea
                id="greeting"
                placeholder="Hi! I'm your AI assistant. How can I help you today?"
                value={greeting}
                onChange={(e) => onGreetingChange(e.target.value)}
                rows={3}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                This message will be shown when customers first interact with the AI
              </p>
            </div>
          </TabsContent>

          <TabsContent value="behavior" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="system-behavior">AI Behavior Instructions</Label>
              <Textarea
                id="system-behavior"
                placeholder="You are a helpful assistant for a dental clinic. Be professional, empathetic, and provide clear information about dental services..."
                value={systemBehavior}
                onChange={(e) => onSystemBehaviorChange(e.target.value)}
                rows={8}
                className="resize-none font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Describe how the AI should behave and respond to customers. This will be added to the system prompt.
              </p>
            </div>

            <div className="rounded-lg bg-muted p-4 space-y-2">
              <h4 className="text-sm font-medium">Examples:</h4>
              <ScrollArea className="h-32">
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• "Always ask for the customer's name and use it throughout the conversation"</li>
                  <li>• "If someone mentions pain, prioritize emergency booking options"</li>
                  <li>• "When discussing pricing, always mention insurance acceptance"</li>
                  <li>• "Encourage customers to book follow-up appointments"</li>
                  <li>• "Use simple, non-technical language when explaining procedures"</li>
                </ul>
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="personality" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="new-trait">Personality Traits</Label>
              <div className="flex gap-2">
                <Input
                  id="new-trait"
                  placeholder="Enter a trait (e.g., Friendly)"
                  value={newTrait}
                  onChange={(e) => setNewTrait(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTrait();
                    }
                  }}
                />
                <Button onClick={addTrait} type="button">
                  Add
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Add personality traits to shape the AI's communication style
              </p>
            </div>

            {personalityTraits.length > 0 && (
              <div className="space-y-2">
                <Label>Active Traits</Label>
                <div className="flex flex-wrap gap-2">
                  {personalityTraits.map((trait) => (
                    <Badge key={trait} variant="secondary" className="gap-1">
                      {trait}
                      <button
                        onClick={() => removeTrait(trait)}
                        className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Suggested Traits</Label>
              <div className="flex flex-wrap gap-2">
                {suggestedTraits
                  .filter((trait) => !personalityTraits.includes(trait))
                  .map((trait) => (
                    <Badge
                      key={trait}
                      variant="outline"
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                      onClick={() =>
                        onPersonalityTraitsChange([...personalityTraits, trait])
                      }
                    >
                      + {trait}
                    </Badge>
                  ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
