class Map {
    constructor(globalApplicationState) {
        if (!globalApplicationState) {
            console.error("Error: globalApplicationState is undefined.");
            return;
        }

        console.log("Initializing Map with globalApplicationState:", globalApplicationState);

        //if (!Array.isArray(globalApplicationState.mapData)) {
        //    console.error("Error: mapData is not iterable. Received:", globalApplicationState.mapData);
        //    return;
        //}

        this.globalApplicationState = globalApplicationState;
        this.globalApplicationState.selectedStates = [];
    }





    loadMap() {
        const width = 975;
        const height = 610;

        // Clear any existing map content
        const mapContainer = d3.select("#us-map-svg");
        mapContainer.selectAll("*").remove();

        const mapData = globalApplicationState.mapData;

        let valueData = this.globalApplicationState.currData;


        if (!mapData || !valueData) {
            console.error("Error: Map or population data is not loaded.");
            return;
        }

        // Tooltip setup
        const tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("position", "absolute")
            .style("background-color", "#f9f9f9")
            .style("border", "1px solid #ccc")
            .style("padding", "10px")
            .style("border-radius", "5px")
            .style("box-shadow", "0px 2px 6px rgba(0, 0, 0, 0.2)")
            .style("display", "none")
            .style("pointer-events", "none");

        //different colored gradients for each dataset
        const colorSchemes = {
            "population": d3.interpolateBlues,
            "jobGrowth": d3.interpolateReds,
            "income": d3.interpolateGreens,
            "housing": d3.interpolatePurples
        };

        //display overlay text differently for each dataset
        const numberFormatter = new Intl.NumberFormat("en-US", {
            maximumFractionDigits: 3 // Adjust precision as needed
        });
        const displayFormats = {
            "population": value => `Total Population: ${numberFormatter.format(value)}`,
            "jobGrowth": value => `Number of Jobs (Thousands): ${numberFormatter.format(value)}`,
            "income": value => `Median Income: $${numberFormatter.format(value.toFixed(2))}`,
            "housing": value => `Median House Price: $${numberFormatter.format(value.toFixed(2))}`
        }

        let valueByState = {};
        let colorScale;

        // Function to update data and color scale for the selected year
        function updateDataForYear(year) {


            // Prepare `valueByState` for the selected year
            valueByState = {};
            valueData.forEach(d => {
                if (!valueByState[d.State]) {
                    valueByState[d.State] = {};
                }
                valueByState[d.State][d.Year] = +d.Value;
            });


            let valuesForYear = valueData
                .filter(d => d.Year === year && d.State !== "United States") //Prevent the total from being the max value.
                .map(d => +d.Value);

            let dataMinusUs = valueData
                .filter(d => d.State !== "United States") //Prevent the total from being the max value.
                .map(d => +d.Value);
            
            let minValue = d3.min(dataMinusUs) || 0;
            let maxValue = d3.max(dataMinusUs) || 0; // Default to 0 if no values


            // Define `colorScale` dynamically based on the data for the year
            colorScale = d3.scaleSequential(colorSchemes[globalApplicationState.selectedDataset]).domain([minValue, maxValue]);
        
            updateLegend(minValue, maxValue)
        }

        // Set up zoom behavior
        const zoom = d3.zoom()
            .scaleExtent([1, 8])
            .on("zoom", zoomed);

        const svg = mapContainer
            .append("svg")
            .attr("viewBox", [0, 0, width, height])
            .attr("width", width)
            .attr("height", height)
            .attr("style", "max-width: 100%; height: auto;")
            .on("click", reset);

        const path = d3.geoPath();

        const g = svg.append("g");

        updateDataForYear(globalApplicationState.selectedYear);

        // Draw the states
        let states = g.append("g")
            .attr("fill", "#ccc")
            .attr("cursor", "pointer")
            .selectAll("path")
            .data(topojson.feature(mapData, mapData.objects.states).features)
            .join("path")
            .on("mouseover", function (event, d) {
                const stateElement = d3.select(this);
                const isSelected = stateElement.attr("data-selected") === "true";

                if (!isSelected) {
                    stateElement
                        .interrupt()
                        .transition()
                        .duration(300)
                        .style("fill", "gray");
                }

                const stateName = d.properties.name;
                const value = valueByState[stateName]?.[globalApplicationState.selectedYear] || "Unknown";
                let displayFunction = displayFormats[globalApplicationState.selectedDataset];
                tooltip
                    .style("display", "block")
                    .html(`<strong>${stateName}:</strong><br>  ${displayFunction(value)}`)
                    .style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY - 65}px`);

                d3.select(this).on("mousemove", function (event) {
                    tooltip
                        .style("left", `${event.pageX + 10}px`)  // Update tooltip position on mouse move
                        .style("top", `${event.pageY - 65}px`);  // Update tooltip position on mouse move
                });
            })
            .on("mouseout", function (event, d) {
                const stateElement = d3.select(this);
                const isSelected = stateElement.attr("data-selected") === "true";

                if (!isSelected) {
                    const stateName = d.properties.name;
                    const value = valueByState[stateName]?.[globalApplicationState.selectedYear] || 0;

                    stateElement.interrupt().transition().duration(300).style("fill", () => colorScale(value));
                }

                tooltip.style("display", "none");
            })
            .on("click", clicked)
            .attr("d", path)
            .attr("fill", d => {
                const stateName = d.properties.name;
                const value = valueByState[stateName]?.[globalApplicationState.selectedYear] || 0;

                if (!colorScale) {
                    console.error("colorScale is not initialized!");
                    return "#ccc";
                }

                return colorScale(value);
            });

        // Draw inner borders (borders between states)
        g.append("path")
            .attr("fill", "none")
            .attr("stroke", "black")  // Black color for inner borders
            .attr("stroke-width", 0.5)  // Thin line for inner borders
            .attr("d", path(topojson.mesh(mapData, mapData.objects.states, (a, b) => a !== b))); // Only inner borders

        // Draw outer borders (entire map border)
        g.append("path")
            .attr("fill", "none")
            .attr("stroke", "black")  // Black color for outer borders
            .attr("stroke-width", 0.5)  // Thin line for outer borders
            .attr("d", path(topojson.mesh(mapData, mapData.objects.states, (a, b) => a === b))); // Outer borders

        svg.call(zoom);

        function reset() {
            states.transition().duration(300).attr("fill", d => {
                const stateName = d.properties.name;
                const value = valueByState[stateName]?.[globalApplicationState.selectedYear] || 0;
                return colorScale(value);
            });
        }

        globalApplicationState.selectedStates = [];

        function clicked(event, d) {
            const stateElement = d3.select(this);
            const stateName = d.properties.name;
            const isSelected = stateElement.attr("data-selected") === "true";

            stateElement.interrupt();

            if (isSelected) {
                stateElement
                    .attr("data-selected", "false")
                    .transition()
                    .duration(300)
                    .attr("fill", () => {
                        const value = valueByState[stateName]?.[globalApplicationState.selectedYear] || 0;
                        return colorScale(value);
                    });
                globalApplicationState.selectedStates = globalApplicationState.selectedStates.filter(name => name !== stateName);
            } else {
                stateElement
                    .attr("data-selected", "true")
                    .style("fill", "orange");
                globalApplicationState.selectedStates.push(stateName);
            }

            console.log("Updated selected states:", globalApplicationState.selectedStates);

            let selected = globalApplicationState.selectedStates;
            const eventDetail = { selected };
            document.dispatchEvent(new CustomEvent("stateSelectionChanged", { detail: eventDetail }));

            zoomToSelectedStates();
        }

        function updateLegend(minValue, maxValue) {
            // Remove any existing legend
            d3.select("#legend-container").remove();
        
            // Append a container for the legend at the bottom of the map-container
            const mapContainer = d3.select("#map-container");
            const legendContainer = mapContainer.append("div")
                .attr("id", "legend-container")
                .style("display", "flex")
                .style("justify-content", "center")
                .style("align-items", "center")
                .style("margin-top", "10px");
        
            // Set legend dimensions
            const legendWidth = 300;
            const legendHeight = 20;
        
            // Append the SVG for the legend
            const legendSvg = legendContainer.append("svg")
                .attr("width", legendWidth)
                .attr("height", legendHeight);
        
            // Create a gradient for the legend
            const gradientId = "color-gradient";
            const defs = legendSvg.append("defs");
            const gradient = defs.append("linearGradient")
                .attr("id", gradientId)
                .attr("x1", "0%")
                .attr("x2", "100%")
                .attr("y1", "0%")
                .attr("y2", "0%");
        
            // Add color stops based on the color scale
            gradient.append("stop")
                .attr("offset", "0%")
                .attr("stop-color", colorScale(minValue));
            gradient.append("stop")
                .attr("offset", "100%")
                .attr("stop-color", colorScale(maxValue));
        
            // Draw the gradient rectangle
            legendSvg.append("rect")
                .attr("x", 0)
                .attr("y", 0)
                .attr("width", legendWidth)
                .attr("height", legendHeight)
                .style("fill", `url(#${gradientId})`);
        
            // Add min and max labels below the legend
            const labelContainer = legendContainer.append("div")
                .style("display", "flex")
                .style("justify-content", "space-between")
                .style("width", `${legendWidth}px`)
                .style("margin-top", "5px");
        
            labelContainer.append("div")
                .text(minValue.toLocaleString())
                .style("text-align", "left");
        
            labelContainer.append("div")
                .text(maxValue.toLocaleString())
                .style("text-align", "right");
        }
        
        
        
        function zoomToSelectedStates() {
            if (globalApplicationState.selectedStates.length === 0) {
                svg.transition().duration(750).call(
                    zoom.transform,
                    d3.zoomIdentity,
                    d3.zoomTransform(svg.node()).invert([width / 2, height / 2])
                );
                return;
            }

            const selectedFeatures = topojson.feature(mapData, mapData.objects.states).features.filter(d =>
                globalApplicationState.selectedStates.includes(d.properties.name)
            );

            const bounds = selectedFeatures.reduce(
                (acc, feature) => {
                    const [[x0, y0], [x1, y1]] = path.bounds(feature);
                    return [
                        [Math.min(acc[0][0], x0), Math.min(acc[0][1], y0)],
                        [Math.max(acc[1][0], x1), Math.max(acc[1][1], y1)]
                    ];
                },
                [[Infinity, Infinity], [-Infinity, -Infinity]]
            );

            const [[x0, y0], [x1, y1]] = bounds;

            const dx = x1 - x0;
            const dy = y1 - y0;
            const x = (x0 + x1) / 2;
            const y = (y0 + y1) / 2;
            const scale = Math.min(8, 0.9 / Math.max(dx / width, dy / height));
            const translate = [width / 2 - scale * x, height / 2 - scale * y];

            svg.transition().duration(750).call(
                zoom.transform,
                d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
            );
        }

        // Apply zoom transformations
        function zoomed(event) {
            const { transform } = event;
            g.attr("transform", transform);
            g.attr("stroke-width", 1 / transform.k);
        }

        // Update the map when the year changes
        d3.select("#yearSelect").on("change", function () {
            globalApplicationState.selectedYear = d3.select(this).property("value");
            console.log("Selected year (from dropdown):", globalApplicationState.selectedYear);

            // Update data and color scale for the new year
            updateDataForYear(globalApplicationState.selectedYear);

            // Rebind data and update state colors
            states
                .transition()
                .duration(300)
                .attr("fill", d => {
                    const stateName = d.properties.name;
                    const value = valueByState[stateName]?.[globalApplicationState.selectedYear] || 0;

                    if (!colorScale) {
                        console.error("colorScale is not initialized!");
                        return "#ccc"; // Default fallback color
                    }

                    return colorScale(value);
                });
        });

    }
}            