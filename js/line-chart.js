class LineChart {
    constructor(globalApplicationState) {
        // Bind the global application state
        this.globalApplicationState = globalApplicationState;
        this.updateChart = this.updateChart.bind(this);

        // Set chart dimensions
        this.margin = { top: 20, right: 30, bottom: 30, left: 50 };
        this.width = 600 - this.margin.left - this.margin.right;
        this.height = 400 - this.margin.top - this.margin.bottom;

        // Create the SVG container
        this.svg = d3.select("#line-chart")
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom);

        // Create a group element for content
        this.g = this.svg.append("g")
            .attr("transform", `translate(${this.margin.left},${this.margin.top})`);

        // Initialize scales and axes
        this.xScale = d3.scaleTime().range([0, this.width]);
        this.yScale = d3.scaleLinear().range([this.height, 0]);

        this.xAxis = d3.axisBottom(this.xScale);
        this.yAxis = d3.axisLeft(this.yScale);

        // Append axes groups
        this.g.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0, ${this.height})`);

        this.g.append("g")
            .attr("class", "y-axis");

        // Add a path element for the line
        this.line = d3.line()
            .x(d => this.xScale(d.Year))
            .y(d => this.yScale(d.Value));

        // Add debugging logs
        console.log("LineChart initialized with globalApplicationState:", this.globalApplicationState);
    }

    updateChart(selectedStates) {
        // Log the states passed to the chart
        console.log("updateChart called with selectedStates:", selectedStates);
    
        if (!this.globalApplicationState) {
            console.error("Error: globalApplicationState line-chart is undefined in updateChart.");
            return;
        }
        // Validate currData from global application state
        const data = this.globalApplicationState.currData;
        if (!data || data.length === 0) {
            console.error("Error: currData is null or empty.");
            return;
        }
    
        // Filter data for selected states
        const filteredData = data.filter(d => selectedStates.includes(d.State));
        console.log("Filtered data:", filteredData);
    
        if (filteredData.length === 0) {
            console.warn("No data available for the selected states.");
            this.g.selectAll("*").remove(); // Clear the chart if no data is available
            this.g.append("text")
                .attr("x", this.width / 2)
                .attr("y", this.height / 2)
                .attr("text-anchor", "middle")
                .text("No data for selected states.");
            return;
        }
    
        // Clear any previous content from the chart
        this.g.selectAll("*").remove();
    
        // Define years (2012-2024) for the x-axis domain
        const years = Array.from(new Set(filteredData.map(d => +d.Year)));
        const x = d3.scaleLinear()
            .domain(d3.extent(years)) // Extent finds [min, max]
            .range([0, this.width]);
    
        // Define y-axis domain based on values
        const y = d3.scaleLinear()
            .domain([0, d3.max(filteredData, d => +d.Value)])
            .range([this.height, 0]);
    
        // Create a color scale for states
        const color = d3.scaleOrdinal(d3.schemeCategory10);
    
        // Add x-axis
        this.g.append("g")
            .attr("transform", `translate(0,${this.height})`)
            .call(d3.axisBottom(x).tickFormat(d3.format("d"))); // Format years as integers
    
        // Add y-axis
        this.g.append("g")
            .call(d3.axisLeft(y));
    
        // Group data by state for plotting
        const groupedData = d3.group(filteredData, d => d.State);
    
        // Plot a line for each state
        groupedData.forEach((stateData, state) => {
            this.g.append("path")
                .datum(stateData)
                .attr("fill", "none")
                .attr("stroke", color(state))
                .attr("stroke-width", 1.5)
                .attr("d", d3.line()
                    .x(d => x(+d.Year))
                    .y(d => y(+d.Value))
                );
    
            // Add labels or tooltips if necessary (optional)
        });
    
        // Add legend
        const legend = this.g.append("g").attr("transform", `translate(${this.width - 100},20)`);
        Array.from(groupedData.keys()).forEach((state, i) => {
            legend.append("rect")
                .attr("x", 0)
                .attr("y", i * 20)
                .attr("width", 10)
                .attr("height", 10)
                .attr("fill", color(state));
            legend.append("text")
                .attr("x", 15)
                .attr("y", i * 20 + 10)
                .text(state);
        });
    } 
}

// Initialize Line Chart
const lineChart = new LineChart(globalApplicationState);
globalApplicationState.currGraph = lineChart;
