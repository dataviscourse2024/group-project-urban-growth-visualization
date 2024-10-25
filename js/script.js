// Define constants for chart dimensions and margins (shared for both charts)
const CHART_WIDTH = document.querySelector("#line-graph").clientWidth;
const CHART_HEIGHT = document.querySelector("#line-graph").clientHeight;
const MARGIN = { left: 60, bottom: 50, top: 20, right: 20 };

// Track the selected state
let selectedState = null;
// Variable to hold population data by state and year
let data = {};
// Shared scales and color scale
const xScale = d3.scaleLinear()
    .domain([2010, 2024])
    .range([MARGIN.left, CHART_WIDTH - MARGIN.right]);

const yScale = d3.scaleLinear()
    .domain([0, 10000000])
    .range([CHART_HEIGHT - MARGIN.bottom, MARGIN.top]);

// Generate color scheme
let colorScale = d3.scaleLinear()
    .domain([0, 10000000])  // Population range
    .range([0, .8]);

// Tooltip setup
const tooltip = d3.select("#tooltip");

// Dropdown element for dataset selection
const datasetSelect = d3.select("#datasetSelect");

// Dropdown element for year selection
const yearSelect = d3.select("#yearSelect");

datasetSelect.on("change", function () {
    const selectedDataset = this.value;
    loadDataset(selectedDataset);  // Function to load and update the map based on the selected dataset
});

// Helper to create scales based on graph dimensions
function createLinearScale(domain, range) {
    return d3.scaleLinear().domain(domain).range(range);
}

// Helper to create band scales for bar charts
function createBandScale(domain, range) {
    return d3.scaleBand().domain(domain).range(range).padding(0.1);
}

// Helper to set up an axis
function setupAxis(svg, axisType, scale, axisClass, transform) {
    const axis = axisType === "x" ? d3.axisBottom(scale).ticks(6).tickFormat(d3.format("d")) : d3.axisLeft(scale);
    svg.select(`.${axisClass}`).remove(); // Remove previous axis
    svg.append("g")
        .attr("transform", transform)
        .attr("class", axisClass)
        .call(axis);
}

// Helper to setup a graph's SVG container
function setupGraphContainer(graphId, width, height) {
    return d3.select(graphId).append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("preserveAspectRatio", "xMinYMin meet");
}

// SVG element for the line graph in the first container
const lineGraphSvg = d3.select("#line-graph").append("svg")
    .attr("width", CHART_WIDTH)
    .attr("height", CHART_HEIGHT)
    .attr("viewBox", `0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`)  // Make it responsive
    .attr("preserveAspectRatio", "xMinYMin meet");  // Preserve aspect ratio

// SVG element for the bar graph in the second container
const barGraphSvg = d3.select("#bar-graph").append("svg")
    .attr("width", CHART_WIDTH)
    .attr("height", CHART_HEIGHT)
    .attr("viewBox", `0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`)  // Make it responsive
    .attr("preserveAspectRatio", "xMinYMin meet");  // Preserve aspect ratio

// Update graphs for the selected state
function updateGraphs() {
    if (!selectedState || !data[selectedState]) {
        console.error("No data available for the selected state.");
        return;
    }

    updateLineGraph();
    updateBarGraph();
}

// Line graph setup
function setupLineGraph() {
    // Dynamically set the height and width of the graphs
    const mapHeight = document.querySelector("#map-container").clientHeight;
    const graphHeight = mapHeight / 3; // Each graph should be 1/3 the height of the map
    const graphWidth = graphHeight * 1.6; // Width should be 1.4 times the height

    // Apply these dimensions to each graph container
    document.querySelectorAll(".graph").forEach(graph => {
        graph.style.height = `${graphHeight}px`;
        graph.style.width = `${graphWidth}px`;
    });

    // Update SVG sizes to match
    d3.selectAll(".graph svg")
        .attr("width", graphWidth)
        .attr("height", graphHeight);

    const svg = d3.select("#line-graph").select("svg")
        .attr("width", CHART_WIDTH)
        .attr("height", CHART_HEIGHT)
        .attr("viewBox", `0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`)
        .attr("preserveAspectRatio", "xMinYMin meet");

    // X-axis scale and setup
    const xScale = d3.scaleLinear()
        .domain([2010, 2024])
        .range([MARGIN.left, graphWidth - MARGIN.right]);
    const xAxis = d3.axisBottom(xScale).ticks(6).tickFormat(d3.format("d"));

    // Y-axis scale and setup
    const yScale = d3.scaleLinear()
        .domain([0, 10000000])
        .range([graphHeight - MARGIN.bottom, MARGIN.top]);
    const yAxis = d3.axisLeft(yScale);

    // X-axis
    svg.append("g")
        .attr("transform", `translate(0,${CHART_HEIGHT - MARGIN.bottom})`)
        .attr("class", "x-axis")
        .call(d3.axisBottom(xScale).ticks(6).tickFormat(d3.format("d")))
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-0.8em")
        .attr("dy", "0.15em")
        .attr("transform", "rotate(-90)");

    // Y-axis
    svg.append("g")
        .attr("transform", `translate(${MARGIN.left},0)`)
        .attr("class", "y-axis")
        .call(d3.axisLeft(yScale));

    // Add y-axis label
    svg.append("text")
        .attr("x", -CHART_HEIGHT / 2)
        .attr("y", MARGIN.left / 3)
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .text("Population");
}

