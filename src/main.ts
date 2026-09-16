import './style.scss';
import { App } from './app/app';

const root = document.querySelector<HTMLElement>('#app');

if (!root) {
  throw new Error('Root element #app was not found');
}

const app = new App(root);
app.start();
