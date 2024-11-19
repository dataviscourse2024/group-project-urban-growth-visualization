const globalApplicationState = {
    selectedStates: [], // Selected states from the map
    selectedYear: "2012", // Default selected year
    dataUrl: "data/PopulationDataClean.csv", // Default dataset
    populationData: null, // Population data for bar graph and line chart
    mapData: null, // GeoJSON map data
    mapVis: null, // Map visualization instance
    barGraph: null, // Bar graph visualization instance
    lineChart: null, // Line chart visualization instance
  };
  
  // ******* DATA LOADING *******
  async function loadData() {
    const populationData = await d3.csv('data/PopulationDataClean.csv');
    const mapData = await d3.json('data/us.json');
    return { populationData, mapData };
  }
  
  // ******* APPLICATION MOUNTING *******
  loadData().then((loadedData) => {
    console.log('Loaded data:', loadedData);
  
    // Store loaded data into global application state
    globalApplicationState.populationData = loadedData.populationData;
    globalApplicationState.mapData = loadedData.mapData;
  
    // Initialize the map visualization
    const mapVis = new Map(globalApplicationState);
    globalApplicationState.mapVis = mapVis;    
  
    // Initialize the bar graph visualization
    const barGraph = new BarGraph(globalApplicationState);
    globalApplicationState.barGraph = barGraph;
  
    // Initialize the line chart visualization
    const lineChart = new LineChart(globalApplicationState);
    globalApplicationState.lineChart = lineChart;
  
    // Add event listeners for dropdown changes
    d3.select("#yearSelect").on("change", function () {
      globalApplicationState.selectedYear = this.value;
  
      // Update the map
      globalApplicationState.mapVis.updateMap();
  
      // Update the bar graph
      const filteredData = globalApplicationState.barGraph.getDataForSelectedState();
      globalApplicationState.barGraph.updateGraph(filteredData);
  
      // Update the line chart
      globalApplicationState.lineChart.updateSelectedStates();
    });
  
    d3.select("#datasetSelect").on("change", function () {
      globalApplicationState.dataUrl = `data/${this.value}.csv`;
  
      // Reload dataset for the selected type and update visualizations
      d3.csv(globalApplicationState.dataUrl).then(newData => {
        newData.forEach(d => {
          d.Value = +d.Value; // Ensure numerical values
          d.Year = d.Year.trim(); // Clean up year formatting
        });
  
        globalApplicationState.populationData = newData;
  
        // Update the map
        globalApplicationState.mapVis.updateMap();
  
        // Update the bar graph
        const filteredData = globalApplicationState.barGraph.getDataForSelectedState();
        globalApplicationState.barGraph.updateGraph(filteredData);
  
        // Update the line chart
        globalApplicationState.lineChart.updateSelectedStates();
      });
    });
  
    // Event listener for state selection changes on the map
    document.addEventListener("stateSelectionChanged", () => {
      const filteredData = globalApplicationState.barGraph.getDataForSelectedState();
  
      // Update the bar graph
      globalApplicationState.barGraph.updateGraph(filteredData);
  
      // Update the line chart
      globalApplicationState.lineChart.updateSelectedStates();
    });
  });
  
  // Placeholder for additional graphs
  function initializeGraph2(container) {
    console.log('Graph 2 initialized in:', container);
  }
  
  function initializeGraph3(container) {
    console.log('Graph 3 initialized in:', container);
  }
  
  function initializeGraph4(container) {
    console.log('Graph 4 initialized in:', container);
  }
  