'use strict';

var VisSquares = Class.extend({
  init: function(divId, measure) {
    this.container = divId;
    this.measure = measure;
    
    // Chart dimensions
    this.containerWidth = null;
    this.axisWidth = null;
    this.margin = {top: 10, right: 30, bottom: 20, left: 35};
    this.width = null;
    this.height = null;

    // Scales
    this.xScale = d3.scale.ordinal();
    this.xScaleTotals = d3.scale.ordinal();
    this.yScaleTotals = d3.scale.ordinal();
    this.yScale = d3.scale.ordinal();
    this.colorScale = d3.scale.ordinal();
    
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
    this.totalApp = null;

    // Legend
    this.legendSquares = d3.legend.color();

    // Objects
    this.tooltip = null;
    this.formatPercent = d3.format('%');
    this.parseDate = d3.time.format("%Y").parse;

    // Chart objects
    this.svgSquares = null;
    this.svgSquaresAxis = null;
    this.svgSquaresLegend = null;
    this.chart = null;
    
    // Constant values
    this.origins = ['Siria', 'Afganistán', 'Iraq', 'Irán', 'Pakistán', 'Somalia', 'Nigeria', 'Rusia', 'Serbia', 'Kosovo'];
    this.ages = ["menos14", "x14a17", "x18a34", "x35a64", "x65mas", "Desconocido"];
    this.sexs = ["Mujeres", "Hombres"];
    this.countries = ["Alemania", "Francia", "Suecia", "Reino Unido", "Italia", "Bélgica", "Holanda", "Grecia", "Austria", "Dinamarca", "Polonia", "España", "Finlandia", "Hungría", "Bulgaria", "Malta", "Chipre", "Irlanda", "Rumanía", "Luxemburgo", "República Checa", "Lituania", "Eslovaquia", "Eslovenia", "Portugal", "Croacia", "Letonia", "Estonia"];
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
    this.margin.right = this.containerWidth > 475 ? this.containerWidth * .16 : 0;
    this.margin.left = this.containerWidth > 475 ? this.containerWidth * .05 : 0;
    this.width = this.containerWidth - this.margin.left - this.margin.right;
    this.height = (this.containerWidth / 3.5) - this.margin.top - this.margin.bottom;

    // Append tooltip
    this.tooltip = d3.select('body').append('div')
      .attr('class', 'tooltip ' + this.measure)
      .style('opacity', 0);

    // Append svg
    this.svgSquares = d3.select(this.container).append('svg')
        .attr('width', this.width + this.margin.left + this.margin.right)
        .attr('height', this.height + this.margin.top + this.margin.bottom)
        .attr('class', 'svg_' + this.measure)
      .append('g')
        .attr('transform', 'translate(' + 0 + ',' + this.margin.top + ')');

    this.niceCategory = {
      "menos14": "menos de 14",
      "x14a17": "14 a 17",
      "x18a34": "18 a 34",
      "x35a64": "35 a 64",
      "x65mas": "65 o más",
      "Desconocido": "Edad desconocida"
    }
  }, 


  render: function(urlData) {
    d3.select(window).on('resize.squares', this._resize.bind(this));

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

      // Get the unique years.
      this.years = d3.nest()
        .key(function(d) { return d.year;})
        .entries(this.dataChart)
        .map(function(d) { return d.key; });

      // Set the scales
      this.xScale
        .domain(this.countries)
        .rangeRoundBands([this.margin.left, this.width], .2);

      var yScaleHeight = (this.years.length * (this.xScale.rangeExtent()[1] / this.countries.length))

      this.yScale
        .domain(this.years)
        .rangeRoundBands([yScaleHeight, 0], .2);
      

      if (this.measure == 'origin') {
        this.colorScale
          .domain(this.origins)
          // .range(['#ECD078', '#FBCE34', '#FB9A02', '#C68E26', '#C86700', '#6FAA71', '#3A7343', '#D05253', '#BA1C1B', '#700404']);
          .range(['#fec44f', '#fe9929', '#ec7014', '#cc4c02', '#993404', '#ABB253', '#848C2F', '#6BB9BA', '#42A1A3', '#007071']);
      } else if (this.measure == 'age') {

        this.colorScale
            .domain(this.ages)
            // .range(['#92E98E', '#5CBF88', '#34937A', '#1D6963', '#14474A', '#686868']);
            // .range(['#7fcdbb', '#41b6c4', '#1d91c0', '#225ea8', '#253494', '#A4A4B0']);
            .range(['#99c5c6', '#66a9a9', '#328c8d', '#007071', '#006465', '#A4A4B0']);
      } else {  
        this.colorScale
            .domain(this.sexs)
            // .range(['#D55B50', '#3C3F4F']);
            .range(['#ABB253', '#fec44f']);
      }
  
      // Define the axis 
      this.xAxis
          .scale(this.xScale)
          .orient("bottom");  

      this.yAxis
          .scale(this.yScale)
          .orient("left");


      // --> DRAW THE BARS  
      this.chart = this.svgSquares.append('g')
          .attr('class', 'chart ' + this.measure);

      this.chart.selectAll('.square')
        .data(this.dataChart)
        .enter()
      .append('rect')
        .attr('class', function(d) { return this.measure + ' square ' + this._normalize(d.win) + ' ' + this._normalize(d.destiny) + ' x' + d.year + ' ' + 'pais'; }.bind(this))
        .attr('x', function(d) { return this.xScale(d.destiny); }.bind(this))
        .attr('y', function(d) { return this.yScale(d.year)}.bind(this))
        .attr('width', this.xScale.rangeBand())
        .attr('height', this.yScale.rangeBand())
        .style('fill', function(d) { return this.colorScale(d.win); }.bind(this))
        .on('mouseover', this._mouseoverRender.bind(this))
        .on('mouseout', this._mouseoutRender.bind(this));

      // --> DRAW THE AXIS
      this.svgSquares.append("g")
          .attr("class", "squares x axis")
          .attr('id', this.measure + 'Axis')
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

      this.svgSquares.append("g")
          .attr("class", "squares y axis")
          .attr("transform", "translate(" + this.margin.left + ",0)")
          .call(this.yAxis)
        .selectAll("text")
          .style("text-anchor", "middle");
      
      // --> DRAW THE LEGEND 
    
      this.svgSquares.append("g")
        .attr("class", "legendGroup " + this.measure)
        .attr("transform", "translate(" + (this.containerWidth - this.margin.right)+ "," + 0 + ")");
   
      this.legendSquares
        .shapeWidth(this.xScale.rangeBand() * 0.7)
        .shapeHeight(this.yScale.rangeBand() * 0.7)
        .shapePadding(this.yScale.rangeBand() * 0.2)
        .scale(this.colorScale);

      if (this.measure == 'age') {
        this.legendSquares
            .labels(this.colorScale.domain().map(function(d) { return this.niceCategory[d]; }.bind(this)))
      }

      d3.select(".legendGroup." + this.measure)
        .call(this.legendSquares);

      this.svgSquares.selectAll('.label')
          .attr('class', function(d) { return this.measure + ' legend label ' + this._normalize(d); }.bind(this))
          .on('mouseover', function(d) { 
            var selectedClass = d3.event.target.classList;
            d3.selectAll('.' + selectedClass[1] + '.' + selectedClass[3])
              .style('cursor', 'pointer')
              .style('opacity', this.opacityLow);
          }.bind(this))
          .on('mouseout', function(d) { 
            var selectedClass = d3.event.target.classList;
            d3.selectAll('.' + selectedClass[1] + '.' + selectedClass[3])
              .style('opacity', 1);
          }.bind(this))
          .on('click', this._clickLegend.bind(this));

      this.svgSquares.selectAll('.swatch')
          .attr('class', function(d) { return this.measure + ' legend swatch ' + this._normalize(d); }.bind(this))
          .on('mouseover', function(d) { 
            var selectedClass = d3.event.target.classList;
            d3.selectAll('.' + selectedClass[1] + '.' + selectedClass[3])
              .style('cursor', 'pointer')
              .style('opacity', this.opacityLow);
          }.bind(this))
          .on('mouseout', function(d) { 
            var selectedClass = d3.event.target.classList;
            d3.selectAll('.' + selectedClass[1] + '.' + selectedClass[3])
              .style('opacity', 1);
          }.bind(this))
          .on('click', this._clickLegend.bind(this));
      
      // Hide the axis on small devices
      if (this.containerWidth < 476) {
        d3.selectAll('.axis.squares')
          .style('visibility', 'hidden');
      } else {
        d3.selectAll('.axis.squares')
          .style('visibility', 'visible');
      }


    }.bind(this)); // end load data
  }, // end render

  updateRender: function(buttonID, measure) {
    this.measure = measure; 

    var svg = d3.select('.svg_' + this.measure);
    svg.selectAll('.square')
        .on('mouseover', null)
        .on('mouseout', null);

    // Actualizar colorScale
    if (this.measure == 'origin') {
      this.colorScale
        .domain(this.origins)
        .range(['#ECD078', '#FBCE34', '#FB9A02', '#C68E26', '#C86700', '#6FAA71', '#3A7343', '#D05253', '#BA1C1B', '#700404']);
    } else if (this.measure == 'age') {
      this.colorScale
          .domain(this.ages)
          .range(['#92E98E', '#5CBF88', '#34937A', '#1D6963', '#14474A', '#686868']);
    } else {  
      this.colorScale
          .domain(this.sexs)
          .range(['#D55B50', '#3C3F4F']);
    }

    // Move elements
    if (buttonID == 'year') {

      // Update xScale to number of elements instead of countries
      this.xScale.domain(d3.range(this.countries.length))

      // Hide x axis
      d3.select('#' + this.measure + 'Axis')
        .transition()
        .duration(this.duration/2)
        .style('opacity', 0);

      // Update squares
      this.years.forEach(function(year) {
        svg.selectAll('.square.x' + year)
          .sort(function(a,b) { return this.colorScale.domain().indexOf(a.win) - this.colorScale.domain().indexOf(b.win); }.bind(this))
          .transition()
          .duration(this.duration)
          .attr('class', function(d) { return this.measure + ' square ' + this._normalize(d.win) + ' ' + this._normalize(d.destiny) + ' x' + d.year + ' ' + buttonID; }.bind(this))
          .attr('x', function(d, i) { return this.xScale(i); }.bind(this))
          .each('end', function() { 
            svg.selectAll('.square')
              .on('mouseover', this._mouseoverRender.bind(this))
              .on('mouseout', this._mouseoutRender.bind(this));
          }.bind(this));
      }.bind(this));    
    } else {

      // Update xScale to the destiny countries names
      this.xScale.domain(this.countries)

      // Show x axis
      d3.select('#' + this.measure + 'Axis')
        .transition()
        .duration(this.duration/2)
        .style('opacity', 1);

      // Squares position
      svg.selectAll('.square')
        .transition()
          .duration(this.duration)
          .attr('class', function(d) { return this.measure + ' square ' + this._normalize(d.win) + ' ' + this._normalize(d.destiny) + ' x' + d.year + ' ' + buttonID; }.bind(this))
          .attr('x', function(d) { return this.xScale(d.destiny); }.bind(this))
          .each('end', function() { 
            svg.selectAll('.square')
              .on('mouseover', this._mouseoverRender.bind(this))
              .on('mouseout', this._mouseoutRender.bind(this));
          }.bind(this));

    }
  }, 

  //PRIVATE

  _mouseoverRender: function () {
    var selected = d3.event.target,
        selectedClass = selected.classList,
        selectedData = d3.select(selected).data()[0];

    this.selectedColor = d3.select(selected).style('fill');

    // Get the text for the tooltip
    var texts = [];
    for (var i = 0; i < this.colorScale.domain().length; i++) {
      if (!isNaN(selectedData[this.colorScale.domain()[i]])) {
        var category = this.measure != 'age' ? this.colorScale.domain()[i] : this.niceCategory[this.colorScale.domain()[i]];
        var a = category + ': <strong>' + this.formatPercent(selectedData[this.colorScale.domain()[i]]) + '</strong><br>'
        texts.push(a)
      }
    }
    
    var textValues = '';
    texts.forEach(function(text) { 
      textValues = textValues + text;
    });

    var winCategory = this.measure != 'age' ? selectedData.win : this.niceCategory[selectedData.win];
    var text = '<strong>' + selectedData.destiny + '</strong> - ' + selectedData.year + '<br>' +
      'a favor de: <strong>' + winCategory + '</strong><br>' + textValues
   
    // Hightlight selected
    d3.selectAll('.square.' + selectedClass[0])
      .filter(function(d) { 
        return this._normalize(d.win) != selectedClass[2] | 
        this._normalize(d.destiny) != selectedClass[3] | 
        ('x' + d.year) != selectedClass[4]; 
      }.bind(this))
      .transition()
      .duration(this.duration / 4)
      .style('opacity', this.opacityLow);
    
    // Highlight legend & axis
    d3.selectAll('.legend.label.' + selectedClass[2])
      .style('fill', 'black')
      .style('font-weight', 600); 

    d3.selectAll('.legend.swatch.' + selectedClass[0])
      .filter(function(d) { return this._normalize(d) != selectedClass[2]; }.bind(this))
      .transition()
      .duration(this.duration / 4)
      .style('opacity', this.opacityLow);

    d3.selectAll('.x.axis').select('text.' + selectedClass[3])
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
    d3.selectAll('.square.' + selectedClass[0])
      .transition()
      .duration(this.duration / 4)
      .style('opacity', 1);

    // UN - Highlight legend & axis
    d3.selectAll('.legend.label.' + selectedClass[2])
      .style('fill', '#7C8388')
      .style('font-weight', 300);

    d3.selectAll('.legend.swatch.' + selectedClass[0])
      .transition()
      .duration(this.duration / 4)
      .style('opacity', 1);

    d3.selectAll('.x.axis').select('text.' + selectedClass[3])
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

    this.selectedColor = d3.select('.swatch.' + selectedClass[3]).style('fill');

    if (!selectedClass.contains('selected')) {
    
      // Apply selected class
      d3.selectAll('.legend.' + selectedClass[3])
        .classed('selected', true)
        .style('opacity', 1);

      if (selectedClass.contains('swatch')) {
        d3.select(selected)
          .style('stroke', d3.rgb(this.selectedColor).darker())
          .transition()
          .duration(this.duration / 4)
          .style('stroke-width', '2px');
      } else {
        d3.selectAll('.swatch.' + selectedClass[3])
          .style('stroke', d3.rgb(this.selectedColor).darker())
          .transition()
          .duration(this.duration / 4)
          .style('stroke-width', '2px');
      }
        
      // Hilight all the same class squares
      d3.selectAll('.square.' + selectedClass[3])
        .style('stroke', d3.rgb(this.selectedColor).darker())
        .transition()
        .duration(this.duration / 4)
        .style('stroke-width', '2px');

    } else {
      d3.selectAll('.legend.' + selectedClass[3])
        .classed('selected', false)
        .style('opacity', 1);

      d3.selectAll('.' + selectedClass[3])
        .transition()
        .duration(this.duration / 4)
        .style('stroke', 'none');
    }

  },

  _resize: function() {
    // update chart dimensions
    this.containerWidth = parseInt(d3.select(this.container).style('width'), 10);
    this.margin.right = this.containerWidth > 476 ? this.containerWidth * .16 : 0;
    this.margin.left = this.containerWidth > 476 ? this.containerWidth * .06 : 0;
    this.width = this.containerWidth - this.margin.left - this.margin.right;
    this.height = (this.containerWidth / 3.5) - this.margin.top - this.margin.bottom;

    d3.selectAll('.squares svg')
      .attr('width', this.width + this.margin.left + this.margin.right)
      .attr('height', this.height + this.margin.top + this.margin.bottom)

    // Update the scales
    this.xScale
        .domain(this.countries)
        .rangeRoundBands([this.margin.left, this.width], .2);
    
    var yScaleHeight = (this.years.length * (this.xScale.rangeExtent()[1] / this.countries.length))

    this.yScale
        .rangeRoundBands([yScaleHeight, 0], .2);

    // Update the axis
    this.xAxis
        .scale(this.xScale)
    this.yAxis
        .scale(this.yScale);

    // update axes
    d3.selectAll('.squares.x.axis')
        .attr("transform", "translate(" + 0 + "," + yScaleHeight + ")")
        .call(this.xAxis)
      .selectAll("text")
        .attr("y", 0)
        .attr("x", 9)
        .attr("dx", "-.85em")
        .attr("dy", ".25em")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

    d3.selectAll('.squares.y.axis')
      .attr("transform", "translate(" + this.margin.left + ",0)")
      .call(this.yAxis);

    // Hide the axis in small devices
    if (this.containerWidth < 476) {
      d3.selectAll('.axis.squares')
        .style('visibility', 'hidden');
    } else {
      d3.selectAll('.axis.squares')
        .style('visibility', 'visible');
    }

    // resize everys chart
    var measures = ['origin', 'age', 'sex'];
    measures.forEach(function(measure) { 
      // Set color scales 
      if (measure == 'origin') {
        this.colorScale
          .domain(this.origins)
          .range(['#fec44f', '#fe9929', '#ec7014', '#cc4c02', '#993404', '#ABB253', '#848C2F', '#6BB9BA', '#42A1A3', '#007071']);
      var legendLabels = this.colorScale.domain();

      } else if (measure == 'age') {
        this.colorScale
            .domain(this.ages)
            .range(['#99c5c6', '#66a9a9', '#328c8d', '#007071', '#006465', '#A4A4B0']);
        var legendLabels = this.colorScale.domain().map(function(d) { return this.niceCategory[d]; }.bind(this));
      } else {  
        this.colorScale
            .domain(this.sexs)
            .range(['#ABB253', '#fec44f']);
        var legendLabels = this.colorScale.domain();
      }

      
      // resize the chart depending on its status
      // Get all the squares
      var measureSquares = d3.selectAll('.square.' + measure);

      // resize common attributes
       measureSquares
        .attr('y', function(d) { return this.yScale(d.year)}.bind(this))
        .attr('width', this.xScale.rangeBand())
        .attr('height', this.yScale.rangeBand());

      // Update the 'x' parameter depending on the chart form
      if (measureSquares.attr('class').indexOf('pais') != -1) {

        this.xScale.domain(this.countries);
        measureSquares
          .attr('x', function(d) { return this.xScale(d.destiny); }.bind(this));
      
      } else {
        this.xScale.domain(d3.range(this.countries.length))
        
        this.years.forEach(function(year) {
          d3.selectAll('.square.x' + year + '.' + measure)
            .attr('x', function(d, i) { return this.xScale(i); }.bind(this));
        }.bind(this))
      }

      // Redefine the legend
      this.legendSquares
          .shapeWidth(this.xScale.rangeBand() * 0.7)
          .shapeHeight(this.yScale.rangeBand() * 0.7)
          .shapePadding(this.yScale.rangeBand() * 0.2)
          .scale(this.colorScale)
          .labels(legendLabels);

      // Re call the legend   
      d3.select('.legendGroup.' + measure)
        .call(this.legendSquares);

    }.bind(this))


    // MOVE THE LEGEND   
    d3.selectAll(".legendGroup")
      .attr("transform", "translate(" + (this.containerWidth - this.margin.right)+ "," + 0 + ")");

          
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








