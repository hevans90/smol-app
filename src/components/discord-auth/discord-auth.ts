import { isBefore } from 'date-fns';
import invariant from 'tiny-invariant';

const loginCheck = () => {
  let logoutPage = '/logout';
  const expires = localStorage.getItem('expires') || 0;
  const expiration = new Date(expires);
  const now = new Date();
  const container = document.getElementById('login-container');
  const loggedOut = document.getElementById('user-logged-out');
  const loggedIn = document.getElementById('user-logged-in');
  invariant(container);
  invariant(loggedOut);
  invariant(loggedIn);

  const loggedOutHoverStyles = [
    'hover:text-discord-400',
    'hover:border-discord-400',
  ];

  if (isBefore(expiration, now)) {
    // logged out
    container.classList.add(...loggedOutHoverStyles);
    loggedOut.classList.remove('hidden');
    loggedOut.classList.add('flex');
    loggedIn.classList.remove('flex');
    loggedIn.classList.add('hidden');
  } else {
    // logged in
    const userData = localStorage.getItem('discord_user');
    invariant(userData);
    const user: { id: string; avatar: string; global_name: string } =
      JSON.parse(userData);
    const avatar = document.getElementById(
      'user-avatar'
    ) as HTMLImageElement | null;
    invariant(avatar);
    const username = document.getElementById('username');
    invariant(username);

    loggedIn.classList.remove('hidden');
    loggedIn.classList.add('flex');

    username.innerText = user.global_name;
    avatar.src = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`;
  }
};
loginCheck();
document
  .getElementById('action-logout')
  ?.addEventListener('click', function () {
    localStorage.removeItem('discord_user');
    localStorage.removeItem('expires');
    loginCheck();
  });
