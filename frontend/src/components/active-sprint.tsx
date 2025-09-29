
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { type StoryWithAssignee, type User } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { 
  MessageCircle, 
  Star, 
  Calendar,
  User as UserIcon,
  Clock,
  ArrowUp,
  ArrowDown,
  Flag,
  BookOpen,
  Bug,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface ActiveSprintProps {
  onStoryClick?: (storyId: string) => void;
}

const PRIORITY_COLORS = {
  High: "hsl(0 84.2% 60.2%)",
  Medium: "hsl(43 74% 66%)",
  Low: "hsl(197 37% 24%)",
};

const PRIORITY_ICONS = {
  High: ArrowUp,
  Medium: Flag,
  Low: ArrowDown,
};

const STORY_TYPE_ICONS = {
  Story: BookOpen,
  Bug: Bug,
  Epic: Zap,
};

export function ActiveSprint({ onStoryClick }: ActiveSprintProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>("all");
  const { user } = useAuth();

  const { data: stories, isLoading: storiesLoading } = useQuery<StoryWithAssignee[]>({
    queryKey: ["/api/stories"],
  });

  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Filter stories for active sprint
  const activeSprintStories = stories?.filter(story => 
    story.sprintId === "sprint-1" && // Current active sprint
    (selectedUserId === "all" || story.assigneeId === selectedUserId)
  ) || [];

  // Group stories by assignee
  const storiesByUser = activeSprintStories.reduce((acc, story) => {
    const userId = story.assigneeId || "unassigned";
    if (!acc[userId]) {
      acc[userId] = [];
    }
    acc[userId].push(story);
    return acc;
  }, {} as Record<string, StoryWithAssignee[]>);

  if (storiesLoading || usersLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Clock className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold text-foreground">Active Sprint</h2>
          <Badge variant="secondary" className="text-sm">
            {activeSprintStories.length} stories
          </Badge>
        </div>

        <div className="flex items-center space-x-4">
          <Label htmlFor="user-filter" className="text-sm font-medium">
            Filter by User:
          </Label>
          <Select
            value={selectedUserId}
            onValueChange={setSelectedUserId}
          >
            <SelectTrigger className="w-64" id="user-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              {users?.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  <div className="flex items-center space-x-2">
                    <Avatar className="w-5 h-5">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {getUserInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span>{user.name}</span>
                  </div>
                </SelectItem>
              ))}
              <SelectItem value="unassigned">Unassigned</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {activeSprintStories.length === 0 ? (
        <div className="text-center py-12">
          <Clock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No Active Stories</h3>
          <p className="text-muted-foreground">
            {selectedUserId === "all" 
              ? "There are no stories in the active sprint yet."
              : "The selected user has no stories in the active sprint."
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeSprintStories.map((story) => {
            const PriorityIcon = PRIORITY_ICONS[story.priority as keyof typeof PRIORITY_ICONS];
            const TypeIcon = STORY_TYPE_ICONS.Story; // Default to Story since we don't have type field yet
            
            return (
              <Card
                key={story.id}
                className="cursor-pointer hover:shadow-md transition-all duration-200 hover:bg-muted/30"
                onClick={() => onStoryClick?.(story.id)}
                data-testid={`active-story-card-${story.id}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <TypeIcon className="w-4 h-4 text-blue-500" />
                      <CardTitle className="text-sm font-medium leading-tight">
                        {story.title}
                      </CardTitle>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant="secondary"
                        className="text-xs px-2 py-1"
                        style={{
                          backgroundColor: `${PRIORITY_COLORS[story.priority as keyof typeof PRIORITY_COLORS]}20`,
                          color: PRIORITY_COLORS[story.priority as keyof typeof PRIORITY_COLORS],
                        }}
                      >
                        <PriorityIcon className="w-3 h-3 mr-1" />
                        {story.priority}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {story.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  {story.description && (
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                      {story.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      {story.pointer && (
                        <div className="flex items-center space-x-1">
                          <Star className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{story.pointer} pts</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-1">
                        <MessageCircle className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {story.commentCount || 0}
                        </span>
                      </div>
                    </div>

                    {story.dueDate && (
                      <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {formatDistanceToNow(new Date(story.dueDate), { addSuffix: true })}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {story.assignee ? (
                        <>
                          <Avatar className="w-6 h-6">
                            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                              {getUserInitials(story.assignee.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-foreground font-medium">
                            {story.assignee.name}
                          </span>
                        </>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                            <UserIcon className="w-3 h-3 text-muted-foreground" />
                          </div>
                          <span className="text-xs text-muted-foreground">Unassigned</span>
                        </div>
                      )}
                    </div>

                    <Badge variant="outline" className="text-xs">
                      Sprint 1
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
