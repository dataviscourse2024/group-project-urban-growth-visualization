class LineChart {
    constructor(globalApplicationState) {
      this.globalApplicationState = globalApplicationState;
  
      // Set up the SVG and group elements
      this.svg = d3.select("#graph2").append("svg")
        .attr("width", 400)
        .attr("height", 300);
  
      this.margin = { top: 20, right: 30, bottom: 40, left: 50 };
      this.width = 400 - this.margin.left - this.margin.right;
      this.height = 300 - this.margin.top - this.margin.bottom;
  
      this.chartGroup = this.svg.append("g")
        .attr("transform", `translate(${this.margin.left},${this.margin.top})`);
  
      this.linesGroup = this.chartGroup.append("g").attr("id", "lines");
  
      // Define scales and axes
      this.xScale = d3.scaleTime().range([0, this.width]);
      this.yScale = d3.scaleLinear().range([this.height, 0]);
      this.colorScale = d3.scaleOrdinal(d3.schemeCategory10);
  
      this.xAxis = this.chartGroup.append("g")
        .attr("transform", `translate(0,${this.height})`);
      this.yAxis = this.chartGroup.append("g");
  
      this.updateSelectedStates();
    }
  
    updateSelectedStates() {
      const data = this.getDataForCurrentSelection();
  
      // Update the x and y domains
      this.xScale.domain(d3.extent(data.flat(), d => new Date(d.Year)));
      this.yScale.domain([0, d3.max(data.flat(), d => d.Value)]);
  
      this.xAxis.call(d3.axisBottom(this.xScale).tickFormat(d3.timeFormat("%Y")));
      this.yAxis.call(d3.axisLeft(this.yScale));
  
      // Line generator function
      const lineGenerator = d3.line()
        .x(d => this.xScale(new Date(d.Year)))
        .y(d => this.yScale(d.Value));
  
      // Bind data and render lines
      this.linesGroup.selectAll("path")
        .data(data)
        .join("path")
        .attr("d", d => lineGenerator(d))
        .attr("fill", "none")
        .attr("stroke", d => this.colorScale(d[0].State))
        .attr("stroke-width", 2);
    }
  
    getDataForCurrentSelection() {
      const selectedStates = this.globalApplicationState.selectedStates;
      const data = this.globalApplicationState.populationData;
  
      if (selectedStates.length === 0) {
        console.warn("No states selected. Showing data for all states.");
        return d3.groups(data, d => d.State).map(([key, values]) => values);
      } else {
        return selectedStates.map(state => data.filter(d => d.State === state));
      }
    }
  }
  