import { Component } from '@angular/core';
import { UserFormComponent } from './components/user-form/user-form';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [UserFormComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class AppComponent {
  title = 'formulario-animado';
}
