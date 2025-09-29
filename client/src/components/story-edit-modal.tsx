
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useWorkspace, TEAM_MEMBERS } from "@/lib/workspace-context";
import { 
  Save, 
  X, 
  User, 
  Calendar, 
  Star, 
  Flag, 
  MessageCircle,
  Paperclip,
  Activity,
  Hash,
  CheckSquare,
  Link,
  FileText,
  History,
  ChevronRight,
  ChevronDown,
  Clock
} from "lucide-react";
import { useState, useEffect } from "react";
import { StoryWithAssignee } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

interface StoryEditModalProps {
  storyId: string;
  open: boolean;
  onClose: () => void;
}

const PRIORITY_OPTIONS = ["Low", "Medium", "High"];
const STATUS_OPTIONS = ["Backlog", "To Do", "In Progress", "Blocked", "Validation", "Completed"];
const STORY_TYPE_OPTIONS = ["Story", "Bug", "Epic"];
const STORY_POINTS = [1, 2, 3, 4, 5];

export function StoryEditModal({ storyId, open, onClose }: StoryEditModalProps) {
  const [formData, setFormData] = useState<Partial<StoryWithAssignee>>({});
  const [showHistory, setShowHistory] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [subtasks, setSubtasks] = useState<Array<{ id: string; text: string; completed: boolean }>>([]);
  
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { selectedWorkspace } = useWorkspace();

  const { data: story, isLoading } = useQuery<StoryWithAssignee>({
    queryKey: [`/api/stories/${storyId}`],
    enabled: open && !!storyId,
  });

  const { data: users } = useQuery({
    queryKey: ["/api/users"],
    enabled: open,
  });

  const { data: comments } = useQuery({
    queryKey: [`/api/stories/${storyId}/comments`],
    enabled: open && !!storyId,
  });

  const updateStoryMutation = useMutation({
    mutationFn: async (updates: Partial<StoryWithAssignee>) => {
      const res = await apiRequest("PATCH", `/api/stories/${storyId}`, updates);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stories"] });
      queryClient.invalidateQueries({ queryKey: [`/api/stories/${storyId}`] });
      onClose();
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: async (comment: string) => {
      const res = await apiRequest("POST", `/api/stories/${storyId}/comments`, {
        commentText: comment,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/stories/${storyId}/comments`] });
      setNewComment("");
    },
  });

  useEffect(() => {
    if (story) {
      setFormData(story);
      // Initialize subtasks from acceptance criteria if formatted as bullet points
      if (story.acceptanceCriteria) {
        const tasks = story.acceptanceCriteria
          .split('\n')
          .filter(line => line.trim().startsWith('•') || line.trim().startsWith('-'))
          .map((line, index) => ({
            id: `task-${index}`,
            text: line.trim().replace(/^[•-]\s*/, ''),
            completed: false
          }));
        setSubtasks(tasks);
      }
    }
  }, [story]);

  const handleSave = () => {
    updateStoryMutation.mutate(formData);
  };

  const handleAddSubtask = () => {
    setSubtasks([...subtasks, { id: `task-${Date.now()}`, text: '', completed: false }]);
  };

  const updateSubtask = (id: string, updates: Partial<typeof subtasks[0]>) => {
    setSubtasks(subtasks.map(task => task.id === id ? { ...task, ...updates } : task));
  };

  const removeSubtask = (id: string) => {
    setSubtasks(subtasks.filter(task => task.id !== id));
  };

  const getUserInitials = (name: string) => {
    return name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "U";
  };

  const getStoryNumber = (story: StoryWithAssignee) => {
    return story.storyNumber || `${story.project || "T&D"}-0000`;
  };

  if (!story || isLoading) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] p-0">
        <div className="flex h-full">
          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            <DialogHeader className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Badge variant="outline" className="font-mono">
                    <Hash className="w-3 h-3 mr-1" />
                    {getStoryNumber(story)}
                  </Badge>
                  <DialogTitle className="text-xl">{formData.title}</DialogTitle>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={() => setShowHistory(!showHistory)}>
                    <History className="w-4 h-4 mr-2" />
                    History
                  </Button>
                  <Button variant="outline" size="sm" onClick={onClose}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </DialogHeader>

            <div className="flex-1 overflow-hidden">
              <div className="grid grid-cols-3 h-full">
                {/* Left Column - Main Details */}
                <div className="col-span-2 p-6 overflow-y-auto">
                  <div className="space-y-6">
                    {/* Title */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Title</label>
                      <Input
                        value={formData.title || ""}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="text-lg font-medium"
                      />
                    </div>

                    {/* Description with Bullet Points */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Description</label>
                      <Textarea
                        value={formData.description || ""}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="• Add bullet points here&#10;• Use bullet points for better formatting&#10;• Keep descriptions clear and concise"
                        rows={5}
                        className="font-mono"
                      />
                    </div>

                    {/* Acceptance Criteria - Single Text Box with Bullet Support */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Acceptance Criteria</label>
                      <Textarea
                        value={formData.acceptanceCriteria || ""}
                        onChange={(e) => setFormData({ ...formData, acceptanceCriteria: e.target.value })}
                        placeholder="• Add acceptance criteria here&#10;• Use bullet points for better formatting&#10;• Each line can be a new criteria&#10;• Press Enter for new lines"
                        rows={8}
                        className="font-mono resize-none"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Use • or - for bullet points. Press Enter for new lines. No separate "Add Criteria" button needed.
                      </p>
                    </div>

                    {/* Comments Section */}
                    <div>
                      <h3 className="text-sm font-medium mb-3 flex items-center">
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Comments & Activity
                      </h3>
                      <div className="space-y-4">
                        {/* Add Comment */}
                        <div className="flex space-x-3">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="text-xs">
                              {getUserInitials(user?.name || "User")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-2">
                            <Textarea
                              value={newComment}
                              onChange={(e) => setNewComment(e.target.value)}
                              placeholder="Add a comment... Use @mention to notify team members"
                              rows={3}
                            />
                            <Button 
                              size="sm" 
                              onClick={() => addCommentMutation.mutate(newComment)}
                              disabled={!newComment.trim()}
                            >
                              Comment
                            </Button>
                          </div>
                        </div>

                        {/* Comments List */}
                        {comments && Array.isArray(comments) && comments.length > 0 ? (
                          comments.map((comment: any) => (
                            <div key={comment.id} className="flex space-x-3 bg-muted/30 rounded-lg p-3">
                              <Avatar className="w-8 h-8">
                                <AvatarFallback className="text-xs">
                                  {getUserInitials(comment.user?.name || "Unknown")}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="text-sm font-medium">{comment.user?.name || "Unknown User"}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {comment.createdAt ? new Date(comment.createdAt).toLocaleString("en-US", {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                      second: '2-digit'
                                    }) : "Just now"}
                                  </span>
                                </div>
                                <p className="text-sm text-foreground whitespace-pre-wrap">{comment.commentText}</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center text-muted-foreground py-4">
                            <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No comments yet</p>
                            <p className="text-xs">Be the first to comment on this story</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Attachments Section */}
                    <div>
                      <h3 className="text-sm font-medium mb-3 flex items-center">
                        <Paperclip className="w-4 h-4 mr-2" />
                        Attachments & Links
                      </h3>
                      <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                        <FileText className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Drag files here or click to upload
                        </p>
                        <Button variant="outline" size="sm" className="mt-2">
                          <Link className="w-4 h-4 mr-2" />
                          Add Link
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Properties */}
                <div className="border-l border-border p-4 overflow-y-auto bg-muted/30">
                  <div className="space-y-4">
                    {/* Story Type */}
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Story Type <span className="text-red-500">*</span>
                      </label>
                      <Select
                        value={formData.storyType || "Story"}
                        onValueChange={(value) => setFormData({ ...formData, storyType: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STORY_TYPE_OPTIONS.map((type) => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Priority */}
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Priority <span className="text-red-500">*</span>
                      </label>
                      <Select
                        value={formData.priority || "Medium"}
                        onValueChange={(value) => setFormData({ ...formData, priority: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PRIORITY_OPTIONS.map((priority) => (
                            <SelectItem key={priority} value={priority}>
                              <div className="flex items-center space-x-2">
                                <Flag className="w-4 h-4" />
                                <span>{priority}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Story Points */}
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Story Points <span className="text-red-500">*</span>
                      </label>
                      <Select
                        value={formData.pointer?.toString() || "1"}
                        onValueChange={(value) => setFormData({ ...formData, pointer: parseInt(value) })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STORY_POINTS.map((point) => (
                            <SelectItem key={point} value={point.toString()}>
                              <div className="flex items-center space-x-2">
                                <Star className="w-4 h-4" />
                                <span>{point}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Status */}
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Status <span className="text-red-500">*</span>
                      </label>
                      <Select
                        value={formData.status || "Backlog"}
                        onValueChange={(value) => setFormData({ ...formData, status: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map((status) => (
                            <SelectItem key={status} value={status}>{status}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Assignee */}
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Assignee <span className="text-red-500">*</span>
                      </label>
                      <Select
                        value={formData.assigneeId || "unassigned"}
                        onValueChange={(value) => setFormData({ 
                          ...formData, 
                          assigneeId: value === "unassigned" ? null : value 
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select assignee..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned">
                            <div className="flex items-center space-x-2">
                              <User className="w-4 h-4 text-muted-foreground" />
                              <span>Unassigned</span>
                            </div>
                          </SelectItem>
                          {TEAM_MEMBERS[selectedWorkspace as keyof typeof TEAM_MEMBERS]?.map((member) => (
                            <SelectItem key={member.id} value={member.id}>
                              <div className="flex items-center space-x-2">
                                <Avatar className="w-4 h-4">
                                  <AvatarFallback className="text-xs">
                                    {getUserInitials(member.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <span>{member.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Epic Link */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Epic Link</label>
                      <Input
                        value={formData.epicLink || ""}
                        onChange={(e) => setFormData({ ...formData, epicLink: e.target.value })}
                        placeholder="Link to epic..."
                      />
                    </div>

                    {/* Active Sprint */}
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Active Sprint <span className="text-red-500">*</span>
                      </label>
                      <Select
                        value={formData.activeSprint || "sprint-1"}
                        onValueChange={(value) => setFormData({ ...formData, activeSprint: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sprint-1">Sprint 1</SelectItem>
                          <SelectItem value="sprint-2">Sprint 2</SelectItem>
                          <SelectItem value="sprint-3">Sprint 3</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator />

                    {/* Action Buttons */}
                    <div className="space-y-2">
                      <Button onClick={handleSave} className="w-full">
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </Button>
                      <Button variant="outline" onClick={onClose} className="w-full">
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Activity History Panel (Collapsible) */}
          {showHistory && (
            <div className="w-80 border-l border-border bg-muted/20">
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium flex items-center">
                    <Activity className="w-4 h-4 mr-2" />
                    Activity History
                  </h3>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowHistory(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <ScrollArea className="h-[calc(100vh-200px)]">
                <div className="p-4 space-y-4">
                  {/* Sample Activity Items */}
                  <div className="flex space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div className="flex-1">
                      <div className="text-sm">
                        <span className="font-medium">Abhishek</span> changed status from 
                        <Badge variant="outline" className="mx-1 text-xs">To Do</Badge> to 
                        <Badge variant="outline" className="mx-1 text-xs">In Progress</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center mt-1">
                        <Clock className="w-3 h-3 mr-1" />
                        {new Date(Date.now() - 2 * 60 * 60 * 1000).toLocaleString("en-US", {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div className="flex-1">
                      <div className="text-sm">
                        <span className="font-medium">Shantnu</span> assigned to 
                        <span className="font-medium mx-1">Tanay</span>
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center mt-1">
                        <Clock className="w-3 h-3 mr-1" />
                        {new Date(Date.now() - 24 * 60 * 60 * 1000).toLocaleString("en-US", {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div className="flex-1">
                      <div className="text-sm">
                        <span className="font-medium">Abhishek</span> created this story
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center mt-1">
                        <Clock className="w-3 h-3 mr-1" />
                        {new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toLocaleString("en-US", {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
