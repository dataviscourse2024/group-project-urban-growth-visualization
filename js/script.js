// Define constants for chart dimensions and margins
const CHART_WIDTH = document.querySelector("#line-graph").clientWidth;
const CHART_HEIGHT = document.querySelector("#line-graph").clientHeight;
const MARGIN = { left: 60, bottom: 50, top: 20, right: 20 };

// Define constants for chart dimensions and margins
const BAR_CHART_WIDTH = document.querySelector("#bar-graph").clientWidth;
const BAR_CHART_HEIGHT = document.querySelector("#bar-graph").clientHeight;

const colorScale = d3.scaleQuantize()
    .domain([0, 10000000])  // Adjust based on population range
    .range(d3.schemePurples[9]);

// Set up tooltip for displaying information
const tooltip = d3.select("#tooltip");

// Track the currently selected state
let selectedState = null;

// Dropdown element for year selection
const yearSelect = d3.select("#yearSelect");

// SVG element for the line graph in the first container
const lineGraphSvg = d3.select("#line-graph").append("svg")
    .attr("width", CHART_WIDTH)
    .attr("height", CHART_HEIGHT)
    .attr("viewBox", `0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`)  // Make it responsive
    .attr("preserveAspectRatio", "xMinYMin meet");  // Preserve aspect ratio

// SVG element for the bar graph in the second container
const barGraphSvg = d3.select("#bar-graph").append("svg")
    .attr("width", BAR_CHART_WIDTH)
    .attr("height", BAR_CHART_HEIGHT)
    .attr("viewBox", `0 0 ${BAR_CHART_WIDTH} ${BAR_CHART_HEIGHT}`)  // Make it responsive
    .attr("preserveAspectRatio", "xMinYMin meet");  // Preserve aspect ratio

// Variable to hold population data by state and year
let populationByStateAndYear = {};

// Setup initial line graph when the page loads
setupLineGraph();

// Setup initial bar graph when the page loads
setupBarGraph();

function setupLineGraph() {
    const svg = lineGraphSvg;

    // X-axis scale
    const xScale = d3.scaleLinear()
        .domain([2019, 2024])  // Ensure the x-axis has 1-year increments
        .range([MARGIN.left, CHART_WIDTH - MARGIN.right]);
    
    // X-axis setup
    const xAxis = d3.axisBottom(xScale)
        .ticks(6)  // Set the number of ticks equal to the number of years
        .tickFormat(d3.format("d"));  // Ensure the format is integer (years)

    // Y-axis scale
    const yScale = d3.scaleLinear()
        .domain([0, 10000000])  // Adjust based on maximum population
        .range([CHART_HEIGHT - MARGIN.bottom, MARGIN.top]);

    // Add x-axis
    svg.append("g")
        .attr("transform", `translate(0,${CHART_HEIGHT - MARGIN.bottom})`)
        .attr("class", "x-axis")
        .call(d3.axisBottom(xScale).ticks(6).tickFormat(d3.format("d")));  // Ensure ticks show 1-year intervals

    // Add y-axis
    svg.append("g")
        .attr("transform", `translate(${MARGIN.left},0)`)
        .attr("class", "y-axis")
        .call(d3.axisLeft(yScale));

    // Add x-axis label
    svg.append("text")
        .attr("x", CHART_WIDTH / 2)
        .attr("y", CHART_HEIGHT - 10)
        .attr("text-anchor", "middle")
        .text("Year");

    // Add y-axis label
    svg.append("text")
        .attr("x", -CHART_HEIGHT / 2)
        .attr("y", MARGIN.left / 3)
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .text("Population");
}

