'use strict';

var VisSex = Class.extend({
  init: function(divId) {
    this.container = divId;
    
    // Chart dimensions
    this.containerWidth = null;
    this.axisWidth = null;
    this.margin = {top: 20, right: 20, bottom: 20, left: 20};
    this.width = null;
    this.height = null;

    // Scales
    this.xScale = d3.scale.ordinal();
    this.xScaleSecondary = d3.scale.linear();
    this.yScale = d3.scale.ordinal();
    this.yScaleSecondary = d3.scale.ordinal();
    this.colorScale = d3.scale.ordinal().range(['#D55B50', '#3C3F4F']);

    // Axis
    this.xAxis = d3.svg.axis();
    this.yAxis = d3.svg.axis();

    // Data
    this.dataChart = null;
    this.dataDomain = null;
    this.years = null;
    this.countries = null;
    this.sexs = null;

    // Legend
    this.legendEvolution = d3.legend.color();

    // Objects
    this.tooltip = null;
    this.formatPercent = this.measure == 'percentage' ? d3.format('%') : d3.format(".2f");
    this.parseDate = d3.time.format("%Y").parse;

    // Chart objects
    this.svgSex = null;
    this.svgSexAxis = null;
    this.chart = null;
    this.line = d3.svg.line();
    
    // Constant values
    this.radius = 6;
    this.opacity = .7;
    this.opacityLow = .4;
    this.duration = 1500;
    this.niceCategory = null;
    this.heavyLine = 5;
    this.lightLine = 2;
  },

  render: function(urlData) {

    // Chart dimensions
    this.containerWidth = parseInt(d3.select(this.container).style('width'), 10);
    this.width = (this.containerWidth * 3) - this.margin.left - this.margin.right;
    this.height = (this.containerWidth / 3) - this.margin.top - this.margin.bottom;

    this.axisWidth = parseInt(d3.select('#sex_chart_axis').style('width'), 10);

    this.margin.left = d3.select(this.container)[0][0].getBoundingClientRect().left;

    console.log(this.margin.left)


    // Append tooltip
    this.tooltip = d3.select('body').append('div')
      .attr('class', 'vis_sex_tooltip')
      .style('opacity', 0);


    // Append svg
    this.svgSex = d3.select(this.container).append('svg')
        .attr('width', this.width + this.margin.left + this.margin.right)
        .attr('height', this.height + this.margin.top + this.margin.bottom)
        .attr('class', 'svg_sex')
      .append('g')
        .attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')');

    this.svgSexAxis = d3.select('#sex_chart_axis').append('svg')
        .attr('width', this.axisWidth)
        .attr('height', this.height + this.margin.top + this.margin.bottom)
      .append('g')
        .attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')');

    // Set nice category
    this.niceCategory = {
      "Actuaciones de carácter general": "Actuaciones Generales",
      "Actuaciones de carácter económico": "Actuaciones Económicas",
      "Producción de bienes públicos de carácter preferente": "Bienes Públicos",
      "Actuaciones de protección y promoción social": "Protección Social",
      "Servicios públicos básicos": "Servicios Públicos",
      "Deuda pública": "Deuda Pública",
      "mean_national": "Media Nacional",
      "mean_autonomy": "Media Autonómica",
      "mean_province": "Media Provincial",
      "G": "Gasto/habitante",
      "I": "Ingreso/habitante",
      "percentage": "% sobre el total"
    }

    // Load the data
    d3.csv('web/data/vis_sex_data_v2.csv', function(error, csvData){
      if (error) throw error;
      
      // Map the data
      this.dataChart = csvData;

      // Filter the accepted_per != NaN
      this.dataChart = this.dataChart.filter(function(d) { return d.win != "NA"; })

      this.dataChart.forEach(function(d) { 
        // d.year = this.parseDate(d.year);
        d.accepted_per = +d.accepted_per;
        d.rejected_per = +d.rejected_per;
        d.total = +d.total;
        d.total_country = +d.total_country;
        d.dif = +d.dif;
      }.bind(this));

      // Sort the data

      this.dataChart = this.dataChart.sort(
          firstBy('total_country', -1)
          .thenBy('year')
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

      var max = d3.max(this.dataChart, function(d) { return d.dif; })

      this.xScaleSecondary
        .domain([0, max])
        .range([0, this.xScale.rangeBand()]);
      
      this.yScale
        .domain(this.years)
        .rangeRoundBands([this.height - (this.margin.bottom / 2), this.margin.top], .5);

      this.yScaleSecondary
        .domain(this.sexs)
        .rangeRoundBands([0, this.yScale.rangeBand()]);
      
      this.colorScale
        .domain(this.sexs);

        console.log(this.colorScale('Hombres'))
      
      // Define the axis 
      this.xAxis
          .scale(this.xScale)
          .orient("bottom");  

      this.yAxis
          .scale(this.yScale)
          .orient("left");

      d3.selectAll('.x.axis').select('text')
          .style('text-anchor', 'start')

      // --> DRAW THE AXIS
      this.svgSex.append("g")
          .attr("class", "x axis")
          .attr("transform", "translate(" + 0 + "," + this.height + ")")
          .call(this.xAxis);

      this.svgSexAxis.append("g")
          .attr("class", "y axis")
          .attr("transform", "translate(" + (this.margin.left/2) + ",0)")
          .call(this.yAxis);


      // --> DRAW THE DOTS  
      this.chart = this.svgSex.append('g')
          .attr('class', 'sex_chart');

      // this.chart.selectAll('.sex-dot')
      //     .data(this.dataChart)
      //     .enter()
      //   .append('circle')
      //     .attr('class', function(d) { return 'sex-dot ' + this._normalize(d.sex); }.bind(this))
      //     .attr('cx', function(d) { return this.xScale(d.destiny) + this.xScaleSecondary(d.accepted_per); }.bind(this))
      //     .attr('cy', function(d) { return this.yScale(d.year); }.bind(this))
      //     .attr('r', this.radius)
      //     .style('fill', function(d) { return this.colorScale(d.sex); }.bind(this))
      //     .style('opacity', this.opacity)
      //   // .on('mouseover', this._mouseover.bind(this))
      //   // .on('mouseout', this._mouseout.bind(this)); 
      
        
        this.chart.selectAll('.bar')
          .data(this.dataChart)
          .enter()
        .append('rect')
          .attr('class', function(d) { return 'sex ' + this._normalize(d.win); }.bind(this))
          .attr('x', function(d) { return this.xScale(d.destiny); }.bind(this))
          .attr('y', 0)
          .attr('width', this.xScale.rangeBand())
          .attr('height', this.height)
          .attr('r', this.radius)
          .style('fill', '#ccc')
          .style('opacity', this.opacityLow)


        this.chart.selectAll('.sex-bar')
          .data(this.dataChart)
          .enter()
        .append('rect')
          .attr('class', function(d) { return 'sex-bar ' + this._normalize(d.win); }.bind(this))
          .attr('x', function(d) { return this.xScale(d.destiny); }.bind(this))
          .attr('y', function(d) { return this.yScale(d.year)}.bind(this))
          .attr('width', function(d) { return this.xScaleSecondary(d.dif); }.bind(this))
          .attr('height', this.yScale.rangeBand())
          .attr('r', this.radius)
          .style('fill', function(d) { return this.colorScale(d.win); }.bind(this))
          // .style('opacity', this.opacityLow)

      // --> DRAW THE Legend 
      var svgLegend = d3.select('.svg_lines');
      
      var series = this.colorScale.domain();
      
      var labels = [];
      for (var i = 0; i < series.length; i++) {
        if (this.niceCategory[series[i]] != undefined) {
          labels.push(this.niceCategory[series[i]])
        } else {
          labels.push(series[i])
        }
      }
    
      svgLegend.append("g")
        .attr("class", "legend_evolution")
        .attr("transform", "translate(" + this.width + "," + (this.height/2) + ")");

      this.legendEvolution
        .shape('path', d3.svg.symbol().type('circle').size(80)())
        .shapeWidth(14)
        .shapePadding(10)
        .ascending(true)
        .scale(this.colorScale)
        .labels(labels);

      d3.select(".legend_evolution")
        .call(this.legendEvolution);

      svgLegend.selectAll('.label')
        .attr('fill', this.darkColor)
        .attr('font-size', '14px')


    }.bind(this)); // end load data
  }, // end render

  updateRender: function () {

    // re-map the data
    this.dataChart = this.data.budgets[this.measure];
    this.kind = this.data.kind;
    this.dataYear = this.parseDate(this.data.year);

    this.dataDomain = [d3.min(this.dataChart.map(function(d) { return d3.min(d.values.map(function(v) { return v.value; })); })), 
              d3.max(this.dataChart.map(function(d) { return d3.max(d.values.map(function(v) { return v.value; })); }))];

    // Update the scales
    this.xScale
      .domain(d3.extent(this.dataChart[0].values, function(d) { return d.date; }));

    this.yScale
      .domain([this.dataDomain[0] * .3, this.dataDomain[1] * 1.2]);

    this.colorScale
      .domain(this.dataChart.map(function(d) { return d.name; }));

    // Update the axis
    this.xAxis.scale(this.xScale);
 
    this.yAxis
        .scale(this.yScale)
        .tickValues(this._tickValues(this.yScale))
        .tickFormat(function(d) { return this.measure != 'percentage' ? d3.round(d, 2) : d3.round(d * 100, 2) + '%'; }.bind(this));

    this.svgSex.select(".x.axis")
      .transition()
      .duration(this.duration)
      .delay(this.duration/2)
      .ease("sin-in-out") 
      .call(this.xAxis);

    this.svgSex.select(".y.axis")
      .transition()
      .duration(this.duration)
      .delay(this.duration/2)
      .ease("sin-in-out") 
      .call(this.yAxis);

    // Change ticks color
    d3.selectAll('.axis').selectAll('text')
      .attr('fill', this.darkColor);

    d3.selectAll('.axis').selectAll('path')
      .attr('stroke', this.darkColor);

    // Update lines
    this.svgSex.selectAll('.evolution_line')
      .data(this.dataChart)
      .transition()
      .duration(this.duration)
      .attr('d', function(d) { return this.line(d.values); }.bind(this))
      .style('stroke', function(d) { return this.colorScale(d.name); }.bind(this));

    // Update the points
    this.svgSex.selectAll(".dots")
        .data(this.dataChart)
      .selectAll(".dot_line")
        .data(function(d) { return d.values; })
        .transition()
        .duration(this.duration)
        .attr('cx', function(d) { return this.xScale(d.date); }.bind(this))
        .attr('cy', function(d) { return this.yScale(d.value); }.bind(this))
        // .style('fill', function(v) { return this.colorScale(d3.select('.dot_line.x'+v.value).node().parentNode.__data__.name); }.bind(this)); 
        //
    var series = this.colorScale.domain();

    var labels = [];
    for (var i = 0; i < series.length; i++) {
      if (this.niceCategory[series[i]] != undefined) {
        labels.push(this.niceCategory[series[i]])
      } else {
        labels.push(series[i])
      }
    }

    // Update legends
    this.legendEvolution
        .labels(labels)
        .scale(this.colorScale);

    d3.select(".legend_evolution")
        .call(this.legendEvolution);
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
        selectedData = d3.select(selected).data()[0],
        selectedCx = d3.select(selected).attr('cx'),
        selectedCy = d3.select(selected).attr('cy');

    var tooltipData = {};

    this.dataChart.map(function(d, i) { 
      d.values.map(function(v) { 
        if ('x' + v.date.getFullYear() == selectedClass[2]) {
          if (i != 3) {
            tooltipData[v.name] = v.value
          } else {
            tooltipData['municipio'] = v.name;
            tooltipData['municipio_value'] = v.value;
          } 
        }
      }); 
    });

    
    var text = tooltipData.municipio + ':<strong> ' + d3.round(tooltipData.municipio_value) +
              '</strong>€/hab<br>Media Nacional: <strong>' + d3.round(tooltipData.mean_national)+ 
              '</strong>€/hab<br>Media Autonómica: <strong>' + d3.round(tooltipData.mean_autonomy) +
              '</strong>€/hab<br>Media Provincial: <strong>' + d3.round(tooltipData.mean_province) + '</strong>€/hab';

    // Append vertical line
    this.svgSex.selectAll('.v_line')
        .data([selectedCx, selectedCy])
        .enter().append('line')
        .attr('class', 'v_line')
            .attr('x1', selectedCx)
            .attr('y1', selectedCy)
            .attr('x2', selectedCx)
            .attr('y2', selectedCy)
            .style('stroke', this.mainColor);

    this.svgSex.selectAll('.v_line')
        .transition()
        .duration(this.duration)
        .attr('y1', function(d, i) { return i == 0 ? this.margin.top : selectedCy; }.bind(this))
        .attr('y2', function(d, i) { return i == 0 ? selectedCy : this.height; }.bind(this));

    d3.select(selected).transition()
      .duration(this.duration / 4)
      .attr('r', this.radius * 1.5);

    this.svgSex.selectAll('.dot_line')
      .filter(function(d) { return d.name != selectedClass[1] && 'x' + d.date.getFullYear() != selectedClass[2]; })
      .transition()
      .duration(this.duration / 4)
      .style('opacity', this.opacityLow);

    this.svgSex.selectAll('.evolution_line')
      .filter(function(d) { return d.name != selectedClass[1]; })
      .transition()
      .duration(this.duration / 4)
      .style('opacity', this.opacityLow);
    
    this.tooltip
        .transition()
        .duration(this.duration / 4)
        .style('opacity', this.opacity);

    this.tooltip
        .html(text)
        .style('left', (d3.event.pageX + 50) + 'px')
        .style('top', (d3.event.pageY - 25) + 'px');

  },

  _mouseout: function () {
    var selected = d3.event.target,
        selectedClass = selected.classList,
        selectedData = d3.select(selected).data()[0],
        selectedCx = d3.select(selected).attr('cx'),
        selectedCy = d3.select(selected).attr('cy');

    var text = 'pepe fúe a la playa'

    this.svgSex.selectAll('.v_line')
        .transition()
        .duration(this.duration / 4)
        .attr('y1', selectedCy)
        .attr('y2', selectedCy)
        .remove();


    this.svgSex.selectAll('.dot_line')
      .transition()
      .duration(this.duration / 4)
      .attr('r', this.radius)
      .style('opacity', 1);

    this.svgSex.selectAll('.evolution_line')
      .transition()
      .duration(this.duration / 4)
      .style('opacity', 1);
    
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








