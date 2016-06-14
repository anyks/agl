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


// socket.send(JSON.stringify({"action": "searchCity", "query": {"str": "Москва"}}));
//
// socket.send(JSON.stringify({"action": "getAddressFromString", "query": {"address": "г.Шуя, площадь комсомольская, д.12"}}));

// socket.send(JSON.stringify({"action": "initEmptyDatabases"}));

// socket.send(JSON.stringify({"action": "updateMetroCity"}));
//
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