// Bar graph setup
function setupBarGraph() {
    const svg = d3.select("#bar-graph").select("svg")
        .attr("width", CHART_WIDTH)
        .attr("height", CHART_HEIGHT)
        .attr("viewBox", `0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`)
        .attr("preserveAspectRatio", "xMinYMin meet");

    // X-axis scale
        const xScale = d3.scaleBand()
        .domain([2010, 2024])
        .range([MARGIN.left, CHART_WIDTH - MARGIN.right])
        .padding(0.1);  // Adjust padding for bars

    // Y-axis scale
    const yScale = d3.scaleLinear()
        .domain([0, 10000000])  // Adjust based on maximum population
        .range([CHART_HEIGHT - MARGIN.bottom, MARGIN.top]);

    // X-axis
    svg.append("g")
        .attr("transform", `translate(0,${CHART_HEIGHT - MARGIN.bottom})`)
        .attr("class", "x-axis-bar")
        .call(d3.axisBottom(xScale).ticks(6).tickFormat(d3.format("d")))
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-0.8em")
        .attr("dy", "0.15em")
        .attr("transform", "rotate(-90)");

    // Y-axis
    svg.append("g")
        .attr("transform", `translate(${MARGIN.left},0)`)
        .attr("class", "y-axis-bar")
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
}

function setupGraphs() {
    // Dynamically set the height and width of the graphs
    const mapHeight = document.querySelector("#map-container").clientHeight;
    const graphHeight = mapHeight / 3;  // Each graph should be 1/3 the height of the map
    const graphWidth = graphHeight * 1.6;  // Width should be 1.6 times the height

    // Apply these dimensions to each graph container
    document.querySelectorAll(".graph").forEach(graph => {
        graph.style.height = `${graphHeight}px`;  // Set graph container height
        graph.style.width = `${graphWidth}px`;    // Set graph container width
    });

    // Update the SVG sizes to match the graph dimensions
    d3.selectAll(".graph svg")
        .attr("width", graphWidth)
        .attr("height", graphHeight);

    // Now call the specific setup functions for the graphs
    setupLineGraph();
    setupBarGraph();
}


// Update line graph based on selected state
function updateLineGraph() {
    lineGraphSvg.selectAll("*").remove();

    // Check if selectedState exists and has data
    if (!selectedState || !data[selectedState]) {
        console.error("No data available for the selected state.");
        return;
    }

    const selectedStateData = Object.entries(data[selectedState])
        .map(([year, population]) => ({ year: +year, population }));

    // Get the min and max population for the selected state
    const minPopulation = d3.min(selectedStateData, d => d.population);
    const maxPopulation = d3.max(selectedStateData, d => d.population);

    const yMargin = (maxPopulation - minPopulation) * 0.1;
    const yMin = Math.max(0, minPopulation - yMargin);
    const yMax = maxPopulation + yMargin;

    const xScale = d3.scaleLinear()
        .domain([2010, 2024])
        .range([MARGIN.left, CHART_WIDTH - MARGIN.right]);

    const yScale = d3.scaleLinear()
        .domain([yMin, yMax])
        .range([CHART_HEIGHT - MARGIN.bottom, MARGIN.top]);

    const xAxis = d3.axisBottom(xScale).ticks(6).tickFormat(d3.format("d"));
    const yAxis = d3.axisLeft(yScale);

    // Clear previous axes
    lineGraphSvg.select(".x-axis").remove();
    lineGraphSvg.select(".y-axis").remove();

    // Draw or update x-axis
    lineGraphSvg.append("g")
        .attr("transform", `translate(0,${CHART_HEIGHT - MARGIN.bottom})`)
        .attr("class", "x-axis")
        .call(xAxis);

    // Draw or update y-axis
    lineGraphSvg.append("g")
        .attr("transform", `translate(${MARGIN.left},0)`)
        .attr("class", "y-axis")
        .call(yAxis);

    // Line generator for the line chart
    const line = d3.line()
        .x(d => xScale(d.year))
        .y(d => yScale(d.population));

    // Bind data to the path element
    const linePath = lineGraphSvg.selectAll(".line-chart")
        .data([selectedStateData]);

    // Enter phase: append the path
    linePath.enter()
        .append("path")
        .attr("class", "line-chart")
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 2)
        .attr("d", line)
        .call(transitionPath);  // Add transition when the path is drawn

    // Exit phase: remove the old path
    linePath.exit()
        .transition()
        .duration(500)
        .attr("opacity", 0)
        .remove();
}

