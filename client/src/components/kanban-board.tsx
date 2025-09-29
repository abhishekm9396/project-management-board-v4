import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import {
  MessageCircle,
  Plus,
  Star,
  Settings,
  Paperclip,
  Users,
  ArrowUpDown,
  List,
  Grid3x3,
  Activity,
  Calendar,
  Hash,
  Filter,
  SortAsc,
  SortDesc,
  Search
} from "lucide-react";
import { StoryWithAssignee } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, differenceInDays, startOfWeek } from "date-fns";

interface KanbanBoardProps {
  compact?: boolean;
  onStoryClick?: (storyId: string) => void;
  onCreateStory?: () => void;
}

// Updated COLUMN_NAMES to include "Backlog"
const COLUMN_NAMES = ["Backlog", "To Do", "In Progress", "Blocked", "Validation", "Completed"];

const COLUMN_COLORS = {
  "Backlog": "hsl(210 40% 96.1%)", // A neutral color for backlog
  "To Do": "hsl(12 76% 61%)",
  "In Progress": "hsl(173 58% 39%)",
  "Blocked": "hsl(0 84.2% 60.2%)",
  "Validation": "hsl(43 74% 66%)",
  "Completed": "hsl(142 76% 36%)",
};

const PRIORITY_COLORS = {
  High: "hsl(0 84.2% 60.2%)",
  Medium: "hsl(43 74% 66%)",
  Low: "hsl(142 76% 36%)",
};

