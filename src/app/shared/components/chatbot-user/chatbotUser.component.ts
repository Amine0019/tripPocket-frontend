import { CommonModule } from '@angular/common';
import { AfterViewChecked, Component, ElementRef, inject, signal, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChatbotUserMessage, ChatbotUserRequest } from '../../../core/models/chatbotUser.model';
import { ChatbotUserService } from '../../../core/services/chatbotUser.service';

@Component({
  selector: 'app-chatbot-user',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbotUser.component.html',
  styleUrl: './chatbotUser.component.scss'
})
export class ChatbotUserComponent implements AfterViewChecked {
  private readonly chatbotUserService = inject(ChatbotUserService);

  @ViewChild('messagesContainer') private messagesContainer?: ElementRef<HTMLDivElement>;
  @ViewChild('messageInput') private messageInput?: ElementRef<HTMLTextAreaElement>;

  // ── State ────────────────────────────────────────────────────────
  readonly isOpen = signal(false);
  readonly isGenerating = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly messages = signal<ChatbotUserMessage[]>([]);
  userInput = '';

  private shouldScrollToBottom = false;

  readonly quickSuggestions: string[] = [
    'Quels types de voyages propose TripPocket ?',
    'Comment suivre et gérer mon budget de voyage ?',
    'Conseils pratiques pour préparer ma valise',
    'Explique-moi les fonctionnalités de l’application'
  ];

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  toggleChat(): void {
    const nextState = !this.isOpen();
    this.isOpen.set(nextState);
    if (nextState) {
      this.shouldScrollToBottom = true;
      setTimeout(() => this.focusInput(), 150);
    }
  }

  closeChat(): void {
    this.isOpen.set(false);
  }

  newConversation(): void {
    if (this.isGenerating()) return;
    this.messages.set([]);
    this.errorMessage.set(null);
    this.userInput = '';
    setTimeout(() => this.focusInput(), 100);
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  sendSuggestion(suggestion: string): void {
    if (this.isGenerating()) return;
    this.userInput = suggestion;
    this.sendMessage();
  }

  sendMessage(): void {
    const text = this.userInput.trim();
    if (!text || this.isGenerating()) return;

    this.errorMessage.set(null);

    // 1. Add user message
    const userMsg: ChatbotUserMessage = {
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const currentList = [...this.messages(), userMsg];
    this.messages.set(currentList);
    this.userInput = '';
    this.isGenerating.set(true);
    this.shouldScrollToBottom = true;

    // 2. Prepare payload with conversation history
    const historyPayload = currentList.slice(0, -1).map((m) => ({
      role: m.role,
      content: m.content
    }));

    const payload: ChatbotUserRequest = {
      message: text,
      history: historyPayload
    };

    // 3. Call backend service
    this.chatbotUserService.sendMessage(payload).subscribe({
      next: (res) => {
        const assistantMsg: ChatbotUserMessage = {
          role: 'model',
          content: res.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        this.messages.update((list) => [...list, assistantMsg]);
        this.isGenerating.set(false);
        this.shouldScrollToBottom = true;
        setTimeout(() => this.focusInput(), 100);
      },
      error: (err) => {
        let msg = 'Une erreur est survenue lors de l’envoi. Veuillez réessayer.';
        if (err.status === 503) {
          msg = err.error?.message || 'Le service IA n’est pas configuré ou la clé API est manquante.';
        } else if (err.status === 429) {
          msg = 'Limite de requêtes atteinte. Merci de patienter quelques secondes.';
        } else if (err.status === 504 || err.status === 0) {
          msg = 'Impossible de joindre le serveur. Vérifiez votre connexion.';
        } else if (err.error?.message) {
          msg = err.error.message;
        }

        this.errorMessage.set(msg);
        this.isGenerating.set(false);
        this.shouldScrollToBottom = true;
      }
    });
  }

  retryLastMessage(): void {
    const list = this.messages();
    if (list.length === 0) return;

    let lastUserIndex = -1;
    for (let i = list.length - 1; i >= 0; i--) {
      if (list[i].role === 'user') {
        lastUserIndex = i;
        break;
      }
    }

    if (lastUserIndex >= 0) {
      const lastUserMsg = list[lastUserIndex];
      // remove any trailing messages from lastUserIndex
      this.messages.set(list.slice(0, lastUserIndex));
      this.userInput = lastUserMsg.content;
      this.sendMessage();
    }
  }

  formatMessageText(content: string): string {
    if (!content) return '';
    // Basic safe markdown-like formatting (bold, newlines)
    let formatted = content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n\n/g, '<br><br>')
      .replace(/\n/g, '<br>');

    return formatted;
  }

  private scrollToBottom(): void {
    try {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
      }
    } catch {
      // ignore
    }
  }

  private focusInput(): void {
    try {
      this.messageInput?.nativeElement.focus();
    } catch {
      // ignore
    }
  }
}
