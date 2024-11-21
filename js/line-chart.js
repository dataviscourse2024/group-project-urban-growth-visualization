class LineChart {
    constructor(globalApplicationState) {
        this.globalApplicationState = globalApplicationState;

        // Define chart dimensions and margins
        this.margin = { top: 20, right: 30, bottom: 30, left: 40 };
        this.width = 800 - this.margin.left - this.margin.right;
        this.height = 400 - this.margin.top - this.margin.bottom;

        this.svg = d3.select("#line-chart")
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom)
            .append("g")
            .attr("transform", `translate(${this.margin.left},${this.margin.top})`);

        this.initializeAxes();

        console.log("LineChart initialized with globalApplicationState:", this.globalApplicationState);
    }

    initializeAxes() {
        // Initialize scales
        this.xScale = d3.scaleLinear().range([0, this.width]);
        this.yScale = d3.scaleLinear().range([this.height, 0]);

        // Append x-axis
        this.xAxis = this.svg.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0,${this.height})`);

        // Append y-axis
        this.yAxis = this.svg.append("g")
            .attr("class", "y-axis");
    }

    updateChart(selectedStates, selectedYear, selectedDataset) {
        console.log(`updateChart called with selectedStates: ${selectedStates}, selectedYear: ${selectedYear}, and selectedDataset: ${selectedDataset}`);
    
        if (!selectedStates || selectedStates.length === 0) {
            console.log("LineChart: No states selected. Clearing the line chart.");
            this.clearChart();
            return;
        }
    
        // Use the data passed to the function to filter relevant entries
        const filteredData = data[`${selectedDataset}Data`].filter(d =>
            selectedStates.includes(d.State) &&
            d.Year === selectedYear
        );
    
        console.log("Filtered data:", filteredData);
    
        if (filteredData.length === 0) {
            console.log("LineChart: No data available to update the chart.");
            this.clearChart();
            return;
        }
    
        // Call renderChart to update the visualization
        this.renderChart(filteredData);
    }

    renderChart(data) {
        console.log("Rendering chart with data:", data);

        // Extract x and y values for scales
        const xValues = data.map(d => d.Year);
        const yValues = data.map(d => d.Value);

        this.xScale.domain(d3.extent(xValues));
        this.yScale.domain([0, d3.max(yValues)]);

        // Update axes
        this.xAxis.transition().duration(500).call(d3.axisBottom(this.xScale).tickFormat(d3.format("d")));
        this.yAxis.transition().duration(500).call(d3.axisLeft(this.yScale));

        // Bind data
        const line = d3.line()
            .x(d => this.xScale(d.Year))
            .y(d => this.yScale(d.Value));

        this.svg.selectAll(".line").remove(); // Clear previous line

        this.svg.append("path")
            .datum(data)
            .attr("class", "line")
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("stroke-width", 1.5)
            .attr("d", line);
    }

    clearChart() {
        console.log("LineChart cleared.");
        this.svg.selectAll("*").remove(); // Clear the line chart
        this.initializeAxes(); // Re-initialize axes to keep the structure
    }
}
