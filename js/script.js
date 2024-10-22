// Define color scale for population
const colorScale = d3.scaleQuantize()
    .domain([0, 10000000])  // Adjust based on population range
    .range(d3.schemePurples[9]);

// Set up tooltip for displaying information
const tooltip = d3.select("#tooltip");

// Track the currently selected state
let selectedState = null;

// Dropdown element for year selection
const yearSelect = d3.select("#yearSelect");

// SVG element for line graph in the first container
const lineGraphSvg = d3.select("#line-graph");

Promise.all([
    d3.json('data/us.json'),  // Load the US map in TopoJSON format
    d3.csv('data/PopulationDataClean.csv')  // Load the population data
]).then(([usMapData, populationData]) => {
    const svgMap = d3.select("#us-map-svg");

    // Prepare population data by year and state
    const populationByStateAndYear = {};
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

        // Ensure that the required data exists before proceeding
        if (!usMapData || !usMapData.objects || !usMapData.objects.states) {
            console.error("Error: 'states' object is missing in the TopoJSON data.");
            return;
        }

        const states = topojson.feature(usMapData, usMapData.objects.states).features;

        // Check if the TopoJSON data was processed correctly
        if (!states || states.length === 0) {
            console.error("Error: No states data available.");
            return;
        }

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
                .attr("fill", d => {
                    if (!d || !d.properties) {
                        console.error("Error: Invalid data encountered for state.");
                        return "#ccc"; // Fallback color if data is invalid
                    }
                    const stateName = d.properties.name;
                    return selectedState === stateName ? "red" : colorScale(populationByState[stateName] || 0);
                })
                .attr("stroke", "#333");

            // Set up interactivity with mouse events
            svgRoot.selectAll("path")
                .on("mouseover", function (event, d) {
                    if (!d || !d.properties) {
                        console.error("Error: Invalid data encountered on mouseover.");
                        return;
                    }
                    const stateName = d.properties.name;
                    const population = populationByState[stateName] || "Unknown";
                    tooltip.style("display", "block")
                        .html(`<strong>${stateName}</strong><br>Population: ${population}`)
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 30) + "px");

                    if (selectedState !== stateName) {
                        d3.select(this).attr("fill", "red");
                    }
                })
                .on("mouseout", function (event, d) {
                    if (!d || !d.properties) {
                        console.error("Error: Invalid data encountered on mouseout.");
                        return;
                    }
                    tooltip.style("display", "none");
                    const stateName = d.properties.name;
                    if (selectedState !== stateName) {
                        d3.select(this).attr("fill", colorScale(populationByState[stateName] || 0));
                    }
                })
                .on("click", function (event, d) {
                    if (!d || !d.properties) {
                        console.error("Error: Invalid data encountered on click.");
                        return;
                    }
                    const stateName = d.properties.name;

                    if (selectedState === stateName) {
                        // Deselect the state
                        selectedState = null;
                        d3.select(this).attr("fill", colorScale(populationByState[stateName] || 0));
                    } else {
                        // Deselect the previously selected state and revert its color
                        if (selectedState) {
                            svgRoot.selectAll("path")
                                .filter(d => d.properties && d.properties.name === selectedState)
                                .attr("fill", d => colorScale(populationByState[selectedState] || 0));
                        }

                        // Select the new state
                        selectedState = stateName;
                        d3.select(this).attr("fill", "red");
                    }

                    // Update the line graph with the selected state's data or clear it if no state is selected
                    updateLineGraph();
                });
        }

        // Function to update the line graph based on the selected state
        function updateLineGraph() {
            lineGraphSvg.selectAll("*").remove();

            if (!selectedState) return;

            const xScale = d3.scaleLinear()
                .domain([2019, 2024])
                .range([50, 450]);

            const yScale = d3.scaleLinear()
                .domain([0, d3.max(Object.values(populationByStateAndYear[selectedState]))] || [0, 10000000])
                .range([250, 50]);

            const xAxis = d3.axisBottom(xScale).tickFormat(d3.format("d"));
            const yAxis = d3.axisLeft(yScale);

            lineGraphSvg.append("g")
                .attr("transform", "translate(50,250)")
                .call(xAxis);

            lineGraphSvg.append("g")
                .attr("transform", "translate(50,0)")
                .call(yAxis);

            const line = d3.line()
                .x(d => xScale(d.year))
                .y(d => yScale(d.population));

            const data = Object.entries(populationByStateAndYear[selectedState])
                .map(([year, population]) => ({ year: +year, population }));

            lineGraphSvg.append("path")
                .datum(data)
                .attr("fill", "none")
                .attr("stroke", "red")
                .attr("stroke-width", 2)
                .attr("d", line);

            lineGraphSvg.append("text")
                .attr("x", 450)
                .attr("y", yScale(data[data.length - 1].population))
                .attr("fill", "black")
                .text(selectedState);
        }

        // Initial map load with the default year
        updateMap('2019');

        yearSelect.on("change", function () {
            const selectedYear = this.value;
            updateMap(selectedYear);
        });
    });
}).catch(error => console.error("Error loading data:", error));
