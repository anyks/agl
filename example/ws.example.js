var WebSocket = require('ws');

var socket = new WebSocket("ws://dev.agl.anyks.net");

socket.onopen = function(){
	console.log("Соединение установлено.");
};

socket.onclose = function(event){
	if(event.wasClean) console.log('Соединение закрыто чисто');
	// например, "убит" процесс сервера
	else console.log('Обрыв соединения');
	console.log('Код:', event.code, 'причина:', event.reason);
};

socket.onmessage = function(event){
	console.log("Получены данные", JSON.parse(event.data).query);
};

socket.onerror = function(error){
	console.log("Ошибка", error.message);
};



//
// socket.send(JSON.stringify({"action": "getAddressFromString", "query": {"address": "г.Шуя, площадь комсомольская, д.12"}}));

// socket.send(JSON.stringify({"action": "getRegions", "query": {"limit": 100}}));

// socket.send(JSON.stringify({"action": "getTimezone", "query": {"lat":"55.870031", "lng":"41.772074"}}));

// socket.send(JSON.stringify({"action": "getAddressFromString", "query": {"address": "Россия, Москва город, Коммунарка поселок, Липовый парк улица, 10К2"}}));

// socket.send(JSON.stringify({"action": "getAddressFromString", "query": {"address": "Россия, Ивановская область, город Шуя, площадь Комсомольская, д.12, кв.101"}}));

// socket.send(JSON.stringify({"action": "getAddressFromString", "query": {"address": "кв.101, площадь Комсомольская, Ивановская обл.,стр.Россия,г.Шуя, дом 12"}}));

// socket.send(JSON.stringify({"action": "updateMetro"}));
// socket.send(JSON.stringify({"action": "findCity", "query": {"str":"Москва"}}));
// socket.send(JSON.stringify({"action": "findCity", "query": {"str":"Санкт-Петербург"}}));
// socket.send(JSON.stringify({"action": "findCity", "query": {"str":"Самара"}}));
// socket.send(JSON.stringify({"action": "findCity", "query": {"str":"Новосибирск"}}));
// socket.send(JSON.stringify({"action": "findCity", "query": {"str":"Нижний Новгород"}}));

// socket.send(JSON.stringify({"action": "findMetro", query: {str: "Румянцево", cityId: "7700000000000"}}));
// socket.send(JSON.stringify({"action": "findNearStationsMetroByIds", query: {ids: ['975c23bb4d69e2efc343cf11']}}));
// socket.send(JSON.stringify({"action": "hintRegions", query: {str: "Ив"}}));
// socket.send(JSON.stringify({"action": "getCities", query: {regionId: "7700000000000"}}));
// socket.send(JSON.stringify({"action": "getCityById", query: {id: "7700000000000"}}));
// socket.send(JSON.stringify({"action": "getAddressByGPS", query: {"lat":"55.870031", "lng":"41.772074"}}));

