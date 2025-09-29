import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCommentSchema, type CommentWithUser, type StoryWithAssignee } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { X, Send, Trash2, Edit } from "lucide-react";
import { cn } from "@/lib/utils";
import { z } from "zod";
import { formatDistanceToNow } from "date-fns";

interface CommentsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  storyId: string | null;
  onEditStory?: () => void;
}

const commentFormSchema = insertCommentSchema.omit({
  storyId: true,
  userId: true,
});

type CommentFormData = z.infer<typeof commentFormSchema>;

export function CommentsSidebar({ isOpen, onClose, storyId, onEditStory }: CommentsSidebarProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CommentFormData>({
    resolver: zodResolver(commentFormSchema),
    defaultValues: {
      commentText: "",
    },
  });

  const { data: story } = useQuery<StoryWithAssignee>({
    queryKey: ["/api/stories", storyId],
    enabled: !!storyId,
  });

  const { data: comments, isLoading } = useQuery<CommentWithUser[]>({
    queryKey: ["/api/stories", storyId, "comments"],
    enabled: !!storyId,
  });

  const createCommentMutation = useMutation({
    mutationFn: async (data: CommentFormData) => {
      if (!storyId) throw new Error("No story selected");
      const res = await apiRequest("POST", `/api/stories/${storyId}/comments`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stories", storyId, "comments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stories"] });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to post comment",
        variant: "destructive",
      });
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      await apiRequest("DELETE", `/api/comments/${commentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stories", storyId, "comments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stories"] });
      toast({
        title: "Success",
        description: "Comment deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete comment",
        variant: "destructive",
      });
    },
  });

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const onSubmit = (data: CommentFormData) => {
    createCommentMutation.mutate(data);
  };

  const handleDeleteComment = (commentId: string) => {
    if (window.confirm("Are you sure you want to delete this comment?")) {
      deleteCommentMutation.mutate(commentId);
    }
  };

  const processCommentText = (text: string) => {
    // Simple @mention highlighting
    return text.replace(/@(\w+)/g, '<span class="text-primary font-medium">@$1</span>');
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed right-0 top-0 h-full w-80 bg-card border-l border-border z-50",
          "transform transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Comments</h3>
              <div className="flex items-center space-x-2">
                {onEditStory && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onEditStory}
                    data-testid="button-edit-story"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  data-testid="button-close-sidebar"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            {story && (
              <p className="text-sm text-muted-foreground mt-1" data-testid="text-story-title">
                {story.title}
              </p>
            )}
          </div>

          {/* Comments List */}
          <div className="flex-1 overflow-y-auto p-6">
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex space-x-3">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-12 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : comments && comments.length > 0 ? (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="bg-muted/50 rounded-lg p-4"
                    data-testid={`comment-${comment.id}`}
                  >
                    <div className="flex items-start space-x-3">
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                          {getUserInitials(comment.user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-foreground">
                              {comment.user.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(comment.createdAt || 0), { addSuffix: true })}
                            </span>
                          </div>
                          {(user?.id === comment.userId || user?.role === "Admin") && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteComment(comment.id)}
                              className="w-6 h-6 p-0 text-muted-foreground hover:text-destructive"
                              data-testid={`button-delete-comment-${comment.id}`}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                        <div
                          className="text-sm text-foreground"
                          dangerouslySetInnerHTML={{
                            __html: processCommentText(comment.commentText),
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <p>No comments yet</p>
                <p className="text-xs mt-1">Be the first to comment on this story</p>
              </div>
            )}
          </div>

          {/* Comment Input */}
          <div className="p-6 border-t border-border">
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex space-x-2">
              <Input
                {...form.register("commentText")}
                placeholder="Add a comment... (use @username to mention)"
                className="flex-1"
                disabled={createCommentMutation.isPending}
                data-testid="input-comment"
              />
              <Button
                type="submit"
                size="sm"
                disabled={createCommentMutation.isPending || !form.watch("commentText")?.trim()}
                data-testid="button-post-comment"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
            {form.formState.errors.commentText && (
              <p className="text-sm text-destructive mt-1">
                {form.formState.errors.commentText.message}
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}