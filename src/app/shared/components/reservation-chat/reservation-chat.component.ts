import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
  inject,
  signal
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BookingDraft, BookingDraftService } from '../../../core/services/booking-draft.service';
import { errorMessage, formatDay, paymentLabel, typeLabel } from '../../../core/services/reservation.mapper';
import { ReservationService } from '../../../core/services/reservation.service';
import { ReservationType } from '../../models/enums/reservation-type.enum';
import { BookingChatMessage, BookingChatState } from '../../models/reservation.model';

interface ChatBubble {
  role: 'user' | 'assistant';
  content: string;
  /** Greeting written by the page: never sent to the server. */
  local?: boolean;
  /** Form fields changed by this answer ("Hotel", "2 travelers"...). */
  applied?: string[];
  warning?: string | null;
  ready?: boolean;
  error?: boolean;
}

const EMPTY_STATE: BookingChatState = {
  type: null,
  travelers: null,
  reservationDate: null,
  paymentMethod: null,
  price: null,
  notes: null
};

const MAX_HISTORY = 12;
const MAX_LENGTH = 300;

/**
 * Booking assistant shown from the first step of the booking page.
 * Each answer pre-fills the booking form (BookingDraftService); nothing is saved:
 * the traveler still reviews and confirms the reservation.
 */
@Component({
  selector: 'app-reservation-chat',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './reservation-chat.component.html',
  styleUrl: './reservation-chat.component.scss'
})
export class ReservationChatComponent implements OnChanges {
  private readonly reservationService = inject(ReservationService);
  private readonly booking = inject(BookingDraftService);

  @Input({ required: true }) tripId!: string;
  @Input() tripTitle = '';
  @Input() firstName = '';
  /** When set, the chat is read-only (demo trip, closed trip...). */
  @Input() disabledReason: string | null = null;
  /** The traveler wants to check the filled form. */
  @Output() review = new EventEmitter<void>();

  @ViewChild('scroller') private scroller?: ElementRef<HTMLElement>;

  readonly maxLength = MAX_LENGTH;
  readonly messages = signal<ChatBubble[]>([]);
  readonly input = signal('');
  readonly sending = signal(false);
  readonly suggestions = signal<string[]>([]);
  readonly aiOffline = signal(false);
  private state: BookingChatState = { ...EMPTY_STATE };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tripId']) {
      this.restart();
    }
  }

  restart(): void {
    this.state = { ...EMPTY_STATE };
    this.aiOffline.set(false);
    this.input.set('');
    this.suggestions.set(['The whole trip for 2', 'A hotel on day 2 for 2 people', 'Dinner for 2 on day 3', 'An activity on day 1']);
    const name = this.firstName ? ` ${this.firstName}` : '';
    this.messages.set([{
      role: 'assistant',
      local: true,
      content: `Hi${name}! I'm your booking assistant${this.tripTitle ? ' for ' + this.tripTitle : ''}. `
        + 'Tell me what you would like to book — the whole trip, a hotel, a restaurant, an activity… '
        + 'I fill in the form for you, and you confirm at the end.'
    }]);
  }

  send(text?: string): void {
    const content = (text ?? this.input()).trim().slice(0, MAX_LENGTH);
    if (!content || this.sending() || this.disabledReason) return;

    this.push({ role: 'user', content });
    this.input.set('');
    this.suggestions.set([]);
    this.sending.set(true);

    const history: BookingChatMessage[] = this.messages()
      .filter((m) => !m.local && !m.error)
      .map((m) => ({ role: m.role, content: m.content.slice(0, 600) }))
      .slice(-MAX_HISTORY);

    this.reservationService.chat({ tripId: Number(this.tripId), messages: history, booking: this.state }).subscribe({
      next: (answer) => {
        this.sending.set(false);
        this.aiOffline.set(!answer.aiAvailable);
        const applied = this.apply(answer.booking);
        this.state = answer.booking;
        this.suggestions.set(answer.suggestions ?? []);
        this.push({ role: 'assistant', content: answer.reply, applied, warning: answer.warning, ready: answer.ready });
      },
      error: (err: unknown) => {
        this.sending.set(false);
        this.push({
          role: 'assistant',
          error: true,
          content: errorMessage(err, 'I could not reach the assistant. You can still fill in the form step by step.')
        });
      }
    });
  }

  /** Copies the assistant's fields into the booking form and returns what changed. */
  private apply(next: BookingChatState): string[] {
    const before = this.state;
    const patch: Partial<BookingDraft> = {};
    const changed: string[] = [];

    if (next.type) {
      patch.reservationType = next.type;
      if (next.type !== before.type) changed.push(typeLabel(next.type));
    }
    if (next.travelers) {
      patch.travelers = next.travelers;
      if (next.travelers !== before.travelers) changed.push(`${next.travelers} traveler${next.travelers > 1 ? 's' : ''}`);
    }
    if (next.type === ReservationType.TRIP) {
      patch.reservationDate = '';
      patch.amount = null;
    } else {
      if (next.reservationDate) {
        patch.reservationDate = next.reservationDate;
        if (next.reservationDate !== before.reservationDate) changed.push(formatDay(next.reservationDate, false));
      }
      if (next.price != null) {
        patch.amount = next.price;
        if (next.price !== before.price) changed.push(`$${Math.round(next.price)}`);
      }
    }
    if (next.paymentMethod) {
      patch.paymentMethod = next.paymentMethod;
      if (next.paymentMethod !== before.paymentMethod) changed.push(paymentLabel(next.paymentMethod));
    }
    if (next.notes) {
      patch.notes = next.notes;
      if (next.notes !== before.notes) changed.push('Notes');
    }
    if (Object.keys(patch).length) {
      this.booking.patch(patch);
    }
    return changed;
  }

  private push(bubble: ChatBubble): void {
    this.messages.update((list) => [...list, bubble]);
    // wait for Angular to render the new bubble, then show the end of the conversation
    const toBottom = (behavior: ScrollBehavior) => {
      const el = this.scroller?.nativeElement;
      el?.scrollTo({ top: el.scrollHeight, behavior });
    };
    setTimeout(() => requestAnimationFrame(() => toBottom('smooth')), 30);
    setTimeout(() => toBottom('auto'), 450);
  }
}
