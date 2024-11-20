// Global application state
const globalApplicationState = {
    selectedStates: [],
    selectedYear: "2012",
    selectedDataset: "population",
    populationData: null,
    jobData: null,
    housepriceData: null,
    incomeData: null,
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
    globalApplicationState.populationData = loadedData.populationData;
    globalApplicationState.jobData = loadedData.jobData;
    globalApplicationState.incomeData = loadedData.incomeData;
    globalApplicationState.housepriceData = loadedData.housepriceData;
    globalApplicationState.mapData = loadedData.mapData;



    // Initialize the map visualization
    const mapVis = new Map(globalApplicationState);
    globalApplicationState.mapVis = mapVis;
    globalApplicationState.mapVis.loadMap();

    console.log("Visuals initialized.");
}).catch((error) => {
    console.error("Failed to initialize application:", error);
});



// Event listener for dataset dropdown
d3.select("#datasetSelect").on("change", function () {
    const selectedDataset = this.value;

    // Update the global dataurl variable based on the selected dataset
    switch (selectedDataset) {
        case "population":
            globalApplicationState.selectedDataset = "population";
            break;
        case "jobGrowth":
            globalApplicationState.selectedDataset = "jobGrowth";
            break;
        case "medianIncome":
            globalApplicationState.selectedDataset = "income";
            break;
        case "housing":
            globalApplicationState.selectedDataset = "housing";
            break;
        default:
            console.error("Unknown dataset selected.");
            return;
    }

    // Reload the map with the new dataset
    globalApplicationState.mapVis.loadMap();
});
