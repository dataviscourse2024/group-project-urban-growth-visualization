// Line Chart Showing Percentage Change From First Year 
Promise.all([
    d3.csv("data/PopulationDataClean.csv"),
    d3.csv("data/MedianIncomeDataClean.csv"),
    d3.csv("data/HousingYearlyDataClean.csv"),
    d3.csv("data/JobGrowth2012_2024.csv")
]).then(function(data) {
    const datasets = {
        population: data[0],
        median_income: data[1],
        housing_prices: data[2],
        jobs: data[3]
    };

    datasets.jobs.forEach(d => d.Value = +d.Value * 1000);

    // Create checkboxes for dataset selection
    const checkboxContainer = d3.select("#checkbox-container");
    const datasetNames = ["Housing Prices", "Median Income", "Population", "Jobs"];
    const datasetKeys = ["housing_prices", "median_income", "population", "jobs"];

    datasetNames.forEach((name, index) => {
        const label = checkboxContainer.append("label").attr("class", "checkbox-label");
        label.append("input")
            .attr("type", "checkbox")
            .attr("id", datasetKeys[index])
            .attr("checked", true);
        label.append("span").text(name);
    });

    // 1. Aggregate data by Year
    let Years = Array.from(new Set(datasets.median_income.map(d => d.Year)));
    Years = Years.sort((a, b) => a - b);

    // 2. Calculate percentage change from the first year
    const firstYear = Years[0];
    const aggregatedData = [];
    Years.forEach(Year => {
        const housingPrice = d3.mean(datasets.housing_prices.filter(d => d.Year === Year), d => +d.Value);
        const medianIncome = d3.mean(datasets.median_income.filter(d => d.Year === Year), d => +d.Value);
        const population = d3.sum(datasets.population.filter(d => d.Year === Year), d => +d.Value);
        const jobs = d3.sum(datasets.jobs.filter(d => d.Year === Year), d => +d.Value); 
        const firstYearHousingPrice = d3.mean(datasets.housing_prices.filter(d => d.Year === firstYear), d => +d.Value);
        const firstYearMedianIncome = d3.mean(datasets.median_income.filter(d => d.Year === firstYear), d => +d.Value);
        const firstYearPopulation = d3.sum(datasets.population.filter(d => d.Year === firstYear), d => +d.Value);
        const firstYearJobs = d3.sum(datasets.jobs.filter(d => d.Year === firstYear), d => +d.Value); 
        const housingPriceChange = ((housingPrice - firstYearHousingPrice) / firstYearHousingPrice) * 100;
        const medianIncomeChange = ((medianIncome - firstYearMedianIncome) / firstYearMedianIncome) * 100;
        const populationChange = ((population - firstYearPopulation) / firstYearPopulation) * 100;
        const jobsChange = ((jobs - firstYearJobs) / firstYearJobs) * 100;
        aggregatedData.push({ Year, housingPriceChange, medianIncomeChange, populationChange, jobsChange, housingPrice, medianIncome, population, jobs });
    });

    // 3. Set up the SVG container
    const margin = { top: 40, right: 20, bottom: 50, left: 80 };
    const width = 800 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    const svg = d3.select("#line-chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // 4. Set up scales
    const xScale = d3.scaleBand()
        .domain(Years)
        .range([0, width])
        .padding(0.1);

    let yScale = d3.scaleLinear()
        .domain([d3.min(aggregatedData, d => Math.min(d.housingPriceChange, d.medianIncomeChange, d.populationChange, d.jobsChange)), d3.max(aggregatedData, d => Math.max(d.housingPriceChange, d.medianIncomeChange, d.populationChange, d.jobsChange))])
        .nice()
        .range([height, 0]);

    // 5. Add axes
    const xAxis = svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(xScale))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

    const yAxis = svg.append("g")
        .call(d3.axisLeft(yScale));

    // 6. Line generators
    const lineHousing = d3.line()
        .x(d => xScale(d.Year) + xScale.bandwidth() / 2)
        .y(d => yScale(d.housingPriceChange));

    const lineIncome = d3.line()
        .x(d => xScale(d.Year) + xScale.bandwidth() / 2)
        .y(d => yScale(d.medianIncomeChange));

    const linePopulation = d3.line()
        .x(d => xScale(d.Year) + xScale.bandwidth() / 2)
        .y(d => yScale(d.populationChange));

    const lineJobs = d3.line()
        .x(d => xScale(d.Year) + xScale.bandwidth() / 2)
        .y(d => yScale(d.jobsChange));

    // 7. Add lines conditionally based on checkbox selection
    function updateChart() {
        svg.selectAll("path.line").remove();

        // Filter selected datasets
        const selectedData = [];
        if (d3.select("#housing_prices").property("checked")) {
            selectedData.push(d => d.housingPriceChange);
        }
        if (d3.select("#median_income").property("checked")) {
            selectedData.push(d => d.medianIncomeChange);
        }
        if (d3.select("#population").property("checked")) {
            selectedData.push(d => d.populationChange);
        }
        if (d3.select("#jobs").property("checked")) {
            selectedData.push(d => d.jobsChange);
        }

        // Update yScale domain based on selected datasets
        const yMin = d3.min(aggregatedData, d => Math.min(...selectedData.map(fn => fn(d))));
        const yMax = d3.max(aggregatedData, d => Math.max(...selectedData.map(fn => fn(d))));
        yScale.domain([yMin, yMax]).nice();

        // Update yAxis
        yAxis.transition().duration(1000).call(d3.axisLeft(yScale));

        // Add lines for selected datasets
        if (d3.select("#housing_prices").property("checked")) {
            svg.append("path")
                .datum(aggregatedData)
                .attr("class", "line")
                .attr("fill", "none")
                .attr("stroke", "#6a0dad")
                .attr("stroke-width", 2)
                .attr("d", lineHousing)
                .attr("stroke-dasharray", function() { return this.getTotalLength(); })
                .attr("stroke-dashoffset", function() { return this.getTotalLength(); })
                .transition().duration(1000).ease(d3.easeLinear)
                .attr("stroke-dashoffset", 0);
        }

        if (d3.select("#median_income").property("checked")) {
            svg.append("path")
                .datum(aggregatedData)
                .attr("class", "line")
                .attr("fill", "none")
                .attr("stroke", "#2e8b57")
                .attr("stroke-width", 2)
                .attr("d", lineIncome)
                .attr("stroke-dasharray", function() { return this.getTotalLength(); })
                .attr("stroke-dashoffset", function() { return this.getTotalLength(); })
                .transition().duration(1000).ease(d3.easeLinear)
                .attr("stroke-dashoffset", 0);
        }

        if (d3.select("#population").property("checked")) {
            svg.append("path")
                .datum(aggregatedData)
                .attr("class", "line")
                .attr("fill", "none")
                .attr("stroke", "#1f77b4")
                .attr("stroke-width", 2)
                .attr("d", linePopulation)
                .attr("stroke-dasharray", function() { return this.getTotalLength(); })
                .attr("stroke-dashoffset", function() { return this.getTotalLength(); })
                .transition().duration(1000).ease(d3.easeLinear)
                .attr("stroke-dashoffset", 0);
        }

        if (d3.select("#jobs").property("checked")) {
            svg.append("path")
                .datum(aggregatedData)
                .attr("class", "line")
                .attr("fill", "none")
                .attr("stroke", "#ff7f0e")
                .attr("stroke-width", 2)
                .attr("d", lineJobs)
                .attr("stroke-dasharray", function() { return this.getTotalLength(); })
                .attr("stroke-dashoffset", function() { return this.getTotalLength(); })
                .transition().duration(1000).ease(d3.easeLinear)
                .attr("stroke-dashoffset", 0);
        }

        updateLegend();
    }


    // Add event listeners to checkboxes
    d3.selectAll("input[type=checkbox]").on("change", updateChart);

    // Add interaction line on mouse hover
    const hoverLine = svg.append("line")
        .attr("class", "hover-line")
        .attr("stroke", "black")
        .attr("stroke-width", 1)
        .attr("y1", 0)
        .attr("y2", height)
        .style("opacity", 0);

    svg.append("rect")
        .attr("class", "overlay")
        .attr("width", width)
        .attr("height", height)
        .style("fill", "none")
        .style("pointer-events", "all")
        .on("mouseover", function() {
            hoverLine.style("opacity", 1);
        })
        .on("mousemove", function(event) {
            const mouseX = d3.pointer(event)[0];
            hoverLine.attr("x1", mouseX).attr("x2", mouseX);

            const closestYear = Years.reduce((a, b) => {
                return Math.abs(xScale(a) + xScale.bandwidth() / 2 - mouseX) < Math.abs(xScale(b) + xScale.bandwidth() / 2 - mouseX) ? a : b;
            });
            updateLegend(closestYear);
        })
        .on("mouseout", function() {
            hoverLine.style("opacity", 0);
            updateLegend();
        });
         // End of overlay event listeners

// 9. Add legend
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 10)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Year");

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left + 20)
        .attr("x", 0 - (height / 2))
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("% Change from 2012");

    const legend = svg.append("g")
        .attr("transform", `translate(20, 20)`);

    function updateLegend(year) {
        legend.selectAll("g.legend-item").remove();

        const closestData = year ? aggregatedData.find(d => d.Year === year) : null;
        let yOffset = 0;

        if (d3.select("#housing_prices").property("checked")) {
            const text = `US mean Housing Price: ${closestData ? `$${(+closestData.housingPrice).toLocaleString(undefined, {minimumFractionDigits: 2})}` : ''}`;
            const legendItem = legend.append("g").attr("class", "legend-item").attr("transform", `translate(0, ${yOffset})`);
            legendItem.append("rect")
                .attr("width", 20)
                .attr("height", 20)
                .attr("fill", "#6a0dad");
            legendItem.append("text")
                .attr("x", 30)
                .attr("y", 15)
                .attr("class", "legend-value")
                .text(text)
                .style("font-size", "12px");
            yOffset += 30;
        }

        if (d3.select("#median_income").property("checked")) {
            const text = `US Household Median Income: ${closestData ? `$${(+closestData.medianIncome).toLocaleString(undefined, {minimumFractionDigits: 2})}` : ''}`;
            const legendItem = legend.append("g").attr("class", "legend-item").attr("transform", `translate(0, ${yOffset})`);
            legendItem.append("rect")
                .attr("width", 20)
                .attr("height", 20)
                .attr("fill", "#2e8b57");
            legendItem.append("text")
                .attr("x", 30)
                .attr("y", 15)
                .attr("class", "legend-value")
                .text(text)
                .style("font-size", "12px");
            yOffset += 30;
        }

        if (d3.select("#population").property("checked")) {
            const text = `Total US Population: ${closestData ? (+closestData.population).toLocaleString() : ''}`;
            const legendItem = legend.append("g").attr("class", "legend-item").attr("transform", `translate(0, ${yOffset})`);
            legendItem.append("rect")
                .attr("width", 20)
                .attr("height", 20)
                .attr("fill", "#1f77b4");
            legendItem.append("text")
                .attr("x", 30)
                .attr("y", 15)
                .attr("class", "legend-value")
                .text(text)
                .style("font-size", "12px");
            yOffset += 30;
        }

        if (d3.select("#jobs").property("checked")) {
            const text = `Total US Nonfarm-Jobs: ${closestData ? (+closestData.jobs).toLocaleString() : ''}`;
            const legendItem = legend.append("g").attr("class", "legend-item").attr("transform", `translate(0, ${yOffset})`);
            legendItem.append("rect")
                .attr("width", 20)
                .attr("height", 20)
                .attr("fill", "#ff7f0e");
            legendItem.append("text")
                .attr("x", 30)
                .attr("y", 15)
                .attr("class", "legend-value")
                .text(text)
                .style("font-size", "12px");
            yOffset += 30;
        }
    }

    
    // Initial chart rendering
    updateChart();
    // Initial legend update
    updateLegend();

});

