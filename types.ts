export interface TimelineEvent {
  year: number;
  displayDate: string;
  title: string;
  description: string;
  entity: string;
}

export interface TimelineResponse {
  events: TimelineEvent[];
}

export interface EntityColor {
  bg: string;
  text: string;
  border: string;
  pill: string;
}

export interface EntityConfig {
  name: string;
  color: EntityColor;
  isVisible: boolean;
}