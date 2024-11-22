
// Global application state
const globalApplicationState = {
    selectedStates: [],
    selectedYear: "2012",
    selectedDataset: "population",
    currData: null,
    mapVis: null,
    currGraph: null,
};

// Debugging
console.log("Global Application State Initialized:", globalApplicationState);

let data;

// Make the global state globally accessible
window.globalApplicationState = globalApplicationState;

// ******* DATA LOADING *******
async function loadData() {
    try {
        // Load population and map data
        const populationData = await d3.csv("data/PopulationDataClean.csv");
        const jobData = await d3.csv("data/JobGrowth2012_2024.csv");
        const incomeData = await d3.csv("data/MedianIncomeDataClean.csv");
        const housepriceData= await d3.csv("data/HousingYearlyDataClean.csv");
        const mapData = await d3.json("data/us.json");

        // Log loaded data
        console.log("Population Data Loaded:", populationData);
        console.log("Map Data Loaded:", mapData);

        // Assign data to global state

        // Return loaded data
        return { populationData, jobData, incomeData, housepriceData, mapData };
    } catch (error) {
        console.error("Error loading data:", error);
        throw error;
    }
}

// Initialize the application
loadData().then((loadedData) => {
    
    data = loadedData;
    
    globalApplicationState.currData = loadedData.populationData;
    console.log("Current Data Initial Load (currData):", globalApplicationState.currData);
    globalApplicationState.mapData = loadedData.mapData;

    // Initialize Map
    const mapVis = new Map(globalApplicationState);
    globalApplicationState.mapVis = mapVis;
    globalApplicationState.mapVis.loadMap();

    // Initialize Line Chart
    const lineChart = new LineChart(globalApplicationState);
    globalApplicationState.currGraph = lineChart;

    console.log("Application initialized.");
}).catch((error) => {
    console.error("Failed to initialize application:", error);
});


// Event listener for dataset dropdown
d3.select("#datasetSelect").on("change", function () {
    const selectedDataset = this.value;
    console.log(selectedDataset);

    // Update the global dataurl variable based on the selected dataset
    switch (selectedDataset) {
        case "population":
            globalApplicationState.selectedDataset = "population";
            globalApplicationState.currData = data.populationData;
            console.log("Current Data (currData):", globalApplicationState.currData);
            break;
        case "jobGrowth":
            globalApplicationState.selectedDataset = "jobGrowth";
            globalApplicationState.currData = data.jobData;
            console.log("Current Data (currData):", globalApplicationState.currData);
            break;
        case "medianIncome":
            globalApplicationState.selectedDataset = "income";
            globalApplicationState.currData = data.incomeData;
            console.log("Current Data (currData):", globalApplicationState.currData);
            break;
        case "housing":
            globalApplicationState.selectedDataset = "housing";
            globalApplicationState.currData = data.housepriceData;
            console.log("Current Data (currData):", globalApplicationState.currData);
            break;
        default:
            console.error("Unknown dataset selected.");
            return;
    }

    // Reload the map with the new dataset
    globalApplicationState.mapVis.loadMap();
});