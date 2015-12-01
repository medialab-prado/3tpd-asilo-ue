d3.json('/web/data/select_data.json', function(error, jsonData){
  if (error) throw error;

  var origin = jsonData.origin,
      sex = jsonData.sex,
      age = jsonData.age,
      destiny = jsonData.destiny;

  $(".select-origin").select2({
    placeholder: "Selecciona el país de origen",
    allowClear: true,
    dataType: 'json',
    data: origin
  });

  $(".select-sex").select2({
    placeholder: "Selecciona el sexo",
    allowClear: true,
    dataType: 'json',
    data: sex
  });

  $(".select-age").select2({
    placeholder: "Selecciona la edad",
    allowClear: true,
    dataType: 'json',
    data: age
  });

  $(".select-destiny").select2({
    placeholder: "Selecciona el país de destino",
    allowClear: true,
    dataType: 'json',
    data: destiny
  });

  d3.select('.select-destiny').on('change', function(d) { console.log('change');return ; })

});