export function KanbanBoard({ compact = false, onStoryClick, onCreateStory }: KanbanBoardProps) {
  const [columns, setColumns] = useState<Record<string, StoryWithAssignee[]>>({});
  const [selectedProject, setSelectedProject] = useState("all");
  const [selectedTeamLead, setSelectedTeamLead] = useState("all");
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");

  // WIP Limits for Kanban workflow
  const [wipLimits, setWipLimits] = useState<Record<string, number>>({
    "Backlog": 0, // No limit for backlog
    "To Do": 5,
    "In Progress": 3,
    "Blocked": 2,
    "Validation": 3,
    "Completed": 0, // No limit for completed
  });
  const [showMetrics, setShowMetrics] = useState(false);

  // Kanban metrics for cycle time and lead time
  const [metrics, setMetrics] = useState({
    avgCycleTime: 0,
    avgLeadTime: 0,
    throughput: 0,
  });

  // List view filters and sorting
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [filters, setFilters] = useState({
    story: "",
    title: "",
    assignee: "all",
    status: "all",
    priority: "all",
    points: "",
    type: "all"
  });
  const [viewDensity, setViewDensity] = useState<"compact" | "normal" | "comfortable">("normal");

  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: stories, isLoading } = useQuery<StoryWithAssignee[]>({
    queryKey: ["/api/stories"],
  });

  const { data: users } = useQuery({
    queryKey: ["/api/users"],
  });

  const updateStoryMutation = useMutation({
    mutationFn: async ({ storyId, updates }: { storyId: string; updates: any }) => {
      const res = await apiRequest("PATCH", `/api/stories/${storyId}`, updates);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stories"] });
    },
  });

  const createStoryMutation = useMutation({
    mutationFn: async (columnStatus: string) => {
      if (!user?.id) {
        throw new Error("User authentication required");
      }

      // Set default status to 'Backlog' if not provided, otherwise use provided status
      const defaultStatus = "Backlog";
      const statusToSet = columnStatus || defaultStatus;


      const newStory = {
        title: "New Story", // Mandatory field - default value
        description: "Click to edit description",
        status: statusToSet, // Default to 'Backlog' or provided
        priority: "Medium" as const, // Mandatory field - default value
        storyType: "Story" as const, // Mandatory field - default value
        pointer: 1, // Mandatory field - default value
        project: selectedProject === "all" ? "T&D" : selectedProject,
        acceptanceCriteria: "• Add acceptance criteria here",
        createdBy: user.id,
        teamLead: selectedTeamLead === "all" ? undefined : selectedTeamLead,
      };
      const res = await apiRequest("POST", "/api/stories", newStory);
      return await res.json();
    },
    onSuccess: (newStory) => {
      queryClient.invalidateQueries({ queryKey: ["/api/stories"] });
      // Optionally, you can open the story for editing immediately
      setTimeout(() => {
        onStoryClick?.(newStory.id);
      }, 500);
    },
    onError: (error: Error) => {
      console.error("Failed to create story:", error);
    },
  });

  // Organize stories by status and calculate metrics
  useEffect(() => {
    if (stories) {
      const organized = COLUMN_NAMES.reduce((acc, status) => {
        acc[status] = stories.filter(story => story.status === status);
        return acc;
      }, {} as Record<string, StoryWithAssignee[]>);
      setColumns(organized);

      // Update Kanban metrics
      const newMetrics = calculateKanbanMetrics();
      setMetrics(newMetrics);
    }
  }, [stories]);

  const onDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const startColumn = [...(columns[source.droppableId] || [])]; // Handle cases where column might be empty
    const endColumn = source.droppableId === destination.droppableId
      ? startColumn
      : [...(columns[destination.droppableId] || [])]; // Handle cases where column might be empty


    // Remove from source
    const [removed] = startColumn.splice(source.index, 1);

    // Add to destination
    if (source.droppableId === destination.droppableId) {
      startColumn.splice(destination.index, 0, removed);
    } else {
      endColumn.splice(destination.index, 0, removed);
    }

    // Update local state immediately for smooth UX
    const newColumns = {
      ...columns,
      [source.droppableId]: startColumn,
      [destination.droppableId]: endColumn,
    };
    setColumns(newColumns);

    // Update story status on backend
    updateStoryMutation.mutate({
      storyId: draggableId,
      updates: { status: destination.droppableId },
    });
  };

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getStoryNumber = (story: StoryWithAssignee) => {
    // Use the story number from database or fallback to generated one
    return story.storyNumber || `${story.project || "T&D"}-0000`;
  };

  // Filter and sort stories for list view
  const getFilteredAndSortedStories = () => {
    if (!stories) return [];

    let filtered = stories.filter(story => {
      const matchesProject = selectedProject === "all" || story.project === selectedProject;
      const matchesTeamLead = selectedTeamLead === "all" || story.teamLead === selectedTeamLead;
      const matchesStory = filters.story === "" || getStoryNumber(story).toLowerCase().includes(filters.story.toLowerCase());
      const matchesTitle = filters.title === "" || story.title.toLowerCase().includes(filters.title.toLowerCase());
      // Handle assignee filter with "all", "unassigned", or specific assignee name
      const matchesAssignee = filters.assignee === "all" || filters.assignee === ""
        ? true
        : filters.assignee === "unassigned"
        ? (story.assignee === null || story.assignee === undefined)
        : (story.assignee?.name.toLowerCase().includes(filters.assignee.toLowerCase()) ?? false);
      const matchesStatus = filters.status === "all" || story.status === filters.status;
      const matchesPriority = filters.priority === "all" || story.priority === filters.priority;
      const matchesPoints = filters.points === "" || story.pointer?.toString() === filters.points;
      const matchesType = filters.type === "all" || story.storyType === filters.type;

      return matchesProject && matchesTeamLead && matchesStory && matchesTitle && matchesAssignee && matchesStatus && matchesPriority && matchesPoints && matchesType;
    });

    if (sortColumn) {
      filtered.sort((a, b) => {
        let aVal: any, bVal: any;

        switch (sortColumn) {
          case "story":
            aVal = getStoryNumber(a);
            bVal = getStoryNumber(b);
            break;
          case "title":
            aVal = a.title;
            bVal = b.title;
            break;
          case "assignee":
            // Handle sorting for unassigned explicitly
            aVal = a.assignee?.name || "";
            bVal = b.assignee?.name || "";
            break;
          case "status":
            aVal = a.status;
            bVal = b.status;
            break;
          case "priority":
            const priorityOrder = { "Low": 0, "Medium": 1, "High": 2 };
            aVal = priorityOrder[a.priority as keyof typeof priorityOrder];
            bVal = priorityOrder[b.priority as keyof typeof priorityOrder];
            break;
          case "points":
            aVal = a.pointer || 0;
            bVal = b.pointer || 0;
            break;
          case "type":
            aVal = a.storyType;
            bVal = b.storyType;
            break;
          default:
            return 0;
        }

        if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
        if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const canManageBoard = user?.role === "Admin" || user?.role === "Team Lead";

  // Calculate Kanban metrics (cycle time, lead time, throughput)
  const calculateKanbanMetrics = () => {
    if (!stories) return { avgCycleTime: 0, avgLeadTime: 0, throughput: 0 };

    const completedStories = stories.filter(story => story.status === "Completed");
    const lastWeekCompleted = completedStories.filter(story =>
      story.updatedAt && new Date(story.updatedAt) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );

    // Calculate average cycle time (In Progress -> Completed)
    const avgCycleTime = completedStories.length > 0
      ? completedStories.reduce((acc, story) => {
          if (story.createdAt && story.updatedAt) {
            return acc + (new Date(story.updatedAt).getTime() - new Date(story.createdAt).getTime()) / (1000 * 60 * 60 * 24);
          }
          return acc;
        }, 0) / completedStories.length
      : 0;

    // Calculate average lead time (Created -> Completed)
    const avgLeadTime = completedStories.length > 0
      ? completedStories.reduce((acc, story) => {
          if (story.createdAt && story.updatedAt) {
            return acc + (new Date(story.updatedAt).getTime() - new Date(story.createdAt).getTime()) / (1000 * 60 * 60 * 24);
          }
          return acc;
        }, 0) / completedStories.length
      : 0;

    return {
      avgCycleTime: Math.round(avgCycleTime * 10) / 10,
      avgLeadTime: Math.round(avgLeadTime * 10) / 10,
      throughput: lastWeekCompleted.length,
    };
  };

  // Check WIP limit violations
  const isWipLimitExceeded = (columnName: string) => {
    const limit = wipLimits[columnName];
    if (limit === 0) return false; // No limit set
    const currentCount = columns[columnName]?.length || 0;
    return currentCount >= limit;
  };

  const getWipLimitColor = (columnName: string) => {
    const limit = wipLimits[columnName];
    if (limit === 0) return "text-muted-foreground";
    const currentCount = columns[columnName]?.length || 0;
    const ratio = currentCount / limit;
    if (ratio >= 1) return "text-red-600";
    if (ratio >= 0.8) return "text-yellow-600";
    return "text-green-600";
  };

  const handleCreateNewTask = (columnStatus?: string) => {
    createStoryMutation.mutate(columnStatus || "To Do");
  };

  const StoryCard = ({ story, index }: { story: StoryWithAssignee; index: number }) => {
    const getCardScale = () => {
      switch (viewDensity) {
        case "compact": return "scale-90";
        case "comfortable": return "scale-110";
        default: return "scale-100";
      }
    };

    return (
      <Draggable draggableId={story.id} index={index}>
        {(provided, snapshot) => (
          <Card
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={cn(
              "mb-3 transition-all duration-200 hover:shadow-md border border-border/50 transform-gpu story-card",
              snapshot.isDragging && "rotate-1 shadow-lg border-primary/50 scale-105",
              getCardScale(),
              viewDensity === "compact" && "mb-2",
              viewDensity === "comfortable" && "mb-4"
            )}
            data-testid={`story-card-${story.id}`}
            style={{
              ...provided.draggableProps.style,
              transformOrigin: "center",
              zoom: "var(--page-zoom, 1)",
              maxHeight: "280px",
              overflowY: "auto"
            }}
          >
            <CardContent
              className={cn(
                "hover:bg-muted/30 transition-colors cursor-pointer overflow-y-auto",
                viewDensity === "compact" && "p-2 text-sm",
                viewDensity === "comfortable" && "p-6 text-base",
                viewDensity === "normal" && "p-4"
              )}
              onClick={(e) => {
                e.stopPropagation();
                onStoryClick?.(story.id);
              }}
            >
              {/* Story Number at the top */}
              <div className="flex items-center justify-between mb-2">
                <Badge variant="outline" className="text-xs font-mono">
                  <Hash className="w-3 h-3 mr-1" />
                  {getStoryNumber(story)}
                </Badge>
                <Badge
                  variant="secondary"
                  className="text-xs px-2 py-1 flex-shrink-0"
                  style={{
                    backgroundColor: `${PRIORITY_COLORS[story.priority as keyof typeof PRIORITY_COLORS]}20`,
                    color: PRIORITY_COLORS[story.priority as keyof typeof PRIORITY_COLORS],
                  }}
                >
                  {story.priority}
                </Badge>
              </div>

              {/* Story Type */}
              {story.storyType && (
                <Badge variant="outline" className="text-xs px-2 py-0.5 mb-2">
                  {story.storyType}
                </Badge>
              )}

              {/* Title */}
              <h5 className={cn(
                "font-medium text-foreground leading-tight hover:text-primary transition-colors",
                viewDensity === "compact" && "text-sm",
                viewDensity === "normal" && "text-base",
                viewDensity === "comfortable" && "text-lg"
              )}>
                {story.title}
              </h5>

              {/* Description (only in normal/comfortable view) */}
              {story.description && (
                <p className={cn(
                  "text-muted-foreground mb-3 line-clamp-2",
                  viewDensity === "compact" && "text-xs",
                  viewDensity === "normal" && "text-sm",
                  viewDensity === "comfortable" && "text-base"
                )}>
                  {story.description}
                </p>
              )}

              {/* Bottom Row - Story Points, Assignee, Attachments, Comments */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {story.pointer && (
                    <div className="flex items-center space-x-1">
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                      <span className={cn("text-muted-foreground", viewDensity === "compact" ? "text-xs" : "text-sm")}>{story.pointer}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-1">
                    <Paperclip className={cn("text-muted-foreground", viewDensity === "compact" ? "w-3 h-3" : "w-4 h-4")} />
                    <span className={cn("text-muted-foreground", viewDensity === "compact" ? "text-xs" : "text-sm")}>0</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {/* Assigned User */}
                  {story.assignee && (
                    <div className="flex items-center space-x-1">
                      <Avatar className={cn(viewDensity === "compact" ? "w-5 h-5" : "w-7 h-7")}>
                        <AvatarFallback className={cn(viewDensity === "compact" ? "text-xs" : "text-sm")}>
                          {getUserInitials(story.assignee.name)}
                        </AvatarFallback>
                      </Avatar>
                      {(
                        <span className={cn("text-muted-foreground", viewDensity === "compact" ? "text-xs" : "text-sm")}>{story.assignee.name}</span>
                      )}
                    </div>
                  )}
                  <div className="flex items-center space-x-1">
                    <MessageCircle className={cn("text-muted-foreground", viewDensity === "compact" ? "w-3 h-3" : "w-4 h-4")} />
                    <span className={cn("text-muted-foreground", viewDensity === "compact" ? "text-xs" : "text-sm")}>
                      {story.commentCount || 0}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </Draggable>
    );
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex-1 p-6">
          <div className="flex space-x-6 overflow-x-auto">
            {COLUMN_NAMES.map((columnName) => (
              <div key={columnName} className="flex-shrink-0 w-80">
                <div className="bg-muted/50 rounded-lg p-4">
                  <Skeleton className="h-6 w-32 mb-4" />
                  <div className="space-y-3">
                    {[...Array(2)].map((_, i) => (
                      <Skeleton key={i} className="h-32 w-full" />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header Section */}
      <div className="border-b border-border bg-card">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              {/* Project Dropdown */}
              <Select value={selectedProject} onValueChange={(value) => {
                setSelectedProject(value);
                // Auto-sync team lead based on project
                if (value === "T&D") {
                  setSelectedTeamLead("Shantnu");
                } else if (value === "ADMS") {
                  setSelectedTeamLead("Pranav");
                } else {
                  setSelectedTeamLead("all");
                }
              }}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Select Project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  <SelectItem value="T&D">T&D</SelectItem>
                  <SelectItem value="ADMS">ADMS</SelectItem>
                </SelectContent>
              </Select>

              {/* Team Lead Dropdown */}
              <Select value={selectedTeamLead} onValueChange={setSelectedTeamLead}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Select Team Lead" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Team Leads</SelectItem>
                  {(selectedProject === "all" || selectedProject === "T&D") && (
                    <SelectItem value="Shantnu">Shantnu</SelectItem>
                  )}
                  {(selectedProject === "all" || selectedProject === "ADMS") && (
                    <SelectItem value="Pranav">Pranav</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

          </div>
        </div>

        {/* Board-Level Toolbar - Available for all roles */}
        <div className="border-t border-border px-4 py-2 bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {canManageBoard && (
                <Button
                  size="sm"
                  className="flex items-center space-x-2"
                  onClick={() => handleCreateNewTask()} // Call without status to use default 'Backlog'
                  data-testid="button-create-new-story"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ New Story</span>
                </Button>
              )}

              {/* View Mode Switch - Available for all roles */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode(viewMode === "kanban" ? "list" : "kanban")}
              >
                {viewMode === "kanban" ? <List className="w-4 h-4 mr-2" /> : <Grid3x3 className="w-4 h-4 mr-2" />}
                {viewMode === "kanban" ? "List View" : "Board View"}
              </Button>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMetrics(!showMetrics)}
              >
                <Activity className="w-4 h-4 mr-2" />
                Metrics
              </Button>

              {canManageBoard && (
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4 mr-2" />
                  Board Settings
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Kanban Metrics Panel */}
      {showMetrics && (
        <div className="px-6 py-4 bg-muted/50 border-b border-border">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{metrics.avgCycleTime}d</div>
              <div className="text-sm text-muted-foreground">Avg Cycle Time</div>
              <div className="text-xs text-muted-foreground">Time from In Progress to Done</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{metrics.avgLeadTime}d</div>
              <div className="text-sm text-muted-foreground">Avg Lead Time</div>
              <div className="text-xs text-muted-foreground">Time from Created to Done</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{metrics.throughput}</div>
              <div className="text-sm text-muted-foreground">Throughput (Last 7 days)</div>
              <div className="text-xs text-muted-foreground">Stories completed this week</div>
            </div>
          </div>
        </div>
      )}

      {/* Main Board Area */}
      <div className="flex-1 overflow-hidden">
        {viewMode === "kanban" ? (
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="h-full overflow-auto scrollbar-thin">
              {/* Adjusted to min-width: max-content to allow horizontal scrolling */}
              <div className="flex space-x-6 p-6 min-w-max">
                {COLUMN_NAMES.map((columnName) => (
                  <Droppable droppableId={columnName} key={columnName}>
                    {(provided, snapshot) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className={cn(
                          "flex-shrink-0",
                          "w-80" // Default width, can be adjusted
                        )}
                      >
                        <div className={cn(
                          "bg-muted/50 rounded-lg border border-border/50 h-full",
                          snapshot.isDraggingOver && "bg-muted/70 border-primary/50"
                        )}>
                          {/* Column Header */}
                          <div className="p-4 border-b border-border/50 bg-card/50 rounded-t-lg">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: COLUMN_COLORS[columnName as keyof typeof COLUMN_COLORS] }}
                                />
                                <h4 className="font-medium text-foreground">
                                  {columnName}
                                </h4>
                                <Badge variant="secondary" className="text-xs px-2 py-1">
                                  {columns[columnName]?.length || 0}
                                </Badge>
                              </div>
                              <div className="flex items-center space-x-1">
                                {/* Create card button - available for all users */}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0"
                                  onClick={() => handleCreateNewTask(columnName)}
                                  title={`Add new story to ${columnName}`}
                                >
                                  <Plus className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                            {/* WIP Limit Indicator */}
                            <div className="flex items-center justify-between">
                              <div className={cn("text-xs font-medium", getWipLimitColor(columnName))}>
                                {wipLimits[columnName] > 0 ? (
                                  <>WIP: {columns[columnName]?.length || 0}/{wipLimits[columnName]}</>
                                ) : wipLimits[columnName] === 0 && columnName !== "Backlog" && columnName !== "Completed" ? (
                                  <>No WIP Limit</>
                                ) : null}
                              </div>
                              {isWipLimitExceeded(columnName) && (
                                <Badge variant="destructive" className="text-xs">
                                  Over Limit!
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Column Content */}
                          <div className="p-4 space-y-3 min-h-[500px] max-h-[calc(100vh-300px)] overflow-y-auto scrollbar-thin scrollbar-track-muted scrollbar-thumb-muted-foreground/30 hover:scrollbar-thumb-muted-foreground/50">
                            {columns[columnName]?.map((story, index) => (
                              <StoryCard key={story.id} story={story} index={index} />
                            ))}
                            {provided.placeholder}
                          </div>
                        </div>
                      </div>
                    )}
                  </Droppable>
                ))}
              </div>
            </div>
          </DragDropContext>
        ) : (
          // List View
          <div className="h-full overflow-auto p-6">
            <div className="bg-card rounded-lg border">
              {/* Filters Row */}
              <div className="grid grid-cols-12 gap-4 p-4 bg-muted/20 border-b">
                <div className="col-span-1">
                  <Input
                    placeholder="Story #..."
                    value={filters.story}
                    onChange={(e) => handleFilterChange("story", e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="col-span-3">
                  <Input
                    placeholder="Title..."
                    value={filters.title}
                    onChange={(e) => handleFilterChange("title", e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="col-span-2">
                  <Select value={filters.assignee} onValueChange={(value) => handleFilterChange("assignee", value)}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Assignee" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Assignees</SelectItem>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {users && Array.isArray(users) ? users.map((user: any) => (
                        <SelectItem key={user.id} value={user.name}>
                          {user.name}
                        </SelectItem>
                      )) : null}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Select value={filters.status} onValueChange={(value) => handleFilterChange("status", value)}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="Backlog">Backlog</SelectItem> {/* Added Backlog */}
                      <SelectItem value="To Do">To Do</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Blocked">Blocked</SelectItem>
                      <SelectItem value="Validation">Validation</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-1">
                  <Select value={filters.priority} onValueChange={(value) => handleFilterChange("priority", value)}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-1">
                  <Input
                    placeholder="Points..."
                    value={filters.points}
                    onChange={(e) => handleFilterChange("points", e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="col-span-1">
                  <Select value={filters.type} onValueChange={(value) => handleFilterChange("type", value)}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="Story">Story</SelectItem>
                      <SelectItem value="Bug">Bug</SelectItem>
                      <SelectItem value="Epic">Epic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-1">
                  <div className="h-8"></div> {/* Actions column - no filter */}
                </div>
              </div>

              {/* Table Header with Sorting */}
              <div className="grid grid-cols-12 gap-4 p-4 bg-muted/50 border-b text-sm font-medium text-muted-foreground">
                <div className="col-span-1 flex items-center cursor-pointer" onClick={() => handleSort("story")}>
                  Story #
                  {sortColumn === "story" && (
                    sortDirection === "asc" ? <SortAsc className="w-3 h-3 ml-1" /> : <SortDesc className="w-3 h-3 ml-1" />
                  )}
                </div>
                <div className="col-span-3 flex items-center cursor-pointer" onClick={() => handleSort("title")}>
                  Title
                  {sortColumn === "title" && (
                    sortDirection === "asc" ? <SortAsc className="w-3 h-3 ml-1" /> : <SortDesc className="w-3 h-3 ml-1" />
                  )}
                </div>
                <div className="col-span-2 flex items-center cursor-pointer" onClick={() => handleSort("assignee")}>
                  Assignee
                  {sortColumn === "assignee" && (
                    sortDirection === "asc" ? <SortAsc className="w-3 h-3 ml-1" /> : <SortDesc className="w-3 h-3 ml-1" />
                  )}
                </div>
                <div className="col-span-2 flex items-center cursor-pointer" onClick={() => handleSort("status")}>
                  Status
                  {sortColumn === "status" && (
                    sortDirection === "asc" ? <SortAsc className="w-3 h-3 ml-1" /> : <SortDesc className="w-3 h-3 ml-1" />
                  )}
                </div>
                <div className="col-span-1 flex items-center cursor-pointer" onClick={() => handleSort("priority")}>
                  Priority
                  {sortColumn === "priority" && (
                    sortDirection === "asc" ? <SortAsc className="w-3 h-3 ml-1" /> : <SortDesc className="w-3 h-3 ml-1" />
                  )}
                </div>
                <div className="col-span-1 flex items-center cursor-pointer" onClick={() => handleSort("points")}>
                  Points
                  {sortColumn === "points" && (
                    sortDirection === "asc" ? <SortAsc className="w-3 h-3 ml-1" /> : <SortDesc className="w-3 h-3 ml-1" />
                  )}
                </div>
                <div className="col-span-1 flex items-center cursor-pointer" onClick={() => handleSort("type")}>
                  Type
                  {sortColumn === "type" && (
                    sortDirection === "asc" ? <SortAsc className="w-3 h-3 ml-1" /> : <SortDesc className="w-3 h-3 ml-1" />
                  )}
                </div>
                <div className="col-span-1">Actions</div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-border">
                {getFilteredAndSortedStories().length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No stories found matching your filters</p>
                  </div>
                ) : (
                  getFilteredAndSortedStories().map((story) => (
                    <div
                      key={story.id}
                      className="grid grid-cols-12 gap-4 p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => onStoryClick?.(story.id)}
                    >
                      <div className="col-span-1">
                        <Badge variant="outline" className="text-xs font-mono">
                          <Hash className="w-3 h-3 mr-1" />
                          {getStoryNumber(story)}
                        </Badge>
                      </div>
                      <div className="col-span-3">
                        <div className="font-medium text-sm">{story.title}</div>
                        {story.description && (
                          <div className="text-xs text-muted-foreground mt-1 line-clamp-1">
                            {story.description}
                          </div>
                        )}
                      </div>
                      <div className="col-span-2">
                        {story.assignee ? (
                          <div className="flex items-center space-x-2">
                            <Avatar className="w-6 h-6">
                              <AvatarFallback className="text-xs">
                                {getUserInitials(story.assignee.name)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{story.assignee.name}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Unassigned</span>
                        )}
                      </div>
                      <div className="col-span-2">
                        <Badge
                          variant="outline"
                          className="text-xs"
                          style={{
                            backgroundColor: `${COLUMN_COLORS[story.status as keyof typeof COLUMN_COLORS]}20`,
                            borderColor: COLUMN_COLORS[story.status as keyof typeof COLUMN_COLORS],
                            color: COLUMN_COLORS[story.status as keyof typeof COLUMN_COLORS],
                          }}
                        >
                          {story.status}
                        </Badge>
                      </div>
                      <div className="col-span-1">
                        <Badge
                          variant="secondary"
                          className="text-xs"
                          style={{
                            backgroundColor: `${PRIORITY_COLORS[story.priority as keyof typeof PRIORITY_COLORS]}20`,
                            color: PRIORITY_COLORS[story.priority as keyof typeof PRIORITY_COLORS],
                          }}
                        >
                          {story.priority}
                        </Badge>
                      </div>
                      <div className="col-span-1">
                        <div className="flex items-center space-x-1">
                          <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                          <span className="text-sm">{story.pointer}</span>
                        </div>
                      </div>
                      <div className="col-span-1">
                        <Badge variant="outline" className="text-xs">
                          {story.storyType}
                        </Badge>
                      </div>
                      <div className="col-span-1">
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-1">
                            <MessageCircle className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs">{story.commentCount || 0}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Paperclip className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs">0</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Compact Footer */}
      <div className="border-t border-border bg-card p-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center space-x-4">
            <span>Total: {stories?.length || 0}</span>
            <span>Done: {columns["Completed"]?.length || 0}</span>
            <span>Active: {columns["In Progress"]?.length || 0}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Activity className="w-3 h-3" />
            <span>Last updated: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}