function updateLineGraph() {
    // Clear only the line and the title, but keep the axes intact
    lineGraphSvg.selectAll(".line-chart").remove();  // Remove the line chart
    lineGraphSvg.selectAll("text.state-title").remove();  // Remove the state title

    if (!selectedState) {
        setupLineGraph();  // Redraw axes if no state is selected
        return;
    }

    const selectedStateData = Object.values(populationByStateAndYear[selectedState]);

    // Get the min and max population for the selected state
    const minPopulation = d3.min(selectedStateData);
    const maxPopulation = d3.max(selectedStateData);

    // Calculate a margin for the y-axis to make it more readable
    const yMargin = (maxPopulation - minPopulation) * 0.1;

    // Ensure y-axis has a meaningful range even if the population values are the same
    const yMin = Math.max(0, minPopulation - yMargin);
    const yMax = maxPopulation + yMargin;

    const xScale = d3.scaleLinear()
        .domain([2019, 2024])
        .range([MARGIN.left, CHART_WIDTH - MARGIN.right]);

    const yScale = d3.scaleLinear()
        .domain([yMin, yMax])
        .range([CHART_HEIGHT - MARGIN.bottom, MARGIN.top]);

    const xAxis = d3.axisBottom(xScale)
        .ticks(6)
        .tickFormat(d3.format("d"));

    const yAxis = d3.axisLeft(yScale);

    // Draw or update x-axis without transitions
    lineGraphSvg.select(".x-axis").remove();  // Clear previous x-axis before updating
    lineGraphSvg.append("g")
        .attr("transform", `translate(0,${CHART_HEIGHT - MARGIN.bottom})`)
        .attr("class", "x-axis")
        .call(xAxis);

    // Draw or update y-axis without transitions
    lineGraphSvg.select(".y-axis").remove();  // Clear previous y-axis before updating
    lineGraphSvg.append("g")
        .attr("transform", `translate(${MARGIN.left},0)`)
        .attr("class", "y-axis")
        .call(yAxis);

    // Line generator
    const line = d3.line()
        .x(d => xScale(d.year))
        .y(d => yScale(d.population));

    const data = Object.entries(populationByStateAndYear[selectedState])
        .map(([year, population]) => ({ year: +year, population }));

    // Add line for the selected state with a transition
    const linePath = lineGraphSvg.selectAll(".line-chart")
        .data([data]);

    linePath.enter()
        .append("path")
        .attr("class", "line-chart")
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 2)
        .attr("d", line)
        .attr("stroke-dasharray", function () {
            const length = this.getTotalLength();
            return `${length} ${length}`;
        })
        .attr("stroke-dashoffset", function () {
            return this.getTotalLength();
        })
        .transition()
        .duration(1000)
        .attr("stroke-dashoffset", 0);

    // Add state label as the title
    lineGraphSvg.append("text")
        .attr("x", CHART_WIDTH / 2)
        .attr("y", MARGIN.top)
        .attr("class", "state-title")
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text(selectedState);
}

function setupBarGraph() {
    const svg = barGraphSvg;

    // X-axis scale
    const xScale = d3.scaleBand()
        .domain([2019, 2020, 2021, 2022, 2023, 2024])
        .range([MARGIN.left, BAR_CHART_WIDTH - MARGIN.right])
        .padding(0.1);  // Adjust padding for bars

    // Y-axis scale
    const yScale = d3.scaleLinear()
        .domain([0, 10000000])  // Adjust based on maximum population
        .range([BAR_CHART_HEIGHT - MARGIN.bottom, MARGIN.top]);

    // Add x-axis
    svg.append("g")
        .attr("transform", `translate(0,${BAR_CHART_HEIGHT - MARGIN.bottom})`)
        .attr("class", "x-axis-bar")
        .call(d3.axisBottom(xScale).ticks(6).tickFormat(d3.format("d")));  // Ensure ticks show 1-year intervals

    // Add y-axis
    svg.append("g")
        .attr("transform", `translate(${MARGIN.left},0)`)
        .attr("class", "y-axis-bar")
        .call(d3.axisLeft(yScale));

    // Add x-axis label
    svg.append("text")
        .attr("x", BAR_CHART_WIDTH / 2)
        .attr("y", BAR_CHART_HEIGHT - 10)
        .attr("text-anchor", "middle")
        .text("Year");

    // Add y-axis label
    svg.append("text")
        .attr("x", -BAR_CHART_HEIGHT / 2)
        .attr("y", MARGIN.left / 3)
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .text("Population");
}

