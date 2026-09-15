import { Routes } from '@angular/router';
import { Landing } from './pages/landing/landing';

export const routes: Routes = [
	{
		path: '',
		component: Landing,
		data: {
			seoTitleKey: 'seo.landing.title',
			seoDescriptionKey: 'seo.landing.description',
		},
	},
	{
		path: 'impressum',
		loadComponent: () => import('./pages/legal/impressum/impressum').then((component) => component.Impressum),
		data: {
			seoTitleKey: 'seo.imprint.title',
			seoDescriptionKey: 'seo.imprint.description',
		},
	},
	{
		path: 'datenschutz',
		loadComponent: () => import('./pages/legal/datenschutz/datenschutz').then((component) => component.Datenschutz),
		data: {
			seoTitleKey: 'seo.privacy.title',
			seoDescriptionKey: 'seo.privacy.description',
		},
	},
	{ path: '**', redirectTo: '' }
];
