class LineChart {
    constructor(globalApplicationState) {
        this.globalApplicationState = globalApplicationState;

        // Create the SVG container
        this.svg = d3.select("#line-chart")
            .append("svg")
            .attr("width", 800) // Set your desired width
            .attr("height", 400) // Set your desired height
            .attr("viewBox", [0, 0, 800, 400]);

        // Margins for axes
        this.margin = { top: 20, right: 30, bottom: 50, left: 50 };
        this.innerWidth = 800 - this.margin.left - this.margin.right;
        this.innerHeight = 400 - this.margin.top - this.margin.bottom;

        // Append a group element for the chart contents
        this.chartGroup = this.svg.append("g")
            .attr("transform", `translate(${this.margin.left}, ${this.margin.top})`);

        // Add groups for axes
        this.xAxisGroup = this.chartGroup.append("g")
            .attr("transform", `translate(0, ${this.innerHeight})`);

        this.yAxisGroup = this.chartGroup.append("g");

        // Initialize scales
        this.xScale = d3.scaleLinear().range([0, this.innerWidth]);
        this.yScale = d3.scaleLinear().range([this.innerHeight, 0]);

        // Add labels
        this.svg.append("text")
            .attr("x", this.margin.left + this.innerWidth / 2)
            .attr("y", 390) // Adjust based on your SVG height
            .style("text-anchor", "middle")
            .text("Year");

        this.svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -(this.margin.top + this.innerHeight / 2))
            .attr("y", 20) // Adjust based on your margins
            .style("text-anchor", "middle")
            .text("Value");

        console.log("LineChart initialized with globalApplicationState:", this.globalApplicationState);
        console.log("SVG Element:", this.svg);
    }

    /**
     * Update chart data
     * @param {Array} selectedStates - Array of selected state names
     * @param {string} selectedYear - Selected year
     * @param {Array} currData - Current dataset
     */
    updateChart(selectedStates, selectedYear, currData) {
        if (!currData) return;
    
        // Check if selectedStates is empty
        const statesToDisplay = selectedStates.length > 0
            ? selectedStates
            : [...new Set(currData.map(d => d.State))]; // Include all states if none are selected
    
        // Filter the data based on selected states and year
        const filteredData = currData.filter(d =>
            statesToDisplay.includes(d.State) && +d.Year <= +selectedYear
        );
    
        const parsedData = filteredData.map(d => ({
            State: d.State,
            Year: +d.Year, // Ensure numeric
            Value: +d.Value // Ensure numeric
        }));
    
        console.log("Filtered and parsed data for chart:", parsedData);
    
        // Update scales and redraw axes
        this.xScale.domain(d3.extent(parsedData, d => d.Year));
        this.yScale.domain([0, d3.max(parsedData, d => d.Value)]);
    
        this.xAxisGroup.call(d3.axisBottom(this.xScale));
        this.yAxisGroup.call(d3.axisLeft(this.yScale));
    
        // Draw the line(s)
        const line = d3.line()
            .x(d => this.xScale(d.Year))
            .y(d => this.yScale(d.Value));
    
        const states = d3.group(parsedData, d => d.State);
    
        this.svg.selectAll(".line")
            .data(states)
            .join("path")
            .attr("class", "line")
            .attr("d", ([, values]) => line(values))
            .style("stroke", "steelblue")
            .style("fill", "none");
    }    
}
