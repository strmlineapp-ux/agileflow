import { FolderKanban, GanttChartSquare, Landmark, Users } from "lucide-react";
import Image from "next/image";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { SidebarProvider, Sidebar, SidebarInset, SidebarHeader, SidebarContent, SidebarFooter } from "@/components/ui/sidebar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AppLogo } from "@/components/app-logo";
import { MainNav } from "@/components/main-nav";
import { DashboardHeader } from "@/components/dashboard-header";
import { TasksOverviewChart } from "@/components/tasks-overview-chart";

export default function Dashboard() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <Sidebar>
          <SidebarHeader>
            <AppLogo />
          </SidebarHeader>
          <SidebarContent>
            <MainNav />
          </SidebarContent>
          <SidebarFooter>
            <Card>
              <CardHeader className="p-4">
                <CardTitle>Upgrade to Pro</CardTitle>
                <CardDescription>
                  Unlock all features and get unlimited access to our support
                  team.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <Button size="sm" className="w-full">
                  Upgrade
                </Button>
              </CardContent>
            </Card>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <DashboardHeader />
          <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Revenue
                  </CardTitle>
                  <Landmark className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">$45,231.89</div>
                  <p className="text-xs text-muted-foreground">
                    +20.1% from last month
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Active Projects
                  </CardTitle>
                  <FolderKanban className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">+23</div>
                  <p className="text-xs text-muted-foreground">
                    +5 since last week
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Team Members</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">+12</div>
                  <p className="text-xs text-muted-foreground">
                    +2 new members this month
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Pending Tasks
                  </CardTitle>
                  <GanttChartSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">57</div>
                  <p className="text-xs text-muted-foreground">
                    10 overdue
                  </p>
                </CardContent>
              </Card>
            </div>
            <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
              <Card className="xl:col-span-2">
                <CardHeader>
                  <CardTitle>Recent Projects</CardTitle>
                  <CardDescription>
                    An overview of the most recently updated projects.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Project</TableHead>
                        <TableHead className="hidden sm:table-cell">Team</TableHead>
                        <TableHead className="hidden md:table-cell">Status</TableHead>
                        <TableHead className="text-right">Progress</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>
                          <div className="font-medium">Website Redesign</div>
                          <div className="hidden text-sm text-muted-foreground md:inline">
                            Marketing Team
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <div className="flex -space-x-2 relative">
                             <Image data-ai-hint="woman smiling" src="https://placehold.co/32x32.png" alt="Avatar" width={32} height={32} className="rounded-full border-2 border-card" />
                             <Image data-ai-hint="man portrait" src="https://placehold.co/32x32.png" alt="Avatar" width={32} height={32} className="rounded-full border-2 border-card" />
                             <Image data-ai-hint="woman portrait" src="https://placehold.co/32x32.png" alt="Avatar" width={32} height={32} className="rounded-full border-2 border-card" />
                           </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant="outline">In Progress</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="w-24">
                            <Progress value={75} className="h-2" />
                            <span className="text-xs text-muted-foreground">75%</span>
                          </div>
                        </TableCell>
                      </TableRow>
                       <TableRow>
                        <TableCell>
                          <div className="font-medium">Mobile App Launch</div>
                          <div className="hidden text-sm text-muted-foreground md:inline">
                            Engineering Team
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <div className="flex -space-x-2 relative">
                             <Image data-ai-hint="man smiling" src="https://placehold.co/32x32.png" alt="Avatar" width={32} height={32} className="rounded-full border-2 border-card" />
                             <Image data-ai-hint="woman smiling" src="https://placehold.co/32x32.png" alt="Avatar" width={32} height={32} className="rounded-full border-2 border-card" />
                           </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant="outline">On Track</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                           <div className="w-24">
                            <Progress value={90} className="h-2" />
                            <span className="text-xs text-muted-foreground">90%</span>
                          </div>
                        </TableCell>
                      </TableRow>
                       <TableRow>
                        <TableCell>
                          <div className="font-medium">Q3 Marketing Campaign</div>
                          <div className="hidden text-sm text-muted-foreground md:inline">
                            Marketing Team
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <div className="flex -space-x-2 relative">
                             <Image data-ai-hint="woman glasses" src="https://placehold.co/32x32.png" alt="Avatar" width={32} height={32} className="rounded-full border-2 border-card" />
                             <Image data-ai-hint="man smiling" src="https://placehold.co/32x32.png" alt="Avatar" width={32} height={32} className="rounded-full border-2 border-card" />
                           </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                           <Badge variant="destructive">At Risk</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                           <div className="w-24">
                            <Progress value={35} className="h-2" />
                            <span className="text-xs text-muted-foreground">35%</span>
                          </div>
                        </TableCell>
                      </TableRow>
                        <TableRow>
                        <TableCell>
                          <div className="font-medium">New Feature Integration</div>
                          <div className="hidden text-sm text-muted-foreground md:inline">
                            Product Team
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <div className="flex -space-x-2 relative">
                             <Image data-ai-hint="man portrait" src="https://placehold.co/32x32.png" alt="Avatar" width={32} height={32} className="rounded-full border-2 border-card" />
                             <Image data-ai-hint="woman professional" src="https://placehold.co/32x32.png" alt="Avatar" width={32} height={32} className="rounded-full border-2 border-card" />
                             <Image data-ai-hint="man smiling" src="https://placehold.co/32x32.png" alt="Avatar" width={32} height={32} className="rounded-full border-2 border-card" />
                             <Image data-ai-hint="woman smiling" src="https://placehold.co/32x32.png" alt="Avatar" width={32} height={32} className="rounded-full border-2 border-card" />
                           </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                           <Badge variant="outline">Completed</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                           <div className="w-24">
                            <Progress value={100} className="h-2" />
                            <span className="text-xs text-muted-foreground">100%</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Tasks Overview</CardTitle>
                  <CardDescription>January - June 2024</CardDescription>
                </CardHeader>
                <CardContent>
                  <TasksOverviewChart />
                </CardContent>
              </Card>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
