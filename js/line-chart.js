class LineChart {
  constructor(globalApplicationState) {
    // Expected input: Array of objects
  


    this.globalApplicationState = globalApplicationState;
    this.data = this.globalApplicationState.currData;

    // Set up margins, width, and height
    this.margin = { top: 20, right: 50, bottom: 50, left: 80 };
    this.width = 800 - this.margin.left - this.margin.right;
    this.height = 500 - this.margin.top - this.margin.bottom;

    // Set up SVG container for the line chart
    this.svg = d3.select("#graph")
      .attr("width", this.width + this.margin.left + this.margin.right)
      .attr("height", this.height + this.margin.top + this.margin.bottom)
      .append("g")
      .attr("transform", `translate(${this.margin.left},${this.margin.top})`);

    this.createChart();
  }

  createChart() {
    // Parse and group the data by state
    const groupedData = d3.group(this.data, d => d.State);

    // Set up scales
    const xScale = d3.scaleLinear()
      .domain(d3.extent(this.data, d => +d.Year))
      .range([0, this.width]);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(this.data, d => +d.Value)])
      .range([this.height, 0]);

    // Add axes
    const xAxis = d3.axisBottom(xScale).tickFormat(d3.format("d"));
    const yAxis = d3.axisLeft(yScale);

    this.svg.append("g")
      .attr("transform", `translate(0,${this.height})`)
      .call(xAxis);

    this.svg.append("g")
      .call(yAxis);

    // Line generator
    const line = d3.line()
      .x(d => xScale(+d.Year))
      .y(d => yScale(+d.Value));

    // Draw lines for each state
    groupedData.forEach((values, state) => {
      this.svg.append("path")
        .datum(values)
        .attr("fill", "none")
        .attr("stroke", this.getColor(state))
        .attr("stroke-width", 2)
        .attr("d", line);
    });

    // Add labels or legend if needed
  }

  // Utility to assign colors to each state
  getColor(state) {
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);
    return colorScale(state);
  }
}
