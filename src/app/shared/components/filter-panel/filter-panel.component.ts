import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

export interface FilterState {
  destination: string;
  category: string;
  price: string;
  duration: string;
  status: string;
  sort: string;
}

@Component({
  selector: 'app-filter-panel',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './filter-panel.component.html',
  styleUrl: './filter-panel.component.scss'
})
export class FilterPanelComponent {
  @Input() open = false;
  @Input() filters: FilterState = {
    destination: '',
    category: '',
    price: '',
    duration: '',
    status: '',
    sort: 'recommended'
  };
  @Output() filtersChange = new EventEmitter<FilterState>();
  @Output() closed = new EventEmitter<void>();

  apply(): void {
    this.filtersChange.emit(this.filters);
    this.closed.emit();
  }
}
