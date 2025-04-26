import { fetchJSON, renderProjects } from '../global.js';


const projectsContainer = document.querySelector('.projects');

const projects = await fetchJSON('../lib/projects.json');

renderProjects(projects, projectsContainer, 'h2');
