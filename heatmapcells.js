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

    // 2. Aggregate data by Year
    let Years = Array.from(new Set(datasets.population.map(d => d.Year)));
    
    // Sort the Years in ascending order
    Years = Years.sort((a, b) => a - b);  // Ensure the Years are sorted numerically
    
    const categories = ["population", "median_income", "housing_prices", "jobs"];

    // Aggregated data for the heatmap
    const aggregatedData = [];

    Years.forEach(Year => {
        categories.forEach(category => {
            let Value;

            if (category === "population" || category === "jobs") {
                // Sum the Values for population and jobs
                Value = d3.sum(datasets[category].filter(d => d.Year === Year), d => +d.Value);
            } else {
                // Calculate mean for median_income and housing_prices
                Value = d3.mean(datasets[category].filter(d => d.Year === Year), d => +d.Value);
            }

            aggregatedData.push({ Year, category, Value });
        });
    });

    // 3. Set up the SVG container
    const margin = { top: 40, right: 20, bottom: 40, left: 60 };
    const width = 1000 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = d3.select("#heatmap")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // 4. Set up scales
    const xScale = d3.scaleBand()
        .domain(Years)
        .range([0, width])
        .padding(0.05);

    const yScale = d3.scaleBand()
        .domain(categories)
        .range([0, height])
        .padding(0.05);

    // Separate color scales for each dataset, ensuring brighter colors for larger Values
    const colorScales = {
        population: d3.scaleSequential(d3.interpolateBlues).domain([0, d3.max(aggregatedData.filter(d => d.category === "population"), d => d.Value)]),
        median_income: d3.scaleSequential(d3.interpolateYlGnBu).domain([0, d3.max(aggregatedData.filter(d => d.category === "median_income"), d => d.Value)]),
        housing_prices: d3.scaleSequential(d3.interpolateReds).domain([0, d3.max(aggregatedData.filter(d => d.category === "housing_prices"), d => d.Value)]),
        jobs: d3.scaleSequential(d3.interpolatePurples).domain([0, d3.max(aggregatedData.filter(d => d.category === "jobs"), d => d.Value)])
    };

    // 5. Create the heatmap cells
    svg.selectAll(".heatmap-cell")
        .data(aggregatedData)
        .enter()
        .append("rect")
        .attr("class", "heatmap-cell")
        .attr("x", d => xScale(d.Year))
        .attr("y", d => yScale(d.category))
        .attr("width", xScale.bandwidth())
        .attr("height", yScale.bandwidth())
        .attr("fill", d => colorScales[d.category](d.Value))
        .on("mouseover", function(event, d) {
            const tooltip = d3.select("#tooltip");
            tooltip.transition().duration(200).style("opacity", .9);
            tooltip.html(`${d.category} - ${d.Year}<br>Value: ${d.Value}`)
                .style("left", `${event.pageX + 5}px`)
                .style("top", `${event.pageY - 28}px`);
        })
        .on("mouseout", function() {
            d3.select("#tooltip").transition().duration(200).style("opacity", 0);
        });

    // 6. Add axes
    svg.append("g")
        .selectAll(".x-axis")
        .data(Years)
        .enter()
        .append("text")
        .attr("class", "axis-label")
        .attr("x", d => xScale(d) + xScale.bandwidth() / 2)
        .attr("y", height + 25)
        .text(d => d);

    svg.append("g")
        .selectAll(".y-axis")
        .data(categories)
        .enter()
        .append("text")
        .attr("class", "axis-label")
        .attr("x", -5)
        .attr("y", d => yScale(d) + yScale.bandwidth() / 2)
        .text(d => d)
        .style("text-anchor", "end")
        .style("dominant-baseline", "middle");
});