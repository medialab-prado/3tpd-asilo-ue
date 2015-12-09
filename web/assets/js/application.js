'use strict';

var AppTable = Class.extend({
  init: function(divId) {
    this.container = divId;
    
    // Chart dimensions
    this.containerWidth = null;
    this.margin = {top: 20, right: 0, bottom: 20, left: 40};
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

    // Load the data
    d3.csv('http://medialab-prado.github.io/3tpd-asilo-ue/web/data/predict2015_short_esp.csv', function(error, predictData){
      if (error) throw error;
      
      this.data = predictData;
      this.data.forEach(function(d) {
        d.accepted_total = +d.accepted_total;
        d.predict2015 = +d.predict2015;
        d.rejected_total = +d.rejected_total;
        d.total = +d.total;
      });

      d3.csv('http://medialab-prado.github.io/3tpd-asilo-ue/web/data/info_adicional.csv', function(error, auxData){
        if (error) throw error;
        
        this.adicionalData = auxData;
        this.adicionalData.forEach(function(d) {
          d.pib_capita = +d.pib_capita;
          d.population = +d.population;
          d.rank_pib = +d.rank_pib;
          d.rank_unemployment = +d.rank_unemployment;
          d.unemployment = +d.unemployment; 
        });
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

    // Texts

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
      time_waiting = ' no se han encontrado datos :(';
    } else {
      time_waiting = this.adicFiltData[0].time_waiting;
    }

    // Add texts
    var prob = 'La probabilidad de que recibas asilo en <span class="big">' + this.destiny + '</span> es del <span class="big">' + this.formatPercent(this.filteredData[0].predict2015) + '</span>.<br>'
    var absolutes = '<br><span class="small">En los últimos 7 años, ' + this.destiny + ' ha recibido ' + this.filteredData[0].total + ' solicitudes de ' + this.filteredData[0].sex + ' de ' + this.filteredData[0].age + ' procedentes de ' + this.origin + ', ' + accepted + '.</span>'
    var unemployment = this.formatPercent(this.adicFiltData[0].unemployment) + '  (puesto #' + this.adicFiltData[0].rank_unemployment + ' de la UE)'
    var rent = d3.round(this.adicFiltData[0].pib_capita) + ' €  (puesto #' + this.adicFiltData[0].rank_pib + ' de la UE)'

    var max_prob;

    if (this.destiny != likely[0].destiny) {
      max_prob = '¡¡ Las predicciones dicen que tu solicitud tiene más probabilidad de ser aceptada en <span class="big">' + likely[0].destiny + '</span> con un <span class="big">' + this.formatPercent(likely[0].predict2015) + '</span> de probabilidades de éxito !!<br>'
    } else if (likely[0].predict2015 == 0) {
      max_prob = 'No hay ningún país en el que las prediciones digan que tu solicitud tiene mayor probabilidad de éxito.'
    } else {
      max_prob = '¡¡ Las predicciones dicen que <span class="big">' + likely[0].destiny + '</span> es el país donde tu solicitud tiene <span class="big">más probabilidades de éxito</span> !!<br>'
    }

    // Map the data

    var tableData = [
      { name: "Lugar de presentación", value: this.adicFiltData[0].organism },
      { name: "Tiempo aproximado de espera", value: time_waiting },
      { name: "Renta per cápita", value: rent },
      { name: "Tasa de paro", value: unemployment }
    ]

    // remove previous elements.

    d3.selectAll('.rm')
      .transition()
      .duration(this.duration/4)
      .style('opacity', 0)
      .remove();

    // Build new ones

    var timeOut = this.duration/3

    setTimeout(function(){ 

    d3.select(this.container)
      .append('h3')
      .attr('class', 'probability rm')
      .style('border-bottom', 'solid 2px #4c5c96')
      .style('border-top', 'solid 2px #4c5c96')
      .style('opacity', 0)
      .html(prob + absolutes)
    .transition()
      .duration(this.duration/4)
      .style('opacity', 1);

    d3.select(this.container)
      .append('h4')
      .attr('class', 'interes rm')
      .style('opacity', 0)
      .html('Datos de interés')
    .transition()
      .duration(this.duration/4)
      .style('opacity', 1);

    var table = d3.select(this.container)
      .append('table')
      .attr('class', 'output_table rm')
      .append('tbody');

    var tr = table.selectAll('tr')
        .data(tableData).enter()
        .append('tr');

    tr.append('td')
      .style('opacity', 0)
      .html(function(m) { return m.name; })
    .transition()
      .duration(this.duration/4)
      .style('opacity', 1)
    
    tr.append('td')
      .attr('class', 'td_right')
      .style('opacity', 0)
      .html(function(m) { return m.value; })
    .transition()
      .duration(this.duration/4)
      .style('opacity', 1)

    d3.select(this.container)
      .append('h3')
      .attr('class', 'probability rm')
      .style('border-bottom', 'solid 2px #4c5c96')
      .style('border-top', 'solid 2px #4c5c96')
      .style('opacity', 0)
      .html(max_prob)
    .transition()
      .duration(this.duration/4)
      .style('opacity', 1);

    }.bind(this), timeOut);
  } // end

}); // End object








