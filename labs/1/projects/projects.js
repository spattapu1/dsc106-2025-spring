import { fetchJSON, renderProjects } from '../global.js';


const projectsContainer = document.querySelector('.projects');
const titleElement = document.querySelector('.projects-title');

const projects = await fetchJSON('../lib/projects.json');

renderProjects(projects, projectsContainer, 'h2');
titleElement.textContent = `${projects.length} Projects`;