document.addEventListener("DOMContentLoaded", () => {
    const globalApplicationState = {
        selectedStates: [], // Tracks currently selected states
        mapData: [], // Contains all state-year-value data for the line chart
    };

    // Initialize map and line chart
    const map = new Map(globalApplicationState);
    const lineChart = new LineChart(globalApplicationState);

    // Load the map data (validate CSV format)
    d3.csv("data/PopulationDataClean.csv", d => ({
        State: d.State,
        Year: +d.Year,
        Value: +d.Value
    })).then(data => {
        globalApplicationState.mapData = data;
        console.log("Loaded data:", data);

        // Initialize the map with the loaded data
        map.loadMap();
    }).catch(error => {
        console.error("Error loading data:", error);
    });

    console.log("Initial selectedStates:", globalApplicationState.selectedStates);

    function updateVisualization() {
        console.log("Updating visualization with selectedStates:", globalApplicationState.selectedStates);
        if (Array.isArray(globalApplicationState.selectedStates)) {
            lineChart.updateSelectedStates();
        } else {
            console.error("selectedStates is not iterable:", globalApplicationState.selectedStates);
        }
    }
    

    // Listen for changes to selected states in the map
    document.addEventListener("stateSelectionChanged", updateVisualization);
});
