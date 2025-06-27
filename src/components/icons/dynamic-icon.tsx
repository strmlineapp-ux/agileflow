
import { Users, Clapperboard, Video, Megaphone, Briefcase, Bot } from 'lucide-react';
import type { LucideProps } from 'lucide-react';

const iconMap = {
  Users,
  Clapperboard,
  Video,
  Megaphone,
  Briefcase,
  Bot,
};

export type IconName = keyof typeof iconMap;

export const iconNames = Object.keys(iconMap) as IconName[];

export function DynamicIcon({ name, ...props }: { name: IconName } & LucideProps) {
  const IconComponent = iconMap[name];
  if (!IconComponent) {
    return <Users {...props} />; // Default icon
  }
  return <IconComponent {...props} />;
}
