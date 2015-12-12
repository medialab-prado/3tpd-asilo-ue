'use strict';

var VisSex = Class.extend({
  init: function(divId) {
    this.container = divId;
    
    // Chart dimensions
    this.containerWidth = null;
    this.axisWidth = null;
    this.margin = {top: 10, right: 20, bottom: 70, left: 20};
    this.width = null;
    this.height = null;

    // Scales
    this.xScale = d3.scale.ordinal();
    this.xScaleSecondary = d3.scale.linear();
    this.xScaleTotals = d3.scale.linear();
    this.yScale = d3.scale.ordinal();
    this.colorScale = d3.scale.ordinal().range(['#3C3F4F', '#D55B50']);

    // Axis
    this.xAxis = d3.svg.axis();
    this.yAxis = d3.svg.axis();

    // Data
    this.dataChart = null;
    this.dataDomain = null;
    this.dataCountryTotals = null;
    this.years = null;
    this.countries = null;
    this.sexs = null;

    // Legend
    this.legendDif = d3.legend.color();
    this.legendSex = d3.legend.color();

    // Objects
    this.tooltip = null;
    this.formatPercent = d3.format('%');
    this.parseDate = d3.time.format("%Y").parse;

    // Chart objects
    this.svgSex = null;
    this.svgSexAxis = null;
    this.svgSexLegend = null;
    this.chart = null;
    
    // Constant values
    this.radius = 6;
    this.opacity = .7;
    this.opacityLow = .02;
    this.duration = 1500;
    this.niceCategory = null;
    this.heavyLine = 5;
    this.lightLine = 2;
    this.grey = '#686868';
    this.yellow = '#E2AF3F'

    // Variable values
    this.selectedColor = null;
  },

  render: function(urlData) {

    // Chart dimensions
    this.containerWidth = parseInt(d3.select(this.container).style('width'), 10) - 100;
    this.width = (this.containerWidth * 3) - this.margin.left - this.margin.right;
    this.height = (this.containerWidth / 3.2) - this.margin.top - this.margin.bottom;

    this.axisWidth = parseInt(d3.select('#sex_chart_axis').style('width'), 10);

    this.margin.left = d3.select(this.container)[0][0].getBoundingClientRect().left;

    // Append tooltip
    this.tooltip = d3.select('body').append('div')
      .attr('class', 'vis_sex_tooltip tooltip')
      .style('opacity', 0);


    // Append svg
    this.svgSex = d3.select(this.container).append('svg')
        .attr('width', this.width + this.margin.left + this.margin.right)
        .attr('height', this.height + this.margin.top + this.margin.bottom)
        .attr('class', 'svg_sex')
      .append('g')
        .attr('transform', 'translate(' + 0 + ',' + this.margin.top + ')');

    this.svgSexAxis = d3.select('#sex_chart_axis').append('svg')
        .attr('width', this.axisWidth)
        .attr('height', this.height + this.margin.top + this.margin.bottom)
      .append('g')
        .attr('transform', 'translate(' + (this.margin.left / 2)+ ',' + this.margin.top + ')');

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
    d3.csv('web/data/vis_sex_data_v2.csv', function(error, csvData){
      if (error) throw error;
      
      // Map the data
      this.dataChart = csvData;

      // Filter the accepted_per != NaN
      this.dataChart = this.dataChart.filter(function(d) { return d.win != "NA"; })

      this.dataChart.forEach(function(d) { 
        // d.year = this.parseDate(d.year);
        d.Hombres = +d.Hombres;
        d.Mujeres = +d.Mujeres;
        d.total = +d.total;
        d.total_country = +d.total_country;
        d.dif = +d.dif;
      }.bind(this));

      this.dataCountryTotals = d3.nest()
        .key(function(d) { return d.destiny;})
        .entries(this.dataChart)
        .map(function(d) { return {'destiny': d.key, 'total_country': d.values[0].total_country}; });

      // Sort the data

      this.dataChart = this.dataChart.sort(
          firstBy('total_country', -1)
          .thenBy('year', -1)
          .thenBy('sex')
      );

      // Get the unique countries and unique sex
      
      this.countries = d3.nest()
        .key(function(d) { return d.destiny;})
        .entries(this.dataChart)
        .map(function(d) { return d.key; });

      this.sexs = d3.nest()
        .key(function(d) { return d.win;})
        .entries(this.dataChart)
        .map(function(d) { return d.key; });
      
      this.years = d3.nest()
        .key(function(d) { return d.year;})
        .entries(this.dataChart)
        .map(function(d) { return d.key; });

      // Set the scales
      this.xScale
        .domain(this.countries)
        .rangeRoundBands([0, (this.width - this.margin.right)], .1);

      var maxPer = d3.max(this.dataChart, function(d) { return d.dif; })
      var maxTotal = d3.max(this.dataChart, function(d) { return d.total_country; })

      this.xScaleSecondary
        .domain([0, maxPer])
        .range([0, this.xScale.rangeBand()]);

      this.xScaleTotals
        .domain([0, maxTotal])
        .range([0, this.xScale.rangeBand()]);
      
      this.yScale
        .domain(this.years)
        .rangeRoundBands([this.height, 0], .3);
      
      this.colorScale
        .domain(this.sexs);
      
      // Define the axis 
      this.xAxis
          .scale(this.xScale)
          .orient("bottom");  

      this.yAxis
          .scale(this.yScale)
          .orient("left");

      d3.selectAll('.x.axis').select('text')
          .style('text-anchor', 'start')

      // --> DRAW THE BARS  
      this.chart = this.svgSex.append('g')
          .attr('class', 'sex_chart');

      // Background
      this.chart.selectAll('.sex-bar-bg')
        .data(this.dataChart)
        .enter()
      .append('rect')
        .attr('class', function(d) { return 'sex-bar-bg ' + this._normalize(d.win); }.bind(this))
        .attr('x', function(d) { return this.xScale(d.destiny); }.bind(this))
        .attr('y', 0)
        .attr('width', this.xScale.rangeBand())
        .attr('height', this.height)
        .style('fill', this.grey)
        .style('opacity', this.opacityLow)

      // Total bars
      this.chart.selectAll('.total-bar')
        .data(this.dataCountryTotals)
        .enter()
      .append('rect')
        .attr('class', function(d) { return 'total-bar '; }.bind(this))
        .attr('x', function(d) { return this.xScale(d.destiny); }.bind(this))
        .attr('y', this.height + 10)
        .attr('width', function(d) { return this.xScaleTotals(d.total_country); }.bind(this))
        .attr('height', this.yScale.rangeBand())
        .style('fill', this.yellow)
        .on('mouseover', this._mouseover.bind(this))
        .on('mouseout', this._mouseout.bind(this));

      // Total labels
      this.chart.selectAll('.total-label')
        .data(this.dataCountryTotals)
        .enter()
      .append('text')
        .attr('class', function(d) { return 'total-bar total-label'; }.bind(this))
        .attr('x', function(d) { return this.xScale(d.destiny) + this.xScale.rangeBand(); }.bind(this))
        .attr('y', this.height + this.yScale.rangeBand())
        .text(function(d) { return d.total_country.toLocaleString(); })
        .attr('text-anchor', 'end')
        .style('fill', d3.rgb(this.grey).darker())
        .on('mouseover', this._mouseover.bind(this))
        .on('mouseout', this._mouseout.bind(this));

      // Total text
      this.svgSexAxis
        .append('foreignObject')
          .attr('class', 'total-text')
          .attr('x', 0)
          .attr('y', this.height + 10)
          .attr('width', this.axisWidth/2)
          .attr('height', this.yScale.rangeBand())
          .html('Total solicitudes <br>recibidas (2008 - 2014)')
          .style('color', '#7C8388')
          .style('text-align', 'right')
          .style('font-size', '0.8em')
          .style('font-weight', '600')
          .style('line-height', '110%')


      // Foreground bar
      this.chart.selectAll('.sex-bar')
        .data(this.dataChart)
        .enter()
      .append('rect')
        .attr('class', function(d) { return 'sex-bar ' + this._normalize(d.win); }.bind(this))
        .attr('x', function(d) { return this.xScale(d.destiny); }.bind(this))
        .attr('y', function(d) { return this.yScale(d.year)}.bind(this))
        .attr('width', function(d) { return this.xScaleSecondary(d.dif); }.bind(this))
        .attr('height', this.yScale.rangeBand())
        .style('fill', function(d) { return this.colorScale(d.win); }.bind(this))
        .on('mouseover', this._mouseover.bind(this))
        .on('mouseout', this._mouseout.bind(this));

      // --> DRAW THE AXIS
      this.svgSex.append("g")
          .attr("class", "x axis")
          .attr("transform", "translate(" + 0 + "," + (this.height + (this.yScale.rangeBand() + 10))+ ")")
          .call(this.xAxis);

      this.svgSexAxis.append("g")
          .attr("class", "y axis")
          .attr("transform", "translate(" + (this.margin.left/2) + ",0)")
          .call(this.yAxis);
      
      // --> DRAW THE LEGEND 
      
      this.svgSexLegend = d3.select('#sex_chart_legend').append('svg')
        .attr('width', this.width)
        .attr('height', 70)
        .attr('class', 'svg_sex_legend')
      .append('g')
        .attr('transform', 'translate(' + (this.axisWidth) + ',' + (this.margin.top * 5) + ')');

      var difScale = d3.scale.ordinal().domain(['Valor de la diferencia (10%)']).range([this.grey]);
    
      this.svgSexLegend.append("g")
        .attr("class", "legend_dif")
        .attr("transform", "translate(" + 30 + "," + (-20) + ")");

      this.svgSexLegend.append("g")
        .attr("class", "legend_sex")
        .attr("transform", "translate(" + 250 + "," + 0 + ")");

      this.legendDif
        .shapeWidth(this.xScaleSecondary(0.1))
        .shapeHeight(this.yScale.rangeBand())
        .shapePadding(10)
        .ascending(true)
        .scale(difScale);

      this.legendSex
        .shape('path', d3.svg.symbol().type('circle').size(90)())
        .shapeWidth(18)
        .shapePadding(50)
        .orient('horizontal')
        .ascending(true)
        .scale(this.colorScale)
        .title('Diferencia a favor de...');

      d3.select(".legend_dif")
        .call(this.legendDif);

      d3.select(".legend_sex")
        .call(this.legendSex);

      this.svgSexLegend.selectAll('.legendTitle')
        .style('font-weight', 600)

      d3.select('.legend_sex').select('.legendCells')
      .attr('transform', 'translate(' + 160 + ',' + (-this.margin.top/2) + ')')


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

    // this.svgSex.select(".x.axis")
    //   .transition()
    //   .duration(this.duration)
    //   .delay(this.duration/2)
    //   .ease("sin-in-out") 
    //   .call(this.xAxis);

    // this.svgSex.select(".y.axis")
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
    // this.svgSex.selectAll('.evolution_line')
    //   .data(this.dataChart)
    //   .transition()
    //   .duration(this.duration)
    //   .attr('d', function(d) { return this.line(d.values); }.bind(this))
    //   .style('stroke', function(d) { return this.colorScale(d.name); }.bind(this));

    // // Update the points
    // this.svgSex.selectAll(".dots")
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

    this.selectedColor = d3.select(selected).style('fill')

    if (selectedClass[0].indexOf('total-bar') == -1) {
      var text = '% Mujeres aceptadas: <strong>' + this.formatPercent(selectedData.Mujeres) + '</strong><br>' +
              '% Hombres aceptados: <strong>' + this.formatPercent(selectedData.Hombres)  + '</strong><br>' + 
              '% Diferencia: <strong>' + this.formatPercent(selectedData.dif)  + ' más ' + selectedData.win.toLowerCase() + '</strong>';
    } else {
      var text = '<strong>' + selectedData.destiny + '</strong><br>' + 
            'Total solicitudes: <strong>' + selectedData.total_country.toLocaleString() + '</strong>';
    }
   
    // Hightlight selected
    d3.select(selected)
      .transition()
      .duration(this.duration / 2)
      .style('fill', d3.rgb(this.selectedColor).darker());
    
    this.tooltip
        .transition()
        .duration(this.duration / 4)
        .style('opacity', this.opacity);

    this.tooltip
        .html(text)
        .style('left', (d3.event.pageX + 25) + 'px')
        .style('top', (d3.event.pageY - 25) + 'px');

  },

  _mouseout: function () {
    var selected = d3.event.target,
        selectedClass = selected.classList,
        selectedData = d3.select(selected).data()[0];

    // UN - Hightlight selected
    d3.select(selected)
      .transition()
      .duration(this.duration / 2)
      .style('fill', this.selectedColor)
    
    this.tooltip
        .transition()
        .duration(this.duration / 4)
        .style('opacity', 0);
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








