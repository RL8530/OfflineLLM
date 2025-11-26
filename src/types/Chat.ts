export interface ChatMessage {
  id: string;
  text: string;
  sender: "user" | "ai" | "system";
  timestamp: Date;
  modelId?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  modelId: string;
  createdAt: Date;
  updatedAt: Date;
}
