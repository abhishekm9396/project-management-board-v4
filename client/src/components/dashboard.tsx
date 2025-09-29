import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ClipboardList,
  CheckCircle,
  Star,
  Users,
  ArrowUp,
  ArrowDown,
  TrendingUp,
  MessageCircle,
  Plus
} from "lucide-react";
import { useEffect, useRef } from "react";



interface DashboardMetrics {
  totalStories: number;
  completed: number;
  totalPoints: number;
  teamMembers: number;
  storiesByStatus: Record<string, number>;
  storiesByPriority: Record<string, number>;
}

export function Dashboard({ onStoryClick }: { onStoryClick: (storyId: string) => void }) { // Added onStoryClick prop
  const chartRefs = {
    completion: useRef<HTMLCanvasElement>(null),
    priority: useRef<HTMLCanvasElement>(null),
  };

  const { data: metrics, isLoading } = useQuery<DashboardMetrics>({
    queryKey: ["/api/dashboard/metrics"],
  });

  // Initialize charts when data is available
  useEffect(() => {
    if (!metrics || !(window as any).Chart) return;

    // Completion Trend Chart
    const completionCtx = chartRefs.completion.current;
    if (completionCtx) {
      const completionChart = new (window as any).Chart(completionCtx, {
        type: 'line',
        data: {
          labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
          datasets: [{
            label: 'Completed Stories',
            data: [4, 7, 12, metrics.completed],
            borderColor: 'hsl(173 58% 39%)',
            backgroundColor: 'hsl(173 58% 39% / 0.1)',
            tension: 0.4,
            fill: true,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                color: 'hsl(214.3 31.8% 91.4%)',
              },
              ticks: {
                color: 'hsl(215.4 16.3% 46.9%)',
              }
            },
            x: {
              grid: {
                color: 'hsl(214.3 31.8% 91.4%)',
              },
              ticks: {
                color: 'hsl(215.4 16.3% 46.9%)',
              }
            }
          }
        }
      });

      return () => completionChart.destroy();
    }
  }, [metrics]);

  useEffect(() => {
    if (!metrics || !(window as any).Chart) return;

    // Priority Distribution Chart
    const priorityCtx = chartRefs.priority.current;
    if (priorityCtx) {
      const priorityChart = new (window as any).Chart(priorityCtx, {
        type: 'doughnut',
        data: {
          labels: ['High', 'Medium', 'Low'],
          datasets: [{
            data: [
              metrics.storiesByPriority.High || 0,
              metrics.storiesByPriority.Medium || 0,
              metrics.storiesByPriority.Low || 0,
            ],
            backgroundColor: [
              'hsl(0 84.2% 60.2%)',
              'hsl(43 74% 66%)',
              'hsl(197 37% 24%)'
            ],
            borderWidth: 2,
            borderColor: 'hsl(0 0% 100%)',
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                color: 'hsl(215.4 16.3% 46.9%)',
                padding: 20,
              }
            }
          }
        }
      });

      return () => priorityChart.destroy();
    }
  }, [metrics]);

  const MetricCard = ({
    title,
    value,
    icon: Icon,
    change,
    changeType
  }: {
    title: string;
    value: string | number;
    icon: React.ElementType;
    change: string;
    changeType: 'up' | 'down';
  }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold text-foreground" data-testid={`metric-${title.toLowerCase().replace(' ', '-')}`}>
              {value}
            </p>
          </div>
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
            <Icon className="w-6 h-6 text-primary" />
          </div>
        </div>
        <div className="mt-4 flex items-center space-x-1">
          {changeType === 'up' ? (
            <ArrowUp className="w-4 h-4 text-green-500" />
          ) : (
            <ArrowDown className="w-4 h-4 text-red-500" />
          )}
          <span className={`text-sm ${changeType === 'up' ? 'text-green-500' : 'text-red-500'}`}>
            {change}
          </span>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16 mb-4" />
                <Skeleton className="h-4 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">Failed to load dashboard metrics</p>
      </div>
    );
  }

  return (
    <div className="flex-1 h-full overflow-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
      <div className="min-w-full p-6 space-y-8">
        {/* Dashboard Header */}
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Project Dashboard</h1>
          <p className="text-muted-foreground">
            Track your team's progress and project metrics
          </p>
        </div>

        {/* Key Metrics Summary */}
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-6 h-6 text-primary" />
              <span>Project Summary</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">{metrics?.totalStories || 0}</p>
              <p className="text-sm text-muted-foreground">Total Stories</p>
              <p className="text-xs text-green-600">+12% from last week</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{metrics?.completed || 0}</p>
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-xs text-green-600">+8% completion rate</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-orange-600">{metrics?.totalPoints || 0}</p>
              <p className="text-sm text-muted-foreground">Story Points</p>
              <p className="text-xs text-red-600">-3% from target</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">{metrics?.teamMembers || 0}</p>
              <p className="text-sm text-muted-foreground">Team Members</p>
              <p className="text-xs text-green-600">+1 this month</p>
            </div>
          </CardContent>
        </Card>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 min-w-fit">
          <MetricCard
            title="Total Stories"
            value={metrics.totalStories}
            icon={ClipboardList}
            change="+12% from last week"
            changeType="up"
          />
          <MetricCard
            title="Completed"
            value={metrics.completed}
            icon={CheckCircle}
            change="+8% from last week"
            changeType="up"
          />
          <MetricCard
            title="Total Points"
            value={metrics.totalPoints}
            icon={Star}
            change="-3% from last week"
            changeType="down"
          />
          <MetricCard
            title="Team Members"
            value={metrics.teamMembers}
            icon={Users}
            change="+1 this month"
            changeType="up"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-w-fit">
          <Card className="min-w-[400px]">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5" />
                <span>Story Completion Trend</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80 w-full">
                <canvas ref={chartRefs.completion} data-testid="chart-completion"></canvas>
              </div>
            </CardContent>
          </Card>

          <Card className="min-w-[400px]">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Star className="w-5 h-5" />
                <span>Priority Distribution</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80 w-full">
                <canvas ref={chartRefs.priority} data-testid="chart-priority"></canvas>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status Distribution Chart */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <ClipboardList className="w-5 h-5" />
              <span>Story Status Overview</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.entries(metrics?.storiesByStatus || {}).map(([status, count]) => (
                <div key={status} className="text-center p-4 bg-muted/30 rounded-lg">
                  <div className="text-2xl font-bold text-foreground">{count}</div>
                  <div className="text-sm text-muted-foreground">{status}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Team Performance Analysis */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-primary" />
              <span>Team Performance Analysis</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="text-2xl font-bold text-green-600 mb-2">85%</div>
                <div className="text-sm text-muted-foreground">Sprint Completion Rate</div>
                <div className="text-xs text-green-600 mt-1">+12% from last sprint</div>
              </div>
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 mb-2">4.2</div>
                <div className="text-sm text-muted-foreground">Avg Story Points/Day</div>
                <div className="text-xs text-blue-600 mt-1">Above target</div>
              </div>
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="text-2xl font-bold text-orange-600 mb-2">2.3</div>
                <div className="text-sm text-muted-foreground">Avg Cycle Time (days)</div>
                <div className="text-xs text-green-600 mt-1">-0.5 days improved</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Project Health Summary */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <span>Project Health Summary</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <div className="font-medium text-green-800 dark:text-green-200">On Track</div>
                    <div className="text-sm text-green-600 dark:text-green-400">Sprint goals are being met</div>
                  </div>
                </div>
                <div className="text-2xl font-bold text-green-600">✓</div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-center space-x-3">
                  <ArrowUp className="w-5 h-5 text-yellow-600" />
                  <div>
                    <div className="font-medium text-yellow-800 dark:text-yellow-200">High Priority Items</div>
                    <div className="text-sm text-yellow-600 dark:text-yellow-400">3 high-priority stories need attention</div>
                  </div>
                </div>
                <div className="text-lg font-bold text-yellow-600">3</div>
              </div>

              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center space-x-3">
                  <Star className="w-5 h-5 text-blue-600" />
                  <div>
                    <div className="font-medium text-blue-800 dark:text-blue-200">Velocity Trend</div>
                    <div className="text-sm text-blue-600 dark:text-blue-400">Team velocity is increasing</div>
                  </div>
                </div>
                <div className="text-lg font-bold text-blue-600">↗</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageCircle className="w-5 h-5" />
              <span>Recent Activity</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3" data-testid="activity-item-1">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">
                    <span className="font-medium">Admin User</span> completed story{" "}
                    <span className="font-medium">"Project Setup"</span>
                  </p>
                  <p className="text-xs text-muted-foreground">2 hours ago</p>
                </div>
              </div>

              <div className="flex items-start space-x-3" data-testid="activity-item-2">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">
                    <span className="font-medium">Team Lead</span> commented on{" "}
                    <span className="font-medium">"Setup Authentication System"</span>
                  </p>
                  <p className="text-xs text-muted-foreground">4 hours ago</p>
                </div>
              </div>

              <div className="flex items-start space-x-3" data-testid="activity-item-3">
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Plus className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">
                    <span className="font-medium">Regular User</span> created new story{" "}
                    <span className="font-medium">"Implement AI Estimation"</span>
                  </p>
                  <p className="text-xs text-muted-foreground">1 day ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Load Chart.js */}
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
      </div>
    </div>
  );
}