function updateBarGraph() {
    barGraphSvg.selectAll(".bar-chart").remove();  // Clear existing bars
    barGraphSvg.selectAll("text.state-title-bar").remove();  // Remove the state title

    if (!selectedState) {
        setupBarGraph();  // Redraw axes and labels if no state is selected
        return;
    }

    const selectedStateData = Object.entries(populationByStateAndYear[selectedState])
        .map(([year, population]) => ({ year: +year, population }));

    // Get the min and max population for the selected state
    const minPopulation = d3.min(selectedStateData, d => d.population);
    const maxPopulation = d3.max(selectedStateData, d => d.population);

    // Calculate a margin for the y-axis to make it more readable
    const yMargin = (maxPopulation - minPopulation) * 0.1;

    // Ensure y-axis has a meaningful range even if the population values are the same
    const yMin = Math.max(0, minPopulation - yMargin);
    const yMax = maxPopulation + yMargin;

    const xScale = d3.scaleBand()
        .domain(selectedStateData.map(d => d.year))
        .range([MARGIN.left, BAR_CHART_WIDTH - MARGIN.right])
        .padding(0.1);

    const yScale = d3.scaleLinear()
        .domain([yMin, yMax])
        .range([BAR_CHART_HEIGHT - MARGIN.bottom, MARGIN.top]);

    const xAxis = d3.axisBottom(xScale).tickFormat(d3.format("d"));
    const yAxis = d3.axisLeft(yScale);

    // Draw or update x-axis without transitions
    barGraphSvg.select(".x-axis-bar").remove();  // Clear previous x-axis before updating
    barGraphSvg.append("g")
        .attr("transform", `translate(0,${BAR_CHART_HEIGHT - MARGIN.bottom})`)
        .attr("class", "x-axis-bar")
        .call(xAxis);

    // Draw or update y-axis without transitions
    barGraphSvg.select(".y-axis-bar").remove();  // Clear previous y-axis before updating
    barGraphSvg.append("g")
        .attr("transform", `translate(${MARGIN.left},0)`)
        .attr("class", "y-axis-bar")
        .call(yAxis);

    // Create the bars with transitions
    const bars = barGraphSvg.selectAll(".bar-chart")
        .data(selectedStateData, d => d.year);

    // Enter new bars
    bars.enter()
        .append("rect")
        .attr("class", "bar-chart")
        .attr("x", d => xScale(d.year))
        .attr("y", yScale(0))  // Start bars from the bottom
        .attr("width", xScale.bandwidth())
        .attr("height", 0)
        .attr("fill", "steelblue")
        .transition()
        .duration(800)  // Duration for the smooth transition
        .attr("y", d => yScale(d.population))
        .attr("height", d => BAR_CHART_HEIGHT - MARGIN.bottom - yScale(d.population));

    // Update existing bars
    bars.transition()
        .duration(800)
        .attr("x", d => xScale(d.year))
        .attr("y", d => yScale(d.population))
        .attr("width", xScale.bandwidth())
        .attr("height", d => BAR_CHART_HEIGHT - MARGIN.bottom - yScale(d.population));

    // Exit and remove old bars with transitions
    bars.exit()
        .transition()
        .duration(500)
        .attr("opacity", 0)
        .remove();

    // Add state label as the title
    barGraphSvg.append("text")
        .attr("x", BAR_CHART_WIDTH / 2)
        .attr("y", MARGIN.top)
        .attr("class", "state-title-bar")
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text(selectedState);
}


// Add logic to call both updateLineGraph and updateBarGraph when a state is selected
function updateGraphs() {
    updateLineGraph();
    updateBarGraph();
}

