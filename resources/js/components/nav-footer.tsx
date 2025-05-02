import { SidebarGroup, SidebarContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { Link } from '@inertiajs/react';

export default function NavFooter({ items }: { items: Array<{ title: string; href: string; icon: string }> }) {
  return (
    <SidebarGroup className="mt-auto">
      <SidebarContent>
        <SidebarMenu>
          {items.map((item, index) => (
            <SidebarMenuItem key={index}>
              <SidebarMenuButton asChild>
                <Link href={item.href}>
                  <i className={item.icon}></i>
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </SidebarGroup>
  );
}