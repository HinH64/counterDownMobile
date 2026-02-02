// Predefined color palette for task markers
export const TASK_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#FFE66D', // Yellow
  '#95E1D3', // Mint
  '#F38181', // Coral
  '#AA96DA', // Purple
  '#FCBAD3', // Pink
  '#A8D8EA', // Light Blue
] as const;

export type TaskColor = typeof TASK_COLORS[number];

export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
  dueDate?: number | null;  // Optional due date timestamp
  color?: TaskColor;        // Color for the marker on the circle
}

export interface CountdownData {
  targetDate: number | null;
  title: string;
  todos: Todo[];
}

export interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}
