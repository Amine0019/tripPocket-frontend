import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ChatbotUserRequest, ChatbotUserResponse } from '../models/chatbotUser.model';

@Injectable({
  providedIn: 'root'
})
export class ChatbotUserService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/chatbot-user/chat`;

  sendMessage(payload: ChatbotUserRequest): Observable<ChatbotUserResponse> {
    return this.http.post<ChatbotUserResponse>(this.apiUrl, payload);
  }
}
