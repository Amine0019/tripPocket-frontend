import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SearchQuery } from '../../../core/models/models';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './search-bar.component.html',
  styleUrl: './search-bar.component.scss'
})
export class SearchBarComponent {
  @Input() query: SearchQuery = {
    destination: '',
    dates: 'May 18 – May 25',
    travelers: 2,
    budget: '$500 – $2,000'
  };
  @Input() compact = false;
  @Output() search = new EventEmitter<SearchQuery>();

  submit(): void {
    this.search.emit(this.query);
  }
}
