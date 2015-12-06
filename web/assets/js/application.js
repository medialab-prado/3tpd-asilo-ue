'use strict';

var AppTable = Class.extend({
  init: function(divId) {
    this.container = divId;
    
    // Chart dimensions
    this.containerWidth = null;
    this.margin = {top: 20, right: 20, bottom: 40, left: 40};
    this.width = null;
    this.height = null;
    
    // Variable 
    this.origin = null;
    this.sex = null;
    this.age = null;
    this.destiny = null;

    // Scales
    this.xScale = d3.scale.ordinal();
    this.yScale = d3.scale.linear();
    this.xScaleSecondary = d3.scale.ordinal();
    this.colorScale = d3.scale.ordinal().range(['#00909E', '#F69C95', '#F1B41B', '#B3CC57', '#32C192', '#F657D8', '#A984FF']);

    // Axis
    this.xAxis = d3.svg.axis();
    this.yAxis = d3.svg.axis();

    // Data
    this.data = null;
    this.adicionalData = null;
    this.originData = null;
    this.sexData = null;
    this.ageData = null;
    this.destinyData = null;
    this.allSelects = ['origin', 'sex', 'age', 'destiny'];
    this.filteredData = null;
    this.adicFiltData = null;

    // Objects
    this.formatPercent = d3.format('%');
    this.parseDate = d3.time.format("%Y").parse;
    this.yearDate = d3.time.format("%Y");

    // Chart objects
    this.svgOutput = null;

    // Constant values
    this.opacity = .7;
    this.opacityLow = .4;
    this.duration = 1500;
    this.mainColor = '#F69C95';
    this.darkColor = '#B87570';
  },

  originRenderSelect: function () {
    $(".select-origin").select2({
      placeholder: "Selecciona el país de origen",
      allowClear: true,
      dataType: 'json',
      data: this.originData
    });
  },
  sexRenderSelect: function () {
    $(".select-sex").select2({
      placeholder: "Selecciona el sexo",
      allowClear: true,
      dataType: 'json',
      data: this.sexData
    });
  },
  ageRenderSelect: function () {
    $(".select-age").select2({
      placeholder: "Selecciona la edad",
      allowClear: true,
      dataType: 'json',
      data: this.ageData
    });
  },
  destinyRenderSelect: function () {
    $(".select-destiny").select2({
      placeholder: "Selecciona el país de destino",
      allowClear: true,
      dataType: 'json',
      data: this.destinyData,
      sorter: function(results) {
        return results.sort(
          firstBy('disabled')
          .thenBy('text')
        );
      }
    });
  },

  loadData: function() {

    // Chart dimensions
    this.containerWidth = parseInt(d3.select(this.container).style('width'), 10);
    this.width = this.containerWidth - this.margin.left - this.margin.right;
    this.height = (this.containerWidth) - this.margin.top - this.margin.bottom;

    // Append svg
    this.svgOutput = d3.select(this.container).append('svg')
        .attr('width', this.width + this.margin.left + this.margin.right)
        .attr('height', this.height + this.margin.top + this.margin.bottom)
        .attr('class', 'svg_output')
      .append('g')
        .attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')');

    // Load the data
    d3.csv('web/data/predict2015_short.csv', function(error, predictData){
      if (error) throw error;
      
      this.data = predictData;
      this.data.forEach(function(d) {
        d.accepted_total = +d.accepted_total;
        d.predict2015 = +d.predict2015;
        d.rejected_total = +d.rejected_total;
        d.total = +d.total;
      });

      d3.csv('web/data/info_adicional.csv', function(error, auxData){
        if (error) throw error;
        
        this.adicionalData = auxData;
        this.adicionalData.forEach(function(d) {
          d.pib_capita = +d.pib_capita;
          d.population = +d.population;
          d.rank_pib = +d.rank_pib;
          d.rank_unemployment = +d.rank_unemployment;
          d.unemployment = +d.unemployment; 
        });
        console.log(this.adicionalData)
      }.bind(this));   
    }.bind(this)); 
  }, // end load data

  enable: function (variable) { 
    // Reset nexts selects
    var index = this.allSelects.indexOf(variable);
    var selects2reset = this.allSelects.slice(index, this.allSelects.length);

    selects2reset.forEach(function(d) { 
      eval('this.' + d + 'RenderSelect()')
    }.bind(this));

    // Build an array with the selects != null
    var selected = [];

    this.allSelects.forEach(function(d) { 
      if (this[d] != null) {
        selected.push(d)
      }
    }.bind(this));

    // Filter the data for each select
    this.filteredData = this.data;

    selected.forEach(function(d) {
      this.filteredData = this.filteredData.filter(function(v) { return v[d] == this[d]; }.bind(this));
    }.bind(this));
    
    // Get the unique values
    var nest = d3.nest()
        .key(function(d) { return d[variable];})
        .entries(this.filteredData);

    var able = nest.map(function(d) { return d.key; })

    eval('this.' + variable + 'Data').map(function(d) { 
      if (able.indexOf(d.text) != -1) {
        return d.disabled = false; 
      } else {
        return d.disabled = true;
      }
    }.bind(this));

    // if (variable == 'destiny') {
    //   this.destinyData = this.destinyData.sort(function(a, b) { console.log('a', a);return a.id - b.id; })
    // }

    // console.log(this.destinyData)
    eval('this.' + variable + 'RenderSelect()')
    
  },

  renderable: function () { 
   return this.origin != null && this.sex != null && this.age != null && this.destiny != null;

  },

  render: function () {

    // re-map the data
    this.filteredData = this.data.filter(function(d) { return d.destiny == this.destiny & d.sex == this.sex & d.origin == this.origin & d.age == this.age; }.bind(this));
    this.adicFiltData = this.adicionalData.filter(function(d) { return d.country == this.destiny; }.bind(this));

    // Get the country where the asylum is more likely.

    var likely = this.data.filter(function(d) { return d.sex == this.sex & d.origin == this.origin & d.age == this.age; }.bind(this));
    var max = d3.max(likely, function(d) { return d.predict2015; });
    
    likely = likely.filter(function(d) { return d.predict2015 == max; })
    console.log(this.adicFiltData)
    console.log('likely', likely)


    var accepted;

    if (this.filteredData[0].accepted_total == this.filteredData[0].total) {
      accepted = 'todas ellas fueron aceptadas';
    } else if (this.filteredData[0].accepted_total == 0) {
      accepted = 'ninguna de ellas fue aceptada'
    } else {
      accepted = this.filteredData[0].accepted_total + ' fueron aceptadas'
    }

    var time_waiting;

    if (this.adicFiltData[0].time_waiting == 0) {
      time_waiting = ' no se han encontrado datos';
    } else {
      time_waiting = ' es de ' + this.adicFiltData[0].time_waiting;
    }
    // Add text
    var prob = 'La probabilidad de que recibas asilo en <span class="big">' + this.destiny + '</span> es del <span class="big">' + this.formatPercent(this.filteredData[0].predict2015) + '</span>.<br>'
    var absolutes = '<span class="small">En los últimos 7 años, ' + this.destiny + ' ha recibido ' + this.filteredData[0].total + ' solicitudes de ' + this.filteredData[0].sex + ' de ' + this.filteredData[0].age + ' procedentes de ' + this.origin + ', ' + accepted + '.</span><br>'
    var info_adicional_sol =  '<span class="bullet fa-envelope"></span>' + 'Podrás presentar la solicitud en ' + this.adicFiltData[0].organism + '.<br>'
    var info_adicional_time = '<span class="bullet fa-clock-o"></span>' + 'En cuanto al tiempo aproximado de espera, ' + time_waiting + '.<br>'

    var max_prob = 'Las predicciones dicen que'
    
    var text = prob + absolutes + '<span class="big">Datos de interés</span><br>' + info_adicional_sol + info_adicional_time + max_prob

    this.svgOutput.selectAll('.output')
        .transition()
        .duration(this.duration/5)
        .style('opacity', 0)
        .remove();

   this.svgOutput.append('foreignObject')
        .attr('class', 'output')
        .attr('width', this.width)
        .attr('height', this.height)
        .attr('transform', 'translate(' + 0 + ',' + this.margin.top + ')')
        .style('fill', '#fff')
        .style('font-size', '28px')
        .style('opacity', 0)
        .html(text)
      .transition()
        .delay(this.duration/5)
        .duration(this.duration/5)
        .style('opacity', 1)
    
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
        selectedCy = d3.select(selected).attr('cy'),
        labelsOn = d3.select('#myonoffswitch-labels').property('checked');
  
    if (selectedData.name == 'influence') {
      var text = '<strong>' + formatPercent(selectedData.percentage) + '</strong> of respondents<br> are influenced<br>by <strong> ' + selectedData.tpClass + ' media</strong>'
    } else {
      var text = '<strong>' + formatPercent(selectedData.percentage) + '</strong> of respondents<br>associates<strong> ' + selectedData.tpClass + ' media</strong> to <strong>' + this.subindustry + '</strong>'
    }
    
    d3.selectAll('.marker.' + selectedClass[1])
      .filter(function(d) { return d.represent == selectedClass[2]; })
      .transition()
      .duration(this.duration / 4)
      .attr('markerWidth', this.markerSize * 2)
      .attr('markerHeight', this.markerSize * 2)
      .style('fill', customGrey)
      .attr('stroke-width', .3);

    var xMouseoverLine = this.xScale(selectedData.percentage),
        yMouseoverLine = this.yScale(selectedData.tpClass) + this.ySecondaryScale(selectedData.name);
  
     d3.select(selected.parentNode).selectAll('mouseover_line')
        .data([xMouseoverLine, yMouseoverLine])
        .enter()
        .append('line')
        .attr('class', 'mouseover_line')
        .attr('x1', xMouseoverLine)
        .attr('y1', yMouseoverLine)
        .attr('x2', xMouseoverLine)
        .attr('y2', yMouseoverLine)
        .attr('stroke-width', 1)
        .style('stroke', this.colorScale(selectedData.tpClass))
        .transition()
        .duration(this.duration)
        .attr('y1', function(d, i) { return i == 0 ? this.margin.top : yMouseoverLine; }.bind(this))
        .attr('y2', function(d, i) { return i == 1 ? (this.height - this.margin.top) : yMouseoverLine; }.bind(this));

   
    d3.selectAll('.legend_line').selectAll('text.' + selectedData.name)
      .attr('font-size', '1.5em');


    this.svgEvolution.selectAll('.barLine')
      .filter(function(d) { return d.name != selectedClass[2]; })
      .transition()
      .duration(this.duration / 4)
      .style('stroke', function(d) { return this.brighterColorScale(d.tpClass); }.bind(this));

    var toBright = this.ySecondaryScale.domain().filter(function(d) { return d != selectedClass[2]; })  
    this.chart.selectAll('.' + toBright)
      .transition()
      .duration(this.duration / 4)
      .style('stroke', function(d) { return this.brighterColorScale(d.tpClass); }.bind(this))
      .attr('fill', function(d) { return this.brighterColorScale(d.tpClass); }.bind(this));
    
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
        labelsOn = d3.select('#myonoffswitch-labels').property('checked');

    d3.selectAll('.marker.' + selectedClass[1])
      .filter(function(d) { return d.represent == selectedClass[2]; })
      .transition()
      .duration(this.duration / 4)
      .attr('markerWidth', this.markerSize)
      .attr('markerHeight', this.markerSize)
      .style('fill', this.colorScale(selectedClass[1]))
      .attr('stroke-width', 0);

    var yMouseoverLine = this.yScale(selectedData.tpClass) + this.ySecondaryScale(selectedData.name);

    d3.selectAll('.mouseover_line')
      .transition()
      .duration(this.duration / 2)
      .attr('y2', yMouseoverLine)
      .attr('y1', yMouseoverLine)
      .remove();
    
    var toBright = this.ySecondaryScale.domain().filter(function(d) { return d != selectedClass[2]; })  
    this.chart.selectAll('.' + toBright)
      .transition()
      .duration(this.duration / 4)
      .style('stroke', function(d) { return this.colorScale(d.tpClass); }.bind(this))
      .attr('fill', function(d) { return this.colorScale(d.tpClass); }.bind(this));

    d3.selectAll('.legend_line').selectAll('text.' + selectedData.name)
      .attr('font-size', '1.1em');

    this.tooltip.transition()
        .duration(this.duration / 4)
        .style("opacity", 0);
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








