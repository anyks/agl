#!/usr/bin/env node

/*
* Example:
* ./agl.js --redis=127.0.0.1:6379 --mongo=127.0.0.1:27017 --fork=127.0.0.1:4420
*
* OR
*
* ./agl.js -r 127.0.0.1:6379 -m 127.0.0.1:27017 -f 127.0.0.1:4420
*/

// Устанавливаем строгий режим
"use strict";
// Экранируем код
(function(){
	// Проверяем версию Node.js
	if(parseInt(/^v(\d+)\.\d+\.\d+$/i.exec(process.version)[1], 10) >= 6){
		// Подключаем модуль кластера
		const cluster = require('cluster');
		// Подключаем модули
		const Agl = require("../api/api");
		// Создаем объект Agl
		const agl = new Agl();
		// Получаем api anyks
		const ax = agl.anyks;
		// Если это мастер
		if(cluster.isMaster){
			// Подключаем модуль файловой системы
			const fs = require('fs');
			// Определяем количество ядер
			const cups = require('os').cpus().length;
			// Получаем аргументы
			const argv = require('minimist')(process.argv.slice(2));
			// Параметры подключения
			const rdb	= (argv.b ? argv.b : (argv.rdb		? argv.rdb		: 0));
			const rpass	= (argv.p ? argv.p : (argv.rpass	? argv.rpass	: undefined));
			const mserv	= (argv.m ? argv.m : (argv.mongo	? argv.mongo	: "127.0.0.1:27017"));
			const rserv	= (argv.r ? argv.r : (argv.redis	? argv.redis	: "127.0.0.1:6379"));
			const fserv	= (argv.f ? argv.f : (argv.fork		? argv.fork		: "127.0.0.1:4420"));
			// Список воркеров
			const workers = [];
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
						agl.log("file does not exist.").error();
						// Сообщаем что файл не найден
						return false;
					}
					// Выводим в консоль сообщение об ошибке
					agl.log("exception fs.statSync (", path, "): ", e).error();
					// Генерируем ошибку
					throw e;
				}
			};
			// Конфигурация подключения
			const config = {
				rdb,
				fserv,
				mserv,
				rserv,
				rpass,
				// Извлекаем параметры подключения к fork серверу
				get fork(){
					// Объект данных конфига
					let conf = {};
					// Распарсим данные
					const parse = /^(\d+\.\d+\.\d+\.\d+)\:(\d+)$/i.exec(this.fserv);
					// Формируем объект подключения
					if(ax.isArray(parse)) conf = {
						"host":		parse[1],
						"port":		parseInt(parse[2], 10)
					};
					// Выводим результат
					return conf;
				},
				// Извлекаем параметры подключения для mongo
				get mongo(){
					// Объект данных конфига
					let conf = {};
					// Распарсим данные mongodb
					const parse = /^(\d+\.\d+\.\d+\.\d+)\:(\d+)$/i.exec(this.mserv);
					// Формируем объект подключения
					if(ax.isArray(parse)) conf = {
						"host":		parse[1],
						"port":		parseInt(parse[2], 10),
						"db":		agl.name
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
			// Создаем воркеры
			for(let i = 0; i < cups; i++) cluster.fork();
			// Событие создания форка
			cluster.on('fork', worker =>{
				// Выводим в консоль что воркер создан
				agl.log(
					'воркер создан',
					'id =', worker.id,
					'pid =', worker.process.pid
				).info();
			});
			// Событие подключения к воркера
			cluster.on('listening', (worker, address) => {
				// Выводим в консоль что воркер активирован
				agl.log(
					'воркер активирован',
					'id =', worker.id,
					'pid =', worker.process.pid,
					address
				).info();
			});
			// Событие подключение онлайн воркера
			cluster.on('online', worker => {
				// Добавляем воркер в список
				workers.push(worker);
				// Отсылаем воркеру сообщение
				worker.send({action: "config", data: config});
				// Выводим в консоль что воркер онлайн
				agl.log(
					'воркер онлайн',
					'id =', worker.id,
					'pid =', worker.process.pid
				).info();
			});
			// Событие воркер отключился
			cluster.on('disconnect', worker => {
				// Удаляем воркер из списка
				workers.splice(parseInt(worker.id, 10) - 1, 1);
				// Выводим в консоль что воркер отключился
				agl.log(
					'воркер отключился',
					'id =', worker.id,
					'pid =', worker.process.pid
				).error();
			});
			// Если воркер упал
			cluster.on('exit', (worker, code, signal) => {
				// Выводим в консоль что воркер вышел
				agl.log(
					'воркер вышел',
					'id =', worker.id,
					'pid =', worker.process.pid,
					code, signal
				).error();
			});
			// Функция инициализации работы сервера
			const init = res => {
				// Результат получения данных
				let mess = "";
				// Устанавливаем кодировку
				res.setEncoding('utf8');
				// Получение буфера данных
				res.on('data', chunk => {
					// Собираем данные из чанкояв
					mess += chunk;
					// Если все данные пришли тогда отсылаем результат
					if(!ax.isset(res.bufferSize)){
						try {
							// Останавливаем прием данных
							res.pause();
							// Перекодируем данные
							mess = JSON.parse(mess);
							// Если пароли совпадают
							if(agl.password === mess.password){
								// Формируем случайный индекс воркера
								let index = ax.getRandomInt(0, workers.length - 1);
								// Отсылаем воркеру сообщение
								workers[index].send({action: "message", data: mess});
								// Пришел ответ с агента
								agl.log('пришел запрос с агента', mess.data).info();
							// Если пароли сервера не совпадают то сообщаем об этом
							} else agl.log('пароли сервера не совпадают', mess.data).error();
							// Разрешаем прием данных
							res.resume();
							// Уничтожаем сокет так как ответ через него все равно передавать не будем
							res.destroy();
						// Закрываем соденинение
						} catch(e) {
							// Выводим в консоль данные
							agl.log('произошла ошибка обработки данных', e, mess).error();
							// Уничтожаем сокет
							res.destroy();
						}
					}
				});
				// События завершения передачи
				res.on('end', () => {
					// Выводим в консоль данные
					agl.log('клиент отключился от форка сервера', agl.name).info();
				});
				// Если происходит ошибка выводим результат
				res.on('error', e => {
					// Выводим в консоль данные
					if(JSON.stringify(e) !== "{}"){
						// Если данные об ошибке существуют тогда выводим их в консоль
						agl.log('произошла ошибка форка сервера', agl.name, e, mess).error();
					}
				});
				// Если происходит физическое отключение сокета
				res.on('close', () => {
					// Выводим в консоль данные
					agl.log('клиент закрыл соединение с форком сервера', agl.name).info();
				});
				// Выводим в консоль данные
				agl.log('клиент подключился к форку сервера', agl.name).info();
				// Подключаем сервер
				res.pipe(res);
			};
			/**
			 * createServer Функция создания сервера
			 */
			const createServer = () => {
				// Сервер сокетов
				let server;
				/**
				 * connectToServer Функция обработки результата подключения к серверу
				 */
				let connectToServer = () => {
					// Выводим в консоль данные
					agl.log('форк сервера', agl.name, 'запущен').info();
					// Если подключится не удалось
					server.on('error', e => {
						if(e.code === 'EADDRINUSE'){
							// Выводим в консоль данные
							agl.log('адрес форка сервера', agl.name, 'занят, перезапуск...').error();
							// Через секунду пытаемся подключится вновь
							setTimeout(createServer, 1000);
						// Выводим в консоль данные
						} else agl.log('произошла ошибка в форке сервера', agl.name, e).error();
					});
					// Если сервер отключился
					server.on('close', err => {
						// Выводим в консоль данные
						agl.log('форк сервер', agl.name, 'отключился', err).error();
					});
					/**
					 * updateImesZones Функция обновления временных зон
					 */
					const updateTimeZones = () => {
						// Проверяем каждые пол часа
						setTimeout(() => {
							// Получаем текущий час
							const hour = parseInt((new Date()).getHours(), 10);
							// Если время 3 утра тогда отправляем запрос
							if(hour === 4){//3){
								// Формируем случайный индекс воркера
								let index = ax.getRandomInt(0, workers.length - 1);
								// Отсылаем воркеру сообщение
								workers[index].send({action: "internal", data: {"action": "updateTimeZones"}});
							}
							// Запускаем следующую проверку
							updateTimeZones();
							// Выводим сообщение в консоль
							agl.log('выполняем попытку обновить временные зоны').info();
						}, 1000 * 60);//1800000);
					};
					// Запускаем проверку обновления временной зоны
					updateTimeZones();
				};
				// Если сервер существует
				if(ax.isset(server)) server.close();
				// Создаем сервер
				else server = require('net').createServer(init, {allowHalfOpen: true});
				// Вешаем сервер на порт
				server.listen(config.fork.port, config.fork.host, connectToServer);
			};
			// Создаем форк сервера
			createServer();
		// Если это Fork
		} else {
			// Клиенты баз данных
			const clients = {};
			/**
			 * exec Функция управления генераторами
			 * @param  {Generator} gen      генератор
			 * @param  {Function}  callback функция обратного вызова при завершении работы
			 * @param  {Variant}   val      полученное значение
			 */
			const exec = (gen, callback, val) => {
				// Передаем первоначальные данные
				let next = gen.next(val);
				// Если генератор завершен не полностью
				if(!next.done){
					next.value.then(
						res => exec(gen, callback, res),
						err => gen.throw(err)
					);
				// Выполняем функцию обратного вызова
				} else callback(next.value);
			};
			/**
			 * internal Функция выполнения внутренних методов системы
			 * @param  {Object} obj входящий запрос
			 */
			const internal = obj => {
				// Если данный метод существует
				if(ax.isFunction(agl[obj.action])){
					// Выполняем запрос данных из api
					agl[obj.action](obj.query, true)
					// Выполняем внутренний метод системы
					.then(res => agl.log("выполнение внутреннего метода", obj, res).info());
				}
			};
			/**
			 * external Функция выполнения внешних методов системы
			 * @param  {Object} obj входящий запрос с сервера
			 */
			const external = obj => {
				// Функция отправки результата ответа
				const sendResult = data => {
					// Присваиваем полученный ответ
					obj.data.query = data;
					// Отправляем сообщение серверу
					clients.redis.publish(
						obj.channel, JSON.stringify(obj)
						.replace(/_id/ig, "id")
						.replace(/\"__v\"\s*:\s*\d+\s*,/ig, "")
					);
				};
				// Если данный метод существует
				if(ax.isFunction(agl[obj.data.action])){
					// Если объект не передан то создаем его
					if(!ax.isset(obj.data.query)) obj.data.query = {};
					// Выполняем запрос данных из api
					agl[obj.data.action](obj.data.query)
					.then(sendResult)
					.catch(err => {
						// Выводим ошибку метода
						agl.log("экшен", obj.data.action, "параметры запроса", obj.data.query, err).error();
						// Выводим сообщение по умолчанию
						sendResult(false);
					});
				}
			};
			// Ловим входящие сообщения от мастера
			process.on('message', msg => {
				// Определяем входящие сообщения
				switch(msg.action){
					// Если это экшен конфига
					case "config":
						/**
						 * *connect Генератор для коннекта баз данных
						 * @return {Boolean} результат запроса из базы
						 */
						const connect = function * (){
							// Выполняем подключение к Redis
							const redis = yield agl.redis(msg.data.redis);
							// Выполняем подключение к MongoDB
							const mongo = yield agl.mongo(msg.data.mongo);
							// Запоминаем клиент Redis
							clients.redis = redis;
							// Запоминаем клиент MongoDB
							clients.mongo = mongo;
						};
						// Запускаем коннект
						exec(connect());
					break;
					// Если это экшен входящих данных
					case "message": external(msg.data); break;
					// Если это экшен внутренних запросов
					case "internal": internal(msg.data); break;
				}
			});
		}
	// Выводим сообщение об ошибке
	} else console.error("Your version node.js " + process.version + " and need v6.x.x or later");
})();