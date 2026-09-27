export interface FAQItem {
  id: string;
  question: string;
  bullets: string[];
  tags?: string[];
  badge?: string;
}

export interface FAQSection {
  id: string;
  title: string;
  iconName?: string;
  description?: string;
  items: FAQItem[];
}
