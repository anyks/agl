#!/usr/bin/env node

/*
* Example:
* ./agl.js --redis=127.0.0.1:6379 --mongo=127.0.0.1:27017
*
* OR
*
* ./agl.js -r 127.0.0.1:6379 -m 127.0.0.1:27017
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
				mserv,
				rserv,
				rpass,
				// Название модуля
				name: "agl",
				// Извлекаем параметры подключения для mongo
				get mongo(){
					// Объект данных конфига
					let conf = {};
					// Распарсим данные редиса
					const parse = /^(\d+\.\d+\.\d+\.\d+)\:(\d+)$/i.exec(this.mserv);
					// Формируем объект подключения
					if(ax.isArray(parse)) conf = {
						"host":		parse[1],
						"port":		parseInt(parse[2], 10),
						"db":		this.name
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
			for(let i = 0; i < cups; i++){
				// Создаем воркер
				let worker = cluster.fork();
				// Отсылаем воркеру сообщение
				worker.send(config);
			}
			// Событие создания форка
			cluster.on('fork', worker =>{
				// Выводим в консоль что воркер создан
				agl.log(['воркер создан', worker], "info");
			});
			// Событие подключения к воркера
			cluster.on('listening', (worker, address) => {
				// Выводим в консоль что воркер активирован
				agl.log(['воркер активирован', worker, address], "info");
			});
			// Событие подключение онлайн воркера
			cluster.on('online', worker => {
				// Выводим в консоль что воркер онлайн
				agl.log(['воркер онлайн', worker], "info");
			});
			// Событие воркер отключился
			cluster.on('disconnect', worker => {
				// Выводим в консоль что воркер отключился
				agl.log(['воркер отключился', worker], "info");
			});
			// Если воркер отключился
			cluster.on('exit', (worker, code, signal) => {
				// Выводим в консоль что воркер вышел
				agl.log(['воркер вышел', worker, code, signal], "info");
			});
		// Если это Fork
		} else {
			// Ловим входящие сообщения от мастера
			process.on('message', config => {
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
				 * init Функция инициализации системы
				 * @param  {Object} clients клиенты баз данных
				 */
				const init = clients => {
					// console.log("++++++", clients);

					// agl.updateMetro().then();
					// agl.updateRegions().then();
					// agl.updateDistricts().then();
					// agl.updateCities().then();
					// agl.initEmptyDatabases().then();

					/*
					agl.getAddressFromGPS(64.436786, 76.499011).then(res => {
						console.log("+++++++", res);
					});
					*/

					// agl.getAddressFromGPS(55.5689216, 37.4896679);
					// agl.getAddressFromString('Россия, Москва, Коммунарка, улица Липовый Парк');
					// agl.searchRegion("И").then(rs => console.log(rs));
					// agl.updateMetroCity().then();
					// agl.searchCity("Южа", "3700000000000").then(rs => console.log(rs));
					agl.searchCity("Иваново", '3700000000000').then(rs => console.log(rs));


					// agl.getVersionSystem().then(rs => console.log("++++", rs));

					// agl.searchStreet("Румянцево", "7700000000000").then(rs => console.log(rs));
					// agl.searchHouse("12", "37019001000010900").then(rs => console.log(rs));
				};
				/**
				 * *connect Генератор для коннекта баз данных
				 * @return {Boolean} результат запроса из базы
				 */
				const connect = function * (){
					// Выполняем подключение к Redis
					const redis = yield agl.redis(config.redis);
					// Выполняем подключение к MongoDB
					const mongo = yield agl.mongo(config.mongo);
					// Выполняем инициализацию
					init({redis: redis, mongo: mongo});
				};
				// Запускаем коннект
				exec(connect());
			});
		}
	// Выводим сообщение об ошибке
	} else console.error("Your version node.js " + process.version + " and need v6.x.x or later");
})();