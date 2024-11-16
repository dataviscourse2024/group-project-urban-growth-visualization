document.addEventListener("DOMContentLoaded", () => {
    // Load the map when the DOM is fully loaded
    loadMap();

    // Add event listeners for dataset and year dropdowns
    const datasetSelect = document.getElementById("datasetSelect");
    const yearSelect = document.getElementById("yearSelect");

    datasetSelect.addEventListener("change", (event) => {
        const selectedDataset = event.target.value;
        console.log(`Selected dataset: ${selectedDataset}`);

        // Update the map's dataset based on the selection
        switch (selectedDataset) {
            case "population":
                dataurl = "data/PopulationDataClean.csv";
                break;
            case "jobGrowth":
                dataurl = "data/JobGrowth2012_2024.csv";
                break;
            case "medianIncome":
                dataurl = "data/MedianIncomeDataClean.csv";
                break;
            case "housing":
                dataurl = "data/HousingYearlyDataClean.csv";
                break;
            default:
                console.error("Unknown dataset selected.");
                return;
        }

        // Reload the map with the new dataset
        loadMap();
    });

    yearSelect.addEventListener("change", (event) => {
        selectedYear = event.target.value;
        console.log(`Selected year: ${selectedYear}`);

        // Reload the map for the selected year
        loadMap();
    });
});
