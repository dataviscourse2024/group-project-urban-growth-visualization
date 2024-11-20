class BarGraph {
  constructor(globalApplicationState) {
      this.globalApplicationState = globalApplicationState;

      // Set up SVG dimensions and margins
      this.margin = { top: 20, right: 30, bottom: 40, left: 50 };
      this.width = 400 - this.margin.left - this.margin.right;
      this.height = 500 - this.margin.top - this.margin.bottom;

      // Create SVG container
      this.svg = d3.select("#bar-graph")
          .attr("width", this.width + this.margin.left + this.margin.right)
          .attr("height", this.height + this.margin.top + this.margin.bottom)
          .append("g")
          .attr("transform", `translate(${this.margin.left},${this.margin.top})`);

      // Initialize scales
      this.xScale = d3.scaleBand().range([0, this.width]).padding(0.1);
      this.yScale = d3.scaleLinear().range([this.height, 0]);

      // Create axes
      this.xAxisGroup = this.svg.append("g").attr("transform", `translate(0,${this.height})`);
      this.yAxisGroup = this.svg.append("g");

      // Add labels
      this.svg.append("text")
          .attr("x", this.width / 2)
          .attr("y", this.height + 35)
          .attr("text-anchor", "middle")
          .text("States");

      this.svg.append("text")
          .attr("x", -this.height / 2)
          .attr("y", -40)
          .attr("text-anchor", "middle")
          .attr("transform", "rotate(-90)")
          .text("Value");

      // Initial rendering
      this.updateGraph([]);
  }

  getDataForSelectedState() {
      const { populationData, selectedStates, selectedYear } = this.globalApplicationState;

      if (!populationData || selectedStates.length === 0) {
          console.error("No population data or selected states.");
          return [];
      }

      // Filter and format data for selected states and year
      return populationData
          .filter(d => selectedStates.includes(d.State) && d.Year === selectedYear)
          .map(d => ({ state: d.State, value: +d.Value }));
  }

  updateGraph(data) {
      if (!data || data.length === 0) {
          console.error("No data available for bar graph.");
          return;
      }

      // Update scales
      this.xScale.domain(data.map(d => d.state));
      this.yScale.domain([0, d3.max(data, d => d.value)]);

      // Bind data to bars
      const bars = this.svg.selectAll(".bar").data(data, d => d.state);

      // Enter new bars
      bars.enter()
          .append("rect")
          .attr("class", "bar")
          .attr("x", d => this.xScale(d.state))
          .attr("y", d => this.yScale(d.value))
          .attr("width", this.xScale.bandwidth())
          .attr("height", d => this.height - this.yScale(d.value))
          .attr("fill", "steelblue")
          .on("mouseover", function (event, d) {
              d3.select(this).attr("fill", "orange");
          })
          .on("mouseout", function (event, d) {
              d3.select(this).attr("fill", "steelblue");
          });

      // Update existing bars
      bars.attr("x", d => this.xScale(d.state))
          .attr("y", d => this.yScale(d.value))
          .attr("width", this.xScale.bandwidth())
          .attr("height", d => this.height - this.yScale(d.value));

      // Remove old bars
      bars.exit().remove();

      // Update axes
      this.xAxisGroup.call(d3.axisBottom(this.xScale));
      this.yAxisGroup.call(d3.axisLeft(this.yScale));
  }
}
