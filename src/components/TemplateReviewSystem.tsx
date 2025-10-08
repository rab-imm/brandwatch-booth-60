import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { IconStar, IconStarFilled, IconThumbUp, IconThumbDown } from "@tabler/icons-react";
import { format } from "date-fns";

interface Review {
  id: string;
  template_id: string;
  user_id: string;
  rating: number;
  review_text: string;
  is_verified_purchase: boolean;
  helpful_count: number;
  created_at: string;
  profiles: {
    full_name: string;
  };
}

interface TemplateReviewSystemProps {
  templateId: string;
}

export const TemplateReviewSystem = ({ templateId }: TemplateReviewSystemProps) => {
  const { profile } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadReviews();
  }, [templateId]);

  const loadReviews = async () => {
    const { data, error } = await supabase
      .from("template_reviews")
      .select("*, profiles(full_name)")
      .eq("template_id", templateId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setReviews(data as any);
    }
  };

  const handleSubmitReview = async () => {
    if (!profile || rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("template_reviews").insert({
      template_id: templateId,
      user_id: profile.user_id,
      rating,
      review_text: reviewText,
      is_verified_purchase: true,
    });

    if (error) {
      toast.error("Failed to submit review");
    } else {
      toast.success("Review submitted");
      setRating(0);
      setReviewText("");
      loadReviews();
    }
    setLoading(false);
  };

  const handleHelpful = async (reviewId: string, isHelpful: boolean) => {
    const { error } = await supabase.from("review_votes").insert({
      review_id: reviewId,
      user_id: profile?.user_id,
      is_helpful: isHelpful,
    });

    if (!error) {
      loadReviews();
    }
  };

  const renderStars = (count: number, interactive = false) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => interactive && setRating(star)}
            disabled={!interactive}
            className={interactive ? "cursor-pointer" : ""}
          >
            {star <= count ? (
              <IconStarFilled className="h-5 w-5 text-yellow-500" />
            ) : (
              <IconStar className="h-5 w-5 text-muted-foreground" />
            )}
          </button>
        ))}
      </div>
    );
  };

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Reviews & Ratings</CardTitle>
              <CardDescription>
                {reviews.length} reviews · {avgRating.toFixed(1)} average rating
              </CardDescription>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{avgRating.toFixed(1)}</div>
              {renderStars(Math.round(avgRating))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Your Rating</label>
              {renderStars(rating, true)}
            </div>
            <Textarea
              placeholder="Share your experience with this template..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              rows={4}
            />
            <Button onClick={handleSubmitReview} disabled={loading || rating === 0}>
              Submit Review
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {reviews.map((review) => (
          <Card key={review.id}>
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <Avatar>
                  <AvatarFallback>
                    {review.profiles.full_name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{review.profiles.full_name}</p>
                      <div className="flex items-center gap-2">
                        {renderStars(review.rating)}
                        {review.is_verified_purchase && (
                          <Badge variant="secondary" className="text-xs">
                            Verified Purchase
                          </Badge>
                        )}
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(review.created_at), "PPP")}
                    </span>
                  </div>
                  <p className="text-sm">{review.review_text}</p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleHelpful(review.id, true)}
                    >
                      <IconThumbUp className="h-4 w-4 mr-1" />
                      Helpful ({review.helpful_count})
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleHelpful(review.id, false)}
                    >
                      <IconThumbDown className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
