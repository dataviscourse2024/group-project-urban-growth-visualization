class LineChart {
    constructor(globalApplicationState) {
      this.globalApplicationState = globalApplicationState;
  
      // Set up the SVG
      this.svg = d3.select("#graph1").append("svg")
        .attr("width", 800)
        .attr("height", 500);
  
      this.margin = { top: 50, right: 50, bottom: 50, left: 75 };
      this.width = 800 - this.margin.left - this.margin.right;
      this.height = 500 - this.margin.top - this.margin.bottom;
  
      this.chartGroup = this.svg
        .append("g")
        .attr("transform", `translate(${this.margin.left},${this.margin.top})`);
  
      // Axes groups
      this.xAxisGroup = this.chartGroup.append("g")
        .attr("transform", `translate(0, ${this.height})`);
  
      this.yAxisGroup = this.chartGroup.append("g");
  
      // Initialize scales
      this.xScale = d3.scaleLinear().range([0, this.width]); // Years
      this.yScale = d3.scaleLinear().range([this.height, 0]); // Values
  
      // Line color scale
      this.colorScale = d3.scaleOrdinal(d3.schemeCategory10);
  
      // Group for lines
      this.linesGroup = this.chartGroup.append("g")
        .attr("id", "lines");
  
      // Initialize the chart
      this.updateSelectedStates();
    }
  
    /**
     * Updates the line chart based on the selected states.
     */
    updateSelectedStates() {
        const data = this.getDataForCurrentSelection();
        console.log("Data for selected states:", data);
    
        if (data.length === 0) {
            this.linesGroup.selectAll("path").remove();
            this.xAxisGroup.call(d3.axisBottom(this.xScale).ticks(0));
            this.yAxisGroup.call(d3.axisLeft(this.yScale).ticks(0));
            return;
        }
    
        const allYears = data.flatMap(d => d.map(e => +e.Year));
        const allValues = data.flatMap(d => d.map(e => +e.Value));
    
        this.xScale.domain(d3.extent(allYears));
        this.yScale.domain([0, d3.max(allValues)]);
    
        const lineGenerator = d3.line()
            .x(d => this.xScale(+d.Year))
            .y(d => this.yScale(+d.Value));
    
        this.linesGroup.selectAll("path")
            .data(data)
            .join("path")
            .attr("fill", "none")
            .attr("stroke-width", 2)
            .attr("stroke", d => this.colorScale(d[0].State))
            .attr("d", d => lineGenerator(d));
    
        this.xAxisGroup.call(d3.axisBottom(this.xScale).tickFormat(d3.format("d")));
        this.yAxisGroup.call(d3.axisLeft(this.yScale));
    }
    
  
    /**
     * Retrieves the data for the currently selected states.
     */
    getDataForCurrentSelection() {
        const selectedStates = this.globalApplicationState.selectedStates || [];
        const data = this.globalApplicationState.mapData || [];
    
        console.log("Selected states:", selectedStates);
        console.log("Available map data:", data);
    
        if (!Array.isArray(selectedStates) || selectedStates.length === 0 || data.length === 0) {
            return [];
        }
    
        return selectedStates.map(state =>
            data.filter(d => d.State === state)
        );
    }
    
  }
  