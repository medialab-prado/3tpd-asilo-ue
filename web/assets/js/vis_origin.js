'use strict';

var VisOrigin = Class.extend({
  init: function(divId) {
    this.container = divId;
    
    // Chart dimensions
    this.containerWidth = null;
    this.axisWidth = null;
    this.margin = {top: 10, right: 60, bottom: 40, left: 40};
    this.width = null;
    this.height = null;

    // Scales
    this.xScale = d3.scale.ordinal();
    this.xScaleTotals = d3.scale.ordinal();
    this.yScaleTotals = d3.scale.ordinal();
    this.yScale = d3.scale.ordinal();
    this.colorScale = d3.scale.ordinal().range(['#ECD078', '#FBCE34', '#FB9A02', '#C68E26', '#C86700', '#6FAA71', '#3A7343', '#D05253', '#BA1C1B', '#700404']);
                                                
    // this.colorScale = d3.scale.ordinal().range(['#F9CE4A', '#F5A71A', '#EF8D19', '#C47413', '#FADE8A','#B6CA0A', '#7A9B02', '#e95b46', '#e4001e', '#ba0006']);
                                                // ['Siria', 'Afganistán', 'Iraq',   'Rusia',   'Serbia',   'Somalia','Pakistán', 'Nigeria', 'Irán',    'Kosovo']
    // Axis
    this.xAxis = d3.svg.axis();
    this.yAxis = d3.svg.axis();
    this.yAxisTotals = d3.svg.axis();

    // Data
    this.dataChart = null;
    this.dataTotals = null;
    this.dataCountryTotals = null;
    this.years = null;
    this.countries = null;
    this.origins = null;
    this.totalApp = null;

    // Legend
    this.legendOrigin = d3.legend.color();
    // this.legendSex = d3.legend.color();

    // Objects
    this.tooltip = null;
    this.formatPercent = d3.format('%');
    this.parseDate = d3.time.format("%Y").parse;

    // Chart objects
    this.svgOrigin = null;
    this.svgOriginAxis = null;
    this.svgOriginLegend = null;
    this.chart = null;
    
    // Constant values
    this.radius = 6;
    this.opacity = .9;
    this.opacityLow = .5;
    this.duration = 1500;
    this.niceCategory = null;
    this.heavyLine = 5;
    this.lightLine = 2;
    this.grey = '#686868';
    this.yellow = '#E2AF3F'

    // Variable values
    this.selectedColor = null;
  },

  loadData: function() {
    // Chart dimensions
    this.containerWidth = parseInt(d3.select(this.container).style('width'), 10);
    this.width = (this.containerWidth) - this.margin.left - this.margin.right;
    this.height = (this.containerWidth / 3.3) - this.margin.top - this.margin.bottom;


    // Append tooltip
    this.tooltip = d3.select('body').append('div')
      .attr('class', 'vis_origin_tooltip tooltip')
      .style('opacity', 0);


    // Append svg
    this.svgOrigin = d3.select(this.container).append('svg')
        .attr('width', this.width + this.margin.left + this.margin.right)
        .attr('height', this.height + this.margin.top + this.margin.bottom)
        .attr('class', 'svg_age')
      .append('g')
        .attr('transform', 'translate(' + 0 + ',' + this.margin.top + ')');


    // Set nice category
    this.totalApp = {
      "Siria": 137145,
      "Afganistán":  127460,
      "Iraq":  117000,
      "Rusia": 108590,
      "Serbia": 93160,
      "Somalia": 90375,
      "Pakistán": 90165,
      "Nigeria": 63765,
      "Irán": 62045,
      "Kosovo": 61560
    }
  }, 


  render: function(urlData) {
    // Load the data
    d3.csv(urlData, function(error, csvData){
      if (error) throw error;
      
      // Map the data
      this.dataChart = csvData;

      // Filter the accepted_per != NA
      this.dataChart = this.dataChart.filter(function(d) { return d.win != "NA"; })

      this.dataChart.forEach(function(d) { 
        // d.year = this.parseDate(d.year);
        d.Afganistán = +d.Afganistán;
        d.Iraq = +d.Iraq;
        d.Irán = +d.Irán;
        d.Kosovo = +d.Kosovo;
        d.Nigeria = +d.Nigeria;
        d.Pakistán = +d.Pakistán;
        d.Rusia = +d.Rusia;
        d.Serbia = +d.Serbia;
        d.Siria = +d.Siria;
        d.Somalia = +d.Somalia;
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
      );

      // Get the unique countries, origins and years.
      
      this.countries = d3.nest()
        .key(function(d) { return d.destiny;})
        .entries(this.dataChart)
        .map(function(d) { return d.key; });

      this.origins = ['Siria', 'Afganistán', 'Iraq', 'Irán', 'Pakistán', 'Somalia', 'Nigeria', 'Rusia', 'Serbia', 'Kosovo'];
      
      this.years = d3.nest()
        .key(function(d) { return d.year;})
        .entries(this.dataChart)
        .map(function(d) { return d.key; });


      // Set the scales
      this.xScale
        .domain(this.countries)
        .rangeRoundBands([this.margin.left, (this.width - this.margin.right)], .2);
      
      var yScaleHeight = (this.years.length * (((this.width - this.margin.right)) - this.margin.left)) / this.countries.length

      this.yScale
        .domain(this.years)
        .rangeRoundBands([yScaleHeight, 0], .2);
      
      this.colorScale
        .domain(this.origins);
      
      // Define the axis 
      this.xAxis
          .scale(this.xScale)
          .orient("bottom");  

      this.yAxis
          .scale(this.yScale)
          .orient("left");


      // --> DRAW THE BARS  
      this.chart = this.svgOrigin.append('g')
          .attr('class', 'origin_chart');

      this.chart.selectAll('.origin-bar')
        .data(this.dataChart)
        .enter()
      .append('rect')
        .attr('class', function(d) { return 'origin-bar ' + this._normalize(d.win) + ' ' + this._normalize(d.destiny); }.bind(this))
        .attr('x', function(d) { return this.xScale(d.destiny); }.bind(this))
        .attr('y', function(d) { return this.yScale(d.year)}.bind(this))
        .attr('width', this.xScale.rangeBand())
        .attr('height', this.yScale.rangeBand())
        .style('fill', function(d) { return this.colorScale(d.win); }.bind(this))
        .on('mouseover', this._mouseoverRender.bind(this))
        .on('mouseout', this._mouseoutRender.bind(this));

      // --> DRAW THE AXIS
      this.svgOrigin.append("g")
          .attr("class", "x axis")
          .attr("transform", "translate(" + 0 + "," + yScaleHeight + ")")
          .call(this.xAxis)
        .selectAll("text")
          .attr('class', function(d) { return this._normalize(d); }.bind(this))
          .attr("y", 0)
          .attr("x", 9)
          .attr("dx", "-.85em")
          .attr("dy", ".25em")
          .attr("transform", "rotate(-45)")
          .style("text-anchor", "end");

      this.svgOrigin.append("g")
          .attr("class", "y axis")
          .attr("transform", "translate(" + this.margin.left + ",0)")
          .call(this.yAxis);
      
      // --> DRAW THE LEGEND 
    
      this.svgOrigin.append("g")
        .attr("class", "legend_origin")
        .attr("transform", "translate(" + (this.width - 20)+ "," + 0 + ")");
   
      this.legendOrigin
        .shapeWidth(this.xScale.rangeBand() * 0.7)
        .shapeHeight(this.yScale.rangeBand() * 0.7)
        .shapePadding(5)
        .scale(this.colorScale);

      d3.select(".legend_origin")
        .call(this.legendOrigin);

      this.svgOrigin.selectAll('.label')
          .attr('class', function(d) { return 'legend label ' + this._normalize(d); }.bind(this))
          .on('mouseover', function(d) { 
            var selectedClass = d3.event.target.classList;
            d3.selectAll('.' + selectedClass[0] + '.' + selectedClass[2])
              .style('cursor', 'pointer')
              .style('opacity', this.opacityLow);
          }.bind(this))
          .on('mouseout', function(d) { 
            var selectedClass = d3.event.target.classList;
            d3.selectAll('.' + selectedClass[0] + '.' + selectedClass[2])
              .style('opacity', 1);
          }.bind(this))
          .on('click', this._clickLegend.bind(this));

      this.svgOrigin.selectAll('.swatch')
          .attr('class', function(d) { return 'legend swatch ' + this._normalize(d); }.bind(this))
          .on('mouseover', function(d) { 
            var selectedClass = d3.event.target.classList;
            d3.selectAll('.' + selectedClass[0] + '.' + selectedClass[2])
              .style('cursor', 'pointer')
              .style('opacity', this.opacityLow);
          }.bind(this))
          .on('mouseout', function(d) { 
            var selectedClass = d3.event.target.classList;
            d3.selectAll('.' + selectedClass[0] + '.' + selectedClass[2])
              .style('opacity', 1);
          }.bind(this))
          .on('click', this._clickLegend.bind(this));
    }.bind(this)); // end load data
  }, // end render

  renderTotals: function(urlData) {
      
    d3.csv(urlData, function(error, csvData){
      if (error) throw error;

      // Map the data
      this.dataChart = csvData;

      // Filter the accepted_per != NaN
      this.dataChart = this.dataChart.filter(function(d) { return d.win != "NA"; })

      this.dataChart.forEach(function(d) { 
        // d.year = this.parseDate(d.year);
        d.Afganistán = +d.Afganistán;
        d.Iraq = +d.Iraq;
        d.Irán = +d.Irán;
        d.Kosovo = +d.Kosovo;
        d.Nigeria = +d.Nigeria;
        d.Pakistán = +d.Pakistán;
        d.Rusia = +d.Rusia;
        d.Serbia = +d.Serbia;
        d.Siria = +d.Siria;
        d.Somalia = +d.Somalia;
        d.total_country = +d.total_country;
        d.dif = +d.dif;
      }.bind(this));

      this.origins = ['Siria', 'Afganistán', 'Iraq', 'Rusia', 'Serbia', 'Somalia', 'Pakistán', 'Nigeria', 'Irán', 'Kosovo']

      this.dataTotals = d3.nest()
        .key(function(d) { return d.win;}).sortKeys(function(a,b) { return this.origins.indexOf(b) - this.origins.indexOf(a); }.bind(this))
        .entries(this.dataChart);

      var valuesLength =  d3.nest()
        .key(function(d) { return d.win;})
        .rollup(function(values) { return values.length; })
        .entries(this.dataChart);

      var max = d3.max(valuesLength, function(d) { return d.values; })
      
      var totalsDomain = [];
      for (var i = 0; i < max; i++) { 
        totalsDomain.push(i.toString())
      }

      // Define the scales

      this.xScaleTotals
        .domain(totalsDomain)
        .rangeRoundBands([this.margin.left, (this.width - this.margin.right)], .2)

      this.yScaleTotals
        .domain(this.origins)
        .rangeRoundBands([0, this.height], .2);

      this.colorScale
        .domain(this.origins);

      // The Axis
      this.yAxisTotals
          .scale(this.yScaleTotals)
          .tickFormat(function(d) { return d; }.bind(this))
          .orient("left");

      //--> DRAW AXIS
      this.svgOrigin.append("g")
          .attr("class", "y axis")
          .attr("transform", "translate(" + (this.margin.left * 2) + ",0)")
          .call(this.yAxisTotals);

      //--> DRAW BARS & LABELS
      var originGroup = this.svgOrigin.selectAll(".origin_total_bar")
          .data(this.dataTotals)
          .enter().append("g")
          .attr('class', '.origin_total_bar')
          .attr("transform", function(d) {
            return "translate(" + this.margin.left + "," + this.yScaleTotals(d.key) + ")";
      }.bind(this));


      originGroup.selectAll("rect")
          .data(function(d) { return d.values; })
        .enter().append("rect")
          .attr("width", 10)
          .attr("x", function(d, i) { return this.xScaleTotals(i.toString()); }.bind(this))
          .attr("y", 0)
          .attr("height", this.yScaleTotals.rangeBand())
          .style("fill", function(d) { return this.colorScale(d.win); }.bind(this))
          .style('opacity', 0)
          .transition()
          .delay(function(d, i) { return i * (this.duration/100); }.bind(this))
          .duration(this.duration/100)
          .style('opacity', 1);

      this.svgOrigin.selectAll(".origin_total_label")
        .data(this.dataTotals)
        .enter().append('text')
            .attr('class', 'label ')
            .attr('x', function(d) { return this.xScaleTotals((d.values.length - 1).toString()) + this.margin.left; }.bind(this))
            .attr('y', function(d) { return this.yScaleTotals(d.key) + (this.yScaleTotals.rangeBand()/1.5); }.bind(this))
            .attr('dx', 15)
            .attr('dy', 2)
            .attr('text-anchor', 'start')
            // .text(function(d) { return d.values.length + ' (Total solucitudes: ' + this.totalApp[d.key] + ')'; }.bind(this))
            .text(function(d) { return d.values.length; })
            .style('fill', this.grey)
            .style('font-size', '1em')
            .style('opacity', 0)
          .transition()
            .delay(50 * (this.duration/100))
            .duration(this.duration/2)
            .style('opacity', 1);

    }.bind(this))
  },

  //PRIVATE
  _tickValues:  function (scale) {
    var range = scale.domain()[1] - scale.domain()[0];
    var a = range/4;
    return [scale.domain()[0], scale.domain()[0] + a, scale.domain()[0] + (a * 2), scale.domain()[1] - a, scale.domain()[1]];
  },

  _mouseoverRender: function () {
    var selected = d3.event.target,
        selectedClass = selected.classList,
        selectedData = d3.select(selected).data()[0];

    this.selectedColor = d3.select(selected).style('fill');

    // Get the text for the tooltip
    var texts = [];
    for (var i = 0; i < this.origins.length; i++) {
      if (!isNaN(selectedData[this.origins[i]])) {
        var a = this.origins[i] + ': <strong>' + this.formatPercent(selectedData[this.origins[i]]) + '</strong><br>'
        texts.push(a)
      }
    }
    
    var textValues = '';
    texts.forEach(function(text) { 
      textValues = textValues + text;
    });

    var text = '<strong>' + selectedData.destiny + '</strong> - ' + selectedData.year + '<br>' +
      'a favor de: <strong>' + selectedData.win + '</strong><br>' + textValues

   
    // Hightlight selected
    d3.select(selected)
      .style('stroke', d3.rgb(this.selectedColor).darker())
      .transition()
      .duration(this.duration / 4)
      .style('stroke-width', '3px');
    
    // Highlight legend & axis
    d3.selectAll('.legend.label.' + selectedClass[1])
      .style('fill', 'black')
      .style('font-weight', 600); 

    d3.selectAll('.legend.swatch.' + selectedClass[1])
      .style('stroke', d3.rgb(this.selectedColor).darker())
      .transition()
      .duration(this.duration / 4)
      .style('stroke-width', '3px');

    d3.selectAll('.x.axis').select('text.' + selectedClass[2])
      .style('fill', 'black')
      .style('font-weight', 600);

    // Show tooltip
    this.tooltip
        .transition()
        .duration(this.duration / 4)
        .style('opacity', this.opacity);

    this.tooltip
        .html(text)
        .style('left', (d3.event.pageX + 25) + 'px')
        .style('top', (d3.event.pageY - 25) + 'px');

  },

  _mouseoutRender: function () {
    var selected = d3.event.target,
        selectedClass = selected.classList,
        selectedData = d3.select(selected).data()[0];

    // UN - Hightlight selected
    d3.select(selected)
      .transition()
      .duration(this.duration / 4)
      .style('stroke', 'none');

    // UN - Highlight legend & axis
    d3.selectAll('.legend.label.' + selectedClass[1])
      .style('fill', '#7C8388')
      .style('font-weight', 300);

    d3.selectAll('.legend.swatch.' + selectedClass[1])
      .transition()
      .duration(this.duration / 4)
      .style('stroke', 'none');

    d3.selectAll('.x.axis').select('text.' + selectedClass[2])
      .style('fill', '#7C8388')
      .style('font-weight', 300);
    
    this.tooltip
        .transition()
        .duration(this.duration / 4)
        .style('opacity', 0);
  },

  _clickLegend: function () {
    var selected = d3.event.target,
        selectedClass = selected.classList,
        selectedData = d3.select(selected).data()[0];

    this.selectedColor = d3.select('.swatch.' + selectedClass[2]).style('fill');

    if (!selectedClass.contains('selected')) {
    
      // Apply selected class
      d3.selectAll('.legend.' + selectedClass[2])
        .classed('selected', true)
        .style('opacity', 1);

      if (selectedClass.contains('swatch')) {
        d3.select(selected)
          .style('stroke', d3.rgb(this.selectedColor).darker())
          .transition()
          .duration(this.duration / 4)
          .style('stroke-width', '3px');
      } else {
        d3.selectAll('.swatch.' + selectedClass[2])
          .style('stroke', d3.rgb(this.selectedColor).darker())
          .transition()
          .duration(this.duration / 4)
          .style('stroke-width', '3px');
      }
        
      // Hilight all the same class squares
      d3.selectAll('.origin-bar.' + selectedClass[2])
        .style('stroke', d3.rgb(this.selectedColor).darker())
        .transition()
        .duration(this.duration / 4)
        .style('stroke-width', '3px');

    } else {
      d3.selectAll('.legend.' + selectedClass[2])
        .classed('selected', false)
        .style('opacity', 1);

      d3.selectAll('.' + selectedClass[2])
        .transition()
        .duration(this.duration / 4)
        .style('stroke', 'none');
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








