'use strict';

var VisGeneral = Class.extend({
  init: function(divId) {
    this.container = divId;
    
    // Chart dimensions
    this.containerWidth = null;
    this.margin = {top: 30, right: 10, bottom: 30, left: 40};
    this.width = null;
    this.height = null;
    this.paddingLegend = 100;

    // Scales
    this.xScale = d3.time.scale();
    this.yScale = d3.scale.linear();
    this.xScaleLegend = d3.scale.linear();
    this.yScaleLegend = d3.scale.ordinal();
    this.colorScale = d3.scale.ordinal().range(['#3C3F4F', '#D55B50']);

    // Axis
    this.xAxis = d3.svg.axis();
    this.yAxis = d3.svg.axis();
    this.yAxisLegend = d3.svg.axis();

    // Data
    this.dataChart = null;
    this.dataTotals = null;
    this.years = null;
    this.countries = null;

    // Legend
    this.legendGeneral = d3.legend.color();

    // Objects
    this.tooltip = null;
    this.formatPercent = d3.format('%');
    this.parseDate = d3.time.format("%Y").parse;

    // Chart objects
    this.svgGeneral = null;
    this.svgGeneralLegend = null;
    this.chart = null;
    this.line = d3.svg.line()
    
    // Constant values
    this.radius = 6;
    this.opacity = .7;
    this.opacityLow = .02;
    this.duration = 1500;
    this.niceCategory = null;
    this.heavyLine = 5;
    this.lightLine = 2;
    this.grey = '#686868';
    this.yellow = '#E2AF3F';
    this.red = '#EA3556';


    // Variable values
    this.selectedColor = null;
  },

  render: function(urlData) {

    // Chart dimensions
    this.containerWidth = parseInt(d3.select(this.container).style('width'), 10);
    this.width = (this.containerWidth) - this.margin.left - this.margin.right;
    this.height = (this.containerWidth / 1.5) - this.margin.top - this.margin.bottom;


    this.legendWidth = parseInt(d3.select('#general_chart_legend').style('width'), 10)
    
    // Append tooltip
    this.tooltip = d3.select('body').append('div')
      .attr('class', 'vis_general_tooltip')
      .style('opacity', 0);


    // Append svg
    this.svgGeneral = d3.select(this.container).append('svg')
        .attr('width', this.width + this.margin.left + this.margin.right)
        .attr('height', this.height + this.margin.top + this.margin.bottom)
        .attr('class', 'svg_general')
      .append('g')
        .attr('transform', 'translate(' + 0 + ',' + this.margin.top + ')');

    this.svgGeneralLegend = d3.select('#general_chart_legend').append('svg')
        .attr('width', this.legendWidth)
        .attr('height', this.height + this.margin.top + this.margin.bottom)
        .attr('class', 'svg_general_legend')
      .append('g')
        .attr('transform', 'translate(' + 0 + ',' + this.margin.top + ')');


    // // Set nice category
    // this.niceCategory = {
    //   "Actuaciones de carácter general": "Actuaciones Generales",
    //   "Actuaciones de carácter económico": "Actuaciones Económicas",
    //   "Producción de bienes públicos de carácter preferente": "Bienes Públicos",
    //   "Actuaciones de protección y promoción social": "Protección Social",
    //   "Servicios públicos básicos": "Servicios Públicos",
    //   "Deuda pública": "Deuda Pública",
    //   "mean_national": "Media Nacional",
    //   "mean_autonomy": "Media Autonómica",
    //   "mean_province": "Media Provincial",
    //   "G": "Gasto/habitante",
    //   "I": "Ingreso/habitante",
    //   "percentage": "% sobre el total"
    // }

    // Load the data
    d3.csv('web/data/vis_general.csv', function(error, csvData){
      if (error) throw error;
      
      // Map the data
      this.data = csvData;

      this.data.forEach(function(d) { 
        d.year = this.parseDate(d.year);
      }.bind(this));

      this.colorScale.domain(d3.keys(this.data[0]).filter(function(key) { return key !== "year"; }.bind(this)));

      this.dataChart = this.colorScale.domain().map(function(country) {
        return {
          destiny: country,
          values: this.data.map(function(d) {
            return {year: d.year, accepted_per: +d[country]};
          }.bind(this))
        };
      }.bind(this));

      // Load data totals
      d3.csv('web/data/totals.csv', function(error, totalsData) {
        
        this.dataTotals = totalsData

        this.dataTotals.forEach(function(d) { 
          d.total_country = +d.total_country;
        }.bind(this));

        this.dataTotals.sort(function(a, b) { 
          return a.total_country - b.total_country; 

        });

        // Set the scales
        this.xScale
          .domain(d3.extent(this.data, function(d) { return d.year; }))
          .range([this.margin.left, (this.width + this.margin.right)]);
        
        this.yScale
            .domain([0,1])
          // .domain([
          //     d3.min(this.dataChart, function(c) { return d3.min(c.values, function(v) { return v.accepted_per; }.bind(this)); }.bind(this)),
          //     d3.max(this.dataChart, function(c) { return d3.max(c.values, function(v) { return v.accepted_per; }.bind(this)); }.bind(this))
          //   ])
          .range([this.height, 0]);
        
          
        this.xScaleLegend
            .domain([0, d3.max(this.dataTotals, function(d) { return d.total_country; })])
            .range([0, (this.legendWidth - this.paddingLegend)]);
        
        this.yScaleLegend
            .domain(this.dataTotals.map(function(d) { return d.destiny; }.bind(this)))
            .rangeRoundBands([this.height, 0], .3)
        
        // Define the axis 
        this.xAxis
            .scale(this.xScale)
            .orient("bottom");  

        this.yAxis
            .scale(this.yScale)
            .tickValues(this._tickValues(this.yScale))
            .tickFormat(this.formatPercent)
            .orient("left");

        this.yAxisLegend
            .scale(this.yScaleLegend)
            .orient("left");

        
        // Define the line
        this.line
          .interpolate("basis")
          .x(function(d) { return this.xScale(d.year); }.bind(this))
          .y(function(d) { return this.yScale(d.accepted_per); }.bind(this));


        // --> DRAW THE AXIS
        this.svgGeneral.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + this.height + ")")
            .call(this.xAxis);

        this.svgGeneral.append("g")
            .attr("class", "y axis")
            .attr("transform", "translate(" + this.margin.left+ ",0)")
            .call(this.yAxis)
          .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            .text("% Solicitudes asilo aceptadas");

        this.svgGeneralLegend.append("g")
            .attr("class", "y axis legendAxis")
            .attr("transform", "translate(" + this.paddingLegend + ",0)")
            .call(this.yAxisLegend)
          .append("text")


        this.svgGeneralLegend.select(".legendAxis")
            .selectAll(".tick")
            .selectAll('text')
            .attr('class', function(d) { return this._normalize(d); }.bind(this))
            .style('cursor', 'default')
            .on('mouseover', this._mouseover.bind(this))
            .on('mouseout', this._mouseout.bind(this))

        // --> DRAW THE LINES

        this.chart = this.svgGeneral.selectAll('.general-lines')
            .data(this.dataChart)
            .enter()
          .append('g')
            .attr('class', function(d) { return 'general-lines ' + this._normalize(d.destiny); }.bind(this));

        this.chart.append('path')
          .attr('class', function(d) { return this._normalize(d.destiny) + ' general-line'; }.bind(this))
          .attr('d', function(d) { return this.line(d.values); }.bind(this))
          .style('stroke', function(d) { return d.destiny == 'mean' ? this.red : this.grey; }.bind(this))
          .style('opacity', this.opacity)
          .style('stroke-width', function(d) { return d.destiny != 'mean' ? 1 : 2; }.bind(this))
          .on('mouseover', this._mouseover.bind(this))
          .on('mouseout', this._mouseout.bind(this));
        
        // Mean label

        this.chart.append("text")
            .datum(function(d) { return {destiny: d.destiny, value: d.values[d.values.length - 1]}; })
            .filter(function(d) { return d.destiny == 'mean'; })
            .attr("transform", function(d) { return "translate(" + this.xScale(d.value.year) + "," + this.yScale(d.value.accepted_per) + ")"; }.bind(this))
            .attr("x", 3)
            .attr("dy", ".35em")
            .style('fill', this.red)
            .text('Media');
        
        // --> DRAW THE LEGEND
        // Bars
        this.svgGeneralLegend.selectAll('.legend-bar')
            .data(this.dataTotals)
            .enter().append('rect')
            .attr('class', function(d) { return this._normalize(d.destiny) + ' legend-bar'; }.bind(this))
                .attr('x', this.paddingLegend)
                .attr('y', function(d) { return this.yScaleLegend(d.destiny); }.bind(this))
                .attr('width', function(d) { return this.xScaleLegend(d.total_country); }.bind(this))
                .attr('height', this.yScaleLegend.rangeBand())
                .style('fill', this.yellow)
                .on('mouseover', this._mouseover.bind(this))
                .on('mouseout', this._mouseout.bind(this));

        // Total labels
      this.svgGeneralLegend.selectAll('.total-label')
        .data(this.dataTotals)
        .enter()
      .append('text')
        .attr('class', function(d) { return this._normalize(d.destiny) + ' total-bar total-label'; }.bind(this))
        .attr('x', this.legendWidth)
        .attr('y', function(d) { return this.yScaleLegend(d.destiny) + this.yScaleLegend.rangeBand(); }.bind(this))
        .text(function(d) { return d.total_country.toLocaleString(); })
        .attr('text-anchor', 'end')
        .style('fill', d3.rgb(this.grey).darker())
        .style('font-size', '0.7em')
        .style('opacity', 0)

        // Bars title
        this.svgGeneralLegend
        .append('foreignObject')
          .attr('class', 'total-text')
          .attr('x', 0)
          .attr('y', -this.margin.top)
          .attr('width', this.xScaleLegend.range()[1] + this.paddingLegend)
          .attr('height', this.yScaleLegend.rangeBand())
          .html('Total solicitudes <br>recibidas (2008 - 2014)')
          .style('color', '#7C8388')
          .style('text-align', 'right')
          .style('font-size', '0.8em')
          .style('font-weight', '600')
          .style('line-height', '110%')


      }.bind(this)); // end load data totals
    }.bind(this)); // end load data
  }, // end render

  updateRender: function () {

    // // re-map the data
    // this.dataChart = this.data.budgets[this.measure];
    // this.kind = this.data.kind;
    // this.dataYear = this.parseDate(this.data.year);

    // this.dataDomain = [d3.min(this.dataChart.map(function(d) { return d3.min(d.values.map(function(v) { return v.value; })); })), 
    //           d3.max(this.dataChart.map(function(d) { return d3.max(d.values.map(function(v) { return v.value; })); }))];

    // // Update the scales
    // this.xScale
    //   .domain(d3.extent(this.dataChart[0].values, function(d) { return d.date; }));

    // this.yScale
    //   .domain([this.dataDomain[0] * .3, this.dataDomain[1] * 1.2]);

    // this.colorScale
    //   .domain(this.dataChart.map(function(d) { return d.name; }));

    // // Update the axis
    // this.xAxis.scale(this.xScale);
 
    // this.yAxis
    //     .scale(this.yScale)
    //     .tickValues(this._tickValues(this.yScale))
    //     .tickFormat(function(d) { return this.measure != 'percentage' ? d3.round(d, 2) : d3.round(d * 100, 2) + '%'; }.bind(this));

    // this.svgGeneral.select(".x.axis")
    //   .transition()
    //   .duration(this.duration)
    //   .delay(this.duration/2)
    //   .ease("sin-in-out") 
    //   .call(this.xAxis);

    // this.svgGeneral.select(".y.axis")
    //   .transition()
    //   .duration(this.duration)
    //   .delay(this.duration/2)
    //   .ease("sin-in-out") 
    //   .call(this.yAxis);

    // // Change ticks color
    // d3.selectAll('.axis').selectAll('text')
    //   .attr('fill', this.darkColor);

    // d3.selectAll('.axis').selectAll('path')
    //   .attr('stroke', this.darkColor);

    // // Update lines
    // this.svgGeneral.selectAll('.evolution_line')
    //   .data(this.dataChart)
    //   .transition()
    //   .duration(this.duration)
    //   .attr('d', function(d) { return this.line(d.values); }.bind(this))
    //   .style('stroke', function(d) { return this.colorScale(d.name); }.bind(this));

    // // Update the points
    // this.svgGeneral.selectAll(".dots")
    //     .data(this.dataChart)
    //   .selectAll(".dot_line")
    //     .data(function(d) { return d.values; })
    //     .transition()
    //     .duration(this.duration)
    //     .attr('cx', function(d) { return this.xScale(d.date); }.bind(this))
    //     .attr('cy', function(d) { return this.yScale(d.value); }.bind(this))
    //     // .style('fill', function(v) { return this.colorScale(d3.select('.dot_line.x'+v.value).node().parentNode.__data__.name); }.bind(this)); 
    //     //
    // var series = this.colorScale.domain();

    // var labels = [];
    // for (var i = 0; i < series.length; i++) {
    //   if (this.niceCategory[series[i]] != undefined) {
    //     labels.push(this.niceCategory[series[i]])
    //   } else {
    //     labels.push(series[i])
    //   }
    // }

    // // Update legends
    // this.legendEvolution
    //     .labels(labels)
    //     .scale(this.colorScale);

    // d3.select(".legend_evolution")
    //     .call(this.legendEvolution);
  },

  //PRIVATE
  _tickValues:  function (scale) {
    var range = scale.domain()[1] - scale.domain()[0];
    var a = range/4;
    return [scale.domain()[0], scale.domain()[0] + a, scale.domain()[0] + (a * 2), scale.domain()[1] - a, scale.domain()[1]];
  },

  _mouseover: function () {
    var selected = d3.event.target,
        selectedClass = selected.classList,
        selectedData = d3.select(selected).data()[0];

    console.log(selectedClass[0])

    // Hilight the line
    d3.selectAll('.general-line.' + selectedClass[0])
      .transition()
      .duration(this.duration/3)
      .style('opacity', 1)
      .style('stroke-width', 3)

    d3.selectAll('.legend-bar.' + selectedClass[0])
      .transition()
      .duration(this.duration/3)
      .style('fill', d3.rgb(this.yellow).darker());

    d3.selectAll('.legendAxis').selectAll('text.' + selectedClass[0])
      .transition()
      .duration(this.duration/3)
      .style('fill', d3.rgb(this.grey).darker())
      .style('font-weight', 'bold');

    d3.selectAll('.total-label.' + selectedClass[0])
      .transition()
      .duration(this.duration/3)
      .style('opacity', 1)



    // this.selectedColor = d3.select(selected).style('fill')

    // if (selectedClass[0].indexOf('total-bar') == -1) {
    //   var text = '% Mujeres aceptadas: <strong>' + this.formatPercent(selectedData.Mujeres) + '</strong><br>' +
    //           '% Hombres aceptados: <strong>' + this.formatPercent(selectedData.Hombres)  + '</strong><br>' + 
    //           '% Diferencia: <strong>' + this.formatPercent(selectedData.dif)  + ' más ' + selectedData.win.toLowerCase() + '</strong>';
    // } else {
    //   var text = '<strong>' + selectedData.destiny + '</strong><br>' + 
    //         'Total solicitudes: <strong>' + selectedData.total_country.toLocaleString() + '</strong>';
    // }
   
    // // Hightlight selected
    // d3.select(selected)
    //   .transition()
    //   .duration(this.duration / 2)
    //   .style('fill', d3.rgb(this.selectedColor).darker());
    
    // this.tooltip
    //     .transition()
    //     .duration(this.duration / 4)
    //     .style('opacity', this.opacity);

    // this.tooltip
    //     .html(text)
    //     .style('left', (d3.event.pageX + 25) + 'px')
    //     .style('top', (d3.event.pageY - 25) + 'px');

  },

  _mouseout: function () {
    var selected = d3.event.target,
        selectedClass = selected.classList,
        selectedData = d3.select(selected).data()[0];

    // UN - Hightlight selected
    d3.selectAll('.general-line.' + selectedClass[0])
      .transition()
      .duration(this.duration/3)
      .style('opacity', this.opacity)
      .style('stroke-width', 1)

    d3.selectAll('.legend-bar.' + selectedClass[0])
      .transition()
      .duration(this.duration/3)
      .style('fill', this.yellow);

    d3.selectAll('.legendAxis').selectAll('text.' + selectedClass[0])
      .transition()
      .duration(this.duration/3)
      .style('fill', this.grey)
      .style('font-weight', '300');

    d3.selectAll('.total-label.' + selectedClass[0])
      .transition()
      .duration(this.duration/3)
      .style('opacity', 0)
    
    // this.tooltip
    //     .transition()
    //     .duration(this.duration / 4)
    //     .style('opacity', 0);
  },

  _normalize: (function() {
    var from = "ÃÀÁÄÂÈÉËÊÌÍÏÎÒÓÖÔÙÚÜÛãàáäâèéëêìíïîòóöôùúüûÑñÇç ", 
        to   = "AAAAAEEEEIIIIOOOOUUUUaaaaaeeeeiiiioooouuuunncc_",
        mapping = {};
   
    for(var i = 0, j = from.length; i < j; i++ )
        mapping[ from.charAt( i ) ] = to.charAt( i );
   
    return function( str ) {
        var ret = [];
        for( var i = 0, j = str.length; i < j; i++ ) {
            var c = str.charAt( i );
            if( mapping.hasOwnProperty( str.charAt( i ) ) )
                ret.push( mapping[ c ] );
            else
                ret.push( c );
        }      
        return ret.join( '' ).toLowerCase();
    }
 
  })()

}); // End object








