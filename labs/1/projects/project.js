import { fetchJSON, renderProjects } from '../global.js';
const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');
renderProjects(projects, projectsContainer, 'h2');

const container = document.getElementById('projects-container');

fetchJSON('https://spattapu1.github.io/dsc106-2025-spring/labs/1/projects/')
  .then(projects => {
    console.log('Fetched projects:', projects);
    renderProjects(projects, container, 'h3'); // test with 'h3'
    renderProjects(projects, container, 'h2'); // or 'h2', 'h4' etc.
  })
  .catch(error => {
    console.error('Error loading projects:', error);
  });