import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Loader2 } from "lucide-react";

interface AIWritingAssistantProps {
  onImprove: (improvedText: string) => void;
  currentText: string;
  placeholder?: string;
}

export function AIWritingAssistant({ onImprove, currentText, placeholder = "text" }: AIWritingAssistantProps) {
  const [improving, setImproving] = useState(false);
  const { toast } = useToast();

  const handleImproveText = async () => {
    if (!currentText.trim()) {
      toast({
        title: "No text to improve",
        description: "Please enter some text first",
        variant: "destructive",
      });
      return;
    }

    setImproving(true);
    
    try {
      // Simple text improvement logic - in a real app you'd call an AI API
      const improvedText = await improveTextWithAI(currentText, placeholder);
      onImprove(improvedText);
      
      toast({
        title: "Text improved!",
        description: "Your text has been made more professional",
      });
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setImproving(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleImproveText}
      disabled={improving || !currentText.trim()}
      className="w-full"
    >
      {improving ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Sparkles className="h-4 w-4 mr-2" />
      )}
      {improving ? "Improving..." : "Help me write this professionally"}
    </Button>
  );
}

// Mock AI text improvement function
async function improveTextWithAI(text: string, context: string): Promise<string> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Simple text improvements
  let improved = text;

  // Capitalize first letter of sentences
  improved = improved.replace(/([.!?]\s*)([a-z])/g, (match, punct, letter) => 
    punct + letter.toUpperCase()
  );

  // Ensure first letter is capitalized
  improved = improved.charAt(0).toUpperCase() + improved.slice(1);

  // Add professional medical terminology context
  if (context.includes('consultation') || context.includes('notes')) {
    // Add more formal structure for consultation notes
    if (!improved.includes('Patient presents') && !improved.includes('Examination reveals')) {
      improved = `Patient presents with ${improved.charAt(0).toLowerCase() + improved.slice(1)}`;
    }
    
    // Ensure proper punctuation
    if (!improved.endsWith('.') && !improved.endsWith('!') && !improved.endsWith('?')) {
      improved += '.';
    }
    
    // Add professional closing if it's a complete note
    if (improved.length > 50 && !improved.includes('recommend') && !improved.includes('follow-up')) {
      improved += ' Recommend follow-up as needed.';
    }
  }

  if (context.includes('prescription')) {
    // Structure prescription instructions
    improved = improved.replace(/take|prendre/gi, 'Take as prescribed:');
    if (!improved.includes('contraindications')) {
      improved += ' Please note any contraindications or allergies.';
    }
  }

  if (context.includes('treatment')) {
    // Structure treatment plan
    if (!improved.includes('Treatment plan:')) {
      improved = `Treatment plan: ${improved}`;
    }
    if (!improved.includes('Expected duration')) {
      improved += ' Expected duration and follow-up schedule to be determined.';
    }
  }

  return improved;
}