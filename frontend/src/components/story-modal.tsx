import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { insertStorySchema, type User, type StoryWithAssignee } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useWorkspace } from "@/lib/workspace-context";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { 
  Loader2, 
  Brain, 
  X, 
  Plus, 
  Minus,
  BookOpen,
  Bug,
  Zap,
  ArrowUp,
  ArrowDown,
  Flag
} from "lucide-react";
import { z } from "zod";

const storyFormSchema = insertStorySchema.omit({
  createdBy: true,
  updatedBy: true,
}).extend({
  title: z.string().min(1, "Title is required"),
  priority: z.enum(["Low", "Medium", "High"], {
    required_error: "Priority is required",
  }),
  storyType: z.enum(["Story", "Bug", "Epic"], {
    required_error: "Story type is required",
  }),
});

// Separate type for form handling with Date objects for UI
const formSchemaWithDate = storyFormSchema.extend({
  dueDate: z.date().optional().refine((date) => {
    if (!date) return true; // Optional field
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    return date >= today;
  }, "Due date cannot be in the past"),
});

type StoryFormData = z.infer<typeof formSchemaWithDate>;

interface StoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AIEstimation {
  estimatedPointer: number;
  prioritySuggestion: string;
  confidence: number;
  reasoning: string;
}

export function StoryModal({ isOpen, onClose }: StoryModalProps) {
  const [isGettingAIEstimate, setIsGettingAIEstimate] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { selectedWorkspace, selectedProject } = useWorkspace();

  const form = useForm<StoryFormData>({
    resolver: zodResolver(formSchemaWithDate),
    defaultValues: {
      title: "",
      description: "",
      pointer: 1,
      acceptanceCriteria: "",
      status: "To Do",
      priority: "Medium",
      storyType: "Story",
      sprintId: "sprint-1",
      tags: [],
      dueDate: undefined,
      assigneeId: undefined,
    },
  });

  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: user?.role === "Admin",
  });

  const createStoryMutation = useMutation({
    mutationFn: async (data: StoryFormData) => {
      const res = await apiRequest("POST", "/api/stories", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stories"] });
      toast({
        title: "Success",
        description: "Story created successfully",
      });
      form.reset();
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create story",
        variant: "destructive",
      });
    },
  });

  const getAIEstimateMutation = useMutation({
    mutationFn: async (data: { title: string; description: string }) => {
      const res = await apiRequest("POST", "/api/stories/ai-estimate", data);
      return await res.json() as AIEstimation;
    },
    onSuccess: (estimation: AIEstimation) => {
      form.setValue("pointer", estimation.estimatedPointer);
      form.setValue("priority", estimation.prioritySuggestion as "Low" | "Medium" | "High");
      toast({
        title: "AI Estimation Complete",
        description: estimation.reasoning,
      });
    },
    onError: () => {
      toast({
        title: "AI Estimation Failed",
        description: "Could not get AI estimation. Please set values manually.",
        variant: "destructive",
      });
    },
  });

  const handleGetAIEstimate = async () => {
    const title = form.getValues("title");
    const description = form.getValues("description") || "";

    if (!title.trim()) {
      toast({
        title: "Title Required",
        description: "Please enter a story title before getting AI estimation",
        variant: "destructive",
      });
      return;
    }

    setIsGettingAIEstimate(true);
    try {
      await getAIEstimateMutation.mutateAsync({ title, description });
    } finally {
      setIsGettingAIEstimate(false);
    }
  };

  const onSubmit = (data: StoryFormData) => {
    // Auto-prefix title with project name if not already prefixed
    const projectPrefix = selectedProject === "T&D" ? "T&D" : "ADMS";
    const prefixedTitle = data.title.startsWith(projectPrefix) 
      ? data.title 
      : `${projectPrefix} - ${data.title}`;

    // Process tags and dueDate
    const processedData = {
      ...data,
      title: prefixedTitle,
      project: selectedProject,
      workspace: selectedWorkspace,
      tags: typeof data.tags === "string" 
        ? (data.tags as string).split(",").map((tag: string) => tag.trim()).filter(Boolean)
        : data.tags || [],
      dueDate: data.dueDate ? data.dueDate.toISOString() : undefined, // Convert Date to string
    };

    createStoryMutation.mutate(processedData as any);
  };

  const handleClose = () => {
    if (!createStoryMutation.isPending) {
      form.reset();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Create New Story</DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              disabled={createStoryMutation.isPending}
              data-testid="button-close-modal"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              data-testid="input-story-title"
              {...form.register("title")}
              placeholder="Enter story title"
              disabled={createStoryMutation.isPending}
            />
            {form.formState.errors.title && (
              <p className="text-sm text-destructive">
                {form.formState.errors.title.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              data-testid="textarea-story-description"
              {...form.register("description")}
              placeholder="Describe the story requirements..."
              rows={4}
              disabled={createStoryMutation.isPending}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority *</Label>
              <Select
                value={form.watch("priority")}
                onValueChange={(value) => form.setValue("priority", value as "Low" | "Medium" | "High")}
                disabled={createStoryMutation.isPending}
              >
                <SelectTrigger data-testid="select-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low <ArrowDown className="w-4 h-4 inline-block ml-2 text-green-500"/></SelectItem>
                  <SelectItem value="Medium">Medium <Zap className="w-4 h-4 inline-block ml-2 text-yellow-500"/></SelectItem>
                  <SelectItem value="High">High <ArrowUp className="w-4 h-4 inline-block ml-2 text-red-500"/></SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.priority && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.priority.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="pointer">Story Points</Label>
              <Input
                id="pointer"
                data-testid="input-story-points"
                type="number"
                min="1"
                max="5"
                {...form.register("pointer", { valueAsNumber: true })}
                placeholder="1-5"
                disabled={createStoryMutation.isPending}
              />
               {form.formState.errors.pointer && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.pointer.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="acceptanceCriteria">Acceptance Criteria</Label>
            <Textarea
              id="acceptanceCriteria"
              data-testid="textarea-acceptance-criteria"
              {...form.register("acceptanceCriteria")}
              placeholder="- User can login with email and password&#10;- JWT token is generated and stored&#10;- User is redirected to dashboard"
              rows={3}
              disabled={createStoryMutation.isPending}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {user?.role === "Admin" && users && (
              <div className="space-y-2">
                <Label htmlFor="assigneeId">Assignee</Label>
                <Select
                  value={form.watch("assigneeId") || "unassigned"}
                  onValueChange={(value) => form.setValue("assigneeId", value === "unassigned" ? undefined : value)}
                  disabled={createStoryMutation.isPending}
                >
                  <SelectTrigger data-testid="select-assignee">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={`w-full justify-start text-left font-normal ${
                      !form.watch("dueDate") && "text-muted-foreground"
                    }`}
                    disabled={createStoryMutation.isPending}
                    data-testid="button-due-date"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.watch("dueDate") ? (
                      format(form.watch("dueDate")!, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={form.watch("dueDate")}
                    onSelect={(date) => form.setValue("dueDate", date)}
                    disabled={(date) => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      date.setHours(0, 0, 0, 0);
                      return date < today;
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {form.formState.errors.dueDate && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.dueDate.message}
                </p>
              )}
            </div>
          </div>
          
          {/* Epic Link */}
          <div className="space-y-2">
            <Label htmlFor="epicLink">Epic Link</Label>
            <Input
              id="epicLink"
              data-testid="input-epic-link"
              {...form.register("epicLink")}
              placeholder="Select or create an Epic Link"
              disabled={createStoryMutation.isPending}
            />
            {/* Add tag suggestion logic here if needed */}
          </div>

          {/* Story Type */}
          <div className="space-y-2">
            <Label htmlFor="storyType">Story Type *</Label>
            <Select
              value={form.watch("storyType")}
              onValueChange={(value) => form.setValue("storyType", value as "Story" | "Bug" | "Epic")}
              disabled={createStoryMutation.isPending}
            >
              <SelectTrigger data-testid="select-story-type">
                <SelectValue placeholder="Select Story Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Story">Story <BookOpen className="w-4 h-4 inline-block ml-2"/></SelectItem>
                <SelectItem value="Bug">Bug <Bug className="w-4 h-4 inline-block ml-2"/></SelectItem>
                <SelectItem value="Epic">Epic <Flag className="w-4 h-4 inline-block ml-2"/></SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.storyType && (
              <p className="text-sm text-destructive">
                {form.formState.errors.storyType.message}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              type="button"
              variant="secondary"
              onClick={handleGetAIEstimate}
              disabled={createStoryMutation.isPending || isGettingAIEstimate}
              className="flex items-center space-x-2"
              data-testid="button-ai-estimate"
            >
              {isGettingAIEstimate ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Brain className="w-4 h-4" />
              )}
              <span>Get AI Estimate</span>
            </Button>

            <div className="flex space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={createStoryMutation.isPending}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createStoryMutation.isPending}
                data-testid="button-create-story"
              >
                {createStoryMutation.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Create Story
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}