import { fetchJSON, renderProjects } from "../global.js";
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";

const projectsContainer = document.querySelector(".projects");
const titleElement = document.querySelector(".projects-title");
let searchInput = document.querySelector(".SearchBar");

let selectedIndex = -1;
let query = "";
let colors = d3.scaleOrdinal(d3.schemeTableau10);
let data = [];

let projects = await fetchJSON("../lib/projects.json");
titleElement.textContent = `Projects`;
renderProjects(projects, projectsContainer, "h2");

//New code
function getFilteredProjects() {
  let filtered = [...projects];

  if (selectedIndex !== -1 && data[selectedIndex]) {
    const selectedYear = String(data[selectedIndex].label);
    filtered = filtered.filter((p) => String(p.year) === selectedYear);
  }

  if (query.trim() !== "") {
    const q = query.toLowerCase();
    filtered = filtered.filter((p) =>
      Object.values(p).join("\n").toLowerCase().includes(q),
    );
  }

  return filtered;
}

// Refactor all plotting into one function
function renderPieChart(projectsGiven) {
  let svg = d3.select("svg");
  let legend = d3.select(".legend");
  svg.selectAll("path").remove();
  legend.selectAll("*").remove();
  // re-calculate rolled data
  let rolledData = d3.rollups(
    projects,
    (v) => v.length,
    (d) => d.year,
  );
  data = rolledData.map(([year, count]) => ({
    label: String(year),
    value: count,
  }));
  let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
  let sliceGenerator = d3.pie().value((d) => d.value);
  let arcData = sliceGenerator(data);
  let arcs = arcData.map((d) => arcGenerator(d));

  arcs.forEach((arc, i) => {
    svg
      .append("path")
      .attr("d", arc)
      .attr("class", i === selectedIndex ? "selected" : "")
      .attr("style", i === selectedIndex ? null : `--color:${colors(i)}`)
      .on("click", () => {
        selectedIndex = selectedIndex === i ? -1 : i;
        let filtered = getFilteredProjects();
        renderProjects(filtered, projectsContainer, "h2");
        renderPieChart(filtered);
      });
  });
  data.forEach((d, i) => {
    legend
      .append("li")
      .attr("class", "legend-item" + (i === selectedIndex ? " selected" : ""))
      .attr("style", i === selectedIndex ? null : `--color:${colors(i)}`)
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
      .on("click", () => {
        selectedIndex = selectedIndex === i ? -1 : i;
        let filtered = getFilteredProjects();
        renderProjects(filtered, projectsContainer, "h2");
        renderPieChart(filtered);
      });
  });
}

searchInput.addEventListener("input", (event) => {
  query = event.target.value;
  let filtered = getFilteredProjects();
  renderProjects(filtered, projectsContainer, "h2");
  renderPieChart(filtered);
});

renderProjects(projects, projectsContainer, "h2");
renderPieChart(projects);
