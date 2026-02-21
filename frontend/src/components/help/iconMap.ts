import {
  Rocket,
  BookOpen,
  Code,
  Plug,
  Shield,
  HelpCircle,
  FileText,
  Search,
  Settings,
  Users,
  BarChart3,
  Zap,
  Globe,
  Lock,
  type LucideIcon,
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  Rocket,
  BookOpen,
  Code,
  Plug,
  Shield,
  HelpCircle,
  FileText,
  Search,
  Settings,
  Users,
  BarChart3,
  Zap,
  Globe,
  Lock,
};

export function getIcon(name: string): LucideIcon {
  return iconMap[name] || HelpCircle;
}

export default iconMap;
