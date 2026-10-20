export interface ChatbotUserMessage {
  role: 'user' | 'model';
  content: string;
  timestamp?: string;
  isError?: boolean;
}

export interface ChatbotUserRequest {
  message: string;
  history?: {
    role: string;
    content: string;
  }[];
}

export interface ChatbotUserResponse {
  reply: string;
  timestamp: string;
}
