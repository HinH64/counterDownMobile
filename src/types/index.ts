export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
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