// Function to create left-to-right transition for the path
function transitionPath(path) {
    path.each(function() {
        const totalLength = this.getTotalLength();

        d3.select(this)
            .attr("stroke-dasharray", totalLength + " " + totalLength)
            .attr("stroke-dashoffset", totalLength)
            .transition()
            .duration(800)  // Duration for the left-to-right transition
            .attr("stroke-dashoffset", 0);
    });
}


// Update bar graph based on selected state
function updateBarGraph() {
    // Check if selectedState exists and has data
    if (!selectedState || !data[selectedState]) {
        console.error("No data available for the selected state in the bar graph.");
        return;
    }

    const selectedStateData = Object.entries(data[selectedState])
        .map(([year, population]) => ({ year: +year, population }));

    // Get the min and max population for the selected state
    const minPopulation = d3.min(selectedStateData, d => d.population);
    const maxPopulation = d3.max(selectedStateData, d => d.population);

    // Calculate a margin for the y-axis to make it more readable
    const yMargin = (maxPopulation - minPopulation) * 0.1;
    const yMin = Math.max(0, minPopulation - yMargin);
    const yMax = maxPopulation + yMargin;

    // X-axis scale (years)
    const xScale = d3.scaleBand()
        .domain(selectedStateData.map(d => d.year))
        .range([MARGIN.left, CHART_WIDTH - MARGIN.right])
        .padding(0.1);

    // Y-axis scale (population)
    const yScale = d3.scaleLinear()
        .domain([yMin, yMax])
        .range([CHART_HEIGHT - MARGIN.bottom, MARGIN.top]);

    // Update or append the X-axis
    if (barGraphSvg.select(".x-axis-bar").empty()) {
        // If the X-axis doesn't exist, append it
        barGraphSvg.append("g")
            .attr("transform", `translate(0,${CHART_HEIGHT - MARGIN.bottom})`)
            .attr("class", "x-axis-bar")
            .call(d3.axisBottom(xScale).tickFormat(d3.format("d")));
    } else {
        // Update the X-axis with new data
        barGraphSvg.select(".x-axis-bar")
            .transition()
            .duration(500)
            .call(d3.axisBottom(xScale).tickFormat(d3.format("d")));
    }

    // Update or append the Y-axis
    if (barGraphSvg.select(".y-axis-bar").empty()) {
        // If the Y-axis doesn't exist, append it
        barGraphSvg.append("g")
            .attr("transform", `translate(${MARGIN.left},0)`)
            .attr("class", "y-axis-bar")
            .call(d3.axisLeft(yScale));
    } else {
        // Update the Y-axis with new data
        barGraphSvg.select(".y-axis-bar")
            .call(d3.axisLeft(yScale));
    }

    // Bind data to the rectangles (bars)
    const bars = barGraphSvg.selectAll(".bar")
        .data(selectedStateData, d => d.year);  // Key by year to track elements during updates

    // Enter phase: append new bars
    bars.enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => xScale(d.year))
        .attr("y", CHART_HEIGHT - MARGIN.bottom)  // Start bars at the bottom for the transition
        .attr("width", xScale.bandwidth())
        .attr("height", 0)  // Initial height for the transition
        .attr("opacity", 0)
        .attr("fill", "steelblue")
        .merge(bars)  // Merge new and updated bars
        .transition()  // Transition for bars entering or updating
        .duration(800)
        .attr("x", d => xScale(d.year))
        .attr("y", d => yScale(d.population))
        .attr("width", xScale.bandwidth())
        .attr("height", d => CHART_HEIGHT - MARGIN.bottom - yScale(d.population))
        .attr("opacity", 1);

    // Exit phase: remove old bars (if necessary)
    bars.exit()
        .transition()
        .duration(500)
        .attr("opacity", 0)
        .remove();
}

