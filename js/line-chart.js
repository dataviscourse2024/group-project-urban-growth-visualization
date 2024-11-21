class LineChart {
    constructor(globalApplicationState) {
        if (!globalApplicationState) {
            console.error("Error: globalApplicationState is undefined.");
            return;
        }
        this.globalApplicationState = globalApplicationState;
        this.svg = d3.select("#line-chart")
            .attr("width", "100%")
            .attr("height", "100%");
        this.margin = { top: 20, right: 30, bottom: 30, left: 40 };
        this.width = parseInt(this.svg.style("width")) - this.margin.left - this.margin.right;
        this.height = parseInt(this.svg.style("height")) - this.margin.top - this.margin.bottom;
        this.g = this.svg.append("g")
            .attr("transform", `translate(${this.margin.left},${this.margin.top})`);
    }

    updateChart(selectedStates) {
        // Clear previous content
        this.g.selectAll("*").remove();
    
        const data = this.globalApplicationState.currData;
        if (!Array.isArray(data)) {
            console.error("Error: Data is not an array.");
            return;
        }
    
        const filteredData = data.filter(d => selectedStates.includes(d.State));
    
        //console.log("Line chart selected states: ", selectedStates);
        if (filteredData.length === 0) {
            // Show empty chart message
            this.g.append("text")
                .attr("x", this.width / 2)
                .attr("y", this.height / 2)
                .attr("text-anchor", "middle")
                .text("No states selected.");
            return;
        }

        // Parse data for line chart
        const groupedData = d3.group(filteredData, d => d.State); // Ensure this works with the data format
        const years = Array.from(new Set(data.map(d => +d.Year)));
        const x = d3.scaleLinear().domain(d3.extent(years)).range([0, this.width]);
        const y = d3.scaleLinear()
            .domain([0, d3.max(filteredData, d => +d.Value)])
            .range([this.height, 0]);
    
        const color = d3.scaleOrdinal(d3.schemeCategory10);
    
        // Draw axes
        this.g.append("g").attr("transform", `translate(0,${this.height})`).call(d3.axisBottom(x));
        this.g.append("g").call(d3.axisLeft(y));
    
        // Draw lines
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
