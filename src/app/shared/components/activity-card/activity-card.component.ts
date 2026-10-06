import { CurrencyPipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Activity } from '../../../core/models/models';

@Component({
  selector: 'app-activity-card',
  standalone: true,
  imports: [RouterLink, CurrencyPipe],
  templateUrl: './activity-card.component.html',
  styleUrl: './activity-card.component.scss'
})
export class ActivityCardComponent {
  @Input({ required: true }) activity!: Activity;
}