let dataurl= "data/PopulationDataClean.csv"
let selectedYear = '2010';
// Function used to change between datasets
function loadDataset(selectedDataset) {
    
    switch (selectedDataset) {
        case "population":
            dataurl = "data/PopulationDataClean.csv";
            break;
        case "jobGrowth":
            dataurl = "data/JobGrowth2012_2024.csv";
            
            break;
        case "medianIncome":
            dataurl = "data/MedianIncomeDataClean.csv";
            break;
        case "housing":
            dataurl = "data/HousingYearlyDataClean.csv"
        default:
            console.error("Unknown dataset selected.");
            return;
    }

    d3.csv(dataurl).then(function(loadedData) {  // Use `loadedData` to prevent overwriting `data`
        data = {}; // Reset data object
        loadedData.forEach(d => {
            const state = d.state;
            const year = +d.year;
            const value = +d.value;

            if (!data[state]) {
                data[state] = {};
            }
            data[state][year] = value;
        });

        updateMap(selectedYear);
        updateGraphs();
    }).catch(function(error) {
        console.error("Error loading dataset:", error);
    });


}



function loadMap(){


// Map and population data logic
Promise.all([
    d3.json('data/us.json'),  // Load the US map in TopoJSON format
    d3.csv(dataurl)  // Load the data
]).then(([usMapData, valueData]) => {
    const svgMap = d3.select("#us-map-svg");

    // Prepare value data by year and state
    data = {};
    valueData.forEach(d => {
        if (!data[d.State]) {
            data[d.State] = {};
        }
        data[d.State][d.Year] = +d.Value;
    });

    // Initial SVG load handling
    svgMap.on("load", function () {
        const svgDoc = this.contentDocument;
        const svgRoot = d3.select(svgDoc).select("svg");

        const states = topojson.feature(usMapData, usMapData.objects.states).features;

        // Function to update the map based on the selected year
        function updateMap(year) {
            const valueByState = {};
            valueData.forEach(d => {
                if (d.Year === year) {
                    valueByState[d.State] = +d.Value;
                }
            });

            // Update state colors based on selection or value
            svgRoot.selectAll("path")
                .data(states)
                .join("path")
                .attr("d", d3.geoPath())
                .attr("fill", d => {
                    const stateName = d.properties.name;
                    const value = valueByState[stateName] || 0;
                    const colorValue = colorScale(value);
                    return d3.interpolateGreys(colorValue);  // Apply gradient
                })
                .attr("stroke", "#333")
                .on("mouseover", function (event, d) {
                    const stateName = d.properties.name;
                    const value = valueByState[stateName] || "Unknown";
                    tooltip.style("display", "block")
                        .html(`<strong>${stateName}</strong><br>Population: ${value}`)
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 30) + "px");

                    if (selectedState !== stateName) {
                        d3.select(this).transition().duration(300).attr("fill", "steelblue");  // Transition to steelblue on hover
                    }
                })
                .on("mouseout", function (event, d) {
                    tooltip.style("display", "none");
                    const stateName = d.properties.name;
                    if (selectedState !== stateName) {
                        d3.select(this).transition().duration(300).attr("fill", d3.interpolateGreys(colorScale(valueByState[stateName] || 0)));  // Return to gradient
                    }
                })
                .on("click", function (event, d) {
                    const stateName = d.properties.name;

                    if (selectedState === stateName) {
                        selectedState = null;
                        d3.select(this).transition().duration(300).attr("fill", d3.interpolateGreys(colorScale(valueByState[stateName] || 0)));
                    } else {
                        if (selectedState) {
                            svgRoot.selectAll("path")
                                .filter(d => d.properties.name === selectedState)
                                .transition().duration(300)
                                .attr("fill", d3.interpolateGreys(colorScale(valueByState[selectedState] || 0)));
                        }
                        selectedState = stateName;
                        d3.select(this).transition().duration(300).attr("fill", "steelblue");
                    }
                    updateGraphs();
                });

        }

        // Initial map load with the default year
        updateMap('2010');

        // Ensure loadDataset is defined before setting up the event listener
        datasetSelect.on("change", function () {
            const selectedDataset = this.value;
            loadDataset(selectedDataset);
            loadMap();
            updateMap(selectedYear);
        });
        // Event listener for year dropdown
        yearSelect.on("change", function () {
            selectedYear = this.value;
            updateMap(selectedYear);
        });
    });
}).catch(error => console.error("Error loading data:", error));
}

loadMap()