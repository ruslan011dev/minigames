import illustrationUrl from '../../assets/images/illustration-side.png';
import uploadUrl from '../../assets/icons/upload.svg?url';

export class DeveloperCta {
  public render(): HTMLElement {
    const section = document.createElement('section');
    section.className = 'developer';
    section.setAttribute('aria-labelledby', 'developer-title');

    const inner = document.createElement('div');
    inner.className = 'developer__inner';

    const image = document.createElement('img');
    image.className = 'developer__image';
    image.src = illustrationUrl;
    image.alt = '';

    inner.append(image, this.createContent());
    section.append(inner);

    return section;
  }

  private createContent(): HTMLElement {
    const content = document.createElement('div');
    content.className = 'developer__content';

    const title = document.createElement('h2');
    title.id = 'developer-title';
    title.className = 'developer__title';
    title.textContent = 'Are You a Game Developer?';

    const text = document.createElement('p');
    text.className = 'developer__text';
    text.textContent =
      "Want to see your game on MiniGames? We're always looking for fun, engaging mini games to add to our platform. Submit your game and reach thousands of players!";

    const cta = document.createElement('a');
    cta.className = 'developer__cta';
    cta.href = '/';
    cta.dataset.page = 'home';

    const icon = document.createElement('img');
    icon.className = 'developer__cta-icon';
    icon.src = uploadUrl;
    icon.alt = '';

    const label = document.createElement('span');
    label.textContent = 'Submit Form';

    cta.append(icon, label);

    const contact = document.createElement('p');
    contact.className = 'developer__contact';
    contact.append('or contact us at ');

    const mail = document.createElement('a');
    mail.className = 'developer__mail';
    mail.href = 'mailto:developers@minigames.com';
    mail.textContent = 'developers@minigames.com';

    contact.append(mail);
    content.append(title, text, cta, contact);

    return content;
  }
}
