import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
let xScale, yScale;
async function loadData() {
    const data = await d3.csv('loc.csv', (row) => ({
      ...row,
      line: Number(row.line), // or just +row.line
      depth: Number(row.depth),
      length: Number(row.length),
      date: new Date(row.date + 'T00:00' + row.timezone),
      datetime: new Date(row.datetime),
    }));
    console.log("Loaded data:", data);

    return data;
  }
  
  function processCommits(data) {
    return d3
      .groups(data, (d) => d.commit)
      .map(([commit, lines]) => {
        let first = lines[0];
        let { author, date, time, timezone, datetime } = first;
        let ret = {
          id: commit,
          url: 'https://github.com/vis-society/lab-7/commit/' + commit,
          author,
          date,
          time,
          timezone,
          datetime,
          hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
          totalLines: lines.length,
        };
  
        Object.defineProperty(ret, 'lines', {
          value: lines,
          // What other options do we need to set?
          // Hint: look up configurable, writable, and enumerable
        });
  
        return ret;
      });
  }
  
  function renderCommitInfo(data, commits) {
    // Create the dl element
    const dl = d3.select('#stats').append('dl').attr('class', 'stats');
  
    // Add total LOC
    dl.append('dt').html('Total <abbr title="Lines of code">LOC</abbr>');
    dl.append('dd').text(data.length);
  
    // Add total commits
    dl.append('dt').text('Total commits');
    dl.append('dd').text(commits.length);
  
    // Longest Line of Code
    dl.append('dt').text('Longest Line');
    dl.append('dd').text(d3.max(data, d => d.length));

    // Number of Days worked on the Site
    dl.append('dt').text('Number of Days');
    dl.append('dd').text(d3.group(data, d => d.date).size);

    // Average File Length 
    const fileLengths = d3.rollups(
        data,
        (v) => d3.max(v, (v) => v.line),
        (d) => d.file,
      );
    const averageFileLength = d3.mean(fileLengths, (d) => d[1]);
    dl.append('dt').text('Average File Length');
    dl.append('dd').text(averageFileLength.toFixed(2));
    // Time of Day Most work was done
    const workByPeriod = d3.rollups(
  data,
  (v) => v.length,
  (d) => new Date(d.datetime).toLocaleString('en', { dayPeriod: 'short' }),);
  const maxPeriod = d3.greatest(workByPeriod, (d) => d[1])?.[0];
  dl.append('dt').text('Most Work Done');
  dl.append('dd').text(maxPeriod);
  }

  function updateTooltipVisibility(isVisible) {
    const tooltip = document.getElementById('commit-tooltip');
    tooltip.hidden = !isVisible;
  }
  function updateTooltipPosition(event) {
    const tooltip = document.getElementById('commit-tooltip');
    tooltip.style.left = `${event.clientX}px`;
    tooltip.style.top = `${event.clientY}px`;
  }
  
  
  function renderScatterPlot(data, commits) {
    const width = 1000;
    const height = 600;
    const margin = { top: 10, right: 10, bottom: 30, left: 40 };

    const sortedCommits = d3.sort(commits, (d) => -d.totalLines);
    const svg = d3
      .select('#chart')
      .append('svg')
      .attr('viewBox', `0 0 ${width} ${height}`)
      .style('overflow', 'visible');
  
    const usableArea = {
      top: margin.top,
      right: width - margin.right,
      bottom: height - margin.bottom,
      left: margin.left,
      width: width - margin.left - margin.right,
      height: height - margin.top - margin.bottom,
    };
    const firstCommitDate = d3.min(commits, (d) => d.datetime);
    const lastCommitDate = d3.max(commits, (d) => d.datetime);

    const extendedDomain = [
        d3.timeDay.offset(firstCommitDate, -1),  // One day before the first commit
        d3.timeDay.offset(lastCommitDate, 1),    // One day after the last commit
      ];
  
    // Define x and y scales
    xScale = d3.scaleTime()
      .domain(extendedDomain)  // Set domain based on the datetime values
      .range([usableArea.left, usableArea.right]);
  
    yScale = d3.scaleLinear()
      .domain([0, d3.max(commits, (d) => d.hourFrac)])  // Set domain based on the hourFrac values
      .range([usableArea.bottom, usableArea.top]);

    const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);

    const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([2, 30]); // adjust these values based on your experimentation
  
    // Define axes
    const xAxis = d3.axisBottom(xScale).ticks(d3.timeDay.every(3)).tickFormat(d3.timeFormat('%b %d'));;
    const yAxis = d3
    .axisLeft(yScale)
    .tickFormat((d) => String(d % 24).padStart(2, '0') + ':00');

    const colorScale = d3.scaleSequential(d3.interpolateBlues)  // Blue for night (default color scheme)
    .domain([0, 12]);

    // Add gridlines BEFORE the axes
    const gridlines = svg
    .append('g')
    .attr('class', 'gridlines')
    .attr('transform', `translate(${usableArea.left}, 0)`);

    // Create gridlines as an axis with no labels and full-width ticks
    gridlines.call(d3.axisLeft(yScale).tickFormat('').tickSize(-usableArea.width));
    gridlines
      .selectAll('line')
      .attr('stroke', '#ccc') // Light gray color for gridlines
      .attr('opacity', 0.5); // Slightly transparent  
      
    // Add X axis
    svg
      .append('g')
      .attr('transform', `translate(0, ${usableArea.bottom})`)
      .call(xAxis);
  
    // Add Y axis
    svg
      .append('g')
      .attr('transform', `translate(${usableArea.left}, 0)`)
      .call(yAxis);
  
    const dots = svg.append('g').attr('class', 'dots');

    // Add scatter plot dots
    dots
    .selectAll('circle')
    .data(sortedCommits)
    .join('circle')
    .attr('cx', (d) => xScale(d.datetime))
    .attr('cy', (d) => yScale(d.hourFrac))
    .attr('r', 5)
    .attr('fill', (d) => {
        // Assign color based on the time of day
        return d.hourFrac >= 6 && d.hourFrac < 18
          ? d3.interpolateOranges((d.hourFrac - 6) / 12)  // Daytime: Orange shades
          : colorScale(d.hourFrac);  // Nighttime: Blue shades
      })
    .attr('r', (d) => rScale(d.totalLines))
    .style('fill-opacity', 0.7) // Add transparency for overlapping dots
    .on('mouseenter', (event, commit) => {
        d3.select(event.currentTarget).style('fill-opacity', 1); // Full opacity on hover
        renderTooltipContent(commit);
        updateTooltipVisibility(true);
        updateTooltipPosition(event);
    })
    .on('mouseleave', () => {
        d3.select(event.currentTarget).style('fill-opacity', 0.7);
        updateTooltipVisibility(false);
    });

    createBrushSelector(svg);

  }
  function createBrushSelector(svg) {
    svg.call(d3.brush().on('start brush end', brushed));
    svg.selectAll('.dots, .overlay ~ *').raise();
  }
  function brushed(event) {
    const selection = event.selection;
    d3.selectAll('circle').classed('selected', (d) =>
        isCommitSelected(selection, d),
    );
    renderSelectionCount(selection);
    renderLanguageBreakdown(selection);

  }
  function renderSelectionCount(selection) {
    const selectedCommits = selection
      ? commits.filter((d) => isCommitSelected(selection, d))
      : [];
  
    const countElement = document.querySelector('#selection-count');
    countElement.textContent = `${
      selectedCommits.length || 'No'
    } commits selected`;
  
    return selectedCommits;
  }

  function isCommitSelected(selection, commit) {
    if (!selection) {
      return false;
    }
    const [x0, x1] = selection.map((d) => d[0]);
    const [y0, y1] = selection.map((d) => d[1]);

    const x = xScale(commit.datetime);
    const y = yScale(commit.hourFrac);

    return x >= x0 && x <= x1 && y >= y0 && y <= y1;
  }


  function renderTooltipContent(commit) {
    const link = document.getElementById('commit-link');
    const date = document.getElementById('commit-date');
  
    if (Object.keys(commit).length === 0) return;
  
    link.href = commit.url;
    link.textContent = commit.id;
    date.textContent = commit.datetime?.toLocaleString('en', {
      dateStyle: 'full',
    });
    
  }
  function renderLanguageBreakdown(selection) {
    const selectedCommits = selection
      ? commits.filter((d) => isCommitSelected(selection, d))
      : [];
    const container = document.getElementById('language-breakdown');
  
    if (selectedCommits.length === 0) {
      container.innerHTML = '';
      return;
    }
    const requiredCommits = selectedCommits.length ? selectedCommits : commits;
    const lines = requiredCommits.flatMap((d) => d.lines);
  
    // Use d3.rollup to count lines per language
    const breakdown = d3.rollup(
      lines,
      (v) => v.length,
      (d) => d.type,
    );
  
    // Update DOM with breakdown
    container.innerHTML = '';
  
    for (const [language, count] of breakdown) {
      const proportion = count / lines.length;
      const formatted = d3.format('.1~%')(proportion);
  
      container.innerHTML += `
              <dt>${language}</dt>
              <dd>${count} lines (${formatted})</dd>
          `;
    }
  }

  let data = await loadData();
  let commits = processCommits(data);
  console.log(commits);
  
  renderCommitInfo(data, commits);
  renderScatterPlot(data, commits);

  

