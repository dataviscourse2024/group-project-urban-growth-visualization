// Define color scale for population
const colorScale = d3.scaleQuantize()
    .domain([0, 10000000])  // Adjust based on population range
    .range(d3.schemePurples[9]);

// Set up tooltip for displaying information
const tooltip = d3.select("#tooltip");

Promise.all([
    d3.json('data/us.json'),  // Load the US map in TopoJSON format
    d3.csv('data/PopulationDataClean.csv')  // Load the population data
]).then(([usMapData, populationData]) => {
    // Map population data by state name
    const populationByState = {};
    populationData.forEach(d => {
        populationByState[d.State] = +d.Population;
    });

    // Once the SVG is loaded, apply D3 interaction
    d3.select("#us-map-svg").on("load", function () {
        const svgDoc = this.contentDocument;
        const svgRoot = d3.select(svgDoc).select("svg");

        // Select all state paths by their IDs or names (depends on how the SVG paths are identified)
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
            })
            .on("mouseout", function () {
                tooltip.style("display", "none");
            });
    });
});
