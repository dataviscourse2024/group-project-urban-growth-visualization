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

    updateChart(selectedStates, selectedYear) {
        console.log(`updateChart called with selectedStates: ${selectedStates} and selectedYear: ${selectedYear}`);
    
        // Check if data is available
        if (!this.data || this.data.length === 0) {
            console.error("LineChart: No data available to update the chart.");
            return;
        }
    
        // Check if any states are selected
        if (!selectedStates || selectedStates.length === 0) {
            console.log("No states selected. Clearing the line chart.");
    
            // Clear the chart
            this.svg.selectAll("*").remove();
            return;
        }
    
        // Filter data based on selected states and year
        const filteredData = this.data.filter(
            d => selectedStates.includes(d.state) && d.year === selectedYear
        );
    
        console.log(`Filtered data: ${filteredData.length > 0 ? filteredData : "No matching data found"}`);
    
        // If no data matches the filters, clear the chart
        if (filteredData.length === 0) {
            console.log("No data available for the selected states and year.");
            this.svg.selectAll("*").remove();
            return;
        }
    
        // Render chart using the filtered data
        try {
            // Clear the chart before rendering new elements
            this.svg.selectAll("*").remove();
    
            // Define scales (adjust based on your data)
            const xScale = d3
                .scaleLinear()
                .domain(d3.extent(filteredData, d => d.year))
                .range([this.margin.left, this.width - this.margin.right]);
    
            const yScale = d3
                .scaleLinear()
                .domain([0, d3.max(filteredData, d => d.value)])
                .range([this.height - this.margin.bottom, this.margin.top]);
    
            // Define axes
            const xAxis = d3.axisBottom(xScale).tickFormat(d3.format("d"));
            const yAxis = d3.axisLeft(yScale);
    
            // Append axes to the SVG
            this.svg
                .append("g")
                .attr("transform", `translate(0, ${this.height - this.margin.bottom})`)
                .call(xAxis);
    
            this.svg
                .append("g")
                .attr("transform", `translate(${this.margin.left}, 0)`)
                .call(yAxis);
    
            // Create line generator
            const line = d3
                .line()
                .x(d => xScale(d.year))
                .y(d => yScale(d.value));
    
            // Bind data and create lines
            this.svg
                .selectAll(".line")
                .data(filteredData)
                .enter()
                .append("path")
                .attr("class", "line")
                .attr("d", d => line(d.values)) // Adjust 'values' as per your data structure
                .attr("stroke", "steelblue")
                .attr("stroke-width", 2)
                .attr("fill", "none");
    
            console.log("Chart successfully updated.");
        } catch (error) {
            console.error("Error while updating the chart:", error);
        }
    }    
}

// Initialize Line Chart
const lineChart = new LineChart(globalApplicationState);
globalApplicationState.currGraph = lineChart;
