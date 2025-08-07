import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { LayoutDashboard, FolderKanban, ListTodo, Users, Settings } from "lucide-react";
import Link from "next/link";

export function MainNav() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <Link href="/">
          <SidebarMenuButton isActive>
            <LayoutDashboard />
            Dashboard
          </SidebarMenuButton>
        </Link>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <Link href="#">
          <SidebarMenuButton>
            <FolderKanban />
            Projects
          </SidebarMenuButton>
        </Link>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <Link href="#">
          <SidebarMenuButton>
            <ListTodo />
            Tasks
          </SidebarMenuButton>
        </Link>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <Link href="#">
          <SidebarMenuButton>
            <Users />
            Teams
          </SidebarMenuButton>
        </Link>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <Link href="#">
          <SidebarMenuButton>
            <Settings />
            Settings
          </SidebarMenuButton>
        </Link>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
