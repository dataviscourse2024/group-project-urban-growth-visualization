// Global application state
const globalApplicationState = {
    selectedStates: [],
    selectedYear: "2012",
    dataUrl: "data/PopulationDataClean.csv",
    populationData: null,
    mapData: null,
    mapVis: null,
    lineChart: null,
};

// Make the global state globally accessible
window.globalApplicationState = globalApplicationState;

// ******* DATA LOADING *******
async function loadData() {
    try {
        // Load population and map data
        const populationData = await d3.csv(globalApplicationState.dataUrl);
        const mapData = await d3.json("data/us.json");

        // Log loaded data
        console.log("Population Data Loaded:", populationData);
        console.log("Map Data Loaded:", mapData);

        // Assign data to global state
        globalApplicationState.populationData = populationData;
        globalApplicationState.mapData = mapData;

        // Return loaded data
        return { populationData, mapData };
    } catch (error) {
        console.error("Error loading data:", error);
        throw error;
    }
}

// Initialize the application
loadData().then((loadedData) => {
    console.log("Initializing visuals...");

    // Initialize the map visualization
    const mapVis = new Map(globalApplicationState);
    globalApplicationState.mapVis = mapVis;

    // Initialize the line chart visualization
    const lineChart = new LineChart(globalApplicationState);
    globalApplicationState.lineChart = lineChart;

    // Force initial rendering of the map and line chart
    console.log("Rendering map and line chart...");
    globalApplicationState.mapVis.updateMap();
    globalApplicationState.lineChart.updateSelectedStates();

    // Set up dropdown change listeners
    setupDropdownListeners();

    console.log("Visuals initialized.");
}).catch((error) => {
    console.error("Failed to initialize application:", error);
});

// Function to set up dropdown change listeners
function setupDropdownListeners() {
    d3.select("#yearSelect").on("change", function () {
        globalApplicationState.selectedYear = this.value;

        console.log(`Year changed to: ${globalApplicationState.selectedYear}`);
        globalApplicationState.mapVis.updateMap();
        globalApplicationState.lineChart.updateSelectedStates();
    });

    d3.select("#datasetSelect").on("change", function () {
        globalApplicationState.dataUrl = `data/${this.value}.csv`;

        console.log(`Dataset changed to: ${globalApplicationState.dataUrl}`);
        d3.csv(globalApplicationState.dataUrl).then(newData => {
            newData.forEach(d => {
                d.Value = +d.Value; // Ensure numerical values
                d.Year = d.Year.trim(); // Clean up year formatting
            });

            globalApplicationState.populationData = newData;

            globalApplicationState.mapVis.updateMap();
            globalApplicationState.lineChart.updateSelectedStates();
        });
    });
}

// Event listener for dataset dropdown
d3.select("#datasetSelect").on("change", function () {
    const selectedDataset = this.value;

    // Update the global dataurl variable based on the selected dataset
    switch (selectedDataset) {
        case "population":
            globalApplicationState.dataUrl = "data/PopulationDataClean.csv";
            break;
        case "jobGrowth":
            globalApplicationState.dataUrl = "data/JobGrowth2012_2024.csv";
            break;
        case "medianIncome":
            globalApplicationState.dataUrl = "data/MedianIncomeDataClean.csv";
            break;
        case "housing":
            globalApplicationState.dataUrl = "data/HousingYearlyDataClean.csv";
            break;
        default:
            console.error("Unknown dataset selected.");
            return;
    }

    // Reload the map with the new dataset
    globalApplicationState.mapVis.loadMap();
});
