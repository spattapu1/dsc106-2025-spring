
function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

document.body.insertAdjacentHTML(
  'afterbegin',
  `
  <label class="color-scheme">
    Theme:
    <select>
      <option value="light dark">Automatic</option>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
  </label>`,
);

const select = document.querySelector('label.color-scheme select');
select.addEventListener('input', function (event) {
  console.log('color scheme changed to', event.target.value);
  document.documentElement.style.setProperty('color-scheme', event.target.value);
  localStorage.colorScheme = event.target.value;
});

if (localStorage.colorScheme){
  const savedScheme = localStorage.colorScheme;
  document.documentElement.style.setProperty('color-scheme', savedScheme);
  select.value = savedScheme;
} else {
  document.documentElement.style.setProperty('color-scheme', 'light dark');
  select.value = 'light dark';
}

let nav = document.createElement('nav');
document.body.prepend(nav);

let pages = [
  { url: '', title: 'Home' },
  { url: './projects/', title: 'Projects' },
  { url: './resume/', title: 'Resume' },
  { url: './contact/', title: 'Contact' },
  { url: 'https://github.com/spattapu1', title: 'GitHub' }];

const BASE_PATH = (location.hostname === "localhost" || location.hostname === "127.0.0.1")
  ? "/labs/1/" 
  : "/dsc106-2025-spring/";    

for (let p of pages) {
  let url = p.url;
  let title = p.title;

  url = !url.startsWith('http') ? BASE_PATH + url : url;


  let a = document.createElement('a');
  a.href = url;
  a.textContent = title;
  nav.append(a);

  if (a.host!== location.host) {
    a.target = '_blank';
  }

  a.classList.toggle(
    'current',
    a.host === location.host && a.pathname === location.pathname,
  );

}
export async function fetchJSON(url) {
  try {
    // Fetch the JSON file from the given URL
    const response = await fetch(url);
    console.log(response)
    if (!response.ok) {
      throw new Error(`Failed to fetch projects: ${response.statusText}`);
    }
    const data = await response.json();
    return data;

  } catch (error) {
    console.error('Error fetching or parsing JSON data:', error);
  }
}
export function renderProjects(projects, containerElement, headingLevel = 'h2') {
  const BASE_PATH = (location.hostname === "localhost" || location.hostname === "127.0.0.1")
    ? "/labs/1/"
    : "/dsc106-2025-spring/labs/1/";

  let html = '';

  for (let i = 0; i < projects.length; i++) {
    const project = projects[i];
    const imageSrc = project.image.startsWith('http')
      ? project.image
      : BASE_PATH + project.image;

      html += `
      <article>
        <${headingLevel}>${project.title}</${headingLevel}>
        <img src="${imageSrc}" alt="${project.title}">
        <p>${project.description} <br>c. ${project.year}</p>

      </article>
    `;
  }

  containerElement.innerHTML = html;
}
export async function fetchGitHubData(username) {
  return fetchJSON(`https://api.github.com/users/${username}`);

}

