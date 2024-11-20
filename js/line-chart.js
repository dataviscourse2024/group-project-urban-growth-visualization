class LineChart {
    constructor(globalApplicationState) {
      this.globalApplicationState = globalApplicationState;
  
      // Set up margins and dimensions
      const margin = { top: 10, right: 50, bottom: 50, left: 80 };
      const width = 700 - margin.left - margin.right;
      const height = 500 - margin.top - margin.bottom;
  
      // Select or create the SVG element for the line chart
      this.svg = d3.select("#line-chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);
  
      // Initialize scales
      this.xScale = d3.scaleLinear().range([0, width]); // Use linear scale for years
      this.yScale = d3.scaleLinear().range([height, 0]);
  
      // Define color scale for states
      this.colorScale = d3.scaleOrdinal(d3.schemeCategory10);
  
      // Define line generator
      this.line = d3.line()
        .x(d => this.xScale(+d.Year)) // Convert Year to a number
        .y(d => this.yScale(+d.Value));
  
      // Create axes
      this.createAxes(width, height);
      this.updateSelectedStates();
  
      // Hover line and text group for interaction
      this.hoverLine = this.svg.append("line")
        .attr("class", "hover-line")
        .attr("stroke", "black")
        .attr("stroke-width", 1)
        .style("opacity", 0);
  
      this.hoverTextGroup = this.svg.append("g")
        .attr("class", "hover-text-group")
        .style("opacity", 0);
  
      // Add an overlay for mouse events
      this.overlay = this.svg.append("rect")
        .attr("width", width)
        .attr("height", height)
        .style("fill", "none")
        .style("pointer-events", "all");
  
    console.log("LineChart initialized with:", this.globalApplicationState);
      // Add interaction
      this.addInteraction();
    }
  
    createAxes(width, height) {
        console.log("Creating axes...");
        // Append x-axis
        this.svg.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0, ${height})`)
            .call(d3.axisBottom(this.xScale));
    
        // Append y-axis
        this.svg.append("g")
            .attr("class", "y-axis")
            .call(d3.axisLeft(this.yScale));
    
        // Add x-axis label
        this.svg.append("text")
            .attr("class", "x-axis-label")
            .attr("text-anchor", "middle")
            .attr("x", width / 2)
            .attr("y", height + 40)
            .text("Year");
    
        // Add y-axis label
        this.svg.append("text")
            .attr("class", "y-axis-label")
            .attr("text-anchor", "middle")
            .attr("x", -height / 2)
            .attr("y", -50)
            .attr("transform", "rotate(-90)")
            .text("Value");
    }
  
    updateSelectedStates() {
        console.log("Updating line chart with selected states:", this.globalApplicationState.selectedStates);
        const { populationData, selectedStates } = this.globalApplicationState;
    
        // Filter data for selected states
        const data = populationData.filter(d => selectedStates.includes(d.State));
    
        if (!data || data.length === 0) {
            this.clearChart();
            return;
        }
    
        // Update scales
        const years = [...new Set(data.map(d => +d.Year))];
        this.xScale.domain(d3.extent(years));
        this.yScale.domain([0, d3.max(data, d => +d.Value)]);
    
        // Update axes
        this.svg.select(".x-axis").call(d3.axisBottom(this.xScale).tickFormat(d3.format("d")));
        this.svg.select(".y-axis").call(d3.axisLeft(this.yScale));
    
        // Group data by state
        const groupedData = d3.group(data, d => d.State);
    
        // Bind data to lines
        const lines = this.svg.selectAll(".line").data(Array.from(groupedData.values()));
    
        lines.enter()
            .append("path")
            .attr("class", "line")
            .attr("fill", "none")
            .attr("stroke-width", 2)
            .merge(lines)
            .attr("stroke", (d, i) => this.colorScale(i))
            .attr("d", d => this.line(d));
    
        lines.exit().remove();
    }
  
    clearChart() {
      this.svg.selectAll(".line").remove();
      this.svg.select(".x-axis").call(d3.axisBottom(this.xScale));
      this.svg.select(".y-axis").call(d3.axisLeft(this.yScale));
    }
  
    addInteraction() {
      this.overlay.on("mousemove", (event) => {
        const [mouseX] = d3.pointer(event);
        const hoveredYear = Math.round(this.xScale.invert(mouseX)); // Get year from x-scale
  
        this.hoverLine
          .attr("x1", mouseX)
          .attr("x2", mouseX)
          .attr("y1", 0)
          .attr("y2", this.yScale.range()[0])
          .style("opacity", 1);
  
        // Update hover text for selected states
        const { selectedStates, populationData } = this.globalApplicationState;
        const hoverData = populationData.filter(d => selectedStates.includes(d.State) && +d.Year === hoveredYear);
  
        this.hoverTextGroup.selectAll("text").remove();
        hoverData.forEach((d, i) => {
          this.hoverTextGroup.append("text")
            .attr("x", mouseX + 10)
            .attr("y", 20 + i * 15)
            .attr("fill", this.colorScale(i))
            .text(`${d.State}: ${d.Value}`);
        });
  
        this.hoverTextGroup.style("opacity", 1);
      });
  
      this.overlay.on("mouseleave", () => {
        this.hoverLine.style("opacity", 0);
        this.hoverTextGroup.style("opacity", 0);
      });
    }
  }
  