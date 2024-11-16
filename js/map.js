let selectedState = null;
let selectedYear = "2010";
let dataurl = "data/PopulationDataClean.csv"; //
let data = {}; // Store the processed data by state and year

// Function to load and render the interactive map
function loadMap() {
    Promise.all([
        d3.json("data/us.json"), // Load US map in TopoJSON format
        d3.csv(dataurl) // Load the dataset
    ])
        .then(([usMapData, valueData]) => {
            const svgWidth = document.querySelector("#map-container").clientWidth;
            const svgHeight = document.querySelector("#map-container").clientHeight;

            const svg = d3.select("#us-map-svg")
                .append("svg")
                .attr("width", svgWidth)
                .attr("height", svgHeight);

            const projection = d3.geoAlbersUsa()
                .scale(svgWidth / 1.5) // Adjust scale dynamically based on width
                .translate([svgWidth / 2, svgHeight / 2]); // Center the map dynamically

            const path = d3.geoPath().projection(projection);


            // Process value data by state and year
            valueData.forEach((d) => {
                if (!data[d.State]) {
                    data[d.State] = {};
                }
                data[d.State][d.Year] = +d.Value;
            });

            const states = topojson.feature(usMapData, usMapData.objects.states).features;

            // Define color scale for state values
            const colorScale = d3.scaleLinear()
                .domain([0, d3.max(valueData, (d) => +d.Value)])
                .range([0, 1]);

            // Render states and update colors dynamically
            function updateMap(year) {
                const valueByState = {};
                valueData.forEach((d) => {
                    if (d.Year === year) {
                        valueByState[d.State] = +d.Value;
                    }
                });

                svg.selectAll("path")
                    .data(states)
                    .join("path")
                    .attr("d", d3.geoPath())
                    .attr("fill", (d) => {
                        const stateName = d.properties.name;
                        const value = valueByState[stateName] || 0;
                        return d3.interpolateGreys(colorScale(value));
                    })
                    .attr("stroke", "#333")
                    .on("mouseover", function (event, d) {
                        const stateName = d.properties.name;
                        const value = valueByState[stateName] || "Unknown";
                        d3.select("#tooltip")
                            .style("display", "block")
                            .html(`<strong>${stateName}</strong><br>Value: ${value}`)
                            .style("left", event.pageX + 10 + "px")
                            .style("top", event.pageY - 30 + "px");
                    })
                    .on("mouseout", function () {
                        d3.select("#tooltip").style("display", "none");
                    })
                    .on("click", function (event, d) {
                        selectedState = d.properties.name;
                        console.log(`Selected state: ${selectedState}`);
                        updateGraphs(); // Update graphs for the selected state
                    });
            }

            // Initial render
            updateMap(selectedYear);

            // Dataset dropdown change listener
            d3.select("#datasetSelect").on("change", function () {
                const selectedDataset = this.value;
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
                        dataurl = "data/HousingYearlyDataClean.csv";
                        break;
                    default:
                        console.error("Unknown dataset selected.");
                        return;
                }

                d3.csv(dataurl).then((loadedData) => {
                    data = {}; // Reset the data
                    loadedData.forEach((d) => {
                        if (!data[d.State]) {
                            data[d.State] = {};
                        }
                        data[d.State][d.Year] = +d.Value;
                    });
                    updateMap(selectedYear); // Update the map with the new dataset
                    updateGraphs(); // Update the graphs for the new dataset
                });
            });

            // Year dropdown change listener
            d3.select("#yearSelect").on("change", function () {
                selectedYear = this.value;
                updateMap(selectedYear); // Update the map for the selected year
            });
        })
        .catch((error) => console.error("Error loading map data:", error));
}
