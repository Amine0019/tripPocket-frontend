import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AppNotification } from '../../../core/models/models';

@Component({
  selector: 'app-notification-item',
  standalone: true,
  templateUrl: './notification-item.component.html',
  styleUrl: './notification-item.component.scss'
})
export class NotificationItemComponent {
  @Input({ required: true }) item!: AppNotification;
  @Output() read = new EventEmitter<string>();
}
