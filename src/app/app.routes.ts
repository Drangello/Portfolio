import { Routes } from '@angular/router';
import { Landing } from './pages/landing/landing';

export const routes: Routes = [
	{ path: '', component: Landing },
	{
		path: 'impressum',
		loadComponent: () => import('./pages/legal/impressum/impressum').then((component) => component.Impressum),
	},
	{
		path: 'datenschutz',
		loadComponent: () => import('./pages/legal/datenschutz/datenschutz').then((component) => component.Datenschutz),
	},
	{ path: '**', redirectTo: '' }
];