// socket.send(JSON.stringify({"action": "getCitiesByGPS", query: {"lat":"55.870031", "lng":"41.772074"}}));
//
//socket.send(JSON.stringify({"action": "getAddressFromString", "query": {"address": "Москва, Чечерский проезд 126, к.2"}}));
//
//
// socket.send(JSON.stringify({"action": "updateCountries", "query": {updateKey: "sekh234khk234hk22"}}));
// socket.send(JSON.stringify({"action": "updateRegions", "query": {updateKey: "sekh234khk234hk22"}}));
// socket.send(JSON.stringify({"action": "updateDistricts", "query": {updateKey: "sekh234khk234hk22"}}));
// socket.send(JSON.stringify({"action": "updateMetro", "query": {updateKey: "sekh234khk234hk22"}}));
// socket.send(JSON.stringify({"action": "updateMetroCity", "query": {updateKey: "sekh234khk234hk22"}}));
// socket.send(JSON.stringify({"action": "initEmptyDatabases", "query": {updateKey: "sekh234khk234hk22"}}));
//
//
// socket.send(JSON.stringify({"action": "parseAddress", query: {"address":"кв.101, площадь Комсомольская, Ивановская обл.,стр.Россия,г.Шуя, дом 12"}}));
// socket.send(JSON.stringify({"action": "parseAddress", query: {"address":"Россия, Москва город, Коммунарка поселок, Липовый парк улица, 10К2"}}));
// socket.send(JSON.stringify({"action": "parseAddress", "query": {"address": "Россия, Ивановская область, город Шуя, площадь Комсомольская, д.12, кв.101"}}));
// socket.send(JSON.stringify({"action": "parseAddress", query: {"address":"Российская Федерация, г.Москва, посёлок Коммунарка, ул.Липовый парк, 10К2"}}));
//
// socket.send(JSON.stringify({"action": "findCountry", "query": {"str":"Рос"}}));
// socket.send(JSON.stringify({"action": "findRegion", "query": {"str":"Ив"}}));
// socket.send(JSON.stringify({"action": "findDistrict", "query": {"str":"Ш", "regionId": '3700000000000'}}));
// socket.send(JSON.stringify({"action": "findCity", "query": {"str":"Ш", "regionId": '3700000000000'}}));
// socket.send(JSON.stringify({"action": "findCity", "query": {"str":"Ш", "districtId": '3701900000000'}}));
// socket.send(JSON.stringify({"action": "findStreet", "query": {"str":"Ко", "cityId": '3701900100000'}}));
// socket.send(JSON.stringify({"action": "findHouse", "query": {"str":"32", "streetId": '37019001000011200'}}));
//
// socket.send(JSON.stringify({"action": "findMetro", "query": {"str":"Ру", "cityId": '7700000000000', "lineId": "31b83c4d182032e41ad85357"}}));
// socket.send(JSON.stringify({"action": "findMetro", "query": {"str":"Ру"}}));
// socket.send(JSON.stringify({"action": "findMetro", "query": {"str":"Румянцево", "cityId": '7700000000000', "lineName": 'Сокольническая'}}));
// socket.send(JSON.stringify({"action": "findMetro", "query": {"str":"Рум", "cityId": '7700000000000', "lineName": 'Сокольническая'}}));
// socket.send(JSON.stringify({"action": "findMetro", "query": {"str":"Ру", "cityId": '7700000000000', "lineName": 'Сокольническая'}}));
// socket.send(JSON.stringify({"action": "findMetro", "query": {"str":"Р", "cityId": '7700000000000', "lineName": 'Сокольническая'}}));
// socket.send(JSON.stringify({"action": "findMetro", "query": {"str":"Ру", "lineName": 'Сокольническая'}}));
// socket.send(JSON.stringify({"action": "findMetro", "query": {"str":"Ру", "cityId": '7700000000000', "lineName": 'Сокольническая'}}));
// socket.send(JSON.stringify({"action": "findMetro", "query": {"str":"Ру", "cityId": '7700000000000', "lineColor": "E42313"}}));
// socket.send(JSON.stringify({"action": "findMetro", "query": {"str":"Ру", "cityId": '7700000000000', "lineId": "31b83c4d182032e41ad85357"}}));
// socket.send(JSON.stringify({"action": "findMetro", "query": {"str":"Ру", "cityId": '7700000000000'}}));
// socket.send(JSON.stringify({"action": "findMetro", "query": {"str":"Рум", "cityId": '7700000000000'}}));
//
// socket.send(JSON.stringify({"action": "findNearStationsMetroByIds", "query": {"ids": ['966c4073e8d794620124a05c', 'd1a0a852a67883f7a91de489', '0fc0e26892380b075b21d69d']}}));
//
// socket.send(JSON.stringify({"action": "findMetroById", "query": {"id": '966c4073e8d794620124a05c'}}));
//
// socket.send(JSON.stringify({"action": "findMetroByStreetId", "query": {"id": '77000000000095300'}}));
// socket.send(JSON.stringify({"action": "findMetroByHouseId", "query": {"id": '7700000000009530046'}}));
//
// socket.send(JSON.stringify({"action": "findAddress", "query": {"address": 'площадь Комсомольская, Ивановская обл.,стр.Россия,г.Шуя, дом 12'}}));
// socket.send(JSON.stringify({"action": "findAddress", "query": {"address": 'Ив. обл., г.Шуя, ул. Свердлова, 96'}}));
//
// socket.send(JSON.stringify({"action": "hintCountries", "query": {"str": 'Рос'}}));
// socket.send(JSON.stringify({"action": "hintMetro", "query": {"str": 'Рум'}})); // hintMetro({str, streetId, houseId})
//
// socket.send(JSON.stringify({"action": "getVersionSystem"}));
//
// socket.send(JSON.stringify({"action": "getAddressByGPS", "query": {"lat":"55.870031", "lng":"41.772074"}}));
// socket.send(JSON.stringify({"action": "getAddressFromString", "query": {"address":'Россия, Владимирская область, Селивановский район, поселок городского типа Красная Горбатка, Комсомольская улица, 84'}}));
//
// socket.send(JSON.stringify({"action": "getCountries", "query": {"page": 1, "limit": 10}}));
// socket.send(JSON.stringify({"action": "getRegions", "query": {"page": 1, "limit": 10}}));
// socket.send(JSON.stringify({"action": "getDistricts", "query": {"page": 1, "limit": 10, regionId: '4100000000000', type: 'Край'}}));
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//