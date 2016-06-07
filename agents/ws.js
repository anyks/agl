#!/usr/bin/env node

/* Агент веб-сокетов AGL */
/*
*	автор:				Юрий Николаевич Лобарев
*	skype:				efrantick
*	телефон:			+7(910) 983-95-90
*	авторские права:	Все права принадлежат автору © Юрий Лобарев, 2016
*/

/*
* Example:
* ./ws.js --redis=127.0.0.1:6379 --server=127.0.0.1:3320
*
* OR
*
* ./ws.js -r 127.0.0.1:6379 -s 127.0.0.1:3320
*/

"use strict";
// Подключаем модули
const Agl = require("../api/api");
// Функция активации сервера
(function($){
	// Подключаем модули
	const fs	= require('fs');
	const net	= require('net');
	const http	= require('http');
	const wss	= require('websocket').server;
	// Получаем аргументы
	const argv = require('minimist')(process.argv.slice(2));
	// Параметры подключения
	const origin	= (argv.o ? argv.o : (argv.origin	? argv.origin	: undefined));
	const rdb		= (argv.b ? argv.b : (argv.rdb		? argv.rdb		: 0));
	const rpass		= (argv.p ? argv.p : (argv.rpass	? argv.rpass	: undefined));
	const rserv		= (argv.r ? argv.r : (argv.redis	? argv.redis	: "127.0.0.1:6379"));
	const serv		= (argv.s ? argv.s : (argv.server	? argv.server	: "127.0.0.1:3320"));
	// Создаем объект Agl
	const agl = new $();
	// Получаем api anyks
	const ax = agl.anyks;
	// Массив онлайн пользователей
	const onlineUsers = {};
	// Идентификатор сервера
	let server, clientRedis;
	/**
	 * socketExists Функция проверки на существование сокета
	 * @param  {String} path адрес сокета
	 * @return {Boolean}     результат проверки на существование сокета
	 */
	const socketExists = path => {
		try  {
			// Выводим сообщение что файл существует
			return fs.statSync(path).isSocket();
		// Если возникает ошибка то обрабатываем ее
		} catch(e) {
			// Обрабатываем ошибку
			if(e.code === "ENOENT"){
				// Выводим в консоль сообщение что файл не найден
				agl.log("file does not exist.", "error");
				// Сообщаем что файл не найден
				return false;
			}
			// Выводим в консоль сообщение об ошибке
			agl.log(["exception fs.statSync (", path, "): ", e], "error");
			// Генерируем ошибку
			throw e;
		}
	};
	// Конфигурация подключения
	const config = {
		rdb,
		serv,
		rserv,
		rpass,
		origin,
		// Извлекаем параметры подключения
		get server(){
			// Объект данных конфига
			let conf = {};
			// Распарсим данные
			const parse = /^(\d+\.\d+\.\d+\.\d+)\:(\d+)$/i.exec(this.serv);
			// Формируем объект подключения
			if(ax.isArray(parse)) conf = {
				"host":		parse[1],
				"port":		parseInt(parse[2], 10)
			};
			// Выводим результат
			return conf;
		},
		// Извлекаем параметры подключения для redis
		get redis(){
			// Объект данных конфига
			let conf = {};
			// Распарсим данные редиса
			const parse = /^(\d+\.\d+\.\d+\.\d+)\:(\d+)$/i.exec(this.rserv);
			// Формируем объект подключения
			if(ax.isArray(parse)) conf = {
				"host":		parse[1],
				"port":		parseInt(parse[2], 10),
				"db":		parseInt(this.rdb, 10),
				"password":	this.rpass
			};
			// Проверяем есть ли файл сокета Redis
			else if(socketExists(this.rserv)) conf = {
				"socket":	this.rserv,
				"db":		parseInt(this.rdb, 10),
				"password":	this.rpass
			};
			// Выводим результат
			return conf;
		}
	};
	/**
	 * sendGeneralMessage Функция отсылки стандартного сообщения
	 * @param  {Object} client объект клиента веб сокетов
	 * @param  {Object} mess   сообщение в формате JSON для отправки клиенту
	 */
	const sendGeneralMessage = (client, mess) => {
		// Если клиент передан
		if(ax.isset(client)){
			// Если сообщение не является объектов
			if(!ax.isset(mess) || !ax.isObject(mess)) mess = {};
			// Отправляем сообщение пустое
			client.sendUTF(JSON.stringify(mess));
		}
	};
	/**
	 * init Функция инициализации работы сервера
	 * @param  {Object} req объект данных клиента подключенному к серверу
	 */
	const init = function(req){
		// Копируем идентификатор сервера
		let client = this;
		// Запоминаем данные в буфер
		onlineUsers[req.key] = client;
		/**
		 * rejectUser Функция отключения пользователя
		 * @param  {String} error  название ошибки
		 * @param  {String} log    текст для вывода в лог
		 * @param  {Object} obj    объект ошибки
		 */
		const rejectUser = (error, log, obj) => {
			try {
				// Выводим в консоль данные
				agl.log([log, obj], "error");
				// Отключаем пользователя
				req.socket.end();
			// Если произошла ошибка тогда выводим в консоль
			} catch(e) {agl.log([log, e], "error");}
			// Выводим сообщение
			sendGeneralMessage(client, {"error": error});
		};
		// Отсылаем сообщение об удачном подключении
		sendGeneralMessage(client, {"message": "Добро пожаловать на сервер Agl!"});
		// Устанавливаем событие на ошибку подключения от клиента
		client.on('error', error => {
			// Выводим в консоль данные
			agl.log(['клиент', error, 'подключился с ошибкой.'], "info");
			// Удаляем пользователя из списка
			delete onlineUsers[req.key];
		});
		// Устанавливаем событие на отключение от сервера клиента
		client.on('close', (reasonCode, description) => {
			// Выводим в консоль данные
			agl.log(['клиент отключился', client.remoteAddress, description], "info");
			// Удаляем пользователя из списка
			delete onlineUsers[req.key];
		});
		// Устанавливаем событие на входящие данные
		client.on('message', message => {
			// Обрабатываем входящие сообщения
			switch(message.type){
				// Если это кодировка utf-8
				case 'utf8':
					try {
						// Входные данные
						let data = JSON.parse(message.utf8Data);
						// Отправляем сообщение серверу
						clientRedis.publish("sendAction", JSON.stringify({
							key:	req.key,
							data:	data
						}));
						// Пришли данные от клиента
						agl.log(['полученны данные с клиента', data], "info");
					// Если возникает ошибка то выводим ее
					} catch(e) {agl.log(['ошибка получения данных веб-сокетов', e], "error");}
				break;
				// Если это бинарные данные
				case 'binary':
					// Реджектим пользователя
					rejectUser("BINARY_NOT_ALLOW", "Бинарные данные запрещены", {bytes: message.binaryData.length});
				break;
			}
		});
		client.on('end', data => {
			console.log("--------------");
		});
	};
	/**
	 * connectRedis Функция подключения к Redis
	 */
	const connectRedis = () => {
		// Выполняем подключение к Redis
		agl.redis(config.redis).then(redis => {
			// Запоминаем redis клиент
			clientRedis = redis;
			// Отлавливаем подписку
			redis.on("subscribe", (channel, count) => {
				// Выводим в консоль данные
				agl.log(['подписка на канал сообщений в Redis,', 'channel =', channel + ',', 'count =', count], "info");
			});
			// Получаем входящие сообщение
			redis.on("message", (ch, mess) => {
				// Если канал для получения сообщений
				if(ch === "sendAction"){
					try {
						// Получаем входные данные
						mess = JSON.parse(mess);
						// Если клиент существует
						if($.isset(onlineUsers[mess.key])){
							// Отправляем сообщение
							onlineUsers[mess.key]
							.sendUTF(JSON.stringify(mess.data));
						}
					// Если возникает ошибка то выводим ее
					} catch(e) {agl.log(['ошибка получения данных подписки из Redis', e], "error");}
				}
			});
			// Подписываемся на канал
			redis.subscribe("sendAction");
			// Выводим в консоль данные
			agl.log(['агент веб-сокетов запущен'], "info");
		});
	};
	/**
	 * createServer Функция создания сервера
	 */
	const createServer = () => {
		/**
		 * originIsAllowed Функция проверки разрешен ли запрос
		 * @param  {String} origin название подключаемого сервера
		 * @return {Boolean}       результат проверки
		 */
		const originIsAllowed = origin => {
			// Если подключение идет к нужному домену, тогда разрешаем подключение
			if(ax.isset(origin)
			&& ax.isset(config.origin)
			&& (origin.indexOf(config.origin) > -1)) return true;
			// Если origin не указан тогда разрешаем соединение для всех подключений
			else if(!ax.isset(config.origin)) return true;
			// Если подключение идет к другому домену тогда запрещаем
			else return false;
		};
		// Если сервер существует
		if(ax.isset(server)) server.close();
		// Создаем сервер
		else server = http.createServer((req, res) => {
			// Выводим в консоль данные
			agl.log(['сервер получил запрос от', req.url], "error");
			// Сообщаем что страница не найдена
			res.writeHead(404);
			// Закрываем соединение
			res.end();
		});
		// Вешаем сервер на порт
		server.listen(config.server.port, config.server.host, connectRedis);
		// Если подключится не удалось
		server.on('error', error => {
			if(error.code === 'EADDRINUSE'){
				// Выводим в консоль данные
				agl.log(['адрес занят, перезапуск...', error], "error");
				// Через секунду пытаемся подключится вновь
				setTimeout(createServer, 1000);
			} else {
				// Выводим в консоль данные
				agl.log(['ошибка запуска агента веб-сокетов', error], "error");
				// Создаем сервер
				createServer();
			}
		});
		// Если сервер отключился
		server.on('close', function(){
			// Выводим в консоль данные
			agl.log(['агент веб-сокетов отключился'], "error");
			// Выходим из приложения
			process.exit(1);
		});
		// Создаем веб сокет сервер
		const wsServer = new wss({
			httpServer: server,
			// You should not use autoAcceptConnections for production
			// applications, as it defeats all standard cross-origin protection
			// facilities built into the protocol and the browser.  You should
			// *always* verify the connection's origin and decide whether or not
			// to accept it.
			autoAcceptConnections: false
		});
		// Создаем событие веб сокетов
		wsServer.on('request', req => {
			// Проверяем разрешено ли подключение с данного клиента
			if(!originIsAllowed(req.origin)){
				// Выводим в консоль данные
				agl.log(['соединение с клиента', req.origin, 'запрещено.'], "error");
				// Make sure we only accept requests from an allowed origin
				req.socket.end();
				// Выходим из функции
				return false;
			}
			// Сообщаем что произошла ошибка
			try {
				// Разрешаем подключится только с протокола ws
				const connection = req.accept(null, req.origin);
				// Выводим в консоль данные
				agl.log(['подключение к веб-сокет серверу разрешено.', connection.remoteAddress], "info");
				// Вызываем функцию инициализации данных сервера
				init.call(connection, req);
			} catch(e) {
				// Выводим в консоль данные
				agl.log(['соединение с клиента', req.origin, 'запрещено.', e], "error");
				// Make sure we only accept requests from an allowed origin
				req.socket.end();
				// Выходим из функции
				return false;
			}
		});
	};
	// Создаем сервер
	createServer();
})(Agl);