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

export interface TimelineResult {
  events: TimelineEvent[];
  wikiSources: string[]; // List of Wikipedia article titles used
}

export interface ProgressInfo {
  completedTasks: number;
  totalTasks: number;
  phase: 'fetching_wiki' | 'extracting_events';
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