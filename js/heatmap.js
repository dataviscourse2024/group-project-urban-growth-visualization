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

    // Heatmap visualization
    const heatmapMargin = { top: 50, right: 30, bottom: 50, left: 80 };
    const heatmapWidth = 600 - heatmapMargin.left - heatmapMargin.right;
    const heatmapHeight = 400 - heatmapMargin.top - heatmapMargin.bottom;

    const heatmapSvg = d3.select("#heatmap-plot")
        .attr("width", heatmapWidth + heatmapMargin.left + heatmapMargin.right)
        .attr("height", heatmapHeight + heatmapMargin.top + heatmapMargin.bottom)
        .append("g")
        .attr("transform", `translate(${heatmapMargin.left},${heatmapMargin.top})`);

    // Create a matrix of correlations for the heatmap
    const metrics = Object.keys(datasets);
    const axisLabels = {
        'housing_prices': 'Housing Prices',
        'median_income': 'Median Income',
        'population': 'Population',
        'jobs': 'Jobs'
    };
    const correlationData = [];

    metrics.forEach((metricX, i) => {
        metrics.forEach((metricY, j) => {
            let correlation = 0;
            const dataX = datasets[metricX];
            const dataY = datasets[metricY];

            // Calculate correlation for each year and state
            const dataPairs = dataX.filter(d => d.Year === Years[0]).map(d => {
                const yData = dataY.find(y => y.State === d.State && y.Year === d.Year);
                return yData ? [+d.Value, +yData.Value] : null;
            }).filter(pair => pair !== null);

            if (dataPairs.length > 0) {
                const xValues = dataPairs.map(d => d[0]);
                const yValues = dataPairs.map(d => d[1]);
                const xMean = d3.mean(xValues);
                const yMean = d3.mean(yValues);
                const numerator = d3.sum(dataPairs.map(d => (d[0] - xMean) * (d[1] - yMean)));
                const denominator = Math.sqrt(d3.sum(dataPairs.map(d => Math.pow(d[0] - xMean, 2))) * d3.sum(dataPairs.map(d => Math.pow(d[1] - yMean, 2))));
                correlation = numerator / denominator;
            }

            correlationData.push({ metricX, metricY, correlation });
        });
    });

    // Create scales
    const xScale = d3.scaleBand().domain(metrics).range([0, heatmapWidth]).padding(0.05);
    const yScale = d3.scaleBand().domain(metrics).range([heatmapHeight, 0]).padding(0.05);
    const colorScale = d3.scaleSequential(d3.interpolateRdYlBu).domain([-1, 1]);

    // Draw heatmap cells
    heatmapSvg.selectAll(".heatmap-cell")
        .data(correlationData)
        .enter().append("rect")
        .attr("class", "heatmap-cell")
        .attr("x", d => xScale(d.metricX))
        .attr("y", d => yScale(d.metricY))
        .attr("width", xScale.bandwidth())
        .attr("height", yScale.bandwidth())
        .style("fill", d => colorScale(d.correlation))
        .style("stroke", "white")
        .on("mouseover", function (event, d) {
            d3.select("#tooltip").transition().duration(200).style("opacity", .9);
            d3.select("#tooltip").html(`${axisLabels[d.metricX]} vs ${axisLabels[d.metricY]}<br>Correlation: ${d3.format(".2f")(d.correlation)}`)
                .style("left", `${event.pageX + 5}px`)
                .style("top", `${event.pageY - 28}px`);
        })
        .on("mouseout", function () {
            d3.select("#tooltip").transition().duration(200).style("opacity", 0);
        });

    // Add axes
    heatmapSvg.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${heatmapHeight})`)
        .call(d3.axisBottom(xScale).tickFormat(d => axisLabels[d] || d))
        .selectAll("text");


    heatmapSvg.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(yScale).tickFormat(d => axisLabels[d] || d));
}).catch(function(error) {
    console.error('Error loading data:', error);
});

