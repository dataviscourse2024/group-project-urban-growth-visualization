// bubblechart.js - Implementation for dynamically updating axis labels

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

    // Set up SVG container
    const margin = { top: 50, right: 30, bottom: 50, left: 80 };
    const width = 800 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    const svg = d3.select("#bubble-plot")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const tooltip = d3.select("#tooltip");

    // Initialize scales and domains
    const globalDomains = {};
    for (const key in datasets) {
        globalDomains[key] = {
            x: d3.extent(datasets[key], d => +d.Value),
            y: d3.extent(datasets[key], d => +d.Value),
            size: d3.extent(datasets[key], d => +d.Value)
        };
    }

    // Set up slider control
    const yearSlider = d3.select("#year-slider");
    const yearDisplay = d3.select("#year-display");

    // Variables to store the selected axis labels
    let selectedXAxis = d3.select("#x-axis-select").property("value");
    let selectedYAxis = d3.select("#y-axis-select").property("value");

    // Event listeners for dropdowns
    d3.select("#x-axis-select").on("change", () => {
        selectedXAxis = d3.select("#x-axis-select").property("value");
        updatePlot(yearSlider.property("value"));
    });
    d3.select("#y-axis-select").on("change", () => {
        selectedYAxis = d3.select("#y-axis-select").property("value");
        updatePlot(yearSlider.property("value"));
    });

    // Event listener for slider control
    yearSlider.on("input", function () {
        const selectedYear = this.value;
        yearDisplay.text(selectedYear); // Update year display text
        updatePlot(selectedYear); // Update plot with the new year
    });

    function updatePlot(year) {
        const selectedYear = year;

        const xDataset = datasets[selectedXAxis];
        const yDataset = datasets[selectedYAxis];

        // Normalize the values for the selected datasets
        const normalize = (value, domain) => (value - domain[0]) / (domain[1] - domain[0]);

        // Filter data for the selected Year
        const filteredData = States.map(State => {
            const xData = xDataset.find(d => d.State === State && d.Year === selectedYear);
            const yData = yDataset.find(d => d.State === State && d.Year === selectedYear);
            return {
                State: State,
                xValue: xData ? +xData.Value : null,
                yValue: yData ? +yData.Value : null,
                size: xData && yData ? (normalize(+xData.Value, globalDomains[selectedXAxis].x) + normalize(+yData.Value, globalDomains[selectedYAxis].y)) / 2 : null
            };
        }).filter(d => d.xValue !== null && d.yValue !== null);

        // Use fixed domains for the selected datasets
        const xDomain = globalDomains[selectedXAxis].x;
        const yDomain = globalDomains[selectedYAxis].y;
        const sizeDomain = d3.extent(filteredData, d => d.size);

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
            .attr("cx", width / 2)
            .attr("cy", height / 2)
            .attr("r", 0)
            .style("fill", d => colorScale(d.State))
            .on("mouseover", function (event, d) {
                tooltip.transition().duration(200).style("opacity", .9);
                let xValueFormatted = d3.format(",.0f")(d.xValue);
                let yValueFormatted = d3.format(",.0f")(d.yValue);
                if (selectedXAxis === 'median_income' || selectedXAxis === 'housing_prices') {
                    xValueFormatted = `$${xValueFormatted}`;
                }
                if (selectedYAxis === 'median_income' || selectedYAxis === 'housing_prices') {
                    yValueFormatted = `$${yValueFormatted}`;
                }
                tooltip.html(`${d.State}<br>${selectedXAxis.replace('_', ' ')}: ${xValueFormatted}<br>${selectedYAxis.replace('_', ' ')}: ${yValueFormatted}`)
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
            .call(d3.axisBottom(xScale))
            .append("text")
            .attr("class", "axis-label")
            .attr("x", width / 2)
            .attr("y", margin.bottom - 10)
            .attr("fill", "black")
            .style("text-anchor", "middle")
            .text(selectedXAxis.replace('_', ' ')); // Update x-axis label dynamically

        svg.append("g")
            .attr("class", "y-axis")
            .call(d3.axisLeft(yScale))
            .append("text")
            .attr("class", "axis-label")
            .attr("x", -margin.left - 100) // Move label more to the left to avoid overlap
            .attr("y", -margin.top - 15)
            .attr("transform", "rotate(-90)")
            .attr("fill", "black")
            .style("text-anchor", "middle")
            .text(selectedYAxis.replace('_', ' ')); // Update y-axis label dynamically
    }

    // Initial plot
    updatePlot(yearSlider.property("value"));
});


