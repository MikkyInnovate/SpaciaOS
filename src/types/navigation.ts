export interface NavItem {
  title: string;
  href: string;
  iconName: string;
  badge?: string;
  isAvailable?: boolean;
}

export interface NavSection {
  label?: string;
  items: NavItem[];
}
