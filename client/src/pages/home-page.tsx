import { useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { Dashboard } from "@/components/dashboard";
import { KanbanBoard } from "@/components/kanban-board";
import { AgileStoryBoard } from "@/components/agile-story-board";
import { StoryModal } from "@/components/story-modal";
import { CommentsSidebar } from "@/components/comments-sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Menu, Search, Plus } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { StoryEditModal } from "@/components/story-edit-modal";

export default function HomePage() {
  const [activeView, setActiveView] = useState<"dashboard" | "kanban" | "sprint">("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedStoryId, setSelectedStoryId] = useState<string | null>(null);
  const [showCreateStory, setShowCreateStory] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const { user } = useAuth();

  const handleStoryClick = (storyId: string) => {
    setSelectedStoryId(storyId);
  };

  const handleCreateStory = () => {
    setShowCreateStory(true);
  };

  const getActiveViewTitle = () => {
    switch (activeView) {
      case "dashboard": return "Project Dashboard";
      case "kanban": return "Kanban Board";
      case "sprint": return "Agile Story Board";
      default: return "Dashboard";
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <Sidebar 
        open={sidebarOpen} 
        onOpenChange={setSidebarOpen}
        activeView={activeView}
        onViewChange={setActiveView}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation */}
        <header className="border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
          <div className="flex items-center justify-between px-6 py-3">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </Button>

              <div>
                <h1 className="text-xl font-semibold text-foreground">
                  {getActiveViewTitle()}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Welcome back, {user?.name}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Global Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search stories, tasks..."
                  className="w-64 pl-10"
                />
              </div>

              {/* Quick Actions */}
              {user?.role === "Admin" || user?.role === "Team Lead" ? (
                <Button size="sm" onClick={handleCreateStory}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Story
                </Button>
              ) : null}
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-hidden">
          {activeView === "dashboard" && (
            <Dashboard onStoryClick={handleStoryClick} />
          )}
          {activeView === "kanban" && (
            <KanbanBoard 
              onStoryClick={handleStoryClick}
              onCreateStory={handleCreateStory}
            />
          )}
          {activeView === "sprint" && (
            <AgileStoryBoard 
              onStoryClick={handleStoryClick}
              onCreateStory={handleCreateStory}
            />
          )}
        </main>
      </div>

      {/* Story Details Modal (using StoryEditModal for editing) */}
      {selectedStoryId && (
        <StoryEditModal
          storyId={selectedStoryId}
          open={!!selectedStoryId}
          onClose={() => setSelectedStoryId(null)}
          onCommentsToggle={() => setCommentsOpen(!commentsOpen)}
          mode="edit"
        />
      )}

      {/* Create Story Modal */}
      {showCreateStory && (
        <StoryEditModal
          open={showCreateStory}
          onClose={() => setShowCreateStory(false)}
          mode="create"
        />
      )}

      {/* Comments Sidebar */}
      {selectedStoryId && (
        <CommentsSidebar
          storyId={selectedStoryId}
          open={commentsOpen}
          onClose={() => setCommentsOpen(false)}
        />
      )}
    </div>
  );
}