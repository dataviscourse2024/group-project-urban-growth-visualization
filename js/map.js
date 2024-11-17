// Define the dataurl globally with a default dataset
let dataurl = "data/PopulationDataClean.csv"; // Default dataset

// Event listener for dataset dropdown
d3.select("#datasetSelect").on("change", function () {
  const selectedDataset = this.value;

  // Update the global dataurl variable based on the selected dataset
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

  // Reload the map with the new dataset
  loadMap();
});

function loadMap() {
    const width = 975;
    const height = 610;
  
    // Clear any existing map content
    const mapContainer = d3.select("#us-map-svg");
    mapContainer.selectAll("*").remove();
  
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
  
    // Load map and data
    Promise.all([
      d3.json("data/us.json"), // TopoJSON map
      d3.csv(dataurl) // CSV data for population, income, etc.
    ])
      .then(([us, valueData]) => {
        let valueByState = {};
        let colorScale; // Ensure `colorScale` is properly scoped and initialized
  
        // Function to update data and color scale for the selected year
        function updateDataForYear(year) {
          console.log("Updating data for year:", year);
  
          // Prepare `valueByState` for the selected year
          valueByState = {};
          valueData.forEach(d => {
            if (!valueByState[d.State]) {
              valueByState[d.State] = {};
            }
            valueByState[d.State][d.Year] = +d.Value;
          });
  
          // Get values for the year and update the color scale
          const valuesForYear = valueData
            .filter(d => d.Year === year)
            .map(d => +d.Value);
  
          const maxValue = d3.max(valuesForYear) || 0; // Default to 0 if no values
          console.log("Max value for year:", maxValue);
  
          // Define `colorScale` dynamically based on the data for the year
          colorScale = d3.scaleSequential(d3.interpolateBlues).domain([0, maxValue]);
  
          // Validate `colorScale`
          console.log("Color scale initialized:", colorScale);
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
  
        // Fetch the initial year dynamically
        const initialYear = d3.select("#yearSelect").property("value");
        updateDataForYear(initialYear); // Initialize data and color scale for the initial year
  
        // Draw the states
        let states = g.append("g")
          .attr("fill", "#ccc")
          .attr("cursor", "pointer")
          .selectAll("path")
          .data(topojson.feature(us, us.objects.states).features)
          .join("path")
          .on("mouseover", function (event, d) {
            const stateName = d.properties.name;
            const year = d3.select("#yearSelect").property("value"); // Fetch dynamically
            const value = valueByState[stateName]?.[year] || "Unknown";
  
            // Show tooltip
            tooltip
              .style("display", "block")
              .html(`<strong>${stateName}</strong><br>Value: ${value}`)
              .style("left", (event.pageX + 10) + "px")
              .style("top", (event.pageY - 30) + "px");
  
            // Highlight the state
            d3.select(this).transition().duration(300).attr("fill", "steelblue");
          })
          .on("mouseout", function (event, d) {
            const stateName = d.properties.name;
            const year = d3.select("#yearSelect").property("value"); // Fetch dynamically
  
            // Hide tooltip
            tooltip.style("display", "none");
  
            // Reset state color
            d3.select(this).transition().duration(300)
              .attr("fill", d => {
                const value = valueByState[d.properties.name]?.[year] || 0;
                return colorScale(value);
              });
          })
          .on("click", clicked)
          .attr("d", path)
          .attr("fill", d => {
            const stateName = d.properties.name;
            const year = d3.select("#yearSelect").property("value"); // Fetch dynamically
            const value = valueByState[stateName]?.[year] || 0;
  
            // Validate `colorScale` before using it
            if (!colorScale) {
              console.error("colorScale is not initialized!");
              return "#ccc"; // Default fallback color
            }
  
            return colorScale(value);
          });
  
        g.append("path")
          .attr("fill", "none")
          .attr("stroke", "white")
          .attr("stroke-linejoin", "round")
          .attr("d", path(topojson.mesh(us, us.objects.states, (a, b) => a !== b)));
  
        svg.call(zoom);
  
        // Reset zoom and color
        function reset() {
          const year = d3.select("#yearSelect").property("value"); // Fetch dynamically
          states.transition().duration(300).attr("fill", d => {
            const stateName = d.properties.name;
            const value = valueByState[stateName]?.[year] || 0;
            return colorScale(value);
          });
          svg.transition().duration(750).call(
            zoom.transform,
            d3.zoomIdentity,
            d3.zoomTransform(svg.node()).invert([width / 2, height / 2])
          );
        }
  
        // Zoom into a specific state when clicked
        function clicked(event, d) {
          const year = d3.select("#yearSelect").property("value"); // Fetch dynamically
          const [[x0, y0], [x1, y1]] = path.bounds(d);
          event.stopPropagation();
          states.transition().duration(300).attr("fill", d => {
            const stateName = d.properties.name;
            const value = valueByState[stateName]?.[year] || 0;
            return colorScale(value);
          });
          d3.select(this).transition().style("fill", "red");
          svg.transition().duration(750).call(
            zoom.transform,
            d3.zoomIdentity
              .translate(width / 2, height / 2)
              .scale(Math.min(8, 0.9 / Math.max((x1 - x0) / width, (y1 - y0) / height)))
              .translate(-(x0 + x1) / 2, -(y0 + y1) / 2),
            d3.pointer(event, svg.node())
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
          const year = d3.select(this).property("value");
          console.log("Selected year (from dropdown):", year);
  
          // Update data and color scale for the new year
          updateDataForYear(year);
  
          // Rebind data and update state colors
          states
            .transition()
            .duration(300)
            .attr("fill", d => {
              const stateName = d.properties.name;
              const value = valueByState[stateName]?.[year] || 0;
  
              // Validate `colorScale` before using it
              if (!colorScale) {
                console.error("colorScale is not initialized!");
                return "#ccc"; // Default fallback color
              }
  
              return colorScale(value);
            });
        });
      })
      .catch(error => console.error("Error loading data:", error));
  }
  
  // Initial map load
  loadMap();  