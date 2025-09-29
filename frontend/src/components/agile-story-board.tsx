import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useWorkspace, TEAM_MEMBERS } from "@/lib/workspace-context";
import {
  Target,
  Plus,
  Star,
  Settings,
  Paperclip,
  MessageCircle,
  ArrowUp,
  ArrowDown,
  Flag,
  Hash,
  Activity,
  Calendar,
  Users
} from "lucide-react";
import { StoryWithAssignee } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

interface AgileStoryBoardProps {
  onStoryClick?: (storyId: string) => void;
  onCreateStory?: () => void;
}

const SPRINT_COLUMNS = ["Backlog", "To Do", "In Progress", "Blocked", "Validation", "Completed"];

const COLUMN_COLORS = {
  "Backlog": "hsl(240 10% 50%)",
  "To Do": "hsl(12 76% 61%)",
  "In Progress": "hsl(173 58% 39%)",
  "Blocked": "hsl(0 84.2% 60.2%)",
  "Validation": "hsl(43 74% 66%)",
  "Completed": "hsl(142 76% 36%)",
};

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

interface Sprint {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: 'planning' | 'active' | 'completed';
  goal?: string;
}

export function AgileStoryBoard({ onStoryClick, onCreateStory }: AgileStoryBoardProps) {
  const [columns, setColumns] = useState<Record<string, StoryWithAssignee[]>>({});
  const [selectedSprint, setSelectedSprint] = useState("sprint-1");
  const [selectedUserId, setSelectedUserId] = useState("all");
  const { selectedWorkspace, selectedProject, setSelectedProject } = useWorkspace();
  
  // Sprint Management
  const [sprints] = useState<Sprint[]>([
    {
      id: 'sprint-1',
      name: 'Sprint 1',
      startDate: '2024-12-01',
      endDate: '2024-12-14',
      status: 'active',
      goal: 'Implement core authentication and user management features'
    },
    {
      id: 'sprint-2', 
      name: 'Sprint 2',
      startDate: '2024-12-15',
      endDate: '2024-12-28',
      status: 'planning',
      goal: 'Complete project management dashboard and reporting'
    },
    {
      id: 'backlog',
      name: 'Product Backlog',
      startDate: '',
      endDate: '',
      status: 'planning',
      goal: 'All unplanned stories'
    }
  ]);
  
  // Agile Metrics
  const [showVelocityChart, setShowVelocityChart] = useState(false);
  const [showBurndownChart, setShowBurndownChart] = useState(false);

  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: stories, isLoading: storiesLoading } = useQuery<StoryWithAssignee[]>({
    queryKey: ["/api/stories"],
  });

  const { data: users, isLoading: usersLoading } = useQuery({
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

      const defaultStatus = "Backlog";
      const statusToSet = columnStatus || defaultStatus;

      const projectPrefix = selectedProject === "T&D" ? "T&D" : "ADMS";
      const newStory = {
        title: `${projectPrefix} - New Story`, // Auto-prefix with project name
        description: "Click to edit description",
        status: statusToSet,
        priority: "Medium" as const,
        storyType: "Story" as const,
        pointer: 1,
        project: selectedProject,
        workspace: selectedWorkspace,
        acceptanceCriteria: "• Add acceptance criteria here",
        createdBy: user.id,
        activeSprint: selectedSprint,
      };

      const res = await apiRequest("POST", "/api/stories", newStory);
      return await res.json();
    },
    onSuccess: (newStory) => {
      queryClient.invalidateQueries({ queryKey: ["/api/stories"] });
      setTimeout(() => {
        onStoryClick?.(newStory.id);
      }, 500);
    },
    onError: (error: Error) => {
      console.error("Failed to create story:", error);
    },
  });

  // Filter stories for sprint and user - using useMemo to prevent infinite re-renders
  const sprintStories = useMemo(() => {
    if (!stories) return [];

    return stories.filter(story => {
      const matchesWorkspace = story.workspace === selectedWorkspace || story.project === selectedProject;
      const matchesProject = story.project === selectedProject;
      const matchesUser = selectedUserId === "all" || story.assignee?.id === selectedUserId;
      const matchesSprint = selectedSprint === "backlog" 
        ? !story.activeSprint || story.activeSprint === "backlog"
        : story.activeSprint === selectedSprint;
      return matchesWorkspace && matchesProject && matchesUser && matchesSprint;
    });
  }, [stories, selectedUserId, selectedSprint, selectedWorkspace, selectedProject]);

  // Organize stories by status - using useMemo to prevent infinite re-renders
  useEffect(() => {
    const organized = SPRINT_COLUMNS.reduce((acc, status) => {
      acc[status] = sprintStories.filter(story => story.status === status);
      return acc;
    }, {} as Record<string, StoryWithAssignee[]>);
    setColumns(organized);
  }, [sprintStories]);

  const onDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const startColumn = [...(columns[source.droppableId] || [])];
    const endColumn = source.droppableId === destination.droppableId
      ? startColumn
      : [...(columns[destination.droppableId] || [])];

    const [removed] = startColumn.splice(source.index, 1);

    if (source.droppableId === destination.droppableId) {
      startColumn.splice(destination.index, 0, removed);
    } else {
      endColumn.splice(destination.index, 0, removed);
    }

    const newColumns = {
      ...columns,
      [source.droppableId]: startColumn,
      [destination.droppableId]: endColumn,
    };
    setColumns(newColumns);

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
    return story.storyNumber || `${story.project || "T&D"}-0000`;
  };

  const canManageBoard = user?.role === "Admin" || user?.role === "Team Lead";

  // Calculate Sprint Velocity
  const calculateSprintVelocity = () => {
    if (!stories) return { currentVelocity: 0, avgVelocity: 0, completedPoints: 0, totalPoints: 0 };
    
    const currentSprintStories = stories.filter(story => story.activeSprint === selectedSprint);
    const completedStories = currentSprintStories.filter(story => story.status === 'Completed');
    const totalPoints = currentSprintStories.reduce((sum, story) => sum + (story.pointer || 0), 0);
    const completedPoints = completedStories.reduce((sum, story) => sum + (story.pointer || 0), 0);
    
    // Calculate average velocity from past sprints (simplified)
    const avgVelocity = completedPoints > 0 ? Math.round(completedPoints * 0.8) : 0;
    
    return {
      currentVelocity: completedPoints,
      avgVelocity,
      completedPoints,
      totalPoints
    };
  };

  // Calculate Burndown Data
  const calculateBurndownData = () => {
    if (!stories) return {
      totalPoints: 0,
      completedPoints: 0,
      remainingPoints: 0,
      progressPercentage: 0
    };
    
    const currentSprintStories = stories.filter(story => story.activeSprint === selectedSprint);
    const totalPoints = currentSprintStories.reduce((sum, story) => sum + (story.pointer || 0), 0);
    const completedPoints = currentSprintStories
      .filter(story => story.status === 'Completed')
      .reduce((sum, story) => sum + (story.pointer || 0), 0);
    
    const remainingPoints = totalPoints - completedPoints;
    
    return {
      totalPoints,
      completedPoints,
      remainingPoints,
      progressPercentage: totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0
    };
  };

  const getCurrentSprint = () => {
    return sprints.find(sprint => sprint.id === selectedSprint) || sprints[0];
  };

  const handleCreateNewTask = (columnStatus?: string) => {
    createStoryMutation.mutate(columnStatus || "Backlog");
  };

  const StoryCard = ({ story, index }: { story: StoryWithAssignee; index: number }) => {
    const PriorityIcon = PRIORITY_ICONS[story.priority as keyof typeof PRIORITY_ICONS];

    return (
      <Draggable draggableId={story.id} index={index}>
        {(provided, snapshot) => (
          <Card
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={cn(
              "mb-3 transition-all duration-200 hover:shadow-md border border-border/50 transform-gpu story-card",
              snapshot.isDragging && "rotate-1 shadow-lg border-primary/50 scale-105"
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
              className="p-4 hover:bg-muted/30 transition-colors cursor-pointer overflow-y-auto"
              onClick={(e) => {
                e.stopPropagation();
                onStoryClick?.(story.id);
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <Badge variant="outline" className="text-xs font-mono">
                  <Hash className="w-3 h-3 mr-1" />
                  {getStoryNumber(story)}
                </Badge>
                <div className="flex items-center space-x-1">
                  <PriorityIcon className="w-3 h-3" style={{ color: PRIORITY_COLORS[story.priority as keyof typeof PRIORITY_COLORS] }} />
                  <Badge
                    variant="secondary"
                    className="text-xs px-2 py-1"
                    style={{
                      backgroundColor: `${PRIORITY_COLORS[story.priority as keyof typeof PRIORITY_COLORS]}20`,
                      color: PRIORITY_COLORS[story.priority as keyof typeof PRIORITY_COLORS],
                    }}
                  >
                    {story.priority}
                  </Badge>
                </div>
              </div>

              {story.storyType && (
                <Badge variant="outline" className="text-xs px-2 py-0.5 mb-2">
                  {story.storyType}
                </Badge>
              )}

              <h5 className="font-medium text-foreground leading-tight hover:text-primary transition-colors mb-2">
                {story.title}
              </h5>

              {story.description && (
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {story.description}
                </p>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {story.pointer && (
                    <div className="flex items-center space-x-1">
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                      <span className="text-sm text-muted-foreground">{story.pointer}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-1">
                    <Paperclip className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">0</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {story.assignee && (
                    <div className="flex items-center space-x-1">
                      <Avatar className="w-7 h-7">
                        <AvatarFallback className="text-sm">
                          {getUserInitials(story.assignee.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-muted-foreground">{story.assignee.name}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-1">
                    <MessageCircle className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
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

  if (storiesLoading || usersLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-96" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6" style={{ zoom: "var(--page-zoom, 1)" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Target className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold text-foreground">Agile Story Board</h2>
          <div className="flex items-center space-x-2">
            <Badge 
              variant={getCurrentSprint().status === 'active' ? 'default' : 'secondary'} 
              className="text-sm"
            >
              {getCurrentSprint().name}
            </Badge>
            {getCurrentSprint().status === 'active' && (
              <Badge variant="outline" className="text-xs text-green-600">
                Active
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select Project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="T&D">T&D Project</SelectItem>
              <SelectItem value="ADMS">ADMS Project</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedSprint} onValueChange={setSelectedSprint}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select Sprint" />
            </SelectTrigger>
            <SelectContent>
              {sprints.map(sprint => (
                <SelectItem key={sprint.id} value={sprint.id}>
                  {sprint.name}
                  {sprint.status === 'active' && ' (Active)'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowVelocityChart(!showVelocityChart)}
          >
            <Activity className="w-4 h-4 mr-2" />
            Velocity
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowBurndownChart(!showBurndownChart)}
          >
            <Target className="w-4 h-4 mr-2" />
            Burndown
          </Button>

          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by User" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Team Members</SelectItem>
              {TEAM_MEMBERS[selectedWorkspace as keyof typeof TEAM_MEMBERS]?.map((member) => (
                <SelectItem key={member.id} value={member.id}>
                  {member.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Sprint Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-primary" />
              <div>
                <p className="text-sm font-medium">Total Stories</p>
                <p className="text-2xl font-bold">{sprintStories.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Star className="w-4 h-4 text-amber-500" />
              <div>
                <p className="text-sm font-medium">Story Points</p>
                <p className="text-2xl font-bold">
                  {sprintStories.reduce((total, story) => total + (story.pointer || 0), 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="w-4 h-4 text-green-500" />
              <div>
                <p className="text-sm font-medium">Completed</p>
                <p className="text-2xl font-bold">{columns["Completed"]?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium">In Progress</p>
                <p className="text-2xl font-bold">{columns["In Progress"]?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sprint Details and Goal */}
      <div className="mb-6 p-4 bg-card rounded-lg border">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-foreground mb-2">{getCurrentSprint().name}</h3>
            <p className="text-sm text-muted-foreground mb-3">{getCurrentSprint().goal}</p>
            {getCurrentSprint().startDate && getCurrentSprint().endDate && (
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(getCurrentSprint().startDate).toLocaleDateString()}</span>
                </div>
                <span>→</span>
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(getCurrentSprint().endDate).toLocaleDateString()}</span>
                </div>
              </div>
            )}
          </div>
          <Badge 
            variant={getCurrentSprint().status === 'active' ? 'default' : 'secondary'}
            className="capitalize"
          >
            {getCurrentSprint().status}
          </Badge>
        </div>
      </div>

      {/* Velocity Chart */}
      {showVelocityChart && (
        <div className="mb-6 p-4 bg-card rounded-lg border">
          <h3 className="font-semibold text-foreground mb-4 flex items-center">
            <Activity className="w-4 h-4 mr-2" />
            Sprint Velocity
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{calculateSprintVelocity().currentVelocity}</div>
              <div className="text-sm text-muted-foreground">Current Sprint Points</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{calculateSprintVelocity().avgVelocity}</div>
              <div className="text-sm text-muted-foreground">Average Velocity</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{calculateSprintVelocity().completedPoints}</div>
              <div className="text-sm text-muted-foreground">Points Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{calculateSprintVelocity().totalPoints}</div>
              <div className="text-sm text-muted-foreground">Total Sprint Points</div>
            </div>
          </div>
        </div>
      )}

      {/* Burndown Chart */}
      {showBurndownChart && (
        <div className="mb-6 p-4 bg-card rounded-lg border">
          <h3 className="font-semibold text-foreground mb-4 flex items-center">
            <Target className="w-4 h-4 mr-2" />
            Sprint Burndown
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{calculateBurndownData().totalPoints}</div>
                <div className="text-sm text-muted-foreground">Total Points</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{calculateBurndownData().completedPoints}</div>
                <div className="text-sm text-muted-foreground">Completed Points</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{calculateBurndownData().remainingPoints}</div>
                <div className="text-sm text-muted-foreground">Remaining Points</div>
              </div>
            </div>
            <div className="w-full bg-muted rounded-full h-3">
              <div 
                className="bg-primary h-3 rounded-full transition-all duration-500"
                style={{ width: `${calculateBurndownData().progressPercentage}%` }}
              ></div>
            </div>
            <div className="text-center text-sm text-muted-foreground">
              {calculateBurndownData().progressPercentage}% Complete
            </div>
          </div>
        </div>
      )}

      {/* Sprint Planning Controls */}
      {canManageBoard && (
        <div className="flex items-center justify-between mb-6 p-4 bg-muted/30 rounded-lg border">
          <div className="flex items-center space-x-4">
            <Button
              size="sm"
              className="flex items-center space-x-2"
              onClick={() => createStoryMutation.mutate("Backlog")}
            >
              <Plus className="w-4 h-4" />
              <span>Add User Story</span>
            </Button>
            <Badge variant="outline" className="text-sm">
              Sprint Planning Mode
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Sprint Settings
            </Button>
          </div>
        </div>
      )}

      {/* Sprint Board */}
      {sprintStories.length === 0 ? (
        <div className="text-center py-12">
          <Target className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No Stories in Sprint</h3>
          <p className="text-muted-foreground mb-4">
            {selectedUserId === "all"
              ? "Add user stories to start your sprint planning."
              : "The selected team member has no stories in this sprint."
            }
          </p>
          {canManageBoard && (
            <Button onClick={() => createStoryMutation.mutate("Backlog")}>
              <Plus className="w-4 h-4 mr-2" />
              Create First Story
            </Button>
          )}
        </div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex space-x-6 overflow-x-auto pb-6">
            {SPRINT_COLUMNS.map((columnName) => (
              <Droppable droppableId={columnName} key={columnName}>
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="flex-shrink-0 w-80"
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
                        <div className="text-xs text-muted-foreground">
                          {columns[columnName]?.reduce((total, story) => total + (story.pointer || 0), 0) || 0} story points
                        </div>
                      </div>

                      {/* Column Content */}
                      <div className="p-4 space-y-3 min-h-[400px] max-h-[calc(100vh-400px)] overflow-y-auto scrollbar-thin scrollbar-track-muted scrollbar-thumb-muted-foreground/30 hover:scrollbar-thumb-muted-foreground/50">
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
        </DragDropContext>
      )}
    </div>
  );
}