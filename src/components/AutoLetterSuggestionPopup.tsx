import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, FileText, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface LetterSuggestion {
  shouldSuggest: boolean;
  letterType: string;
  confidence: number;
  reasoning: string;
  suggestedTitle?: string;
  topicKeywords?: string[];
}

interface AutoLetterSuggestionPopupProps {
  suggestion: LetterSuggestion;
  conversationId: string | null;
  onDismiss: () => void;
}

export const AutoLetterSuggestionPopup = ({
  suggestion,
  conversationId,
  onDismiss,
}: AutoLetterSuggestionPopupProps) => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(30);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (isHovered) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          onDismiss();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isHovered, onDismiss]);

  const handleCreateLetter = () => {
    navigate("/letters/create", {
      state: {
        conversationId,
        suggestedType: suggestion.letterType,
        suggestedTitle: suggestion.suggestedTitle,
      },
    });
    onDismiss();
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 90) return "Highly Recommended";
    if (confidence >= 80) return "Recommended";
    return "Consider Creating";
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return "bg-green-500";
    if (confidence >= 80) return "bg-blue-500";
    return "bg-yellow-500";
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-300">
      <Card
        className="w-[400px] shadow-xl border-2"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Letter Suggestion</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 -mt-1 -mr-1"
              onClick={onDismiss}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription className="flex items-center gap-2 mt-2">
            <Badge variant="secondary" className="font-medium">
              {suggestion.letterType}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {getConfidenceLabel(suggestion.confidence)}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Confidence Meter */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Confidence</span>
              <span className="font-semibold flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {suggestion.confidence}%
              </span>
            </div>
            <Progress value={suggestion.confidence} className="h-2" />
          </div>

          {/* Reasoning */}
          <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
            {suggestion.reasoning}
          </div>

          {/* Suggested Title */}
          {suggestion.suggestedTitle && (
            <div className="text-sm">
              <span className="font-medium">Suggested Title: </span>
              <span className="text-muted-foreground">{suggestion.suggestedTitle}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <Button variant="outline" size="sm" onClick={onDismiss}>
              Not Now
            </Button>
            <Button size="sm" onClick={handleCreateLetter} className="gap-2">
              <FileText className="h-4 w-4" />
              Create Letter
            </Button>
          </div>

          {/* Auto-dismiss countdown */}
          <div className="text-xs text-center text-muted-foreground">
            Auto-closing in {countdown}s
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