// Function to create left-to-right transition for the path
function transitionPath(path) {
    path.each(function() {
        const totalLength = this.getTotalLength();

        d3.select(this)
            .attr("stroke-dasharray", totalLength + " " + totalLength)  // Create the dashed path with full length
            .attr("stroke-dashoffset", totalLength)  // Offset the dash to hide the line
            .transition()  // Add transition to reveal the line
            .duration(800)  // Duration for the left-to-right transition
            .attr("stroke-dashoffset", 0);  // Animate the dash offset to reveal the line
    });
}


// Map and population data logic
Promise.all([
    d3.json('data/us.json'),  // Load the US map in TopoJSON format
    d3.csv('data/PopulationDataClean.csv')  // Load the population data
]).then(([usMapData, populationData]) => {
    const svgMap = d3.select("#us-map-svg");

    // Prepare population data by year and state
    populationByStateAndYear = {};
    populationData.forEach(d => {
        if (!populationByStateAndYear[d.State]) {
            populationByStateAndYear[d.State] = {};
        }
        populationByStateAndYear[d.State][d.Year] = +d.Population;
    });

    // Initial SVG load handling
    svgMap.on("load", function () {
        const svgDoc = this.contentDocument;
        const svgRoot = d3.select(svgDoc).select("svg");

        const states = topojson.feature(usMapData, usMapData.objects.states).features;

        // Function to update the map based on the selected year
        // Function to update the map based on the selected year
        function updateMap(year) {
            const populationByState = {};
            populationData.forEach(d => {
                if (d.Year === year) {
                    populationByState[d.State] = +d.Population;
                }
            });

            // Update state colors based on selection or population
            svgRoot.selectAll("path")
                .data(states)
                .join("path")
                .attr("d", d3.geoPath())
                .attr("fill", d => {
                    const stateName = d.properties.name;
                    return selectedState === stateName ? "blue" : colorScale(populationByState[stateName] || 0);
                })
                .attr("stroke", "#333")
                .on("mouseover", function (event, d) {
                    const stateName = d.properties.name;
                    const population = populationByState[stateName] || "Unknown";
                    tooltip.style("display", "block")
                        .html(`<strong>${stateName}</strong><br>Population: ${population}`)
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 30) + "px");

                    if (selectedState !== stateName) {
                        d3.select(this).transition().duration(300).attr("fill", "steelblue");  // Transition to orange on hover
                    }
                })
                .on("mouseout", function (event, d) {
                    tooltip.style("display", "none");
                    const stateName = d.properties.name;
                    if (selectedState !== stateName) {
                        d3.select(this).transition().duration(300).attr("fill", colorScale(populationByState[stateName] || 0));  // Transition back to original color
                    }
                })
                .on("click", function (event, d) {
                    const stateName = d.properties.name;

                    if (selectedState === stateName) {
                        // Deselect the state
                        selectedState = null;
                        d3.select(this).transition().duration(300).attr("fill", colorScale(populationByState[stateName] || 0));  // Smoothly transition back to the original color
                    } else {
                        // Deselect the previously selected state and revert its color
                        if (selectedState) {
                            svgRoot.selectAll("path")
                                .filter(d => d.properties.name === selectedState)
                                .transition().duration(300)  // Smooth transition
                                .attr("fill", d => colorScale(populationByState[selectedState] || 0));
                        }

                        // Select the new state
                        selectedState = stateName;
                        d3.select(this).transition().duration(300).attr("fill", "blue");
                    }

                    // Update the line graph with the selected state's data or clear it if no state is selected
                    updateGraphs();
                });
        }

        // Initial map load with the default year
        updateMap('2019');

        // Event listener for year dropdown
        yearSelect.on("change", function () {
            const selectedYear = this.value;
            updateMap(selectedYear);
        });
    });
}).catch(error => console.error("Error loading data:", error));
