class BarGraph {
    constructor(globalApplicationState) {
      this.globalApplicationState = globalApplicationState;
  
      // Set up SVG dimensions
      this.svg = d3.select("#graph1").append("svg")
        .attr("width", 400)
        .attr("height", 300);
  
      this.margin = { top: 20, right: 30, bottom: 40, left: 40 };
      this.width = 400 - this.margin.left - this.margin.right;
      this.height = 300 - this.margin.top - this.margin.bottom;
  
      this.chartGroup = this.svg.append("g")
        .attr("transform", `translate(${this.margin.left},${this.margin.top})`);
  
      // Scales and axes
      this.xScale = d3.scaleBand().range([0, this.width]).padding(0.2);
      this.yScale = d3.scaleLinear().range([this.height, 0]);
  
      this.xAxis = this.chartGroup.append("g")
        .attr("transform", `translate(0,${this.height})`);
      this.yAxis = this.chartGroup.append("g");
  
      // Initial rendering
      this.updateGraph();
    }
  
    updateGraph() {
      const data = this.getDataForCurrentSelection();
  
      // Update scales
      this.xScale.domain(data.map(d => d.State));
      this.yScale.domain([0, d3.max(data, d => +d.Value)]);
  
      // Update axes
      this.xAxis.call(d3.axisBottom(this.xScale));
      this.yAxis.call(d3.axisLeft(this.yScale));
  
      // Render bars
      const bars = this.chartGroup.selectAll(".bar")
        .data(data);
  
      bars.enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => this.xScale(d.State))
        .attr("width", this.xScale.bandwidth())
        .attr("y", this.height)
        .attr("height", 0)
        .merge(bars)
        .transition()
        .duration(500)
        .attr("y", d => this.yScale(d.Value))
        .attr("height", d => this.height - this.yScale(d.Value))
        .attr("fill", "steelblue");
  
      bars.exit().remove();
    }
  
    getDataForCurrentSelection() {
      const year = this.globalApplicationState.selectedYear;
      const data = this.globalApplicationState.populationData;
  
      return data.filter(d => d.Year === year);
    }
  }
  