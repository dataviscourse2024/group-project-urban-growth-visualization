Promise.all([
    d3.csv("data/PopulationDataClean.csv"),
    d3.csv("data/MedianIncomeDataClean.csv"),
    d3.csv("data/HousingYearlyDataClean.csv"),
    d3.csv("data/JobGrowth2012_2024.csv")
]).then(function (data) {
    const datasets = {
        population: data[0],
        median_income: data[1],
        housing_prices: data[2],
        jobs: data[3]
    };

    const Years = Array.from(new Set(datasets.population.map(d => d.Year))).sort((a, b) => a - b);
    const States = Array.from(new Set(datasets.population.map(d => d.State)));

    const colorScale = d3.scaleOrdinal(d3.schemeCategory10).domain(States);

    const margin = { top: 50, right: 30, bottom: 50, left: 60 };
    const width = 800 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    const svg = d3.select("#bubble-plot")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const tooltip = d3.select("#tooltip");

    // Populate Year dropdown
    const YearSelect = d3.select("#Year");
    Years.forEach(Year => {
        YearSelect.append("option").attr("value", Year).text(Year);
    });

    // Calculate global domains for each dataset
    const globalDomains = {};
    for (const key in datasets) {
        globalDomains[key] = {
            x: d3.extent(datasets[key], d => +d.Value),
            y: d3.extent(datasets[key], d => +d.Value),
            size: d3.extent(datasets[key], d => +d.Value)
        };
    }

    // Default selections
    let selectedYear = Years[0];
    let selectedXAxis = "population";
    let selectedYAxis = "population";

    // Dropdown event listeners
    d3.select("#x-axis").on("change", updatePlot);
    d3.select("#y-axis").on("change", updatePlot);
    d3.select("#Year").on("change", updatePlot);

    updatePlot();

    function updatePlot() {
        selectedYear = YearSelect.property("value");
        selectedXAxis = d3.select("#x-axis").property("value");
        selectedYAxis = d3.select("#y-axis").property("value");

        const xDataset = datasets[selectedXAxis];
        const yDataset = datasets[selectedYAxis];

        // Filter data for the selected Year
        const filteredData = States.map(State => {
            const xData = xDataset.find(d => d.State === State && d.Year === selectedYear);
            const yData = yDataset.find(d => d.State === State && d.Year === selectedYear);
            return {
                State: State,
                xValue: xData ? +xData.Value : null,
                yValue: yData ? +yData.Value : null,
                size: xData ? +xData.Value : null // Use xValue for size, modify as needed
            };
        }).filter(d => d.xValue !== null && d.yValue !== null);

        // Use fixed domains for the selected datasets
        const xDomain = globalDomains[selectedXAxis].x;
        const yDomain = globalDomains[selectedYAxis].y;
        const sizeDomain = globalDomains[selectedXAxis].size;

        const xScale = d3.scaleLinear().domain(xDomain).range([0, width]);
        const yScale = d3.scaleLinear().domain(yDomain).range([height, 0]);
        const sizeScale = d3.scaleSqrt().domain(sizeDomain).range([5, 50]);

        // Bind data and create bubbles
        const bubbles = svg.selectAll(".bubble").data(filteredData, d => d.State);

        // Exit phase
        bubbles.exit().transition().duration(500).attr("r", 0).remove();

        // Enter phase
        const newBubbles = bubbles.enter().append("circle")
            .attr("class", "bubble")
            .attr("cx", width / 2)  // Start at center
            .attr("cy", height / 2)
            .attr("r", 0)
            .style("fill", d => colorScale(d.State))
            .on("mouseover", function (event, d) {
                tooltip.transition().duration(200).style("opacity", .9);
                tooltip.html(`${d.State}<br>${selectedXAxis}: ${d.xValue}<br>${selectedYAxis}: ${d.yValue}`)
                    .style("left", `${event.pageX + 5}px`)
                    .style("top", `${event.pageY - 28}px`);
            })
            .on("mouseout", function () {
                tooltip.transition().duration(200).style("opacity", 0);
            });

        // Merge and update
        newBubbles.merge(bubbles)
            .transition()
            .duration(1000)
            .attr("cx", d => xScale(d.xValue))
            .attr("cy", d => yScale(d.yValue))
            .attr("r", d => sizeScale(d.size));

        // Update axes
        svg.select(".x-axis").remove();
        svg.select(".y-axis").remove();

        svg.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(xScale));

        svg.append("g")
            .attr("class", "y-axis")
            .call(d3.axisLeft(yScale));
    }
});