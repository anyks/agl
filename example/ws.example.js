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
	console.log("Получены данные", JSON.parse(event.data));
};

socket.onerror = function(error){
	console.log("Ошибка", error.message);
};


// socket.send(JSON.stringify({"action": "searchCity", "query": {"str": "Москва"}}));
//
// socket.send(JSON.stringify({"action": "getAddressFromString", "query": {"address": "г.Шуя, площадь комсомольская, д.12"}}));

// socket.send(JSON.stringify({"action": "initEmptyDatabases"}));
//
// socket.send(JSON.stringify({"action": "updateMetroCity"}));
//
// socket.send(JSON.stringify({"action": "getRegions", "query": {"limit": 100}}));

// socket.send(JSON.stringify({"action": "getTimezone", "query": {"lat":"55.870031", "lng":"41.772074"}}));

