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
  currentEntity: string;
  currentChunk: number;
  totalChunks: number;
  entityIndex: number;
  totalEntities: number;
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