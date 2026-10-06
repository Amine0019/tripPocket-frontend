import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Destination } from '../../../core/models/models';

@Component({
  selector: 'app-destination-card',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './destination-card.component.html',
  styleUrl: './destination-card.component.scss'
})
export class DestinationCardComponent {
  @Input({ required: true }) destination!: Destination;
}
