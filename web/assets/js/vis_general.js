'use strict';

var VisGeneral = Class.extend({
  init: function(divId) {
    this.container = divId;
    
    // Chart dimensions
    this.containerWidth = null;
    this.margin = {top: 30, right: 10, bottom: 30, left: 40};
    this.width = null;
    this.height = null;
    this.paddingLegend = null;
    this.wrapperWidth = null;

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
    this.line = d3.svg.line();
    
    // Constant values
    this.radius = 6;
    this.opacity = .5;
    this.opacityLow = .3;
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
    d3.select(window).on('resize.general', this._resize.bind(this));

    // Chart dimensions
    this.wrapperWidth = parseInt(d3.select('#general_chart').style('width'), 10);
    if (this.wrapperWidth < 482) {
      d3.select('#general_chart_lines')
        .style('width', '100%');

      d3.select('#general_chart_legend')
        .style('width', '0%');
    } 

    this.containerWidth = parseInt(d3.select(this.container).style('width'), 10);
    this.width = (this.containerWidth) - this.margin.left - this.margin.right;
    this.height = (this.containerWidth / 1.8) - this.margin.top - this.margin.bottom;
    this.paddingLegend = this.containerWidth > 476 ? this.containerWidth * 0.18 : this.containerWidth * 0.08;

    this.legendWidth = parseInt(d3.select('#general_chart_legend').style('width'), 10);
    
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
            .domain(this.dataTotals.map(function(d) { return this.containerWidth > 476 ? d.destiny : d.destiny_code; }.bind(this)))
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
            .defined(function(d) { return !isNaN(d.accepted_per); })
            .x(function(d) { return this.xScale(d.year); }.bind(this))
            .y(function(d) { return this.yScale(d.accepted_per); }.bind(this));


        // --> DRAW THE AXIS
        this.svgGeneral.append("g")
            .attr("class", "x axis general")
            .attr("transform", "translate(0," + this.height + ")")
            .call(this.xAxis);

        this.svgGeneral.append("g")
            .attr("class", "y axis general")
            .attr("transform", "translate(" + this.margin.left+ ",0)")
            .call(this.yAxis)
          .append("text")
            .attr("transform", "rotate(-90)")
            .attr('class', 'general-yaxis-title')
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
          .style('opacity', this.wrapperWidth < 482 ? this.opacityLow: this.opacity)
          .style('stroke-width', function(d) { return d.destiny != 'mean' ? 1 : 2; }.bind(this))
          .on('mouseover', this._mouseover.bind(this))
          .on('mouseout', this._mouseout.bind(this));
        
        // Mean label

        this.chart.append("text")
            .datum(function(d) { return {destiny: d.destiny, value: d.values[d.values.length - 1]}; })
            .filter(function(d) { return d.destiny == 'mean'; })
            .attr('class', 'mean-text')
            .attr("transform", function(d) { return "translate(" + this.xScale(d.value.year) + "," + this.yScale(d.value.accepted_per) + ")"; }.bind(this))
            .attr("x", 3)
            .attr("dy", ".35em")
            .style('fill', this.red)
            .text('Media');
        
        // --> DRAW THE LEGEND
        // Bars
        this.svgGeneralLegend.selectAll('.legend-bar')
              .data(this.dataTotals)
              .enter()
            .append('rect')
              .attr('class', function(d) { return this._normalize(d.destiny) + ' legend-bar'; }.bind(this))
              .attr('x', this.paddingLegend)
              .attr('y', function(d) { return this.containerWidth > 476 ?  this.yScaleLegend(d.destiny) :  this.yScaleLegend(d.destiny_code); }.bind(this))
              .attr('width', function(d) { return this.legendWidth != 0 ? this.xScaleLegend(d.total_country) : 0; }.bind(this))
              .attr('width', function(d) { return this.xScaleLegend(d.total_country); }.bind(this))
              .attr('height', this.yScaleLegend.rangeBand())
              .style('fill', this.yellow)
              .on('mouseover', this._mouseover.bind(this))
              .on('mouseout', this._mouseout.bind(this));



        // Bars title
        this.svgGeneralLegend
        .append('foreignObject')
          .attr('class', 'total-text')
          .attr('x', 0)
          .attr('y', -this.margin.top)
          .attr('width', this.xScaleLegend.range()[1] + this.paddingLegend)
          .attr('height', this.yScaleLegend.rangeBand())
          .html('Total solicitudes <br>(2008 - 2014)')
          .style('color', '#7C8388')
          .style('text-align', 'right')
          .style('font-size', '0.8em')
          .style('font-weight', '600')
          .style('line-height', '110%')


      }.bind(this)); // end load data totals
    }.bind(this)); // end load data
  }, // end render

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
      .style('opacity', 1);
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

  },

  _resize: function () {

    // Chart dimensions
    this.containerWidth = parseInt(d3.select(this.container).style('width'), 10);
    this.width = (this.containerWidth) - this.margin.left - this.margin.right;
    this.height = (this.containerWidth / 1.2) - this.margin.top - this.margin.bottom;
    this.legendWidth = parseInt(d3.select('#general_chart_legend').style('width'), 10);
    this.paddingLegend = this.containerWidth < 476 ? this.containerWidth * 0.08 : this.containerWidth * 0.15;

    this.wrapperWidth = parseInt(d3.select('#general_chart').style('width'), 10);

    if (this.wrapperWidth < 482) {
      d3.select('#general_chart_lines')
        .style('width', '100%');

      d3.select('#general_chart_legend')
        .style('width', '0%');

      d3.select('.general-yaxis-title')
        .style('visibility', 'hidden');

      d3.selectAll('.general-line')
        .style('opacity', this.opacityLow)

    } else {
      d3.select('#general_chart_lines')
        .style('width', '80%');

      d3.select('#general_chart_legend')
        .style('width', '20%');

      d3.select('.general-yaxis-title')
        .style('visibility', 'visible');

      d3.selectAll('.general-line')
        .style('opacity', this.opacity)
    }


   
    // SVG dimensions
    d3.select('.svg_general')
        .attr('width', this.width + this.margin.left + this.margin.right)
        .attr('height', this.height + this.margin.top + this.margin.bottom);

    d3.select('.svg_general_legend')
        .attr('width', this.legendWidth)
        .attr('height', this.height + this.margin.top + this.margin.bottom);

    // Update the scales
    this.xScale
        .range([this.margin.left, (this.width + this.margin.right)]);
    
    this.yScale
        .range([this.height, 0]);


    // Axis
    this.xAxis
        .scale(this.xScale);
    this.yAxis
        .scale(this.yScale);

    d3.select(".x.axis")
        .attr("transform", "translate(0," + this.height + ")")
        .call(this.xAxis);

    d3.select(".y.axis")
        .call(this.yAxis);

    // Line object
    this.line
        .x(function(d) { return this.xScale(d.year); }.bind(this))
        .y(function(d) { return this.yScale(d.accepted_per); }.bind(this));

    d3.selectAll('.general-line')
        .attr('d', function(d) { return this.line(d.values); }.bind(this));

    d3.select('.mean-text')
      .attr("transform", function(d) { return "translate(" + this.xScale(d.value.year) + "," + this.yScale(d.value.accepted_per) + ")"; }.bind(this))

    // Legend
    if (this.legendWidth != 0) {

      this.xScaleLegend
        .range([0, (this.legendWidth - this.paddingLegend)]);
      
      this.yScaleLegend
          .domain(this.dataTotals.map(function(d) { return this.containerWidth > 476 ? d.destiny : d.destiny_code; }.bind(this)) )
          .rangeRoundBands([this.height, 0], .3)
    
      this.yAxisLegend
          .scale(this.yScaleLegend);
      
      d3.select(".legendAxis")
        .attr("transform", "translate(" + this.paddingLegend+ ", 0)")
        .call(this.yAxisLegend);

      this.svgGeneralLegend.selectAll('.legend-bar')
          .attr('x', this.paddingLegend)
          .attr('y', function(d) { return this.containerWidth > 476 ?  this.yScaleLegend(d.destiny) :  this.yScaleLegend(d.destiny_code); }.bind(this))
          .attr('width', function(d) { return this.xScaleLegend(d.total_country); }.bind(this))
          .attr('height', this.yScaleLegend.rangeBand())
    
      this.svgGeneralLegend.select('.total-text')
          .attr('width', this.xScaleLegend.range()[1] + this.paddingLegend)
          .attr('height', this.yScaleLegend.rangeBand())
          .html(this.containerWidth > 476 ? 'Total solicitudes <br>(2008 - 2014)' : 'Total solicitudes');
    }

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








