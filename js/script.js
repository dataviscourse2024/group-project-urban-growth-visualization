// Define color scale for population
const colorScale = d3.scaleQuantize()
    .domain([0, 10000000])  // Adjust based on population range
    .range(d3.schemePurples[9]);

// Set up tooltip for displaying information
const tooltip = d3.select("#tooltip");

// Dropdown element for year selection
const yearSelect = d3.select("#yearSelect");

Promise.all([
    d3.json('data/us.json'),  // Load the US map in TopoJSON format
    d3.csv('data/PopulationDataClean.csv')  // Load the population data
]).then(([usMapData, populationData]) => {
    const svgMap = d3.select("#us-map-svg");
    
    // Initial SVG load handling
    svgMap.on("load", function () {
        const svgDoc = this.contentDocument;
        const svgRoot = d3.select(svgDoc).select("svg");

        // Function to update the map based on the selected year
        function updateMap(year) {
            const populationByState = {};
            populationData.forEach(d => {
                if (d.Year === year) {
                    populationByState[d.State] = +d.Population;
                }
            });

            // Reapply D3 interaction when year changes
            svgRoot.selectAll("path")
                .data(topojson.feature(usMapData, usMapData.objects.states).features)
                .attr("fill", d => {
                    const stateName = d.properties.name;
                    const population = populationByState[stateName] || 0;
                    return colorScale(population);
                })
                .attr("stroke", "#333")
                .on("mouseover", function (event, d) {
                    const stateName = d.properties.name;
                    const population = populationByState[stateName] || "Unknown";
                    tooltip.style("display", "block")
                        .html(`<strong>${stateName}</strong><br>Population: ${population}`)
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 30) + "px");

                    d3.select(this).attr("previous-fill", d3.select(this).attr("fill"));
                    d3.select(this).attr("fill", "red");
                })
                .on("mouseout", function () {
                    tooltip.style("display", "none");
                    d3.select(this).attr("fill", d3.select(this).attr("previous-fill"));
                });
        }

        // Initial map load with the default year
        updateMap('2019');

        // Event listener for year dropdown, reapply the map with new data when the year changes
        yearSelect.on("change", function () {
            const selectedYear = this.value;
            updateMap(selectedYear);  // Update the map with the selected year
        });
    });
}).catch(error => console.error("Error loading data:", error));
