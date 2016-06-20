/* API системы Agl */
/*
*	автор:				Юрий Николаевич Лобарев
*	skype:				efrantick
*	телефон:			+7(910) 983-95-90
*	авторские права:	Все права принадлежат автору © Юрий Лобарев, 2016
*/
"use strict";
// Подключаем модули
const anyks = require("./lib.anyks");
// Функция активации сервера
(function($){
	// Подключаем модуль файловой системы
	const fs = require('fs');
	/**
	 * fileExists Функция проверки на существование файла
	 * @param  {String} path адрес файла
	 * @return {Boolean}     результат проверки на существование файла
	 */
	const fileExists = path => {
		try {
			// Выводим сообщение что файл существует
			return fs.statSync(path).isFile();
		// Если возникает ошибка то обрабатываем ее
		} catch(e) {
			// Обрабатываем ошибку
			if(e.code === "ENOENT"){
				// Выводим в консоль сообщение что файл не найден
				console.error("File does not exist.");
				// Сообщаем что файл не найден
				return false;
			}
			// Выводим в консоль сообщение об ошибке
			console.error("Exception fs.statSync (", path, "): ", e);
			// Генерируем ошибку
			throw e;
		}
	};
	// Адрес конфигурационного файла
	const configFile = process.argv[1].replace(/\/\w+\.\w+$/i, "") + "/../config/config.json";
	// Считываем файл конфигурации
	const config = (fileExists(configFile) ? JSON.parse(fs.readFileSync(configFile, 'utf8')) : false);
	// Если конфигурационный файл не найден тогда выходим
	if(!config){
		// Сообщаем что конфигурационный файл не найден
		console.error("Конфигурационный файл не найден");
		// Выходим из приложения
		process.exit(1);
	}
	// Карта поправок по gps координатам
	const gpsMap = {
		// Байконур
		"9900000000000": {
			"lat": "45.96611",
			"lng": "63.30778",
			"gps": [parseFloat("63.30778"), parseFloat("45.96611")]
		}
	};
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
				res => exec.call(this, gen, callback, res),
				err => {
					this.log("exec generator", err).error();
					exec.call(this, gen, callback, false);
				}
			);
		// Выполняем функцию обратного вызова
		} else callback(next.value);
	};
	/**
	 * createMetroObject Функция генерации объекта метро
	 * @param  {Object} city    объект города метро
	 * @param  {Object} line    объект линии метро
	 * @param  {Object} station объект станции метро
	 * @return {Object}         объект метро
	 */
	const createMetroObject = (city, line, station) => {
		// Формируем объект для сохранения в кеше
		return {
			id:		station._id,
			name:	station.name,
			lat:	station.lat,
			lng:	station.lng,
			order:	station.order,
			line:	line.name,
			color:	line.color,
			city:	city.name,
			lineId:	line._id,
			cityId:	city._id,
			gps:	[parseFloat(station.lng), parseFloat(station.lat)]
		};
	};
	/**
	 * createSubjectKey Функция создания ключа в Redis
	 * @param  {String} key        основной ключ
	 * @param  {String} parentType родительский тип
	 * @param  {String} parentId   родительский идентификатор
	 * @param  {String} type       тип запроса
	 * @param  {String} name       название записи
	 * @param  {String} id         идентификатор записи
	 * @return {String}            готовый ключ
	 */
	const createSubjectKey = ({key, parentType, parentId, db, name = "*", id = "*"}) => {
		// Выполняем генерацию ключа
		return (function(){
			// Вид ключа: [address:subjects:db:parentType:parentId:char:id]
			// Создаем массив составного ключа
			const arrKey = [];
			// Ключ по умолчанию
			arguments[0][0] = "address:" + key;
			// Создаем буквы ключа
			if($.isset(name)) for(let i = 0; i < name.length; i++) arrKey.push(name[i].toLowerCase());
			// Добавляем идентификатор
			if($.isset(id)) arrKey.push(id);
			// Формируем первоначальное значение ключа
			return (arguments[0].join(":") + ":" + arrKey.join(":"))
			// Убираем пробелы и двойные двоеточие
			.replace(/\s/g, "").replace(/:{2,7}/g, ":");
		})([key, db, parentType, parentId], name, id);
	};
	/**
	 * createMetroKey Функция создания ключа для станций метро в Redis
	 * @param  {String} key     основной ключ
	 * @param  {String} cityId  родительский тип
	 * @param  {String} lineId  родительский идентификатор
	 * @param  {String} name    название записи
	 * @param  {String} id      идентификатор записи
	 * @return {String}         готовый ключ
	 */
	const createMetroKey = ({key, cityId, lineId, name = "*", id = "*"}) => {
		// Выполняем генерацию ключа
		return (function(){
			// Вид ключа: [address:metro:cityId:lineId:c:h:a:r:id]
			// Создаем массив составного ключа
			const arrKey = [];
			// Ключ по умолчанию
			arguments[0][0] = "address:" + key;
			// Создаем буквы ключа
			if($.isset(name)) for(let i = 0; i < name.length; i++) arrKey.push(name[i].toLowerCase());
			// Добавляем идентификатор
			if($.isset(id)) arrKey.push(id);
			// Формируем первоначальное значение ключа
			return (arguments[0].join(":") + ":" + arrKey.join(":"))
			// Убираем пробелы и двойные двоеточие
			.replace(/\s/g, "").replace(/:{2,7}/g, ":");
		})([key, cityId, lineId], name, id);
	};
	/**
	 * getKeyRedisForSubject Функция генерации ключа для объектов адресов
	 * @param  {Object} obj объект для генерации ключа
	 * @return {String}     сгенерированный ключ
	 */
	const getKeyRedisForSubject = obj => {
		// Родительский элемент
		let parentType = "", parentId = "", id = ($.isset(obj.id) ? obj.id : obj._id);
		// Если это элемент только пришел из базы Кладра
		if($.isArray(obj.parents) && obj.parents.length){
			parentId	= obj.parents[obj.parents.length - 1].id;
			parentType	= obj.parents[obj.parents.length - 1].contentType;
		// Если это существующий элемент
		} else {
			// Если есть идентификатор улицы значит это дом
			if($.isset(obj.streetId)){
				parentType	= 'street';
				parentId	= obj.streetId;
			// Если есть идентификатор города значит это улица
			} else if($.isset(obj.cityId)) {
				parentType	= 'city';
				parentId	= obj.cityId;
			// Если есть идентификатор района значит это город
			} else if($.isset(obj.districtId)) {
				parentType	= 'district';
				parentId	= obj.districtId;
			// Если есть идентификатор региона значит это город или район
			} else if($.isset(obj.regionId)) {
				parentType	= 'region';
				parentId	= obj.regionId;
			}
		}
		// Ключ запроса из Redis
		return createSubjectKey({
			id,
			parentId,
			parentType,
			db:		obj.contentType,
			key:	"subjects",
			name:	obj.name
		});
	};
	/**
	 * compareWords Функция сравнения строк
	 * @param  {String}  str1 первая строка для сравнения
	 * @param  {String}  str2 вторая строка для сравнения
	 * @return {Boolean}      результат сравнения
	 */
	const compareWords = (str1, str2) => {
		/**
		 * levenshtein Алгоритм Левенштейна
		 * @param {string} s1 Исходная строка
		 * @param {string} s2 Сравниваемая строка
		 * @param {object} [costs] Веса операций { [replace], [replaceCase], [insert], [remove] }
		 * @return {number} Расстояние Левенштейна
		 */
		const levenshtein = (s1, s2, costs) => {
			let i, j, l1, l2, flip, ch, chl, ii, ii2, cost, cutHalf;
			l1			= s1.length;
			l2			= s2.length;
			costs		= (costs || {});
			let cr		= (costs.replace || 1);
			let cri		= (costs.replaceCase || costs.replace || 1);
			let ci		= (costs.insert || 1);
			let cd		= (costs.remove || 1);
			cutHalf 	= flip = Math.max(l1, l2);
			let minCost	= Math.min(cd, ci, cr);
			let minD	= Math.max(minCost, (l1 - l2) * cd);
			let minI	= Math.max(minCost, (l2 - l1) * ci);
			let buf		= new Array((cutHalf * 2) - 1);
			for(i = 0; i <= l2; ++i) buf[i] = i * minD;
			for(i = 0; i < l1; ++i, flip = cutHalf - flip){
				ch	= s1[i];
				chl	= ch.toLowerCase();
				buf[flip] = (i + 1) * minI;
				ii	= flip;
				ii2	= cutHalf - flip;
				for(j = 0; j < l2; ++j, ++ii, ++ii2){
					cost = (ch === s2[j] ? 0 : (chl === s2[j].toLowerCase()) ? cri : cr);
					buf[ii + 1] = Math.min(buf[ii2 + 1] + cd, buf[ii] + ci, buf[ii2] + cost);
				}
			}
			return buf[l2 + cutHalf - flip];
		};
		// Определяем самую длинную строку
		const count = (str1.length > str2.length ? str1.length : str2.length);
		// Определяем расстояние Левенштейна
		const lev = levenshtein(str1, str2);
		// Определяем количество верных символов
		const good = count - lev;
		// Определяем процентное соотношение
		const proc = (good / count) * 100;
		// Определяем сколько процентов верно
		if(proc >= 53) return true;
		// Сообщаем что сравнение не верное
		else return false;
	};
	/**
	 * parseAnswerGeoCoder Функция обработки результата полученного с геокодера
	 * @param  {Object} obj   ответ с геокодера
	 * @return {Object}       результат обработки
	 */
	const parseAnswerGeoCoder = function(obj){
		// Получаем идентификатор текущего объекта
		const idObj = this;
		// Создаем промис для обработки
		return new Promise(resolve => {
			// Данные с геокодера
			let data = {}, result = false;
			// Определяем тип геокодера
			switch(obj.status){
				// OpenStreetMaps
				case "osm":
					// Получаем данные с геокодера
					data = (
						$.isArray(obj.data) && obj.data.length ? obj.data[0] :
						($.isset(obj.data) && $.isObject(obj.data) ? obj.data : false)
					);
					// Если данные существуют
					if($.isset(data)){
						// Получаем основные данные
						let lat			= $.fnShowProps(data, "lat");
						let lng			= $.fnShowProps(data, "lon");
						let city		= $.fnShowProps(data, "city");
						let town		= $.fnShowProps(data, "town");
						let code		= $.fnShowProps(data, "country_code");
						let street		= $.fnShowProps(data, "road");
						let county		= $.fnShowProps(data, "county");
						let region		= $.fnShowProps(data, "state");
						let country		= $.fnShowProps(data, "country");
						let district	= $.fnShowProps(data, "state_district");
						let boundingbox	= $.fnShowProps(data, "boundingbox");
						let description	= $.fnShowProps(data, "display_name");
						let zip			= $.fnShowProps(data, "postcode");
						let gps			= [parseFloat(lng), parseFloat(lat)];
						let _id			= idObj.generateKey(description);
						// Если почтовый индекс существует то преобразуем его
						zip = ($.isset(zip) ? parseInt(zip, 10) : null);
						// Если город не найден ищем его еще раз
						if(!$.isset(city)) city = town;
						// Если район не найден тогда присваиваем ему другой район
						if(!$.isset(district)) district = county;
						// Формируем объект
						result = {
							_id, lat, lng, gps,
							boundingbox, description,
							address: {zip, city, code, street, region, country, district}
						};
					}
				break;
				// Yandex
				case "yandex":
					// Получаем массив данных
					data = $.fnShowProps(obj.data, "featureMember");
					// Если данные существуют
					if($.isArray(data) && data.length){
						// Получаем данные с геокодера
						data = data[0];
						// Получаем основные данные
						let lat			= $.fnShowProps(data, "pos").split(" ")[1];
						let lng			= $.fnShowProps(data, "pos").split(" ")[0];
						let city		= $.fnShowProps(data, "LocalityName");
						let code		= $.fnShowProps(data, "CountryNameCode").toLowerCase();
						let street		= $.fnShowProps(data, "ThoroughfareName");
						let region		= $.fnShowProps(data, "AdministrativeAreaName");
						let country		= $.fnShowProps(data, "CountryName");
						let district	= $.fnShowProps(data, "SubAdministrativeAreaName");
						let description	= $.fnShowProps(data, "text");
						let lowerCorner	= $.fnShowProps(data, "lowerCorner").split(" ");
						let upperCorner = $.fnShowProps(data, "upperCorner").split(" ");
						let boundingbox = [lowerCorner[1], upperCorner[1], lowerCorner[0], upperCorner[0]];
						let gps			= [parseFloat(lng), parseFloat(lat)];
						let _id			= idObj.generateKey(description);
						// Формируем объект
						result = {
							_id, lat, lng, gps,
							boundingbox, description,
							address: {city, code, street, region, country, district}
						};
					}
				break;
				// Google
				case "google":
					// Если данные существуют
					if($.isArray(obj.data.results)
					&& obj.data.results.length){
						// Получаем данные с геокодера
						data = obj.data.results[0];
						// Координаты запроса
						let lat	= $.fnShowProps(data.geometry.location, "lat");
						let lng	= $.fnShowProps(data.geometry.location, "lng");
						let gps	= [parseFloat(lng), parseFloat(lat)];
						// Описание адреса
						let description = data.formatted_address;
						// Переменные адреса
						let zip, city, code, street, region, country, district;
						// Переходим по всему массиву с компонентами адреса
						data.address_components.forEach(obj => {
							// Ищем почтовый индекс
							if(obj.types.indexOf('postal_code') > -1){
								// Если почтовый индекс существует
								zip = ($.isset(obj.long_name) ? parseInt(obj.long_name, 10) : null);
							// Ищем город
							} else if(obj.types.indexOf('locality') > -1) city = obj.long_name;
							// Ищем код и название страны
							else if(obj.types.indexOf('country') > -1){
								// Получаем название страны
								country = obj.long_name;
								// Получаем код страны
								code = obj.short_name.toLowerCase();
							// Ищем название улицы
							} else if(obj.types.indexOf('route') > -1) street = obj.long_name;
							// Ищем название региона
							else if(obj.types.indexOf('administrative_area_level_1') > -1) region = obj.long_name;
							// Ищем название района
							else if(obj.types.indexOf('administrative_area_level_2') > -1) district = obj.long_name;
						});
						// Генерируем идентификатор объекта
						let _id = idObj.generateKey(description);
						// Формируем объект
						result = {
							_id, lat, lng, gps,
							description,
							address: {zip, city, code, street, region, country, district}
						};
					}
				break;
			}
			// Выводим результат
			resolve(result);
		});
	};
	/**
	 * getRedisByMaskKey Функция чтения данных из Redis с использованием масок ключей
	 * @param  {String} key ключ маска
	 * @return {Promise}    промис содержащий массив данных из Redis
	 */
	const getRedisByMaskKey = function(key){
		// Получаем идентификатор текущего объекта
		const idObj = this;
		// Создаем промис для обработки
		return (new Promise(resolve => {
			// Получаем список ключей
			Agl.getRedisKeys.call(idObj, key).then(keys => {
				// Если ключи найдены
				if($.isArray(keys)){
					// Массив данных результата
					const result = [];
					/**
					 * getRedis Функция поиска данных в базе
					 * @param  {Number} i индекс итераций
					 */
					const getRedis = (i = 0) => {
						// Если данные загружены не полностью
						if(i < keys.length){
							// Считываем данные из кеша
							Agl.getRedis.call(idObj, "get", keys[i]).then(({err, cache}) => {
								// Если данные не найдены, то пропускаем ключ
								if(!$.isset(cache)) getRedis(i + 1);
								// Если данные найдены
								else {
									// Переконвертируем объект
									cache = JSON.parse(cache);
									// Добавляем объект в массив
									result.push(cache);
									// Продолжаем дальше
									getRedis(i + 1);
								}
							// Если происходит ошибка тогда выходим
							}).catch(err => {
								// Выводим ошибку метода
								idObj.log("getRedis in getRedisByMaskKey", err).error();
								// Продолжаем дальше
								getRedis(i + 1);
							});
						// Если данные загружены полностью
						} else resolve(result);
					};
					// Выполняем загрузку данных из Redis
					getRedis();
				// Сообщаем что ничего не найдено
				} else resolve(false);
			// Если происходит ошибка тогда выходим
			}).catch(err => {
				// Выводим ошибку метода
				idObj.log("getRedisKeys in getRedisByMaskKey", err).error();
				// Выходим
				resolve(false);
			});
		}));
	};
	/**
	 * findAddressInCache Функция поиска данных в кеше
	 * @param  {String} str        строка запроса
	 * @param  {String} db         название базы данных
	 * @param  {String} parentId   идентификатор родительский
	 * @param  {String} parentType тип родителя
	 * @param  {Number} limit      лимит результатов для выдачи
	 * @return {Promise}           промис содержащий результат
	 */
	const findAddressInCache = function(str, db, parentId, parentType, limit = 1){
		// Получаем идентификатор текущего объекта
		const idObj = this;
		// Создаем промис для обработки
		return (new Promise(resolve => {
			// Ограничиваем максимальный лимит
			if(limit > 100) limit = 100;
			// Ключ запроса из Redis
			const key = createSubjectKey({
				db,
				parentId,
				parentType,
				name:	str,
				key:	"subjects"
			});
			// Получаем список ключей
			Agl.getRedisKeys.call(idObj, key).then(keys => {
				// Если ключи найдены
				if($.isArray(keys)){
					// Массив данных результата
					const result = [];
					/**
					 * getRedis Функция поиска данных в базе
					 * @param  {Number} i индекс итераций
					 */
					const getRedis = (i = 0) => {
						// Если данные загружены не полностью
						if(i < keys.length){
							// Считываем данные из кеша
							Agl.getRedis.call(idObj, "get", keys[i]).then(({err, cache}) => {
								// Если данные не найдены, то пропускаем ключ
								if(!$.isset(cache)) getRedis(i + 1);
								// Если данные найдены
								else {
									// Переконвертируем объект
									cache = JSON.parse(cache);
									// Создаем регулярное выражение для поиска
									let reg = new RegExp("^" + str, "i");
									// Если станции метро не найдены то удаляем ключ
									if($.isset(cache.metro)
									&& !cache.metro.length) delete cache.metro;
									// Запоминаем результат
									result.push(cache);
									// Увеличиваем значение индекса
									if(i < (limit - 1)) getRedis(i + 1);
									// Выводим результат
									else resolve(result);
								}
							// Если происходит ошибка тогда выходим
							}).catch(err => {
								// Выводим ошибку метода
								idObj.log("getRedis in findAddressInCache", err).error();
								// Продолжаем дальше
								getRedis(i + 1);
							});
						// Если данные загружены полностью
						} else resolve(result);
					};
					// Выполняем загрузку данных из Redis
					getRedis();
				// Сообщаем что ничего не найдено
				} else resolve(false);
			// Если происходит ошибка тогда выходим
			}).catch(err => {
				// Выводим ошибку метода
				idObj.log("getRedisKeys in findAddressInCache", err).error();
				// Выходим
				resolve(false);
			});
		}));
	};
	/**
	 * getGPSForAddress Функция получения gps координат для указанного адреса
	 * @param  {Object}  scheme    схема для сохранения
	 * @param  {Array}   arr       Массив с адресами для получения данных
	 * @param  {String}  address   префикс для адреса
	 * @return {Promise}           промис ответа
	 */
	const getGPSForAddress = function(scheme, arr, address){
		// Получаем идентификатор текущего объекта
		const idObj = this;
		// Создаем промис для обработки
		return (new Promise(resolve => {
			// Изменяем данные схемы
			scheme = idObj.schemes[scheme];
			/**
			 * gpsFix Функция исправления неверных gps координат
			 * @param  {Object} id  идентификатор субъекта
			 * @return {Object}     объект с исправленными координатами
			 */
			const gpsFix = id => {
				// Выводим результат
				if($.isset(id) && $.isset(gpsMap[id])) return gpsMap[id];
				// Иначе сообщаем что ничего не найдено
				else return false;
			};
			/**
			 * updateDB Функция обновления данных в базе
			 * @param  {Object} obj      объект для обновления данных
			 * @param  {Object} callback функция обратного вызова
			 */
			const updateDB = (obj, callback) => {
				// Запрашиваем все данные из базы
				scheme.findOne({_id: obj._id})
				// Выполняем запрос
				.exec((err, data) => {
					/**
					 * saveCache Функция сохранения данных в кеше
					 */
					const saveCache = () => {
						// Ключ запроса из Redis
						const key = getKeyRedisForSubject(obj);
						// Сохраняем данные в кеше
						Agl.setRedis.call(idObj, "set", key, obj).then(callback).catch(callback);
					};
					// Если ошибки нет
					if(!$.isset(err) && $.isset(data) && $.isObject(data)){
						// Если метро не найдено
						if(!$.isset(obj.metro)) obj.metro = data.metro;
						// Если временная зона была не найдена
						if(!$.isset(obj.timezone)) obj.timezone = data.timezone;
						// Выполняем обновление
						scheme.update({_id: obj._id}, obj, {upsert: true}, saveCache);
					// Просто добавляем новый объект
					} else (new scheme(obj)).save(saveCache);
				});
			};
			/**
			 * getAddressCache Функция извлечения данных кеша
			 * @param  {Object} obj объект данных для запроса из кеша
			 * @return {Promise}    промис содержащий объект из кеша
			 */
			const getAddressCache = function(obj){
				// Получаем идентификатор текущего объекта
				const idObj = this;
				// Создаем промис для обработки
				return (new Promise(resolve => {
					// Ключ запроса из Redis
					const key = getKeyRedisForSubject(obj);
					// Считываем данные из кеша
					Agl.getRedis.call(idObj, "get", key).then(({err, cache}) => {
						// Если данные не найдены
						if(!$.isset(cache)) cache = {};
						// Выполняем парсинг ответа
						else cache = JSON.parse(cache);
						// Выводим результат
						resolve(cache);
					// Если происходит ошибка тогда выходим
					}).catch(err => {
						// Выводим ошибку метода
						idObj.log("getRedis in getAddressCache", err).error();
						// Выходим
						resolve(false);
					});
				}));
			};
			/**
			 * compareResult Функция сравнения двух одинаковых адресов
			 * @param  {String}  addr1 строка адреса 1
			 * @param  {String}  addr2 строка адреса 2
			 * @return {Promise}       промис содержащий результат сравнения
			 */
			const compareResult = (addr1, addr2, obj) => {
				// Создаем промис для обработки
				return (new Promise(resolve => {
					/**
					 * *getData Генератор для формирования данных адреса
					 */
					const getData = function * (){
						// Если адреса существуют
						if($.isset(addr1) && $.isset(addr2)){
							// Выполняем разбор адреса
							let resName1 = yield idObj.parseAddress({address: addr1});
							let resName2 = yield idObj.parseAddress({address: addr2});
							// Если разбор удачный
							resName1 = $.fnShowProps(resName1, "name");
							resName2 = $.fnShowProps(resName2, "name");
							// Если названия не найдены тогда присваиваем основное название
							if(!$.isset(resName1)) resName1 = addr1;
							if(!$.isset(resName2)) resName2 = addr2;
							// Очищаем названия
							resName1 = resName1.replace(/[^А-ЯЁ\-\d]/ig, "");
							resName2 = resName2.replace(/[^А-ЯЁ\-\d]/ig, "");
							// Создаем регулярное выражение для поиска
							const regName1 = new RegExp(resName1, "i");
							const regName2 = new RegExp(resName2, "i");
							// Выполняем проверку
							if(compareWords(addr1, addr2) ||
							compareWords(resName1, resName2) ||
							compareWords(addr1, resName2) ||
							compareWords(addr2, resName1) ||
							regName1.test(resName2) ||
							regName1.test(addr2) ||
							regName2.test(resName1) ||
							regName2.test(addr1)) resolve(true);
							// Если сравнение не удалось то сообщаем что не удачно
							else if($.isset(obj)) {
								// Копируем объект
								const newObj = Object.assign({}, obj);
								// Запоминаем данные субъекта
								let key = false, compare = false;
								// Перебираем оставшиеся объекты
								for(let subject in newObj){
									// Если текущее значение адреса найдено то удаляем
									if(newObj[subject] === addr2) newObj[subject] = undefined;
									// Выполняем следующую проверку
									else key = subject;
								}
								// Если ключ не найден тогда выходим
								if($.isset(key)){
									// Копируем значение адреса
									addr2 = newObj[key];
									// Удаляем его из списка
									newObj[key] = undefined;
									// Выполняем следующую проверку
									compare = yield compareResult(addr1, addr2, newObj);
								}
								// Если ответ пришел тогда выходим
								resolve(compare);
							// Просто выходим
							} else resolve(false);
						// Просто выходим
						} else resolve(false);
						// Сообщаем что все удачно
						return true;
					};
					// Запускаем коннект
					exec.call(idObj, getData());
				}));
			};
			/**
			 * *getData Генератор для формирования данных адреса
			 * @param {Array}  arr массив с данными адресов
			 * @param {Number} i   индекс итерации массива
			 */
			const getData = function * (arr, i){
				// Получаем данные из кеша
				const cache = yield getAddressCache.call(idObj, arr[i]);
				// Если в объекте не найдена временная зона или gps координаты или станции метро
				if(!cache || (!$.isArray(cache.gps) || !$.isArray(cache.metro) || !$.isset(cache.timezone))){
					// Выполняем получение данные gps
					const fixGps = gpsFix(arr[i]._id);
					// Очищаем название и тип
					arr[i].name = arr[i].name.replace(/[^А-ЯЁ\-\_\.\,\d]/ig, "");
					arr[i].type = arr[i].type.replace(/[^А-ЯЁ\-\_\.\,\d]/ig, "");
					// Формируем строку адреса
					const addr = (address + " " + arr[i].name + " " + arr[i].type);
					// Выполняем запрос данных
					const res = yield idObj.getAddressByString({"address": addr});
					// Получаем название суъбекта для сравнения
					const name = (arr[i].contentType !== 'building' ? res.address[arr[i].contentType] : arr[i].name);
					// Если результат найден
					if(($.isset(res) && $.isset(name)) || $.isset(fixGps)){
						// Выполняем справнение найденного результата
						const compare = yield compareResult(arr[i].name, name, res.address);
						// Если результат найден
						if(($.isset(res.lat) && $.isset(res.lng) && compare) || $.isset(fixGps)){
							// Выполняем сохранение данных
							arr[i].code	= res.address.code;
							// Если исправления есть то применяем их
							if($.isset(fixGps)){
								// Применяем исправленные координаты
								arr[i].lat	= fixGps.lat;
								arr[i].lng	= fixGps.lng;
								arr[i].gps	= fixGps.gps;
							// Сохраняем результат
							} else {
								// Применяем координаты так как они есть
								arr[i].lat	= res.lat;
								arr[i].lng	= res.lng;
								arr[i].gps	= res.gps;
							}
							// Выполняем поиск временной зоны
							const timezone = yield idObj.getTimezoneByGPS({lat: arr[i].lat, lng: arr[i].lng});
							// Если временная зона найдена
							if($.isset(timezone)) arr[i].timezone = timezone;
							// Если объект внешних ключей существует тогда добавляем их
							if($.isArray(arr[i].parents)){
								// Переходим по всему массиву данных
								arr[i].parents.forEach(val => {
									// Определяем тип контента
									switch(val.contentType){
										// Формируем внешние ключи
										case 'region':		arr[i].regionId		= val.id;	break;
										case 'district':	arr[i].districtId	= val.id;	break;
										case 'city':		arr[i].cityId		= val.id;	break;
										case 'street':		arr[i].streetId		= val.id;	break;
									}
								});
								// Удаляем родительские объекты
								arr[i].parents = undefined;
							}
							// Если это улица или дом то ищем ближайшие станции метро
							if((arr[i].contentType === 'street')
							|| (arr[i].contentType === 'building')){
								// Параметры запроса
								const query = {
									lat:		parseFloat(arr[i].lat),
									lng:		parseFloat(arr[i].lng),
									distance:	3000
								};
								// Выполняем поиск ближайших станций метро
								const metro = yield idObj.getMetroByGPS(query);
								// Если метро передано
								if($.isArray(metro) && metro.length){
									// Создаем пустой массив с метро
									arr[i].metro = [];
									// Переходим по всему массиву данных
									metro.forEach(val => arr[i].metro.push(val._id));
								}
								// Сохраняем данные
								updateDB(arr[i], () => getGPS(arr, i + 1));
							// Сохраняем данные
							} else updateDB(arr[i], () => getGPS(arr, i + 1));
						// Идем дальше
						} else getGPS(arr, i + 1);
					// Идем дальше
					} else getGPS(arr, i + 1);
				// Идем дальше
				} else getGPS(arr, i + 1);
				// Сообщаем что все удачно
				return true;
			};
			/**
			 * getGPS Рекурсивная функция поиска gps координат для города
			 * @param  {Array} arr массив объектов для обхода
			 * @param  {Number} i  индекс массива
			 */
			const getGPS = (arr, i = 0) => {
				// Если данные не все получены
				if(i < arr.length){
					// Изменяем идентификатор данных
					arr[i]._id = arr[i].id;
					// Удаляем основной идентификатор
					arr[i].id = undefined;
					// Запускаем коннект
					exec.call(idObj, getData(arr, i));
				// Сообщаем что все сохранено удачно
				} else resolve(arr);
			};
			// Выполняем запрос на получение gps данных
			getGPS(arr);
		}));
	};
	/**
	 * processResultKladr Функция обработки результата полученного с базы данных Кладр
	 * @param  {Object}   scheme   объект схемы базы данных
	 * @param  {Object}   err      объект с ошибкой
	 * @param  {Object}   res      объект с результатом
	 * @param  {Function} callback функция обратного вызова
	 */
	const processResultKladr = function(scheme, err, res, callback){
		// Получаем идентификатор текущего объекта
		const idObj = this;
		// Если возникает ошибка тогда выводим её
		if($.isset(err) && !$.isset(res)){
			// Выводим сообщение об ошибке
			idObj.log("произошла ошибка поиска в базе Kladr", err).error();
			// Выводим результат
			callback(false);
		// Если данные пришли
		} else if($.isObject(res) && $.isArray(res.result) && res.result.length){
			// Формируем первоначальную строку адреса
			let address = "Россия" + ", "
			+ ($.isArray(res.result[0].parents)
			&& res.result[0].parents.length ? (res.result[0].parents.length > 1 ?
			res.result[0].parents.reduce((sum, val) => {
				// Формируем строку отчета
				return ($.isString(sum) ? sum : sum.name + " " + sum.type)
				+ ", " + val.name + " " + val.type;
			}) : res.result[0].parents[0].name + " " + res.result[0].parents[0].type) + "," : "");
			// Выполняем поиск GPS координат для текущего адреса
			getGPSForAddress.call(idObj, scheme, res.result, address)
			.then(result => {
				// Выводим сообщение в консоль
				idObj.log(
					"получение gps координат для адреса:",
					(res.result.length ? (res.result.length > 1 ? res.result.reduce((sum, val) => {
						// Формируем строку отчета
						return ($.isString(sum) ? sum : sum.name + " " + sum.typeShort + ".")
						+ ", " + val.name + " " + val.typeShort + ".";
					}) : res.result[0].name + " " + res.result[0].typeShort + ".") : ""),
					(result.length ? "Ok" : "Not ok")
				).info();
				// Выводим результат
				callback(result);
			// Если происходит ошибка тогда выходим
			}).catch(err => {
				// Выводим ошибку метода
				idObj.log("getGPSForAddress in processResultKladr", err).error();
				// Выходим
				callback(false);
			});
		// Если данные не найдены то сообщаем об этом
		} else {
			// Выводим сообщение об ошибке
			idObj.log("адрес в базе Kladr не найден", res.searchContext).error();
			// Выводим результат
			callback(false);
		}
	};
	/**
	 * getByGPS Метод поиска данных по GPS координатам
	 * @param  {Object} scheme   схема базы данных MongoDB
	 * @param  {String} key      ключ для запроса данных из Redis
	 * @param  {Number} lat      широта
	 * @param  {Number} lng      долгота
	 * @param  {Number} distance дистанция поиска в метрах
	 * @return {Promise}         промис содержащий найденные данные
	 */
	const getByGPS = function(scheme, key, lat, lng, distance = 3000){
		// Получаем идентификатор текущего объекта
		const idObj = this;
		// Создаем промис для обработки
		return (new Promise(resolve => {
			// Изменяем данные схемы
			scheme = idObj.schemes[scheme];
			// Ищем данные в кеше
			Agl.getRedis.call(idObj, "get", key, 3600).then(({err, cache}) => {
				// Если данные в кеше сть тогда выводим их
				if($.isset(cache)) resolve(JSON.parse(cache));
				// Если данные в кеше не найдены тогда продолжаем искать
				else {
					// Выполняем поиск ближайших данных
					scheme.find({
						'gps': {
							$near: {
								$geometry: {
									type:			'Point',
									coordinates:	[lng, lat]
								},
								$maxDistance: distance
							}
						}
					// Запрашиваем данные
					}).exec((err, data) => {
						// Результат ответа
						let result = false;
						// Если ошибки нет
						if(!$.isset(err) && $.isArray(data)) result = data;
						// Выводим в консоль сообщение что данные не найдены
						else idObj.log("поиск по gps координатам не дал результатов:", "lat =", lat, "lng =", lng, err, data).error();
						// Отправляем в Redis на час
						Agl.setRedis.call(idObj, "set", key, result, 3600).then();
						// Выводим результат
						resolve(result);
					});
				}
			// Если происходит ошибка тогда выходим
			}).catch(err => {
				// Выводим ошибку метода
				idObj.log("getRedis in getByGPS", err).error();
				// Выходим
				resolve(false);
			});
		}));
	};
	/**
	 * getAddressById Функция поиска данных адресов по id
	 * @param  {Object} scheme схема базы данных MongoDB
	 * @param  {String} key    ключ для запроса данных из Redis
	 * @param  {String} id     идентификатор искомого объекта
	 * @return {Promise}       промис содержащий найденные данные
	 */
	const getAddressById = function(scheme, key, id){
		// Получаем идентификатор текущего объекта
		const idObj = this;
		// Создаем промис для обработки
		return (new Promise(resolve => {
			// Изменяем данные схемы
			scheme = idObj.schemes[scheme];
			// Считываем данные из кеша
			getRedisByMaskKey.call(idObj, key).then(result => {
				// Если данные в кеше сть тогда выводим их
				if(!$.isArray(result) && result.length) resolve(result[0]);
				// Если данные в кеше не найдены тогда продолжаем искать
				else {
					// Выполняем поиск идентификатора
					scheme.findOne({"_id": id}).exec((err, data) => {
						// Если ошибки нет
						if(!$.isset(err) && $.isset(data)){
							// Ключ запроса из Redis
							const key = getKeyRedisForSubject(data);
							// Сохраняем данные в кеше
							Agl.setRedis.call(idObj, "set", key, data).then();
							// Выводим результат
							resolve(data);
						// Выводим в консоль сообщение что данные не найдены
						} else {
							// Выводим сообщение об ошибке
							idObj.log("поиск по id не дал результатов:", "id =", id, err, data).error();
							// Выводим результат
							resolve(false);
						}
					});
				}
			// Если происходит ошибка тогда выходим
			}).catch(err => {
				// Выводим ошибку метода
				idObj.log("getRedisByMaskKey in getAddressById", err).error();
				// Выходим
				resolve(false);
			});
		}));
	};
	/**
	 * getDataMetroById Функция поиска данных метро по id
	 * @param  {Object} scheme схема базы данных MongoDB
	 * @param  {String} key    ключ для запроса данных из Redis
	 * @param  {String} id     идентификатор искомого объекта
	 * @return {Promise}       промис содержащий найденные данные
	 */
	const getDataMetroById = function(scheme, key, id){
		// Получаем идентификатор текущего объекта
		const idObj = this;
		// Создаем промис для обработки
		return (new Promise(resolve => {
			// Изменяем данные схемы
			scheme = idObj.schemes[scheme];
			// Считываем данные из кеша
			Agl.getRedis.call(idObj, "get", key, 3600).then(({err, cache}) => {
				// Если данные не найдены, сообщаем что в кеше ничего не найдено
				if(!$.isset(cache)){
					// Формируем параметры запроса
					const query = {};
					// Выполняем поиск идентификатора
					scheme.findOne({"_id": id}).exec((err, data) => {
						// Результат ответа
						let result = false;
						// Если ошибки нет
						if(!$.isset(err) && $.isset(data)) result = data;
						// Выводим в консоль сообщение что данные не найдены
						else idObj.log("поиск по id не дал результатов:", "id =", id, err, data).error();
						// Отправляем в Redis на час
						Agl.setRedis.call(idObj, "set", key, result, 3600).then();
						// Выводим результат
						resolve(result);
					});
				// Выводим результат
				} else resolve(JSON.parse(cache));
			// Если происходит ошибка тогда выходим
			}).catch(err => {
				// Выводим ошибку метода
				idObj.log("getRedisByMaskKey in getDataMetroById", err).error();
				// Выходим
				resolve(false);
			});
		}));
	};
	/**
	 * Класс Agl с базовыми методами
	 */
	class Agl {
		/**
		 * createModels Метод создания объектов
		 * @param  {Object} idObj идентификатор текущего объекта
		 */
		static createModels(){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Подключаем модель адреса
			const ModelAddress = require('../models/address');
			// Подключаем модель стран
			const ModelCountries = require('../models/countries');
			// Подключаем модель регионов
			const ModelRegions = require('../models/regions');
			// Подключаем модель района
			const ModelDistricts = require('../models/districts');
			// Подключаем модель городов
			const ModelCities = require('../models/cities');
			// Подключаем модель улиц
			const ModelStreets = require('../models/streets');
			// Подключаем модель домов
			const ModelHouses = require('../models/houses');
			// Подключаем модель метро
			const ModelMetro = require('../models/metro');
			// Подключаем модель метро с городами
			const ModelMetro_cities = require('../models/metro_cities');
			// Подключаем модель метро с линиями
			const ModelMetro_lines = require('../models/metro_lines');
			// Подключаем модель метро с станциями
			const ModelMetro_stations = require('../models/metro_stations');
			// Создаем модель адресов
			const modelAddress = (new ModelAddress("address")).getData();
			// Создаем модель стран
			const modelCountries = (new ModelCountries("countries")).getData();
			// Создаем модель регионов
			const modelRegions = (new ModelRegions("regions")).getData();
			// Создаем модель районов
			const modelDistricts = (new ModelDistricts("districts")).getData();
			// Создаем модель городов
			const modelCities = (new ModelCities("cities")).getData();
			// Создаем модель улиц
			const modelStreets = (new ModelStreets("streets")).getData();
			// Подключаем модель домов
			const modelHouses = (new ModelHouses("houses")).getData();
			// Создаем модель метро
			const modelMetro = (new ModelMetro("metro")).getData();
			// Создаем модель метро с городами
			const modelMetro_cities = (new ModelMetro_cities("metro_cities")).getData();
			// Создаем модель метро с линиями
			const modelMetro_lines = (new ModelMetro_lines("metro_lines")).getData();
			// Создаем модель метро с станциями
			const modelMetro_stations = (new ModelMetro_stations("metro_stations")).getData();
			// Создаем схему адресов
			const Address = idObj.clients.mongo.model("Address", modelAddress);
			// Создаем схему стран
			const Countries = idObj.clients.mongo.model("Countries", modelCountries);
			// Создаем схему регионов
			const Regions = idObj.clients.mongo.model("Regions", modelRegions);
			// Создаем схему районов
			const Districts = idObj.clients.mongo.model("Districts", modelDistricts);
			// Создаем схему городов
			const Cities = idObj.clients.mongo.model("Cities", modelCities);
			// Создаем схему улиц
			const Streets = idObj.clients.mongo.model("Streets", modelStreets);
			// Создаем схему домов
			const Houses = idObj.clients.mongo.model("Houses", modelHouses);
			// Создаем схему метро
			const Metro = idObj.clients.mongo.model("Metro", modelMetro);
			// Создаем схему метро с городами
			const Metro_cities = idObj.clients.mongo.model("Metro_cities", modelMetro_cities);
			// Создаем схему метро с линиями
			const Metro_lines = idObj.clients.mongo.model("Metro_lines", modelMetro_lines);
			// Создаем схему метро с станциями
			const Metro_stations = idObj.clients.mongo.model("Metro_stations", modelMetro_stations);
			// Сохраняем схемы
			idObj.schemes = {
				Address,
				Countries,
				Regions,
				Districts,
				Cities,
				Streets,
				Houses,
				Metro,
				Metro_cities,
				Metro_lines,
				Metro_stations
			};
		}
		/**
		 * getRedis Метод чтения из Redis данных
		 * @param  {String}   command  название комманды (get или hgetall)
		 * @param  {String}   key      ключ в базе
		 * @param  {Number}   expire   время жизни в секундах (если 0 то без ограничения)
		 * @return {Promise}           результат извлечения данных из базы
		 */
		static getRedis(command, key, expire = 0){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Если такая комманда существует
				if($.isset(idObj.clients.redis[command])){
					// Преобразуем время жизни
					expire = parseInt(Math.ceil(parseFloat(expire)), 10);
					// Параметры запроса
					const params = [[command, key]];
					// Устанавливаем время жизни
					if($.isset(expire)) params.push(["EXPIRE", key, expire]);
					// Считываем данные кеша
					idObj.clients.redis.multi(params)
					.exec((err, cache) => resolve({
						err,
						"cache": ($.isArray(cache) && cache.length ? cache[0] : false)
					}));
				// Сообщаем что такая комманда не найдена
				} else resolve({err: "not found", cache: false});
			}));
		}
		/**
		 * setRedis Метод записи в Redis данных
		 * @param  {String}   command  комманда для редиса (hmset или set)
		 * @param  {String}   key      ключ в базе
		 * @param  {String}   value    значение для записи
		 * @param  {Number}   expire   время жизни в секундах (если 0 то без ограничения)
		 * @return {Promise}           результат записи данных в базу
		 */
		static setRedis(command, key, value, expire = 0){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Параметры запроса
				let params = [];
				/**
				 * setParams Функция формирования параметров
				 * @param  {String} command команда redis
				 * @param  {String} key     ключ запроса
				 * @param  {String} value   значение запроса
				 */
				const setParams = (command, key, value) => {
					// Преобразуем время жизни
					expire = parseInt(Math.ceil(parseFloat(expire)), 10);
					// Формируем массив запроса
					if($.isset(expire)){
						// Устанавливаем время жизни данных
						params = [
							[command, key, value],
							["EXPIRE", key, expire]
						];
					// Записываем параметры без времени жизни
					} else params = [[command, key, value]];
				};
				// Если нужно записать массив
				if((command !== "hmset") && $.isObject(value)){
					// Формируем блок параметров
					setParams(command, key, JSON.stringify(value));
				// Формируем блок параметров
				} else setParams(command, key, value);
				// Записываем данные в редисе
				idObj.clients.redis.multi(params)
				.exec((err, cache) => resolve({err, cache}));
			}));
		}
		/**
		 * getKeys Функция для поиска ключей
		 * @param  {String}   key ключ для поиска
		 * @return {Promise}      промис содержащий список ключей по маске
		 */
		static getRedisKeys(key){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Ищем ключи
				idObj.clients.redis.multi([["keys", key]])
				.exec((error, result) => {
					// Если данные пришли
					if($.isArray(result)
					&& result.length
					&& $.isArray(result[0])
					&& result[0].length){
						// Выводим найденный ключ
						resolve(result[0]);
					// Выводим результат что ничего не найдено
					} else resolve(false);
				});
			}));
		}
		/**
		 * rmRedis Метод удаления из Redis данных
		 * @param  {String}   key   ключ для поиска
		 * @return {Promise}        результат удаления данных из базы
		 */
		static rmRedis(key){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Запрашиваем данные удаляемого ключа
				Agl.getRedisKeys.call(idObj, key).then(result => {
					// Если данные пришли
					if($.isArray(result)){
						// Массив для удаления ключей
						const removes = [];
						// Собираем массив для удаления ключей
						result.forEach(val => removes.push(["del", val]));
						// Удаляем данные
						idObj.clients.redis.multi(removes)
						.exec((err, cache) => resolve({err, cache}));
					// Выводим что ничего не удалено
					} else resolve({err: "not found", cache: false});
				// Если происходит ошибка тогда выходим
				}).catch(err => {
					// Выводим ошибку метода
					idObj.log("getKeys in rmRedis", err).error();
					// Выходим
					resolve({err: "not found", cache: false});
				});
			}));
		}
		/**
		 * constructor Конструктор класса
		 */
		constructor(){
			// Устанавливаем объект api anyks
			this.anyks = $;
			// Устанавливаем объект клиентов
			this.clients = {};
			// Устанавливаем название системы
			this.name = config.name;
			// Устанавливаем тип отладки
			this.debug = config.debug;
			// Устанавливаем ключ кладра
			this.keyKladr = config.kladr;
			// Устанавливаем ключ pikpoint
			this.keyPickPoint = config.pickpoint;
			// Устанавливаем версию системы
			this.version = config.version;
			// Устанавливаем копирайт
			this.copyright = config.copyright;
			// Устанавливаем ключ для обновления базы данных
			this.updateKey = this.generateKey(config.updateKey);
			// Устанавливаем пароль системы
			this.password = this.generateKey(config.password);
		}
		/**
		 * getVersionSystem Метод получения версии и копирайта системы
		 * @return {Promise} промис результата ответа
		 */
		getVersionSystem(){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Определяем копирайт
				let getCopyYuear = idObj.copyright.match(/\-\s*(\d{4})/i);
				// Определяем текущий год
				let getCurYuear = (new Date()).getFullYear();
				// Сравниваем года, если текущий год выше следующего то изменяем копирайт
				if($.isArray(getCopyYuear)
				&& (parseInt(getCopyYuear[1]) < getCurYuear)){
					// Заменяем копирайт
					idObj.copyright = idObj.copyright
					.replace(getCopyYuear[0], getCopyYuear[1] + " - " + getCurYuear);
				}
				// Выводим результат
				const object = {
					version:	idObj.version,
					copyright:	idObj.copyright,
					text:		idObj.name.anyks_ucwords() + " v"
								+ idObj.version + " \u00A9 " + idObj.copyright
				};
				// Выводи данные в консоль
				idObj.log(
					"\x1B[31m\x1B[1m"
					.anyks_clearColor(idObj.debug.console),
					"v" + idObj.version,
					"\u00A9", idObj.copyright,
					"\x1B[0m".anyks_clearColor(idObj.debug.console)
				).info();
				// Выводим результат
				resolve(object);
			}));
		}
		/**
		 * generateKey Функция генерирования ключа
		 * @param  {String} str строка для генерации
		 * @return {String}     сгенерированный ключ
		 */
		generateKey(str = null){
			// Подключаем модуль md5
			const md5 = require('MD5');
			// Генерируем от текущего времени
			let mkey = md5((new Date()).valueOf().toString());
			// Если это строка
			if($.isString(str)) mkey = md5(str);
			// Формируем новый вид ключа
			let key = (mkey.substr(0, 8) + mkey.substr(24, 31));
			// Выводим результат
			return key.replace(key.substr(4, 8), mkey.substr(8, 16));
		}
		/**
		 * getAddress Метод поиска адреса в кеше
		 * @param  {String} options.address адрес для парсинга
		 * @return {Object}                 объект ответа
		 */
		getAddress({address}){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Массив с типами субъектов для поиска
				const types = [];
				/**
				 * findSubject Функция поиска географического субъекта по массиву
				 * @param  {Object} subject название субъекта
				 * @param  {Array}  arr     массив найденных субъектов
				 * @return {Object}         найденный объект
				 */
				const findSubject = (subject, arr) => {
					// Если это массив
					if($.isArray(arr) && arr.length){
						// Результат поиска
						let result = false;
						// Переходим по всему найденному массиву
						for(let val of arr){
							// Создаем регулярное выражение для поиска
							const reg = new RegExp("^" + subject + "(?:\\s+[А-ЯЁ]+)?$", "i");
							// Если элемент в массиве найден
							if(reg.test(val.name) && (!$.isset(result)
							|| (types.indexOf(val.type.toLowerCase()) > -1))) result = val;
						}
						// Выводим результат
						return result;
					}
					// Выходим из функции
					return false;
				};
				/**
				 * *getData Генератор для получения данных субъектов
				 */
				const getData = function * (){
					// Переменные субъектов
					let country, region, district, city, street, house;
					// Разбиваем текст на составляющие
					address = address
					// Устанавливаем пробелы в нужных местах
					.replace(/(\.|\,)/ig, "$1 ")
					// Удаляем все символы кроме русских букв, цифр, пробелов и тире
					.replace(/[^А-ЯЁ\-\d\s]/ig, "")
					// Разбиваем текст на массив
					.anyks_trim().split(" ");
					// Массив найденных индексов
					const indexes = [], mask = ["дом", "строение", "корпус"];
					// Делаем первый обход массива и извлекаем из него все типы
					for(let i = 0; i < address.length; i++){
						// Выполняем разбор адреса
						const addr = yield idObj.parseAddress({address: address[i]});
						// Проверяем найденный результат, если это тип населенного пункта то пропускаем
						if($.isset(addr) && ($.isset(addr.subject)
						&& $.isset(addr.subject.type)
						&& !$.isset(addr.subject.name))){
							// Запоминаем типы найденных субъектов
							types.push(addr.subject.type.toLowerCase());
							// Добавляем найденный индекс в массив
							indexes.push(i);
						// Если найден запрещенный субъект то также добавляем его в список
						} else if(mask.indexOf(address[i].toLowerCase()) > -1) indexes.push(i);
					}
					// Удаляем ненужные нам индексы
					address = address.filter((val, i) => (indexes.indexOf(i) < 0));
					// Переходим по всему массиву
					for(let subject of address){
						// Если это не одна буква
						if((/^[А-ЯЁ]+$/i.test(subject)
						&& (subject.length > 1))
						|| /\d/i.test(subject)){
							// Если страна не найдена
							if(!$.isset(country)){
								// Получаем данные стран
								const countries = yield findAddressInCache.call(idObj, subject, "country", null, null, 100);
								// Получаем данные страны
								country = findSubject(subject, countries);
								// Продолжаем дальше
								if($.isset(country)) continue;
							}
							// Если регион не найден
							if(!$.isset(region)){
								// Получаем данные регионов
								const regions = yield findAddressInCache.call(idObj, subject, "region", null, null, 100);
								// Получаем данные региона
								region = findSubject(subject, regions);
								// Продолжаем дальше
								if($.isset(region)) continue;
							}
							// Если район не найден
							if(!$.isset(district)){
								// Получаем идентификатор родителя
								const parentId = ($.isset(region) ? region._id : "*");
								// Получаем тип родителя
								const parentType = ($.isset(region) ? "region" : "*");
								// Получаем данные районов
								const districts = yield findAddressInCache.call(idObj, subject, "district", parentId, parentType, 100);
								// Получаем данные района
								district = findSubject(subject, districts);
								// Продолжаем дальше
								if($.isset(district)) continue;
							}
							// Если город не найден
							if(!$.isset(city)){
								// Получаем идентификатор родителя
								let parentId = ($.isset(district) ? district._id : ($.isset(region) ? region._id : "*"));
								// Получаем тип родителя
								let parentType = ($.isset(district) ? "district" : ($.isset(region) ? "region" : "*"));
								// Определяем ключ кеша
								parentType	= ($.isset(region) ? "*"							: parentType);
								parentId	= ($.isset(region) ? parentId.substr(0, 2) + "*"	: parentId);
								// Получаем данные городов
								const cities = yield findAddressInCache.call(idObj, subject, "city", parentId, parentType, 100);
								// Получаем данные города
								city = findSubject(subject, cities);
								// Продолжаем дальше
								if($.isset(city)) continue;
							}
							// Если улица не найдена а город найден
							if(!$.isset(street) && $.isset(city)){
								// Получаем данные улиц
								const streets = yield findAddressInCache.call(idObj, subject, "street", city._id, "city", 100);
								// Получаем данные улиц
								street = findSubject(subject, streets);
								// Выходим
								if($.isset(street)) continue;
							}
							// Если дом не найден а улица найдена
							if(!$.isset(house) && $.isset(street)){
								// Получаем данные домов
								const houses = yield findAddressInCache.call(idObj, subject, 'building', street._id, "street", 100);
								// Получаем данные домов
								house = findSubject(subject, houses);
								// Выходим
								if($.isset(house)) break;
							}
						}
					}
					// Выводим результат
					resolve({country, region, district, city, street, house});
					// Сообщаем что все удачно
					return true;
				};
				// Запускаем коннект
				exec.call(idObj, getData());
			}));
		}
		/**
		 * parseAddress Метод парсинга адреса
		 * @param  {String} options.address адрес для парсинга
		 * @return {Object}                 объект ответа
		 */
		parseAddress({address}){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// [Страна, Регион, Район, Город, Улица, Дом, Квартира]
				//
				// ИЛИ
				//
				// [Индекс, Страна, Регион, Район, Город, Улица, Дом, Квартира]
				// Исправляем адрес
				address = address.toLowerCase()
				// Изменяем все записи вида (кяхта)
				.replace(/\(([А-ЯЁ]+)[^\(]*\)/ig, "$1")
				// Удаляем все символы кроме разрешенных
				.replace(/[^А-ЯЁ\,\.\-\s\d]/ig, "")
				// Изменяем расстояние до знаков препинания
				.replace(/([\.|\,])/ig, "$1 ").anyks_trim();
				// Проверяем есть ли запятые
				if(!/\,/ig.test(address)) address += ",";
				// Удаляем не существующие элементы массива
				address = address.split(",").filter(val => $.isset(val));
				// Регулярное выражение для интерпретации данных
				const reg = [{
						// Почтовый индекс
						"type":	"zip",
						"reg":	/\d{6}/i
					// Регионы
					},{
						"type":	"region",
						"reg":	new RegExp("(?:\\s|\\.|\\,|^)(авт(?:ономный|\\.)\\s+окр?(?:уг|-г)?|область|край|республика|город)|"
								+ "(?:\\s|\\.|\\,|^)(респ?|ао(?:кр?)?|обл|кр|г)(?:\\s|\\.|\\,|$)", "i")
					// Районы
					},{
						"type":	"district",
						"reg":	new RegExp("(?:\\s|\\.|\\,|^)(район|(?:автономный\\s+)?округ|улус|поселение)|(?:\\s|\\.|\\,|^)(р-н|окр|у|п)(?:\\s|\\.|\\,|$)", "i")
					// Города
					},{
						"type":	"city",
						"reg":	new RegExp("(?:\\s|\\.|\\,|^)((?:пос[её]л(?:ение|ок|ки)\\s+(?:городского\\s+типа|сельского\\s+типа|и\\(при\\)\\s+станция\\(и\\)|"
								+ "(?:при|и)\\s+станци(?:и|я)))|(?:(?:рабочий|курортный|дачный|городской)\\s+пос[её]лок)|(?:(?:поселковый|сельский|дачный\\s+поселковый)\\s+совет)|"
								+ "(?:пром(?:ышленная|\.)?\s*(?:\\s+|-)\s*зона)|(?:сельское\\s+(?:муницип(?:\\.|альное)?)?\\s*(?:образование|поселение))|(?:городской\\s+округ)|"
								+ "(?:насел[её]нный\\s+пункт)|(?:железнодорож(?:ный|ная)\\s+(?:пост|станция|разъезд|платформа|будка))|(?:почтовое\\s+отделение)|(?:жилой\\s+район)|"
								+ "(?:коллективное\\s+хозяйство)|(?:садовое\\s+неком(?:-|мерческо)е\\s+товарищество)|(?:советское\\s+хозяйство)|(?:выселки\\(ок\\))|"
								+ "ж\\/д\\s+останов\\.?\\s+\\(обгонный\\)\\s+пункт|ж\\/д\\s+(?:останов(?:\\.?|очный)|обгонный)\\s+пункт|(?:поселение|заимка|аал|кордон|"
								+ "пос[её]лок|территория|хозяйство|товарищество|зимовье|район|кишлак|поссовет|сельсовет|сомон|волость|село|местечко|аул|станица|остров|казарма|"
								+ "автодорога|квартал|починок|жилрайон|массив|деревня|слобода|станция|хутор|разъезд|колхоз|улус|погост|выселк(?:и|ок)|микрорайон|город(?:ок)?)|"
								+ "(?:п\\.г\\.т\\.|р\\.п\\.|к\\.п\\.|д\\.п\\.|н\\.п\\.|п\\.\\s+ст\\.|п\\.ст\\.|ж\\/д\\.\\s+ст\\.|ж\\/д\\s+ст\\.))|(?:\\s|\\.|\\,|^)(с\\/?с|п\\/(?:о|ст)|"
								+ "ж\\/д(?:ст|(?:\\_|\\.|-)?\s*(?:рзд|пост|оп|платф|будка))|с\\/(?:мо|п)|ст(?:-|\\.)\\s*ц?а|авто-а|кв-л|ма-в|р-?н|св?-т|за-ка|п(?:ромзона|ос-к|ст|гт|-к|к)|"
								+ "с(?:вх|мн|нт|вт|т|л|в)?|п(?:о?с)?|к(?:лх|п)?|т(?:ов|ер)|р(?:зд|п)|к(?:ор|аз)|г(?:о|п)|хз?|высел|пог|зим|мкр|нп|вл|дп|м|д|у|г)(?:\\s|\\.|\\,|$)", "i")
					// Улицы
					},{
						"type":	"street",
						"reg":	new RegExp("(?:\\s|\\.|\\,|^)(улица|площадь|переулок|гора|парк|тупик|канал|шоссе|проезд|набережная|километр|вал|бульвар|квартал|"
								+ "проспект|авеню|аллея|кольцо)|(?:\\s|\\.|\\,|^)(ул|пл|пр-?к?т?|ав|алл?|б-?р|вл|кнл|кв-л|к(?:м|л)|клц|на?б|пер|пр-зд|туп|ш|гор)(?:\\s|\\.|\\,|$)", "i")
					// Микрорайоны
					},{
						"type":	"community",
						"reg":	/(?:\\s|\\.|\\,|^)(микрорайон|жилой\s+комплекс)|(?:\s|\.|\,|^)(мкр|жкс?)(?:\s|\.|\,|$)/i
					// Квартиры
					},{
						"type":	"apartment",
						"reg":	/(?:\\s|\\.|\\,|^)(квартира|офис|комната)|(?:\s|\.|\,|^)(кв|ко?м|оф)(?:\s|\.|\,|$)/i
					// Дома
					},{
						"type":	"house",
						"reg":	/(?:\\s|\\.|\\,|^)(дом|строение|корпус)|(?:\s|\.|\,|^)(дм?|стр|ко?рп?|ст\-е)(?:\s|\.|\,|$)/i
					// Дома
					},{
						"type":	"house",
						"reg":	new RegExp("(?:(?:№\\s*)?\\d+[А-ЯЁ]*\\s*(?:\\/|-)\\s*\\d+[А-ЯЁ]*)|"
								+ "(?:(?:№\\s*)?(?:\\d+)[А-ЯЁ]*\\s*(?:к|с)?\\s*(?:\\d+)?\\s*(?:к|с)?\\s*(?:\\d+)?)$", "i")
					// Реки
					},{
						"type":	"river",
						"reg":	/(?:\\s|\\.|\\,|^)(река)|(?:^|\s)(р(?:-ка)?)(?:\s|\.|\,|$)/i
					// Страны
					},{
						"type":	"country",
						"reg":	/(?:\\s|\\.|\\,|^)(страна)|(?:\s|\.|\,|^)(стр?-?н?а?)(?:\s|\.|\,|$)/i
					}
				];
				// Карта объектов
				const mapSubjects = {
					"р":			"Река",
					"оф":			"Офис",
					"гор":			"Гора",
					"у":			"Улус",
					"кр":			"Край",
					"с":			"Село",
					"туп":			"Тупик",
					"ш":			"Шоссе",
					"смн":			"Сомон",
					"г":			"Город",
					"р-н":			"Район",
					"окр":			"Округ",
					"ав":			"Авеню",
					"ал":			"Аллея",
					"алл":			"Аллея",
					"кнл":			"Канал",
					"ул":			"Улица",
					"х":			"Хутор",
					"пог":			"Погост",
					"кор":			"Кордон",
					"за-ка":		"Заимка",
					"стр":			"Страна",
					"пр-зд":		"Проезд",
					"кл":			"Кольцо",
					"клц":			"Кольцо",
					"ма-в":			"Массив",
					"к":			"Кишлак",
					"д":			"Деревня",
					"пл":			"Площадь",
					"кв-л":			"Квартал",
					"б-р":			"Бульвар",
					"бр":			"Бульвар",
					"ком":			"Комната",
					"обл":			"Область",
					"п-к":			"Починок",
					"пос-к":		"Посёлок",
					"сл":			"Слобода",
					"ст":			"Станция",
					"ст-ца":		"Станица",
					"рзд":			"Разъезд",
					"каз":			"Казарма",
					"зим":			"Зимовье",
					"вл":			"Волость",
					"м":			"Местечко",
					"км":			"Километр",
					"кв":			"Квартира",
					"пер":			"Переулок",
					"пр":			"Проспект",
					"пр-т":			"Проспект",
					"пр-кт":		"Проспект",
					"пос":			"Поселение",
					"с/с":			"Сельсовет",
					"с-т":			"Сельсовет",
					"св-т":			"Сельсовет",
					"свт":			"Сельсовет",
					"св":			"Сельсовет",
					"хз":			"Хозяйство",
					"п":			"Поселение",
					"авто-а":		"Автодорога",
					"тер":			"Территория",
					"респ":			"Республика",
					"наб":			"Набережная",
					"нб":			"Набережная",
					"мкр":			"Микрорайон",
					"рес":			"Республика",
					"жилрайон":		"Жилой район",
					"высел":		"Выселки(ок)",
					"тов":			"Товарищество",
					"cc":			"Сельский совет",
					"жк":			"Жилой комплекс",
					"жкс":			"Жилой комплекс",
					"дп":			"Дачный посёлок",
					"р.п.":			"Рабочий посёлок",
					"рп":			"Рабочий посёлок",
					"го":			"Городской округ",
					"пс":			"Поселковый совет",
					"ао":			"Автономный округ",
					"аок":			"Автономный округ",
					"аокр":			"Автономный округ",
					"н.п.":			"Населённый пункт",
					"нп":			"Населённый пункт",
					"гп":			"Городской посёлок",
					"к.п.":			"Курортный посёлок",
					"кп":			"Курортный посёлок",
					"промзона":		"Промышленная зона",
					"с/п":			"Сельское поселение",
					"п/о":			"Почтовое отделение",
					"свх":			"Советское хозяйство",
					"п. ст.":		"Посёлок при станции",
					"п.ст.":		"Посёлок при станции",
					"пст":			"Посёлок при станции",
					"ж/д_пост":		"Железнодорожный пост",
					"ж/д_будка":	"Железнодорожная будка",
					"клх":			"Коллективное хозяйство",
					"д.п.":			"Дачный поселковый совет",
					"ж/д. ст.":		"Железнодорожная станция",
					"ж/д ст.":		"Железнодорожная станция",
					"ж/дст":		"Железнодорожная станция",
					"п.г.т.":		"Посёлок городского типа",
					"пгт":			"Посёлок городского типа",
					"ж/д_рзд":		"Железнодорожный разъезд",
					"п/ст":			"Посёлок и(при) станция(и)",
					"ж/д_платф": 	"Железнодорожная платформа",
					"с/мо":			"Сельское муницип.образование",
					"снт":			"Садовое неком-е товарищество",
					"ж/д_оп":		"ж/д останов. (обгонный) пункт"
				};
				/**
				 * getAddress Функция поиска субъектов адреса
				 * @return {Object} объект собранный из параметров субъектов адреса
				 */
				const getAddress = () => {
					// Объект с данными
					let result = false;
					// Переходим по всему массиву адресов
					address.forEach((subject, i) => {
						// Удаляем пробелы
						subject = subject.anyks_trim();
						// Переходим по всему объекту регулярных выражений
						for(let key of reg){
							// Получаем массив типов
							const types = subject.match(key.reg);
							// Если массив существует
							if($.isArray(types) && (types.length > 1)){
								// Создаем объект
								const data = {name: "", type: ""};
								// Если объект не создан то создаем его
								if(!$.isset(result)) result = {};
								// Если это дом то делаем дополнительную проверку
								if((key.type === "house")
								&& !reg[8].reg.test(subject)) continue;
								// Переходим по массиву
								types.forEach((val, i) => {
									// Если это не нулевой элемент
									if($.isset(i) && $.isset(val)){
										// Запоминаем тип адреса
										data.type = val;
										// Останавливаем поиск
										types.length = 0;
									}
								});
								// Извлекаем название
								data.name = subject.replace(new RegExp("(?:^|\\s)" + data.type, "ig"), "").replace(/[\.\,]/ig, "");
								// Переименовываем тип объекта
								data.type = ($.isset(mapSubjects[data.type]) ? mapSubjects[data.type] : data.type);
								// Исправляем название и тип
								data.name = data.name.anyks_trim().anyks_ucwords();
								data.type = data.type.anyks_trim().anyks_ucwords();
								// Если дом найден тогда присваиваем ему тип
								if(key.type === "house") data.type = "Дом";
								// Если это тип города а найден в названии первым символом цифра то выходим,
								// так как название города не может начинаться с цифры
								if(/^\d/.test(data.name) && (key.type === "city")) continue;
								// Создаем объект
								if(!$.isset(result[key.type])
								|| (key.type === "city")){
									// Запоминаем найденный результат
									if(address.length > 1) result[key.type] = data;
									// Если это всего один элемент в списке то создаем ключ Subject
									else result.subject = data;
									// Проверяем следует ли выходить
									if(((key.type !== "region")
									&& (key.type !== "district"))
									&& $.isset(result.city)) break;
								}
							// Ищем оставшиеся элементы
							} else {
								// Создаем объект
								const data = {name: "", type: ""};
								// Определяем тип субъекта
								switch(key.type){
									// Если это почтовый индекс
									case "zip":
										// Проверяем является ли запись почтовым индексом
										let zip = subject.match(key.reg);
										// Если это массив то преобразуем его
										if($.isArray(zip) && zip.length){
											// Запоминаем название почтового индекса
											data.name = zip[0].anyks_trim().anyks_ucwords();
											// Запоминаем тип индекса
											data.type = "Почтовый индекс";
										}
									break;
									// Если это дом
									case "house":
										// Проверяем является ли запись номером жилища
										let house = subject.match(reg[8].reg);
										// Если это массив то преобразуем его
										if($.isArray(house) && house.length
										&& !$.isset(result.subject)
										&& !$.isset(result.apartment)){
											// Запоминаем название жилища
											data.name = house[0].anyks_trim().anyks_ucwords();
											// Запоминаем тип жилища
											data.type = "Дом";
										}
									break;
									// Если это страна
									case "country":
										// Если это первый элемент в массиве или второй но первым был найден почтовый индекс
										if((!$.isset(i) && !$.isset(result)) || ((i === 1)
										&& $.isset(result) && $.isset(result.zip))){
											// Проверяем является ли запись исключительно строкой
											let country = subject.match(/^[^\d]+$/i);
											// Если это массив то преобразуем его
											if($.isArray(country) && country.length){
												// Запоминаем название страны
												data.name = country[0].anyks_trim().anyks_ucwords();
												// Запоминаем тип страны
												data.type = "Страна";
											}
										}
									break;
								}
								// Если какие-то данные найдены, тогда запоминаем их
								if($.isset(data.name) && (!$.isset(result)
								|| !$.isset(result[key.type]))){
									// Если результат не существует
									if(!$.isset(result)) result = {};
									// Запоминаем найденный результат
									if(address.length > 1) result[key.type] = data;
									// Если это всего один элемент в списке то создаем ключ Subject
									else result.subject = data;
									// Выходим
									break;
								}
							}
						}
					});
					// Выводим найденный результат
					return result;
				};
				// Формируем объект результата
				const result = getAddress();
				// Строковые виды адресов
				let lightAddress = "", fullAddress = "", osmAddress = "";
				// Формируем массив найденных данных
				const arr = [], arrlight = [], arrfull = [], arrOsm = [], arrMask = [];
				// Карта элементов не входящих в простую форму адреса
				const mapLight = ["zip", "river", "district", "apartment", "community"];
				// Добавляем в массив найденные данные
				if($.isset(result.zip))			arr.push({data: result.zip, type: "zip"});
				if($.isset(result.country))		arr.push({data: result.country, type: "country"});
				if($.isset(result.region))		arr.push({data: result.region, type: "region"});
				if($.isset(result.river))		arr.push({data: result.river, type: "river"});
				if($.isset(result.district))	arr.push({data: result.district, type: "district"});
				if($.isset(result.city))		arr.push({data: result.city, type: "city"});
				if($.isset(result.community))	arr.push({data: result.community, type: "community"});
				if($.isset(result.street))		arr.push({data: result.street, type: "street"});
				if($.isset(result.house))		arr.push({data: result.house, type: "house"});
				if($.isset(result.apartment))	arr.push({data: result.apartment, type: "apartment"});
				if($.isset(result.subject))		arr.push({data: result.subject, type: "subject"});
				// Создаем адреса в строковом виде
				arr.forEach(val => {
					// Если это не запрещенный тип данных
					if(mapLight.indexOf(val.type) < 0){
						// Создаем адреса в простом виде
						arrlight.push(val.data.name);
						// Создаем адреса для OSM
						if(val.type !== "region") arrOsm.push(val.data.name);
						// Если это регион тогда добавляем полное описание
						else arrOsm.push(val.data.name + " " + val.data.type.toLowerCase());
					}
					// Создаем строку субъекта для добавления в полный адрес
					const subject = val.data.name + " " + val.data.type.toLowerCase();
					// Создаем адреса в полном виде
					if(arrfull.indexOf(subject) < 0){
						// Добавляем данные в полный адрес
						arrfull.push(subject);
						// Создаем адрес в замаскированном виде
						arrMask.push("{" + val.type + "}");
					}
				});
				// Формируем строковый вид адресов
				address			= arrMask.join(", ");
				osmAddress		= arrOsm.join(", ");
				lightAddress	= arrlight.join(", ");
				fullAddress		= arrfull.join(", ");
				// Формируем результирующий массив
				Object.assign(result, {address, osmAddress, fullAddress, lightAddress});
				// Выводим в консоль результат
				idObj.log("строка адреса интерпретирована", result).info();
				// Выводим результат
				resolve(result);
			}));
		}
		/**
		 * findCountry Метод поиска страны
		 * @param  {String}  options.str      строка запроса
		 * @param  {Number}  options.limit    количество результатов к выдаче
		 * @param  {Boolean} options.noCache  отключить кеш
		 * @return {Promise}                  промис результата
		 */
		findCountry({str, limit = 10, noCache = false}){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Ограничиваем максимальный лимит
				if(limit > 100) limit = 100;
				// Создаем переменные
				const ContentName	= str;
				const ContentType	= 'country';
				const Limit			= limit;
				// Ищем данные адреса сначала в кеше
				findAddressInCache.call(idObj, ContentName, ContentType, null, null, Limit).then(result => {
					// Если данные не найдены
					if(!$.isset(result) || noCache){
						// Формируем данные страны
						const result = [{
							"id":			"7",
							"name":			"Россия",
							"type":			"Страна",
							"typeShort":	"ст-а",
							"contentType":	"country",
							"nameFull":		"Российская Федерация",
							"nameShort":	"РФ"
						}];
						// Выполняем обработку данных
						processResultKladr.call(idObj, "Countries", null, {result}, resolve);
					// Отдаем результат из кеша
					} else resolve(result);
				// Если происходит ошибка тогда выходим
				}).catch(err => {
					// Выводим ошибку метода
					idObj.log("findAddressInCache in findCountry", err).error();
					// Выходим
					resolve(false);
				});
			}));
		}
		/**
		 * findRegion Метод поиска региона
		 * @param  {String}  options.str      строка запроса
		 * @param  {Number}  options.limit    количество результатов к выдаче
		 * @param  {Boolean} options.noCache  отключить кеш
		 * @return {Promise}                  промис результата
		 */
		findRegion({str, limit = 10, noCache = false}){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Ограничиваем максимальный лимит
				if(limit > 100) limit = 100;
				// Создаем переменные
				const ContentName	= str;
				const ContentType	= 'region';
				const WithParent	= 0;
				const Limit			= limit;
				// Ищем данные адреса сначала в кеше
				findAddressInCache.call(idObj, ContentName, ContentType, null, null, Limit).then(result => {
					// Если данные не найдены
					if(!$.isset(result) || noCache){
						// Подключаем модуль кладра
						const kladr = require("kladrapi").ApiQuery;
						// Выполняем поиск в кладре
						kladr(idObj.keyKladr, 'foontick', {
							Limit,
							WithParent,
							ContentName,
							ContentType
						}, (err, res) => {
							// Выполняем обработку данных
							processResultKladr.call(idObj, "Regions", err, res, resolve);
						});
					// Отдаем результат из кеша
					} else resolve(result);
				// Если происходит ошибка тогда выходим
				}).catch(err => {
					// Выводим ошибку метода
					idObj.log("findAddressInCache in findRegion", err).error();
					// Выходим
					resolve(false);
				});
			}));
		}
		/**
		 * findDistrict Метод поиска района
		 * @param  {String}  options.str        строка запроса
		 * @param  {String}  options.regionId   идентификатор региона
		 * @param  {Number}  options.limit      количество результатов к выдаче
		 * @param  {Boolean} options.noCache    отключить кеш
		 * @return {Promise}                    промис результата
		 */
		findDistrict({str, regionId, limit = 10, noCache = false}){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Ограничиваем максимальный лимит
				if(limit > 100) limit = 100;
				// Создаем переменные
				const ContentName	= str;
				const ContentType	= 'district';
				const ParentType	= ($.isset(regionId) ? 'region' : undefined);
				const ParentId		= ($.isset(regionId) ? regionId : undefined);
				const WithParent	= 1;
				const Limit			= limit;
				// Ищем данные адреса сначала в кеше
				findAddressInCache.call(idObj, ContentName, ContentType, ParentId, ParentType, Limit).then(result => {
					// Если данные не найдены
					if(!$.isset(result) || noCache){
						// Подключаем модуль кладра
						const kladr = require("kladrapi").ApiQuery;
						// Выполняем поиск в кладре
						kladr(idObj.keyKladr, 'foontick', {
							Limit,
							ParentId,
							ParentType,
							WithParent,
							ContentName,
							ContentType
						}, (err, res) => {
							// Выполняем обработку данных
							processResultKladr.call(idObj, "Districts", err, res, resolve);
						});
					// Отдаем результат из кеша
					} else resolve(result);
				// Если происходит ошибка тогда выходим
				}).catch(err => {
					// Выводим ошибку метода
					idObj.log("findAddressInCache in findDistrict", err).error();
					// Выходим
					resolve(false);
				});
			}));
		}
		/**
		 * findCity Метод поиска города
		 * @param  {String}  options.str        строка запроса
		 * @param  {String}  options.regionId   идентификатор региона
		 * @param  {String}  options.districtId идентификатор района
		 * @param  {Number}  options.limit      количество результатов к выдаче
		 * @param  {Boolean} options.noCache    отключить кеш
		 * @return {Promise}                    промис результата
		 */
		findCity({str, regionId, districtId, limit = 10, noCache = false}){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Ограничиваем максимальный лимит
				if(limit > 100) limit = 100;
				// Создаем переменные
				const ContentName	= str;
				const ContentType	= 'city';
				const ParentType = (
					$.isset(districtId) || $.isset(regionId) ?
					($.isset(districtId) ? 'district' : 'region') : undefined
				);
				const ParentId = (
					$.isset(districtId) || $.isset(regionId) ?
					($.isset(districtId) ? districtId : regionId) : undefined
				);
				const WithParent	= 1;
				const Limit			= limit;
				// Определяем ключ кеша
				const cacheParentType	= ($.isset(regionId) ? "*"							: ParentType);
				const cacheParentId		= ($.isset(regionId) ? regionId.substr(0, 2) + "*"	: ParentId);
				// Ищем данные адреса сначала в кеше
				findAddressInCache.call(idObj, ContentName, ContentType, cacheParentId, cacheParentType, Limit).then(result => {
					// Если данные не найдены
					if(!$.isset(result) || noCache){
						// Подключаем модуль кладра
						const kladr = require("kladrapi").ApiQuery;
						// Выполняем поиск в кладре
						kladr(idObj.keyKladr, 'foontick', {
							Limit,
							ParentId,
							ParentType,
							WithParent,
							ContentType,
							ContentName
						}, (err, res) => {
							// Выполняем обработку данных
							processResultKladr.call(idObj, "Cities", err, res, resolve);
						});
					// Отдаем результат из кеша
					} else resolve(result);
				// Если происходит ошибка тогда выходим
				}).catch(err => {
					// Выводим ошибку метода
					idObj.log("findAddressInCache in findCity", err).error();
					// Выходим
					resolve(false);
				});
			}));
		}
		/**
		 * findStreet Метод поиска улицы
		 * @param  {String} options.str        строка запроса
		 * @param  {String} options.cityId     идентификатор города
		 * @param  {Number} options.limit      количество результатов к выдаче
		 * @param  {Boolean} options.noCache   отключить кеш
		 * @return {Promise}                   промис результата
		 */
		findStreet({str, cityId, limit = 10, noCache = false}){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Ограничиваем максимальный лимит
				if(limit > 100) limit = 100;
				// Создаем переменные
				const ContentName	= str;
				const ContentType	= 'street';
				const ParentType	= 'city';
				const ParentId		= cityId;
				const WithParent	= 1;
				const Limit			= limit;
				// Ищем данные адреса сначала в кеше
				findAddressInCache.call(idObj, ContentName, ContentType, ParentId, ParentType, Limit).then(result => {
					// Если данные не найдены
					if(!$.isset(result) || noCache){
						// Подключаем модуль кладра
						const kladr = require("kladrapi").ApiQuery;
						// Выполняем поиск в кладре
						kladr(idObj.keyKladr, 'foontick', {
							Limit,
							ParentId,
							ParentType,
							WithParent,
							ContentName,
							ContentType
						}, (err, res) => {
							// Выполняем обработку данных
							processResultKladr.call(idObj, "Streets", err, res, resolve);
						});
					// Отдаем результат из кеша
					} else resolve(result);
				// Если происходит ошибка тогда выходим
				}).catch(err => {
					// Выводим ошибку метода
					idObj.log("findAddressInCache in findStreet", err).error();
					// Выходим
					resolve(false);
				});
			}));
		}
		/**
		 * findHouse Метод поиска дома
		 * @param  {String} options.str        строка запроса
		 * @param  {String} options.streetId   идентификатор улицы
		 * @param  {Number} options.limit      количество результатов к выдаче
		 * @param  {Boolean} options.noCache   отключить кеш
		 * @return {Promise}                   промис результата
		 */
		findHouse({str, streetId, limit = 10, noCache = false}){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Ограничиваем максимальный лимит
				if(limit > 100) limit = 100;
				// Создаем переменные
				const ContentName	= str;
				const ContentType	= 'building';
				const ParentType	= 'street';
				const ParentId		= streetId;
				const WithParent	= 1;
				const Limit			= limit;
				// Ищем данные адреса сначала в кеше
				findAddressInCache.call(idObj, ContentName, ContentType, ParentId, ParentType, Limit).then(result => {
					// Если данные не найдены
					if(!$.isset(result) || noCache){
						// Подключаем модуль кладра
						const kladr = require("kladrapi").ApiQuery;
						// Выполняем поиск в кладре
						kladr(idObj.keyKladr, 'foontick', {
							Limit,
							ParentId,
							ParentType,
							WithParent,
							ContentName,
							ContentType
						}, (err, res) => {
							// Выполняем обработку данных
							processResultKladr.call(idObj, "Houses", err, res, resolve);
						});
					// Отдаем результат из кеша
					} else resolve(result);
				// Если происходит ошибка тогда выходим
				}).catch(err => {
					// Выводим ошибку метода
					idObj.log("findAddressInCache in findHouse", err).error();
					// Выходим
					resolve(false);
				});
			}));
		}
		/**
		 * findMetro Метод поиска станции метро
		 * @param  {String} options.str       строка запроса
		 * @param  {String} options.cityId    идентификатор города
		 * @param  {String} options.lineId    идентификатор линии метро
		 * @param  {String} options.lineName  название линии метро
		 * @param  {String} options.lineColor цвет линии метро
		 * @param  {Number} options.limit     количество результатов к выдаче
		 * @return {Promise}                  промис результата
		 */
		findMetro({str, cityId, lineId, lineName, lineColor, limit = 10}){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Ограничиваем максимальный лимит
				if(limit > 100) limit = 100;
				// Ключа кеша метро
				const key = createMetroKey({
					name:	str,
					key:	"metro",
					cityId:	($.isset(cityId) ? cityId : "*"),
					lineId:	($.isset(lineId) ? lineId : "*")
				});
				// Ищем станции в кеше
				getRedisByMaskKey.call(idObj, key).then(result => {
					// Если данные есть в кеше
					if($.isArray(result) && result.length){
						// Станции метро
						let metro_stations = [];
						// Если название линии или цвет указаны
						if($.isset(lineName) || $.isset(lineColor)){
							// Индекс итератора
							let i = 0;
							// Перебираем все станции метро
							for(let metro of result){
								// Если метро найдено, добавляем станцию метро в список
								if(($.isset(lineName) && (metro.line === lineName))
								|| ($.isset(lineColor) && (metro.color.toLowerCase()
								=== lineColor.toLowerCase()))) metro_stations.push(metro);
								// Если итератор перешел за границы тогда выходим
								if(i < limit) i++; else break;
							}
						// Копируем просто нужное количество найденных станций
						} else metro_stations = result.splice(0, limit);
						// Выводим результат
						resolve(metro_stations);
					// Если данные в кеше не найдены
					} else {
						/**
						 * getStations Функция поиска станций метро в базе
						 * @param  {String} str    чать названия станции метро
						 * @param  {String} cityId идентификатор города
						 * @param  {String} lineId идентификатор линии
						 * @return {Promise}       промис содержащий результаты найденных станций метро
						 */
						const getStations = (str, cityId, lineId) => {
							// Создаем промис для обработки
							return (new Promise(resolve => {
								// Параметры запроса
								const query = {"name": new RegExp("^" + str, "i")};
								// Если идентификатор города передан
								if($.isset(cityId)) query.cityId = cityId;
								// Если идентификатор линии передан
								if($.isset(lineId)) query.lineId = lineId;
								// Запрашиваем все данные из базы
								idObj.schemes.Metro_stations.find(query)
								.populate('cityId')
								.populate('lineId')
								.limit(limit)
								.exec((err, data) => {
									// Выводим результат поиска по базе
									idObj.log("поиск станций метро в базе", data).info();
									// Если ошибки нет, выводим результат
									if(!$.isset(err) && $.isArray(data)) resolve(data);
									// Если данные не найдены выводим как есть
									else resolve(false);
								});
							}));
						};
						/**
						 * getStation Функция поиска линий метро в базе
						 * @param  {String} lineId    идентификатор линии
						 * @param  {String} cityId    идентификатор города
						 * @param  {String} lineName  название линии метро
						 * @param  {String} lineColor цвет линии метро
						 * @return {Promise}          промис содержащий результаты найденных линий метро
						 */
						const getLine = (lineId, cityId, lineName, lineColor) => {
							// Создаем промис для обработки
							return (new Promise(resolve => {
								// Параметры запроса
								const query = {};
								// Если идентификатор города передан
								if($.isset(cityId)) query.cityId = cityId;
								// Если идентификатор линии передан
								if($.isset(lineId)) query._id = lineId;
								// Если название линии передано
								if($.isset(lineName)) query.name = new RegExp("^" + lineName, "i");
								// Если цвет линии передан
								if($.isset(lineColor)) query.color = lineColor;
								// Запрашиваем все данные из базы
								idObj.schemes.Metro_lines.find(query).exec((err, data) => {
									// Выводим результат поиска по базе
									idObj.log("поиск линий метро в базе", data).info();
									// Если ошибки нет, выводим результат
									if(!$.isset(err) && $.isArray(data)) resolve(data);
									// Если данные не найдены выводим как есть
									else resolve(false);
								});
							}));
						};
						/**
						 * *getData Генератор для получения данных метро
						 */
						const getData = function * (){
							/**
							 * parseDataMetro Функция обработки данных метро
							 * @param  {Array} metro массив станций метро
							 */
							const parseDataMetro = metro => {
								// Массив метро
								const metro_stations = [];
								// Переходим по всем полученным станциям метро
								metro.forEach(val => {
									// Формируем объект со станцией метро
									const station = createMetroObject(val.cityId, val.lineId, val);
									// Формируем массив станций метро
									metro_stations.push(station);
									// Ключа кеша метро
									const key = createMetroKey({
										id:		val._id,
										key:	"metro",
										name:	val.name,
										cityId:	val.cityId._id,
										lineId:	val.lineId._id
									});
									// Записываем данные в кеш
									Agl.setRedis.call(idObj, "set", key, station).then();
								});
								// Выводим полученный массив метро
								resolve(metro_stations);
							};
							// Если же передано название линии или цвет линии
							if($.isset(lineName) || $.isset(lineColor)) {
								// Запрашиваем данные станции
								const lines = yield getLine(lineId, cityId, lineName, lineColor);
								// Если линии найдены
								if($.isArray(lines)){
									// Массив метро
									const metro = [];
									// Рекурсивная функция получения станций метро
									const getMetro = (i = 0) => {
										// Если не все данные загружены тогда продолжаем загрузку
										if(i < lines.length){
											// Загружаем станции метро
											getStations(str, lines[i].cityId, lines[i]._id)
											.then(data => {
												// Если данные существуют
												if($.isArray(data)) metro.push(data[0]);
												// Продолжаем дальше
												getMetro(i + 1);
											}).catch(() => getMetro(i + 1));
										// Обрабатываем полученные данные
										} else parseDataMetro(metro);
									};
									// Выполняем загрузку станций метро
									getMetro();
								// Сообщаем что станции метро не найдены
								} else resolve(false);
							// Если идентификатор города или идентификатор линии найден
							} else {
								// Запрашиваем данные станции метро
								const metro = yield getStations(str, cityId, lineId);
								// Формируем массив метро
								if($.isArray(metro)) parseDataMetro(metro);
								// Сообщаем что станции метро не найдены
								else resolve(false);
							}
							// Сообщаем что все удачно
							return true;
						};
						// Запускаем коннект
						exec.call(idObj, getData());
					}
				// Если происходит ошибка тогда выходим
				}).catch(err => {
					// Выводим ошибку метода
					idObj.log("getRedisByMaskKey in findMetro", err).error();
					// Выходим
					resolve(false);
				});
			}));
		}
		/**
		 * findNearStationsMetroByIds Метод поиска ближайших станций метро к каждому из метро
		 * @param  {Array}   options.ids      массив идентификаторов станций метро
		 * @param  {Number}  options.distance дистанция поиска в метрах
		 * @return {Promise}                  промис результата
		 */
		findNearStationsMetroByIds({ids, distance = 5000}){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				/**
				 * *getData Генератор для получения данных метро
				 */
				const getData = function * (){
					// Массив с данными метро
					const metro_stations = [];
					// Перебираем все станции метро
					for(let id of ids){
						// Запрашиваем данные метро
						const metro = yield idObj.findMetroById({id});
						// Получаем ближайшие станции метро
						const stations = yield idObj.getMetroByGPS({
							lat:		metro.lat,
							lng:		metro.lng,
							distance:	distance
						});
						// Список ближайших станций метро
						const newStations = [];
						// Переходим по всем станциям место
						for(let station of stations){
							// Запрашиваем данные метро
							const metro = yield idObj.findMetroById({id: station._id});
							// Добавляем станцию в список
							newStations.push(metro);
						}
						// Добавляем в массив данные метро
						metro_stations.push({
							metro,
							near: newStations.filter(val => val.id !== metro.id)
						});
					}
					// Выводим результат
					resolve(metro_stations);
					// Сообщаем что все удачно
					return true;
				};
				// Запускаем коннект
				exec.call(idObj, getData());
			}));
		}
		/**
		 * findMetroById Метод поиска станции метро по Id
		 * @param  {String} options.id  идентификатор станции метро
		 * @return {Promise}            промис результата
		 */
		findMetroById({id}){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Ключа кеша метро
				const key = createMetroKey({
					id,
					key:	"metro",
					cityId:	"*",
					lineId:	"*"
				});
				// Ищем станции в кеше
				getRedisByMaskKey.call(idObj, key).then(result => {
					// Если данные есть в кеше
					if($.isArray(result) && result.length) resolve(result[0]);
					// Если в кеше данные метро не найдены
					else {
						// Запрашиваем все данные из базы
						idObj.schemes.Metro_stations.findOne({_id: id})
						.populate('cityId')
						.populate('lineId')
						.exec((err, data) => {
							// Выводим результат поиска по базе
							idObj.log("поиск станций метро в базе", data).info();
							// Если ошибки нет, выводим результат
							if(!$.isset(err) && $.isset(data)){
								// Формируем объект со станцией метро
								const station = createMetroObject(data.cityId, data.lineId, data);
								// Ключа кеша метро
								const key = createMetroKey({
									id:		data._id,
									key:	"metro",
									name:	data.name,
									cityId:	data.cityId._id,
									lineId:	data.lineId._id
								});
								// Записываем данные в кеш
								Agl.setRedis.call(idObj, "set", key, station).then();
								// Выводим результат
								resolve(station);
							// Если данные не найдены выводим как есть
							} else resolve(false);
						});
					}
				// Если происходит ошибка тогда выходим
				}).catch(err => {
					// Выводим ошибку метода
					idObj.log("getRedisByMaskKey in findMetroById", err).error();
					// Выходим
					resolve(false);
				});
			}));
		}
		/**
		 * findMetroByStreetId Метод поиска станций метро по Id улицы
		 * @param  {String} options.id  идентификатор улицы
		 * @return {Promise}            промис результата
		 */
		findMetroByStreetId({id}){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				/**
				 * *getData Генератор для получения данных метро
				 */
				const getData = function * (){
					// Получаем данные улицы
					const street = yield idObj.getStreetById({id});
					// Если улицы найдена и в ней есть станции метро
					if($.isset(street) && $.isArray(street.metro) && street.metro.length){
						// Массив с данными метро
						const metro_stations = [];
						// Перебираем все станции метро
						for(let id of street.metro){
							// Запрашиваем данные метро
							const metro = yield idObj.findMetroById({id});
							// Если метро найдено то добавляем его в массив
							if($.isset(metro)) metro_stations.push(metro);
						}
						// Выводим результат
						resolve(metro_stations);
					// Сообщаем что такие данные не найдены
					} else resolve(false);
					// Сообщаем что все удачно
					return true;
				};
				// Запускаем коннект
				exec.call(idObj, getData());
			}));
		}
		/**
		 * findMetroByHouseId Метод поиска станций метро по Id дома
		 * @param  {String} options.id  идентификатор дома
		 * @return {Promise}            промис результата
		 */
		findMetroByHouseId({id}){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				/**
				 * *getData Генератор для получения данных метро
				 */
				const getData = function * (){
					// Получаем данные улицы
					const house = yield idObj.getHouseById({id});
					// Если дом найден и рядом есть станции метро
					if($.isset(house) && $.isArray(house.metro) && house.metro.length){
						// Массив с данными метро
						const metro_stations = [];
						// Перебираем все станции метро
						for(let id of house.metro){
							// Запрашиваем данные метро
							const metro = yield idObj.findMetroById({id});
							// Если метро найдено то добавляем его в массив
							if($.isset(metro)) metro_stations.push(metro);
						}
						// Выводим результат
						resolve(metro_stations);
					// Сообщаем что такие данные не найдены
					} else resolve(false);
					// Сообщаем что все удачно
					return true;
				};
				// Запускаем коннект
				exec.call(idObj, getData());
			}));
		}
		/**
		 * findAddress Метод поиска данных по строковым данным адреса
		 * @param  {String} options.address адрес для поиска
		 * @return {Promise}                промис содержащий результат поиска
		 */
		findAddress({address}){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Ключ кеша адреса
				const key = "address:" + idObj.generateKey(address);
				// Ищем данные в кеше
				Agl.getRedis.call(idObj, "get", key, 3600).then(({err, cache}) => {
					// Если данные в кеше сть тогда выводим их
					if($.isset(cache)) resolve(JSON.parse(cache));
					// Если данные в кеше не найдены тогда продолжаем искать
					else {
						// Выполняем интерпретацию данных
						idObj.parseAddress({address}).then(address => {
							// Если адрес интерпретирован удачно
							if($.isset(address)){
								/**
								 * findSubject Функция запроса данных из базы
								 * @param  {Object} func   функция выполняющая поиск
								 * @param  {Object} query  объект с параметрами запроса
								 * @return {Promise}       промис с результатами поиска
								 */
								const findSubject = (func, query) => {
									// Устанавливаем лимит записей в 1 штуку
									query.limit = 10;
									// Выполняем поиск данных
									return idObj[func](query);
								};
								/**
								 * findSubjectByType Функция поиска субъекта по его типу
								 * @param  {Array}  subjects массив объектов субъектов для поиска
								 * @param  {String} type     тип субъекта который нужно найти
								 * @return {Object}          найденный объект субъекта
								 */
								const findSubjectByType = (subjects, type) => {
									// Если тип не передан тогда выводим нулевой элемент
									if(!$.isset(type)) return subjects[0];
									// Если тип передан тогда ищем указанный тип
									else {
										// Регулярное выражение для удаления ненужных символов
										const regBroken = /[^А-ЯЁ\-]/ig;
										// Регулярное выражение для поиска типа
										const regType = new RegExp(type.replace(regBroken, ""), "i");
										// Переходим по всему массиву
										for(let subject of subjects){
											// Если тип найден тогда выходим
											if(regType.test(subject.type.replace(regBroken, ""))) return subject;
										}
										// Сообщаем что ничего не найдено
										return subjects[0];
									}
								};
								/**
								 * *getData Генератор для получения данных адреса
								 */
								const getData = function * (){
									// Формируем параметры запроса
									let str, type, country = false, region = false,
									district = false, city = false,
									street = false, house = false;
									// Если страна найдена
									if($.isset(address.country)){
										// Присваиваем параметр поиска
										str = address.country.name;
										// Запрашиваем данные страны
										country = yield findSubject("findCountry", {str});
										// Если страна существует тогда изменяем ее
										if($.isArray(country) && country.length) country = findSubjectByType(country);
									}
									// Если регион найден
									if($.isset(address.region)){
										// Присваиваем параметр поиска
										str		= address.region.name;
										type	= address.region.type;
										// Запрашиваем данные региона
										region = yield findSubject("findRegion", {str});
										// Если регион существует тогда изменяем его
										if($.isArray(region) && region.length) region = findSubjectByType(region, type);
									}
									// Если район найден
									if($.isset(address.district)){
										// Присваиваем параметр поиска
										str		= address.district.name;
										type	= address.district.type;
										// Получаем идентификатор региона
										const regionId = ($.isset(region) ? region._id : undefined);
										// Запрашиваем данные района
										district = yield findSubject("findDistrict", {str, regionId});
										// Если район существует тогда изменяем его
										if($.isArray(district) && district.length) district = findSubjectByType(district, type);
									}
									// Если город найден
									if($.isset(address.city)){
										// Присваиваем параметр поиска
										str		= address.city.name;
										type	= address.city.type;
										// Получаем идентификатор региона
										const regionId = ($.isset(region) ? region._id : undefined);
										// Получаем идентификатор района
										const districtId = ($.isset(district) ? district._id : undefined);
										// Запрашиваем данные города
										city = yield findSubject("findCity", {str, regionId, districtId});
										// Если город существует тогда изменяем его
										if($.isArray(city) && city.length) city = findSubjectByType(city, type);
									}
									// Если улица найдена
									if($.isset(address.street) && $.isset(city)){
										// Присваиваем параметр поиска
										str		= address.street.name;
										type	= address.street.type;
										// Получаем идентификатор города
										const cityId = city._id;
										// Запрашиваем данные улицы
										street = yield findSubject("findStreet", {str, cityId});
										// Если улица существует тогда изменяем её
										if($.isArray(street) && street.length) street = findSubjectByType(street, type);
									}
									// Если дом найден
									if($.isset(address.house) && $.isset(street)){
										// Присваиваем параметр поиска
										str = address.house.name;
										// Получаем идентификатор улицы
										const streetId = street._id;
										// Запрашиваем данные дома
										house = yield findSubject("findHouse", {str, streetId});
										// Если дом существует тогда изменяем его
										if($.isArray(house) && house.length) house = findSubjectByType(house);
									}
									// Формируем объект с результатами поиска
									const result = {country, region, district, city, street, house};
									// Отправляем в Redis на час
									Agl.setRedis.call(idObj, "set", key, result, 3600).then();
									// Формируем объект для генерации ключа
									const obj = ($.isset(house) ? house : ($.isset(street) ? street :
									($.isset(city) ? city : ($.isset(district) ? district :
									($.isset(region) ? region : ($.isset(country) ? country : false))))));
									// Если объект существует тогда генерируем ключ
									if($.isset(obj)){
										// Генерируем ключ
										const key = getKeyRedisForSubject(obj);
										// Записываем данные в кеш
										Agl.setRedis.call(idObj, "set", key, obj).then();
									}
									// Выводим результат
									resolve(result);
									// Сообщаем что все удачно
									return true;
								};
								// Запускаем коннект
								exec.call(idObj, getData());
							// Сообщаем что ничего не найдено
							} else resolve(false);
						// Если происходит ошибка тогда выходим
						}).catch(err => {
							// Выводим ошибку метода
							idObj.log("parseAddress in findAddress", err).error();
							// Выходим
							resolve(false);
						});
					}
				// Если происходит ошибка тогда выходим
				}).catch(err => {
					// Выводим ошибку метода
					idObj.log("getRedis in findAddress", err).error();
					// Выходим
					resolve(false);
				});
			}));
		}
		/**
		 * hintCountries Метод вывода подсказок для стран
		 * @param  {String} options.str подстрока поиска
		 * @return {Promise}            промис содержащий список подсказок
		 */
		hintCountries({str}){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Выполняем поиск подсказок в кеше
				findAddressInCache.call(idObj, str, "country", null, null, 100)
				// Выводим результат а если произошла ошибка то сообщаем об этом
				.then(resolve).catch(err => {
					// Выводим ошибку метода
					idObj.log("findAddressInCache in hintCountries", err).error();
					// Выходим
					resolve(false);
				});
			}));
		}
		/**
		 * hintRegions Метод вывода подсказок для регионов
		 * @param  {String} options.str подстрока поиска
		 * @return {Promise}            промис содержащий список подсказок
		 */
		hintRegions({str}){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Выполняем поиск подсказок в кеше
				findAddressInCache.call(idObj, str, "region", null, null, 100)
				// Выводим результат а если произошла ошибка то сообщаем об этом
				.then(resolve).catch(err => {
					// Выводим ошибку метода
					idObj.log("findAddressInCache in hintRegions", err).error();
					// Выходим
					resolve(false);
				});
			}));
		}
		/**
		 * hintDistricts Метод вывода подсказок для районов
		 * @param  {String} options.str подстрока поиска
		 * @return {Promise}            промис содержащий список подсказок
		 */
		hintDistricts({str, regionId}){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Если идентификатор региона не передан то создаем маску
				if(!$.isset(regionId)) regionId = "*";
				// Выполняем поиск подсказок в кеше
				findAddressInCache.call(idObj, str, "district", regionId, "region", 100)
				// Выводим результат а если произошла ошибка то сообщаем об этом
				.then(resolve).catch(err => {
					// Выводим ошибку метода
					idObj.log("findAddressInCache in hintDistricts", err).error();
					// Выходим
					resolve(false);
				});
			}));
		}
		/**
		 * hintCities Метод вывода подсказок для городов
		 * @param  {String} options.str подстрока поиска
		 * @return {Promise}            промис содержащий список подсказок
		 */
		hintCities({str, regionId, districtId}){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Определяем идентификатор
				const type	= ($.isset(regionId) ? "*"							: ($.isset(districtId) ? "district" : "*"));
				const id	= ($.isset(regionId) ? regionId.substr(0, 2) + "*"	: ($.isset(districtId) ? districtId : "*"));
				// Выполняем поиск подсказок в кеше
				findAddressInCache.call(idObj, str, "city", id , type, 100)
				// Выводим результат а если произошла ошибка то сообщаем об этом
				.then(resolve).catch(err => {
					// Выводим ошибку метода
					idObj.log("findAddressInCache in hintCities", err).error();
					// Выходим
					resolve(false);
				});
			}));
		}
		/**
		 * hintStreets Метод вывода подсказок для улиц
		 * @param  {String} options.str подстрока поиска
		 * @return {Promise}            промис содержащий список подсказок
		 */
		hintStreets({str, cityId}){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Если идентификатор улицы не передан то создаем маску
				if(!$.isset(cityId)) cityId = "*";
				// Выполняем поиск подсказок в кеше
				findAddressInCache.call(idObj, str, "street", cityId , "city", 100)
				// Выводим результат а если произошла ошибка то сообщаем об этом
				.then(resolve).catch(err => {
					// Выводим ошибку метода
					idObj.log("findAddressInCache in hintStreets", err).error();
					// Выходим
					resolve(false);
				});
			}));
		}
		/**
		 * hintHouses Метод вывода подсказок для домов
		 * @param  {String} options.str подстрока поиска
		 * @return {Promise}            промис содержащий список подсказок
		 */
		hintHouses({str, streetId}){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Если идентификатор дома не передан то создаем маску
				if(!$.isset(streetId)) streetId = "*";
				// Выполняем поиск подсказок в кеше
				findAddressInCache.call(idObj, str, "building", streetId , "street", 100)
				// Выводим результат а если произошла ошибка то сообщаем об этом
				.then(resolve).catch(err => {
					// Выводим ошибку метода
					idObj.log("findAddressInCache in hintHouses", err).error();
					// Выходим
					resolve(false);
				});
			}));
		}
		/**
		 * hintMetro Метод вывода подсказок для метро
		 * @param  {String} options.str подстрока поиска
		 * @return {Promise}            промис содержащий список подсказок
		 */
		hintMetro({str, streetId, houseId}){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				/**
				 * *getData Генератор для получения данных адресов
				 */
				const getData = function * (){
					// Запрашиваем данные улицы
					const street = ($.isset(streetId) ? yield idObj.getStreetById({id: streetId}) : false);
					// Запрашиваем данные дома
					const house = ($.isset(houseId) ? yield idObj.getHouseById({id: houseId}) : false);
					// Определяем субъект
					const subject = ($.isset(street) ? street : ($.isset(house) ? house : false));
					// Получаем станции метро
					if($.isArray(subject.metro) && subject.metro.length){
						// Массив метро
						let metro_stations = [];
						// Переходим по всем станциям метро
						for(let i = 0; i < subject.metro.length; i++){
							// Загружаем станцию метро
							let metro = yield idObj.findMetroById({id: subject.metro[i]});
							// Создаем регулярное выражение для поиска
							let reg = new RegExp("^" + str, "i");
							// Добавляем станцию в список
							if(reg.test(metro.name)) metro_stations.push(metro);
						}
						// Выводим результат
						resolve(metro_stations);
					// Сообщаем что ничего не найдено
					} else resolve([]);
					// Сообщаем что все удачно
					return true;
				};
				// Запускаем коннект
				exec.call(idObj, getData());
			}));
		}
		/**
		 * getAddressByGPS Метод получения данных адреса по GPS координатам
		 * @param  {Float}   options.lat    широта
		 * @param  {Float}   options.lng    долгота
		 * @return {Promise}                промис содержащий объект с адресом
		 */
		getAddressByGPS({lat, lng}){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Ключ кеша адреса
				const key = "address:gps:" + idObj.generateKey(lat + ":" + lng);
				// Ищем станции в кеше
				Agl.getRedis.call(idObj, "get", key, 3600).then(({err, cache}) => {
					// Если данные это не массив тогда создаем его
					if($.isset(cache)) resolve(JSON.parse(cache));
					// Если данные в кеше не найдены тогда продолжаем искать
					else {
						/**
						 * getDataFromGeocoder Функция запроса данных с геокодера
						 */
						const getDataFromGeocoder = () => {
							// Подключаем модуль закачки данных
							const fetch = require('node-fetch');
							// Массив с геокодерами
							const urlsGeo = [
								'https://geocode-maps.yandex.ru/1.x/?format=json&geocode=$lat,$lng&sco=latlong&lang=ru_RU&results=1',
								'http://maps.googleapis.com/maps/api/geocode/json?address=$lat,$lng&sensor=false&language=ru',
								'http://nominatim.openstreetmap.org/reverse?format=json&lat=$lat&lon=$lng&addressdetails=1&zoom=18',
								'https://api.pickpoint.io/v1/forward?key=$keyPickPoint&format=json&lat=$lat&lon=$lng&limit=1&zoom=18'
							].map(val => val.replace("$lat", lat).replace("$lng", lng).replace("$keyPickPoint", idObj.keyPickPoint));
							// Получаем объект запроса с геокодера
							const init = obj => {
								// Выполняем обработку результата геокодера
								parseAnswerGeoCoder.call(idObj, obj).then(result => {
									// Выводим сообщение об удачном приведении типов
									idObj.log("приведение типов выполнено", result).info();
									// Если данные найдены
									if($.isset(result)){
										// Сохраняем результат в базу данных
										(new idObj.schemes.Address(result)).save(() => {
											// Отправляем в Redis на час
											Agl.setRedis.call(idObj, "set", key, result, 3600)
											// Выводим результат
											.then(() => resolve(result)).catch(() => resolve(result));
										});
									// Выводим результат
									} else resolve(result);
								// Если происходит ошибка тогда выходим
								}).catch(err => {
									// Выводим ошибку метода
									idObj.log("parseAnswerGeoCoder in getAddressByGPS", err).error();
									// Выходим
									resolve(false);
								});
							};
							/**
							 * *getData Генератор для получения данных с геокодеров
							 */
							const getData = function * (){
								// Выводим сообщение что выполняем запрос с геокодера
								idObj.log("выполняем запрос с геокодера,", "lat =", lat + ",", "lng =", lng).info();
								// Выполняем запрос с геокодера Yandex
								let yandex = yield fetch(urlsGeo[0]).then(
									res => (res.status === 200 ? res.json() : false),
									err => idObj.log('получения данных с yandex api', err).error()
								);
								// Выполняем запрос с геокодера Google
								let google = (!yandex ? yield fetch(urlsGeo[1]).then(
									res => (res.status === 200 ? res.json() : false),
									err => idObj.log('получения данных с google api', err).error()
								) : false);
								// Если лимит запросов у гугла исчерпан тогда запоминаем это
								if($.isset(google) && (google.status === "OVER_QUERY_LIMIT")) google = false;
								// Выполняем запрос с геокодера OpenStreet Maps
								let osm = (!google && !yandex ? yield fetch(urlsGeo[2]).then(
									res => (res.status === 200 ? res.json() : false),
									err => idObj.log('получения данных с osm api', err).error()
								) : false);
								// Выполняем запрос на альтернативный адрес OpenStreet Maps
								let pkpt = (!google && !yandex && !osm ? yield fetch(urlsGeo[3]).then(
									res => (res.status === 200 ? res.json() : false),
									err => idObj.log('получения данных с osm2 api', err).error()
								) : false);
								// Создаем объект ответа
								const obj = (
									yandex ? {data: yandex, status: "yandex"} :
									(google ? {data: google, status: "google"} :
									(osm ? {data: osm, status: "osm"} :
									(pkpt ? {data: pkpt, status: "osm"} : false)))
								);
								// Выводим сообщение отработки геокодеров
								idObj.log(
									"обработка геокодеров:",
									"yandex =", (yandex ? "Ok" : "Not") + ",",
									"google =", (google ? "Ok" : "Not") + ",",
									"osm =", (osm || pkpt ? "Ok" : "Not")
								).info();
								// Выполняем инициализацию
								init(obj);
								// Сообщаем что все удачно
								return true;
							};
							// Запускаем коннект
							exec.call(idObj, getData());
						};
						// Запрашиваем все данные из базы
						idObj.schemes.Address.findOne({
							'gps': {
								$near: {
									$geometry: {
										type: 'Point',
										// Широта и долгота поиска
										coordinates: [lng, lat]
									},
									$maxDistance: 25
								}
							}
						// Выполняем запрос
						}).exec((err, data) => {
							// Если ошибки нет, выводим результат
							if(!$.isset(err) && $.isset(data)
							&& $.isObject(data)) resolve(data);
							// Продолжаем дальше если данные не найдены
							else getDataFromGeocoder();
						});
					}
				// Если происходит ошибка тогда выходим
				}).catch(err => {
					// Выводим ошибку метода
					idObj.log("getRedis in getAddressByGPS", err).error();
					// Выходим
					resolve(false);
				});
			}));
		}
		/**
		 * getAddressByString Метод получения данных адреса по строке
		 * @param  {String}   options.address строка запроса
		 * @return {Promise}                  промис содержащий объект с адресом
		 */
		getAddressByString({address}){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Преобразуем адрес
				address = address.toLowerCase().anyks_trim();
				// Ключ кеша адреса
				const key = "address:string:" + idObj.generateKey(address);
				// Ищем станции в кеше
				Agl.getRedis.call(idObj, "get", key, 3600).then(({err, cache}) => {
					// Если данные это не массив тогда создаем его
					if($.isset(cache)) resolve(JSON.parse(cache));
					// Если данные в кеше не найдены тогда продолжаем искать
					else {
						/**
						 * getDataFromGeocoder Функция запроса данных с геокодера
						 */
						const getDataFromGeocoder = (address, osmAddress) => {
							// Подключаем модуль закачки данных
							const fetch = require('node-fetch');
							// Массив с геокодерами
							const urlsGeo = [
								'http://geocode-maps.yandex.ru/1.x/?format=json&geocode=$address&lang=ru_RU&results=1',
								'http://maps.googleapis.com/maps/api/geocode/json?address=$address&sensor=false&language=ru',
								'http://nominatim.openstreetmap.org/search?q=$address&format=json&addressdetails=1&limit=1',
								'https://api.pickpoint.io/v1/forward?key=$keyPickPoint&q=$address&format=json&addressdetails=1&limit=1'
							].map(val => val.replace("$address", encodeURI(address)).replace("$keyPickPoint", idObj.keyPickPoint));
							// Заменяем адрес OSM если он существует
							if($.isset(osmAddress)){
								urlsGeo[2] = urlsGeo[2].replace(encodeURI(address), encodeURI(osmAddress));
								urlsGeo[3] = urlsGeo[3].replace(encodeURI(address), encodeURI(osmAddress));
							}
							// Получаем объект запроса с геокодера
							const init = obj => {
								// Выполняем обработку результата геокодера
								parseAnswerGeoCoder.call(idObj, obj).then(result => {
									// Выводим сообщение об удачном приведении типов
									idObj.log("приведение типов выполнено", result).info();
									// Если данные найдены
									if($.isset(result)){
										// Присваиваем ключ запроса
										result.key = idObj.generateKey(address);
										// Сохраняем результат в базу данных
										(new idObj.schemes.Address(result)).save(() => {
											// Удаляем ключ из объекта
											result.key = undefined;
											// Отправляем в Redis на час
											Agl.setRedis.call(idObj, "set", key, result, 3600)
											// Выводим результат
											.then(() => resolve(result)).catch(() => resolve(result));
										});
									// Выводим результат
									} else resolve(result);
								// Если происходит ошибка тогда выходим
								}).catch(err => {
									// Выводим ошибку метода
									idObj.log("parseAnswerGeoCoder in getAddressByString", err).error();
									// Выходим
									resolve(false);
								});
							};
							/**
							 * *getData Генератор для получения данных с геокодеров
							 */
							const getData = function * (){
								// Выводим сообщение что выполняем запрос с геокодера
								idObj.log("выполняем запрос с геокодера,", "address =", address).info();
								// Выполняем запрос с геокодера Yandex
								let yandex = yield fetch(urlsGeo[0]).then(
									res => (res.status === 200 ? res.json() : false),
									err => idObj.log('получения данных с yandex api', err).error()
								);
								// Выполняем запрос с геокодера Google
								let google = (!yandex ? yield fetch(urlsGeo[1]).then(
									res => (res.status === 200 ? res.json() : false),
									err => idObj.log('получения данных с google api', err).error()
								) : false);
								// Если лимит запросов у гугла исчерпан тогда запоминаем это
								if($.isset(google) && (google.status === "OVER_QUERY_LIMIT")) google = false;
								// Выполняем запрос с геокодера OpenStreet Maps
								let osm = (!google && !yandex ? yield fetch(urlsGeo[2]).then(
									res => (res.status === 200 ? res.json() : false),
									err => idObj.log('получения данных с osm api', err).error()
								) : false);
								// Выполняем запрос на альтернативный адрес OpenStreet Maps
								let pkpt = (!google && !yandex && !osm ? yield fetch(urlsGeo[3]).then(
									res => (res.status === 200 ? res.json() : false),
									err => idObj.log('получения данных с osm2 api', err).error()
								) : false);
								// Создаем объект ответа
								const obj = (
									yandex ? {data: yandex, status: "yandex"} :
									(google ? {data: google, status: "google"} :
									(osm ? {data: osm, status: "osm"} :
									(pkpt ? {data: pkpt, status: "osm"} : false)))
								);
								// Выводим сообщение отработки геокодеров
								idObj.log(
									"обработка геокодеров:",
									"yandex =", (yandex ? "Ok" : "Not") + ",",
									"google =", (google ? "Ok" : "Not") + ",",
									"osm =", (osm || pkpt ? "Ok" : "Not")
								).info();
								// Выполняем инициализацию
								init(obj);
								// Сообщаем что все удачно
								return true;
							};
							// Запускаем коннект
							exec.call(idObj, getData());
						};
						// Запрашиваем все данные из базы
						idObj.schemes.Address.findOne({key: idObj.generateKey(address)}).exec((err, data) => {
							// Выводим результат поиска по базе
							idObj.log("поиск адреса в базе", data).info();
							// Если ошибки нет, выводим результат
							if(!$.isset(err) && $.isset(data)
							&& $.isObject(data)) resolve(data);
							// Продолжаем дальше если данные не найдены
							else {
								// Выполняем интерпретацию адреса
								idObj.parseAddress({address}).then(result => {
									// Если данные пришли
									if($.isObject(result)) getDataFromGeocoder(address, result.osmAddress);
									// Продолжаем дальше
									else getDataFromGeocoder(address);
								// Если происходит ошибка тогда выходим
								}).catch(err => {
									// Выводим ошибку метода
									idObj.log("parseAddress in getAddressByString", err).error();
									// Выходим
									getDataFromGeocoder(address);
								});
							}
						});
					}
				// Если происходит ошибка тогда выходим
				}).catch(err => {
					// Выводим ошибку метода
					idObj.log("getRedis in getAddressByString", err).error();
					// Выходим
					resolve(false);
				});
			}));
		}
		/**
		 * getCountries Метод получения списка стран
		 * @param  {Number}  options.page  номер страницы для запроса
		 * @param  {Number}  options.limit количество результатов к выдаче
		 * @return {Promise}               промис результата
		 */
		getCountries({page = 1, limit = 10}){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Уменьшаем значение страницы
				page -= 1;
				// Преобразуем размер лимита
				limit = Math.ceil(limit);
				// Ограничиваем максимальный лимит
				if(limit > 100) limit = 100;
				// Ключ запроса
				const key = createSubjectKey({key: "subjects", db: "country"});
				// Считываем данные из кеша
				getRedisByMaskKey.call(idObj, key).then(result => {
					// Если данные пришли, выводим результат
					if($.isArray(result) && result.length){
						// Определяем количество записей
						const count = (result.length > limit ? Math.ceil(result.length / limit) : 1);
						// Если размер массива больше указанного лимита то уменьшаем размер данных
						const data = result.splice(page * limit, limit);
						// Увеличиваем значение страницы
						page += 1;
						// Выводим результат
						resolve({page, limit, count, data});
					// Если данные не найдены, то ищем их в базе
					} else {
						// Запрашиваем все данные из базы
						idObj.schemes.Countries.find({})
						.sort({_id: 1})
						.skip(page * limit)
						.limit(limit)
						.exec((err, data) => {
							// Если ошибки нет, выводим результат
							if(!$.isset(err) && $.isArray(data)
							&& data.length){
								// Запрашиваем количество записей
								idObj.schemes.Countries.count({}, (err, len) => {
									// Определяем количество записей
									let count = (len > limit ? Math.ceil(len / limit) : ($.isset(len) ? 1 : 0));
									// Если произошла ошибка то выводим в консоль
									if($.isset(err)) idObj.log("чтение из базы данных", err).error();
									// Увеличиваем значение страницы
									page += 1;
									// Выводим результат
									resolve({page, limit, count, data});
								});
							// Сообщаем что ничего не найдено
							} else resolve(false);
						});
					}
				// Если происходит ошибка тогда выходим
				}).catch(err => {
					// Выводим ошибку метода
					idObj.log("getRedisByMaskKey in getCountries", err).error();
					// Выходим
					resolve(false);
				});
			}));
		}
		/**
		 * getRegions Метод получения списка регионов
		 * @param  {String}  options.type  тип региона (область, край, республика, автономный округ)
		 * @param  {Number}  options.page  номер страницы для запроса
		 * @param  {Number}  options.limit количество результатов к выдаче
		 * @return {Promise}               промис результата
		 */
		getRegions({type, page = 1, limit = 10}){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Уменьшаем значение страницы
				page -= 1;
				// Преобразуем размер лимита
				limit = Math.ceil(limit);
				// Ограничиваем максимальный лимит
				if(limit > 100) limit = 100;
				// Ключ запроса
				const key = createSubjectKey({key: "subjects", db: "region"});
				// Считываем данные из кеша
				getRedisByMaskKey.call(idObj, key).then(data => {
					// Если данные пришли, выводим результат
					if($.isArray(data) && data.length){
						// Результат поиска данных
						let result = [];
						// Если тип данных указан
						if($.isset(type)){
							// Переходим по всему массиву и ищем в нем тип искомого региона
							data.forEach(val => {
								// Если тип найден то добавляем его в массив
								if(val.type === type.anyks_ucwords()) result.push(val);
							});
						// Иначе просто приравниваем массив
						} else result = data;
						// Определяем количество записей
						const count = (result.length > limit ? Math.ceil(result.length / limit) : 1);
						// Если размер массива больше указанного лимита то уменьшаем размер данных
						data = result.splice(page * limit, limit);
						// Увеличиваем значение страницы
						page += 1;
						// Выводим результат
						resolve({page, limit, count, data});
					// Если данные не найдены, то ищем их в базе
					} else {
						// Формируем параметры запроса
						const query = {};
						// Если тип передан
						if($.isset(type)) query.type = type.anyks_ucwords();
						// Запрашиваем все данные из базы
						idObj.schemes.Regions.find(query)
						.sort({_id: 1})
						.skip(page * limit)
						.limit(limit)
						.exec((err, data) => {
							// Если ошибки нет, выводим результат
							if(!$.isset(err) && $.isArray(data)
							&& data.length){
								// Запрашиваем количество записей
								idObj.schemes.Regions.count(query, (err, len) => {
									// Определяем количество записей
									let count = (len > limit ? Math.ceil(len / limit) : ($.isset(len) ? 1 : 0));
									// Если произошла ошибка то выводим в консоль
									if($.isset(err)) idObj.log("чтение из базы данных", err).error();
									// Увеличиваем значение страницы
									page += 1;
									// Выводим результат
									resolve({page, limit, count, data});
								});
							// Сообщаем что ничего не найдено
							} else resolve(false);
						});
					}
				// Если происходит ошибка тогда выходим
				}).catch(err => {
					// Выводим ошибку метода
					idObj.log("getRedisByMaskKey in getRegions", err).error();
					// Выходим
					resolve(false);
				});
			}));
		}
		/**
		 * getDistricts Метод получения списка районов
		 * @param  {String}  options.regionId  идентификатор региона
		 * @param  {String}  options.type      тип района (район, округ)
		 * @param  {Number}  options.page      номер страницы для запроса
		 * @param  {Number}  options.limit     количество результатов к выдаче
		 * @return {Promise}                   промис результата
		 */
		getDistricts({regionId, type, page = 1, limit = 10}){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Уменьшаем значение страницы
				page -= 1;
				// Преобразуем размер лимита
				limit = Math.ceil(limit);
				// Ограничиваем максимальный лимит
				if(limit > 100) limit = 100;
				// Ключ запроса
				const key = createSubjectKey({
					db:			"district",
					key:		"subjects",
					parentId:	regionId,
					parentType:	($.isset(regionId) ? "region" : null)
				});
				// Считываем данные из кеша
				getRedisByMaskKey.call(idObj, key).then(data => {
					// Если данные пришли, выводим результат
					if($.isArray(data) && data.length){
						// Результат поиска данных
						let result = [];
						// Если тип данных указан
						if($.isset(type)){
							// Переходим по всему массиву и ищем в нем тип искомого региона
							data.forEach(val => {
								// Если тип найден то добавляем его в массив
								if(val.type === type.anyks_ucwords()) result.push(val);
							});
						// Иначе просто приравниваем массив
						} else result = data;
						// Определяем количество записей
						const count = (result.length > limit ? Math.ceil(result.length / limit) : 1);
						// Если размер массива больше указанного лимита то уменьшаем размер данных
						data = result.splice(page * limit, limit);
						// Увеличиваем значение страницы
						page += 1;
						// Выводим результат
						resolve({page, limit, count, data});
					// Если данные не найдены, то ищем их в базе
					} else {
						// Формируем параметры запроса
						const query = {};
						// Если регион или тип переданы
						if($.isset(type))		query.type		= type.anyks_ucwords();
						if($.isset(regionId))	query.regionId	= regionId;
						// Запрашиваем все данные из базы
						idObj.schemes.Districts.find(query)
						.sort({_id: 1})
						.skip(page * limit)
						.limit(limit)
						.exec((err, data) => {
							// Если ошибки нет, выводим результат
							if(!$.isset(err) && $.isArray(data)
							&& data.length){
								// Запрашиваем количество записей
								idObj.schemes.Districts.count(query, (err, len) => {
									// Определяем количество записей
									let count = (len > limit ? Math.ceil(len / limit) : ($.isset(len) ? 1 : 0));
									// Если произошла ошибка то выводим в консоль
									if($.isset(err)) idObj.log("чтение из базы данных", err).error();
									// Увеличиваем значение страницы
									page += 1;
									// Выводим результат
									resolve({page, limit, count, data});
								});
							// Сообщаем что ничего не найдено
							} else resolve(false);
						});
					}
				// Если происходит ошибка тогда выходим
				}).catch(err => {
					// Выводим ошибку метода
					idObj.log("getRedisByMaskKey in getDistricts", err).error();
					// Выходим
					resolve(false);
				});
			}));
		}
		/**
		 * getCities Метод получения списка городов
		 * @param  {String}  options.regionId    идентификатор региона
		 * @param  {String}  options.districtId  идентификатор района
		 * @param  {String}  options.type        тип города (деревня, село, город)
		 * @param  {Number}  options.page        номер страницы для запроса
		 * @param  {Number}  options.limit       количество результатов к выдаче
		 * @return {Promise}                     промис результата
		 */
		getCities({regionId, districtId, type, page = 1, limit = 10}){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Уменьшаем значение страницы
				page -= 1;
				// Ограничиваем максимальный лимит
				if(limit > 100) limit = 100;
				// Ключ запроса
				const key = "address:cities:" + idObj.generateKey(
					regionId + ":" +
					districtId + ":" +
					type + ":" +
					page + ":" + limit
				);
				// Считываем данные из кеша
				Agl.getRedis.call(idObj, "get", key, 3600).then(({err, cache}) => {
					// Если данные не найдены, сообщаем что в кеше ничего не найдено
					if(!$.isset(cache)){
						// Формируем параметры запроса
						const query = {};
						// Если регион или район передан
						if($.isset(type))		query.type			= type.anyks_ucwords();
						if($.isset(regionId))	query.regionId		= regionId;
						if($.isset(districtId))	query.districtId	= districtId;
						// Запрашиваем все данные из базы
						idObj.schemes.Cities.find(query)
						.sort({_id: 1})
						.skip(page * limit)
						.limit(limit)
						.exec((err, data) => {
							// Если ошибки нет, выводим результат
							if(!$.isset(err) && $.isArray(data)
							&& data.length){
								// Запрашиваем количество записей
								idObj.schemes.Cities.count(query, (err, len) => {
									// Определяем количество записей
									let count = (len > limit ? Math.ceil(len / limit) : ($.isset(len) ? 1 : 0));
									// Если произошла ошибка то выводим в консоль
									if($.isset(err)) idObj.log("чтение из базы данных", err).error();
									// Увеличиваем значение страницы
									page += 1;
									// Формируем объект
									const obj = {page, limit, count, data};
									// Отправляем в Redis на час
									Agl.setRedis.call(idObj, "set", key, obj, 3600).then();
									// Выводим результат
									resolve(obj);
								});
							// Сообщаем что ничего не найдено
							} else resolve(false);
						});
					// Если данные пришли, выводим результат
					} else resolve(JSON.parse(cache));
				// Если происходит ошибка тогда выходим
				}).catch(err => {
					// Выводим ошибку метода
					idObj.log("getRedis in getCities", err).error();
					// Выходим
					resolve(false);
				});
			}));
		}
		/**
		 * getStreets Метод получения списка улиц
		 * @param  {String}  options.cityId    идентификатор города
		 * @param  {String}  options.type      тип улицы (улица, площадь, проспект)
		 * @param  {Number}  options.page      номер страницы для запроса
		 * @param  {Number}  options.limit     количество результатов к выдаче
		 * @return {Promise}                   промис результата
		 */
		getStreets({cityId, type, page = 1, limit = 10}){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Уменьшаем значение страницы
				page -= 1;
				// Ограничиваем максимальный лимит
				if(limit > 100) limit = 100;
				// Ключ запроса
				const key = "address:streets:" + idObj.generateKey(
					cityId + ":" +
					type + ":" +
					page + ":" + limit
				);
				// Считываем данные из кеша
				Agl.getRedis.call(idObj, "get", key, 3600).then(({err, cache}) => {
					// Если данные не найдены, сообщаем что в кеше ничего не найдено
					if(!$.isset(cache)){
						// Формируем параметры запроса
						const query = {};
						// Если город передан
						if($.isset(type))	query.type		= type.anyks_ucwords();
						if($.isset(cityId))	query.cityId	= cityId;
						// Запрашиваем все данные из базы
						idObj.schemes.Streets.find(query)
						.sort({_id: 1})
						.skip(page * limit)
						.limit(limit)
						.exec((err, data) => {
							// Если ошибки нет, выводим результат
							if(!$.isset(err) && $.isArray(data)
							&& data.length){
								// Запрашиваем количество записей
								idObj.schemes.Streets.count(query, (err, len) => {
									// Определяем количество записей
									let count = (len > limit ? Math.ceil(len / limit) : ($.isset(len) ? 1 : 0));
									// Если произошла ошибка то выводим в консоль
									if($.isset(err)) idObj.log("чтение из базы данных", err).error();
									// Увеличиваем значение страницы
									page += 1;
									// Формируем объект
									const obj = {page, limit, count, data};
									// Отправляем в Redis на час
									Agl.setRedis.call(idObj, "set", key, obj, 3600).then();
									// Выводим результат
									resolve(obj);
								});
							// Сообщаем что ничего не найдено
							} else resolve(false);
						});
					// Если данные пришли, выводим результат
					} else resolve(JSON.parse(cache));
				// Если происходит ошибка тогда выходим
				}).catch(err => {
					// Выводим ошибку метода
					idObj.log("getRedis in getStreets", err).error();
					// Выходим
					resolve(false);
				});
			}));
		}
		/**
		 * getHouses Метод получения списка домов
		 * @param  {String}  options.streetId  идентификатор улицы
		 * @param  {String}  options.type      тип постройки
		 * @param  {Number}  options.page      номер страницы для запроса
		 * @param  {Number}  options.limit     количество результатов к выдаче
		 * @return {Promise}                   промис результата
		 */
		getHouses({streetId, type, page = 1, limit = 10}){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Уменьшаем значение страницы
				page -= 1;
				// Ограничиваем максимальный лимит
				if(limit > 100) limit = 100;
				// Ключ запроса
				const key = "address:houses:" + idObj.generateKey(
					streetId + ":" +
					type + ":" +
					page + ":" + limit
				);
				// Считываем данные из кеша
				Agl.getRedis.call(idObj, "get", key, 3600).then(({err, cache}) => {
					// Если данные не найдены, сообщаем что в кеше ничего не найдено
					if(!$.isset(cache)){
						// Формируем параметры запроса
						const query = {};
						// Если улица передана
						if($.isset(type))		query.type		= type.anyks_ucwords();
						if($.isset(streetId))	query.streetId	= streetId;
						// Запрашиваем все данные из базы
						idObj.schemes.Houses.find(query)
						.sort({_id: 1})
						.skip(page * limit)
						.limit(limit)
						.exec((err, data) => {
							// Если ошибки нет, выводим результат
							if(!$.isset(err) && $.isArray(data)
							&& data.length){
								// Запрашиваем количество записей
								idObj.schemes.Houses.count(query, (err, len) => {
									// Определяем количество записей
									let count = (len > limit ? Math.ceil(len / limit) : ($.isset(len) ? 1 : 0));
									// Если произошла ошибка то выводим в консоль
									if($.isset(err)) idObj.log("чтение из базы данных", err).error();
									// Увеличиваем значение страницы
									page += 1;
									// Формируем объект
									const obj = {page, limit, count, data};
									// Отправляем в Redis на час
									Agl.setRedis.call(idObj, "set", key, obj, 3600).then();
									// Выводим результат
									resolve(obj);
								});
							// Сообщаем что ничего не найдено
							} else resolve(false);
						});
					// Если данные пришли, выводим результат
					} else resolve(JSON.parse(cache));
				// Если происходит ошибка тогда выходим
				}).catch(err => {
					// Выводим ошибку метода
					idObj.log("getRedis in getHouses", err).error();
					// Выходим
					resolve(false);
				});
			}));
		}
		/**
		 * getMetro Метод получения списка метро
		 * @param  {String}  options.cityId  идентификатор города метро
		 * @param  {String}  options.lineId  идентификатор станции метро
		 * @param  {Number}  options.page    номер страницы для запроса
		 * @param  {Number}  options.limit   количество результатов к выдаче
		 * @return {Promise}                 промис результата
		 */
		getMetro({cityId, lineId, page = 1, limit = 10}){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Уменьшаем значение страницы
				page -= 1;
				// Преобразуем размер лимита
				limit = Math.ceil(limit);
				// Ограничиваем максимальный лимит
				if(limit > 100) limit = 100;
				// Ключ запроса
				const key = createMetroKey({key: "metro", cityId, lineId});
				// Считываем данные из кеша
				getRedisByMaskKey.call(idObj, key).then(result => {
					// Если данные пришли, выводим результат
					if($.isArray(result) && result.length){
						// Определяем количество записей
						const count = (result.length > limit ? Math.ceil(result.length / limit) : 1);
						// Если размер массива больше указанного лимита то уменьшаем размер данных
						const data = result.splice(page * limit, limit);
						// Увеличиваем значение страницы
						page += 1;
						// Выводим результат
						resolve({page, limit, count, data});
					// Если данные не найдены, то ищем их в базе
					} else {
						// Формируем параметры запроса
						const query = {};
						// Если идентификатор города передан
						if($.isset(cityId)) query.cityId = cityId;
						// Если станция метро передана
						if($.isset(lineId)) query.lineId = lineId;
						// Запрашиваем все данные из базы
						idObj.schemes.Metro_stations.find(query)
						.sort({_id: 1})
						.skip(page * limit)
						.limit(limit)
						.populate('cityId')
						.populate('lineId')
						.exec((err, data) => {
							// Если ошибки нет, выводим результат
							if(!$.isset(err) && $.isArray(data)
							&& data.length){
								// Запрашиваем количество записей
								idObj.schemes.Metro_stations.count(query, (err, len) => {
									// Определяем количество записей
									let count = (len > limit ? Math.ceil(len / limit) : ($.isset(len) ? 1 : 0));
									// Если произошла ошибка то выводим в консоль
									if($.isset(err)) idObj.log("чтение из базы данных", err).error();
									// Объект с данными метро
									const metro = [];
									// Формируем нужного вида объект
									data.forEach(station => {
										// Добавляем в массив наш объект метро
										metro.push(createMetroObject(station.cityId, station.lineId, station));
									});
									// Увеличиваем значение страницы
									page += 1;
									// Выводим результат
									resolve({page, limit, count, data: metro});
								});
							// Сообщаем что ничего не найдено
							} else resolve(false);
						});
					}
				// Если происходит ошибка тогда выходим
				}).catch(err => {
					// Выводим ошибку метода
					idObj.log("getRedisByMaskKey in getMetro", err).error();
					// Выходим
					resolve(false);
				});
			}));
		}
		/**
		 * getCountryById Метод поиска страны по идентификатору
		 * @param  {String} options.id идентификатор объекта
		 * @return {Promise}           результат поиска данных
		 */
		getCountryById({id}){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Ключ запроса из Redis
				const key = createSubjectKey({key: "subjects", db: "country", id});
				// Выполняем запрос данных в базе по идентификатору объекта
				getAddressById.call(idObj, "Countries", key, id)
				// Выводим результат а если произошла ошибка то сообщаем об этом
				.then(resolve).catch(err => {
					// Выводим ошибку метода
					idObj.log("getAddressById in getCountryById", err).error();
					// Выходим
					resolve(false);
				});
			}));
		}
		/**
		 * getRegionById Метод поиска региона по идентификатору
		 * @param  {String} options.id идентификатор объекта
		 * @return {Promise}           результат поиска данных
		 */
		getRegionById({id}){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Ключ запроса из Redis
				const key = createSubjectKey({key: "subjects", db: "region", id});
				// Выполняем запрос данных в базе по идентификатору объекта
				getAddressById.call(idObj, "Regions", key, id)
				// Выводим результат а если произошла ошибка то сообщаем об этом
				.then(resolve).catch(err => {
					// Выводим ошибку метода
					idObj.log("getAddressById in getRegionById", err).error();
					// Выходим
					resolve(false);
				});
			}));
		}
		/**
		 * getDistrictById Метод поиска района по идентификатору
		 * @param  {String} options.id идентификатор объекта
		 * @return {Promise}           результат поиска данных
		 */
		getDistrictById({id}){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Ключ запроса из Redis
				const key = createSubjectKey({
					id,
					db:			"district",
					key:		"subjects",
					parentId:	"*",
					parentType:	"*"
				});
				// Выполняем запрос данных в базе по идентификатору объекта
				getAddressById.call(idObj, "Districts", key, id)
				// Выводим результат а если произошла ошибка то сообщаем об этом
				.then(resolve).catch(err => {
					// Выводим ошибку метода
					idObj.log("getAddressById in getDistrictById", err).error();
					// Выходим
					resolve(false);
				});
			}));
		}
		/**
		 * getCityById Метод поиска города по идентификатору
		 * @param  {String} options.id идентификатор объекта
		 * @return {Promise}           результат поиска данных
		 */
		getCityById({id}){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Ключ запроса из Redis
				const key = createSubjectKey({
					id,
					db:			"city",
					key:		"subjects",
					parentId:	"*",
					parentType:	"*"
				});
				// Выполняем запрос данных в базе по идентификатору объекта
				getAddressById.call(idObj, "Cities", key, id)
				// Выводим результат а если произошла ошибка то сообщаем об этом
				.then(resolve).catch(err => {
					// Выводим ошибку метода
					idObj.log("getAddressById in getCityById", err).error();
					// Выходим
					resolve(false);
				});
			}));
		}
		/**
		 * getStreetById Метод поиска улицы по идентификатору
		 * @param  {String} options.id идентификатор объекта
		 * @return {Promise}           результат поиска данных
		 */
		getStreetById({id}){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Ключ запроса из Redis
				const key = createSubjectKey({
					id,
					db:			"street",
					key:		"subjects",
					parentId:	"*",
					parentType:	"*"
				});
				// Выполняем запрос данных в базе по идентификатору объекта
				getAddressById.call(idObj, "Streets", key, id)
				// Выводим результат а если произошла ошибка то сообщаем об этом
				.then(resolve).catch(err => {
					// Выводим ошибку метода
					idObj.log("getAddressById in getStreetById", err).error();
					// Выходим
					resolve(false);
				});
			}));
		}
		/**
		 * getHouseById Метод поиска дома по идентификатору
		 * @param  {String} options.id идентификатор объекта
		 * @return {Promise}           результат поиска данных
		 */
		getHouseById({id}){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Ключ запроса из Redis
				const key = createSubjectKey({
					id,
					db:			"building",
					key:		"subjects",
					parentId:	"*",
					parentType:	"*"
				});
				// Выполняем запрос данных в базе по идентификатору объекта
				getAddressById.call(idObj, "Houses", key, id)
				// Выводим результат а если произошла ошибка то сообщаем об этом
				.then(resolve).catch(err => {
					// Выводим ошибку метода
					idObj.log("getAddressById in getHouseById", err).error();
					// Выходим
					resolve(false);
				});
			}));
		}
		/**
		 * getMetroStationById Метод поиска станции метро по идентификатору
		 * @param  {String} options.id идентификатор объекта
		 * @return {Promise}           результат поиска данных
		 */
		getMetroStationById({id}){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Генерируем ключ метро
				const key = "metro:stations:" + idObj.generateKey(id);
				// Ищем станцию метро в базе
				getDataMetroById.call(idObj, "Metro_stations", key, id)
				// Выводим результат а если произошла ошибка то сообщаем об этом
				.then(resolve).catch(err => {
					// Выводим ошибку метода
					idObj.log("getDataMetroById in getMetroStationById", err).error();
					// Выходим
					resolve(false);
				});
			}));
		}
		/**
		 * getMetroLineById Метод поиска линии метро по идентификатору
		 * @param  {String} options.id идентификатор объекта
		 * @return {Promise}           результат поиска данных
		 */
		getMetroLineById({id}){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Генерируем ключ метро
				const key = "metro:lines:" + idObj.generateKey(id);
				// Ищем линию метро в базе
				getDataMetroById.call(idObj, "Metro_lines", key, id)
				// Выводим результат а если произошла ошибка то сообщаем об этом
				.then(resolve).catch(err => {
					// Выводим ошибку метода
					idObj.log("getDataMetroById in getMetroLineById", err).error();
					// Выходим
					resolve(false);
				});
			}));
		}
		/**
		 * getMetroCityById Метод поиска города метро по идентификатору
		 * @param  {String} options.id идентификатор объекта
		 * @return {Promise}           результат поиска данных
		 */
		getMetroCityById({id}){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Генерируем ключ метро
				const key = "metro:cities:" + idObj.generateKey(id);
				// Ищем город в котором есть метро в базе
				getDataMetroById.call(idObj, "Metro_cities", key, id)
				// Выводим результат а если произошла ошибка то сообщаем об этом
				.then(resolve).catch(err => {
					// Выводим ошибку метода
					idObj.log("getDataMetroById in getMetroCityById", err).error();
					// Выходим
					resolve(false);
				});
			}));
		}
		/**
		 * getTimezoneByGPS Метод получения данных временной зоны по GPS координатам
		 * @param  {Number} options.lat широта
		 * @param  {Number} options.lng долгота
		 * @return {Promise}            промис содержащий данные временной зоны
		 */
		getTimezoneByGPS({lat, lng}){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Ключ кеша метро
				const key = "timezone:" + idObj.generateKey(lat + ":" + lng);
				// Ищем станции в кеше
				Agl.getRedis.call(idObj, "get", key, 3600).then(({err, cache}) => {
					// Если данные это не массив тогда создаем его
					if($.isset(cache)) resolve(JSON.parse(cache));
					// Если данные в кеше не найдены тогда продолжаем искать
					else {
						// Подключаем модуль закачки данных
						const fetch = require('node-fetch');
						// Создаем штамп времени
						const timestamp = Math.round((new Date()).valueOf() / 1000);
						// Адрес запроса
						const url = "https://maps.googleapis.com/maps/api/timezone/json?location=$lat,$lng&language=ru&timestamp=$tm";
						/**
						 * getData Функция обработки полученных данных временной зоны
						 * @param  {Object} json объект данных временной зоны
						 */
						const getData = json => {
							// Если ответ пришел
							if(json.status === "OK"){
								// Удаляем статус
								json.status = undefined;
								// Отправляем в Redis на час
								Agl.setRedis.call(idObj, "set", key, json, 3600).then();
								// Выводим результат
								resolve(json);
							// Сообщаем что ничего не найдено
							} else resolve(false);
						};
						// Выполняем запрос данных
						fetch(url
							.replace("$lat", lat)
							.replace("$lng", lng)
							.replace("$tm", timestamp)
						// Преобразуем полученный объект
						).then(
							res => (res.status === 200 ? res.json() : false),
							err => idObj.log("get timezone", err).error()
						// Обрабатываем полученные данные
						).then(getData, err => idObj.log("parse timezone", err).error())
						// Если происходит ошибка тогда выходим
						.catch(err => {
							// Ошибка метода getTimezoneByGPS
							idObj.log("getTimezoneByGPS", err).error();
							// Сообщаем что дальше некуда
							resolve(false);
						});
					}
				// Если происходит ошибка тогда выходим
				}).catch(err => {
					// Выводим ошибку метода
					idObj.log("getRedis in getTimezoneByGPS", err).error();
					// Выходим
					resolve(false);
				});
			}));
		}
		/**
		 * getCountryByGPS Метод поиска страны по GPS координатам
		 * @param  {Number} options.lat широта
		 * @param  {Number} options.lng долгота
		 * @return {Promise}            промис содержащий найденные регионы
		 */
		getCountryByGPS({lat, lng}){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Ключ кеша
				const key = "address:country:" + idObj.generateKey(lat + ":" + lng);
				// Ищем станции в кеше
				Agl.getRedis.call(idObj, "get", key, 3600).then(({err, cache}) => {
					// Если данные это не массив тогда создаем его
					if($.isset(cache)) resolve(JSON.parse(cache));
					// Если данные в кеше не найдены тогда продолжаем искать
					else {
						/**
						 * *getData Генератор для получения данных адреса
						 */
						const getData = function * (){
							// Получаем данные по GPS координатам
							const name = yield idObj.getAddressByGPS({lat, lng});
							// Получаем страну
							let country = ($.isset(name) && $.isset(name.address)
							&& $.isset(name.address.country) ? name.address.country : "");
							// Выполняем парсинг строки адреса страны
							country = ($.isset(country) ? yield idObj.parseAddress({address: country}) : false);
							// Извлекаем название страны
							country = ($.isset(country) ? country.subject.name : false);
							// Запрашиваем данные страны с сервера
							country = ($.isset(country) ? yield idObj.findCountry({str: country, limit: 1}) : false);
							// Если это массив то извлекаем данные
							if($.isArray(country) && country.length) country = country[0];
							// Создаем объект для сохранения данных
							const obj = {country};
							// Отправляем в Redis на час
							Agl.setRedis.call(idObj, "set", key, obj, 3600).then();
							// Выводим результат
							resolve(obj);
							// Сообщаем что все удачно
							return true;
						};
						// Запускаем коннект
						exec.call(idObj, getData());
					}
				// Если происходит ошибка тогда выходим
				}).catch(err => {
					// Выводим ошибку метода
					idObj.log("getRedis in getCountryByGPS", err).error();
					// Выходим
					resolve(false);
				});
			}));
		}
		/**
		 * getRegionByGPS Метод поиска региона по GPS координатам
		 * @param  {Number} options.lat широта
		 * @param  {Number} options.lng долгота
		 * @return {Promise}            промис содержащий найденные регионы
		 */
		getRegionByGPS({lat, lng}){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Ключ кеша
				const key = "address:region:" + idObj.generateKey(lat + ":" + lng);
				// Ищем станции в кеше
				Agl.getRedis.call(idObj, "get", key, 3600).then(({err, cache}) => {
					// Если данные это не массив тогда создаем его
					if($.isset(cache)) resolve(JSON.parse(cache));
					// Если данные в кеше не найдены тогда продолжаем искать
					else {
						/**
						 * *getData Генератор для получения данных адреса
						 */
						const getData = function * (){
							// Получаем данные по GPS координатам
							const name = yield idObj.getAddressByGPS({lat, lng});
							// Получаем страну
							let country = ($.isset(name) && $.isset(name.address)
							&& $.isset(name.address.country) ? name.address.country : "");
							// Выполняем парсинг строки адреса страны
							country = ($.isset(country) ? yield idObj.parseAddress({address: country}) : false);
							// Извлекаем название страны
							country = ($.isset(country) ? country.subject.name : false);
							// Запрашиваем данные страны с сервера
							country = ($.isset(country) ? yield idObj.findCountry({str: country, limit: 1}) : false);
							// Если это массив то извлекаем данные
							if($.isArray(country) && country.length) country = country[0];
							// Получаем регион
							let region = ($.isset(name) && $.isset(name.address)
							&& $.isset(name.address.region) ? name.address.region : "");
							// Выполняем парсинг строки адреса региона
							region = ($.isset(region) ? yield idObj.parseAddress({address: region}) : false);
							// Извлекаем название региона
							region = ($.isset(region) ? region.subject.name : false);
							// Запрашиваем данные региона с сервера
							region = ($.isset(region) ? yield idObj.findRegion({str: region, limit: 1}) : false);
							// Если это массив то извлекаем данные
							if($.isArray(region) && region.length) region = region[0];
							// Создаем объект для сохранения данных
							const obj = {country, region};
							// Отправляем в Redis на час
							Agl.setRedis.call(idObj, "set", key, obj, 3600).then();
							// Выводим результат
							resolve(obj);
							// Сообщаем что все удачно
							return true;
						};
						// Запускаем коннект
						exec.call(idObj, getData());
					}
				// Если происходит ошибка тогда выходим
				}).catch(err => {
					// Выводим ошибку метода
					idObj.log("getRedis in getRegionByGPS", err).error();
					// Выходим
					resolve(false);
				});
			}));
		}
		/**
		 * getDistrictByGPS Метод поиска района по GPS координатам
		 * @param  {Number} options.lat широта
		 * @param  {Number} options.lng долгота
		 * @return {Promise}            промис содержащий найденные районы
		 */
		getDistrictByGPS({lat, lng}){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Ключ кеша
				const key = "address:district:" + idObj.generateKey(lat + ":" + lng);
				// Ищем станции в кеше
				Agl.getRedis.call(idObj, "get", key, 3600).then(({err, cache}) => {
					// Если данные это не массив тогда создаем его
					if($.isset(cache)) resolve(JSON.parse(cache));
					// Если данные в кеше не найдены тогда продолжаем искать
					else {
						/**
						 * *getData Генератор для получения данных адреса
						 */
						const getData = function * (){
							// Получаем данные по GPS координатам
							const name = yield idObj.getAddressByGPS({lat, lng});
							// Получаем страну
							let country = ($.isset(name) && $.isset(name.address)
							&& $.isset(name.address.country) ? name.address.country : "");
							// Выполняем парсинг строки адреса страны
							country = ($.isset(country) ? yield idObj.parseAddress({address: country}) : false);
							// Извлекаем название страны
							country = ($.isset(country) ? country.subject.name : false);
							// Запрашиваем данные страны с сервера
							country = ($.isset(country) ? yield idObj.findCountry({str: country, limit: 1}) : false);
							// Если это массив то извлекаем данные
							if($.isArray(country) && country.length) country = country[0];
							// Получаем регион
							let region = ($.isset(name) && $.isset(name.address)
							&& $.isset(name.address.region) ? name.address.region : "");
							// Выполняем парсинг строки адреса региона
							region = ($.isset(region) ? yield idObj.parseAddress({address: region}) : false);
							// Извлекаем название региона
							region = ($.isset(region) ? region.subject.name : false);
							// Запрашиваем данные региона с сервера
							region = ($.isset(region) ? yield idObj.findRegion({str: region, limit: 1}) : false);
							// Если это массив то извлекаем данные
							if($.isArray(region) && region.length) region = region[0];
							// Получаем район
							let district = ($.isset(name) && $.isset(name.address)
							&& $.isset(name.address.district) ? name.address.district : "");
							// Выполняем парсинг строки адреса района
							district = ($.isset(district) ? yield idObj.parseAddress({address: district}) : false);
							// Извлекаем название района
							district = ($.isset(district) ? district.subject.name : false);
							// Запрашиваем данные района с сервера
							district = ($.isset(district) && $.isset(region) ? yield idObj.findDistrict({str: district, regionId: region._id, limit: 1}) : false);
							// Если это массив то извлекаем данные
							if($.isArray(district) && district.length) district = district[0];
							// Создаем объект для сохранения данных
							const obj = {country, region, district};
							// Отправляем в Redis на час
							Agl.setRedis.call(idObj, "set", key, obj, 3600).then();
							// Выводим результат
							resolve(obj);
							// Сообщаем что все удачно
							return true;
						};
						// Запускаем коннект
						exec.call(idObj, getData());
					}
				// Если происходит ошибка тогда выходим
				}).catch(err => {
					// Выводим ошибку метода
					idObj.log("getRedis in getDistrictByGPS", err).error();
					// Выходим
					resolve(false);
				});
			}));
		}
		/**
		 * getCityByGPS Метод поиска города по GPS координатам
		 * @param  {Number} options.lat широта
		 * @param  {Number} options.lng долгота
		 * @return {Promise}            промис содержащий найденные города
		 */
		getCityByGPS({lat, lng}){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Ключ кеша
				const key = "address:city:" + idObj.generateKey(lat + ":" + lng);
				// Ищем станции в кеше
				Agl.getRedis.call(idObj, "get", key, 3600).then(({err, cache}) => {
					// Если данные это не массив тогда создаем его
					if($.isset(cache)) resolve(JSON.parse(cache));
					// Если данные в кеше не найдены тогда продолжаем искать
					else {
						/**
						 * *getData Генератор для получения данных адреса
						 */
						const getData = function * (){
							// Получаем данные по GPS координатам
							const name = yield idObj.getAddressByGPS({lat, lng});
							// Получаем страну
							let country = ($.isset(name) && $.isset(name.address)
							&& $.isset(name.address.country) ? name.address.country : "");
							// Выполняем парсинг строки адреса страны
							country = ($.isset(country) ? yield idObj.parseAddress({address: country}) : false);
							// Извлекаем название страны
							country = ($.isset(country) ? country.subject.name : false);
							// Запрашиваем данные страны с сервера
							country = ($.isset(country) ? yield idObj.findCountry({str: country, limit: 1}) : false);
							// Если это массив то извлекаем данные
							if($.isArray(country) && country.length) country = country[0];
							// Получаем регион
							let region = ($.isset(name) && $.isset(name.address)
							&& $.isset(name.address.region) ? name.address.region : "");
							// Выполняем парсинг строки адреса региона
							region = ($.isset(region) ? yield idObj.parseAddress({address: region}) : false);
							// Извлекаем название региона
							region = ($.isset(region) ? region.subject.name : false);
							// Запрашиваем данные региона с сервера
							region = ($.isset(region) ? yield idObj.findRegion({str: region, limit: 1}) : false);
							// Если это массив то извлекаем данные
							if($.isArray(region) && region.length) region = region[0];
							// Получаем город
							let city = ($.isset(name) && $.isset(name.address)
							&& $.isset(name.address.city) ? name.address.city : "");
							// Выполняем парсинг строки адреса города
							city = ($.isset(city) ? yield idObj.parseAddress({address: city}) : false);
							// Извлекаем название города
							city = ($.isset(city) ? city.subject.name : false);
							// Запрашиваем данные города с сервера
							city = ($.isset(city) && $.isset(region) ? yield idObj.findCity({str: city, regionId: region._id, limit: 1}) : false);
							// Если это массив то извлекаем данные
							if($.isArray(city) && city.length) city = city[0];
							// Создаем объект для сохранения данных
							const obj = {country, region, city};
							// Отправляем в Redis на час
							Agl.setRedis.call(idObj, "set", key, obj, 3600).then();
							// Выводим результат
							resolve(obj);
							// Сообщаем что все удачно
							return true;
						};
						// Запускаем коннект
						exec.call(idObj, getData());
					}
				// Если происходит ошибка тогда выходим
				}).catch(err => {
					// Выводим ошибку метода
					idObj.log("getRedis in getCityByGPS", err).error();
					// Выходим
					resolve(false);
				});
			}));
		}
		/**
		 * getStreetByGPS Метод поиска улицы по GPS координатам
		 * @param  {Number} options.lat широта
		 * @param  {Number} options.lng долгота
		 * @return {Promise}            промис содержащий найденные улицы
		 */
		getStreetByGPS({lat, lng}){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Ключ кеша
				const key = "address:street:" + idObj.generateKey(lat + ":" + lng);
				// Ищем станции в кеше
				Agl.getRedis.call(idObj, "get", key, 3600).then(({err, cache}) => {
					// Если данные это не массив тогда создаем его
					if($.isset(cache)) resolve(JSON.parse(cache));
					// Если данные в кеше не найдены тогда продолжаем искать
					else {
						/**
						 * *getData Генератор для получения данных адреса
						 */
						const getData = function * (){
							// Получаем данные по GPS координатам
							const name = yield idObj.getAddressByGPS({lat, lng});
							// Получаем страну
							let country = ($.isset(name) && $.isset(name.address)
							&& $.isset(name.address.country) ? name.address.country : "");
							// Выполняем парсинг строки адреса страны
							country = ($.isset(country) ? yield idObj.parseAddress({address: country}) : false);
							// Извлекаем название страны
							country = ($.isset(country) ? country.subject.name : false);
							// Запрашиваем данные страны с сервера
							country = ($.isset(country) ? yield idObj.findCountry({str: country, limit: 1}) : false);
							// Если это массив то извлекаем данные
							if($.isArray(country) && country.length) country = country[0];
							// Получаем регион
							let region = ($.isset(name) && $.isset(name.address)
							&& $.isset(name.address.region) ? name.address.region : "");
							// Выполняем парсинг строки адреса региона
							region = ($.isset(region) ? yield idObj.parseAddress({address: region}) : false);
							// Извлекаем название региона
							region = ($.isset(region) ? region.subject.name : false);
							// Запрашиваем данные региона с сервера
							region = ($.isset(region) ? yield idObj.findRegion({str: region, limit: 1}) : false);
							// Если это массив то извлекаем данные
							if($.isArray(region) && region.length) region = region[0];
							// Получаем город
							let city = ($.isset(name) && $.isset(name.address)
							&& $.isset(name.address.city) ? name.address.city : "");
							// Выполняем парсинг строки адреса города
							city = ($.isset(city) ? yield idObj.parseAddress({address: city}) : false);
							// Извлекаем название города
							city = ($.isset(city) ? city.subject.name : false);
							// Запрашиваем данные города с сервера
							city = ($.isset(city) && $.isset(region) ? yield idObj.findCity({str: city, regionId: region._id, limit: 1}) : false);
							// Если это массив то извлекаем данные
							if($.isArray(city) && city.length) city = city[0];
							// Получаем улицу
							let street = ($.isset(name) && $.isset(name.address)
							&& $.isset(name.address.street) ? name.address.street : "");
							// Выполняем парсинг строки адреса улицы
							street = ($.isset(street) ? yield idObj.parseAddress({address: street}) : false);
							// Извлекаем название улицы
							street = ($.isset(street) ? street.subject.name : false);
							// Запрашиваем данные улицы с сервера
							street = ($.isset(street) && $.isset(city) ? yield idObj.findStreet({str: street, cityId: city._id, limit: 1}) : false);
							// Если это массив то извлекаем данные
							if($.isArray(street) && street.length) street = street[0];
							// Создаем объект для сохранения данных
							const obj = {country, region, city, street};
							// Отправляем в Redis на час
							Agl.setRedis.call(idObj, "set", key, obj, 3600).then();
							// Выводим результат
							resolve(obj);
							// Сообщаем что все удачно
							return true;
						};
						// Запускаем коннект
						exec.call(idObj, getData());
					}
				// Если происходит ошибка тогда выходим
				}).catch(err => {
					// Выводим ошибку метода
					idObj.log("getRedis in getStreetByGPS", err).error();
					// Выходим
					resolve(false);
				});
			}));
		}
		/**
		 * getStreetsByGPS Метод поиска улиц по GPS координатам
		 * @param  {Number} options.lat      широта
		 * @param  {Number} options.lng      долгота
		 * @param  {Number} options.distance дистанция поиска в метрах
		 * @return {Promise}                 промис содержащий найденные улицы
		 */
		getStreetsByGPS({lat, lng, distance = 3000}){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Ключ кеша улиц
				const key = "address:streets:gps:" + idObj.generateKey(lat + ":" + lng + ":" + distance);
				// Ищем улицы
				getByGPS.call(idObj, "Streets", key, lat, lng, distance)
				// Выполняем поиск улиц
				.then(resolve).catch(err => {
					// Выводим ошибку метода
					idObj.log("getByGPS in getStreetsByGPS", err).error();
					// Выходим
					resolve(false);
				});
			}));
		}
		/**
		 * getHousesByGPS Метод поиска домов по GPS координатам
		 * @param  {Number} options.lat      широта
		 * @param  {Number} options.lng      долгота
		 * @param  {Number} options.distance дистанция поиска в метрах
		 * @return {Promise}                 промис содержащий найденные дома
		 */
		getHousesByGPS({lat, lng, distance = 3000}){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Ключ кеша домов
				const key = "address:houses:gps:" + idObj.generateKey(lat + ":" + lng + ":" + distance);
				// Ищем дома
				getByGPS.call(idObj, "Houses", key, lat, lng, distance)
				// Выполняем поиск домов
				.then(resolve).catch(err => {
					// Выводим ошибку метода
					idObj.log("getByGPS in getHousesByGPS", err).error();
					// Выходим
					resolve(false);
				});
			}));
		}
		/**
		 * getMetroByGPS Метод поиска метро по GPS координатам
		 * @param  {Number} options.lat      широта
		 * @param  {Number} options.lng      долгота
		 * @param  {Number} options.distance дистанция поиска в метрах
		 * @return {Promise}                 промис содержащий найденные станции метро
		 */
		getMetroByGPS({lat, lng, distance = 3000}){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Ключ кеша метро
				const key = "metro:gps:" + idObj.generateKey(lat + ":" + lng + ":" + distance);
				// Ищем станции в кеше
				getByGPS.call(idObj, "Metro_stations", key, lat, lng, distance)
				// Выполняем поиск домов
				.then(resolve).catch(err => {
					// Выводим ошибку метода
					idObj.log("getByGPS in getMetroByGPS", err).error();
					// Выходим
					resolve(false);
				});
			}));
		}
		/**
		 * updateTimeZones Метод обновления временных зон у тех элементов адресов у которых ранее временная зона была не найдена
		 * @param  {String}  updateKey ключ для обновления базы данных
		 * @param  {Boolean} flag      флаг для внутреннего обновления
		 * @return {Promise}           промис содержащий результат обновления временных зон
		 */
		updateTimeZones({updateKey}, flag = false){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Проверяем совпадают ли ключи
				if(flag || (idObj.generateKey(updateKey) === idObj.updateKey)){
					/**
					 * updateDB Функция обновления данных в базе
					 * @param  {Object} obj      объект для обновления данных
					 * @param  {Object} scheme   схема базы данных
					 * @param  {Function}        callback функция обратного вызова
					 */
					const updateDB = (scheme, obj, callback) => {
						/**
						 * Функция сохранения данных в кеше saveCache
						 */
						const saveCache = () => {
							// Ключ запроса
							const key = getKeyRedisForSubject(obj);
							// Сохраняем данные в кеше
							Agl.setRedis.call(idObj, "set", key, obj).then(callback).catch(callback);
						};
						// Запрашиваем все данные из базы
						scheme.findOne({_id: obj._id})
						// Выполняем запрос
						.exec((err, data) => {
							// Если ошибки нет
							if(!$.isset(err) && $.isset(data)
							&& $.isObject(data)){
								// Выполняем обновление
								scheme.update({_id: obj._id}, obj, {upsert: true}, saveCache);
							// Просто добавляем новый объект
							} else (new scheme(obj)).save(saveCache);
						});
					};
					/**
					 * getTimezone Функция запроса временной зоны
					 * @param  {Object} scheme схема базы данных
					 * @return {Promise}       промис содержащий результат ответа
					 */
					const getTimezone = scheme => {
						// Создаем промис для обработки
						return (new Promise(resolve => {
							// Запрашиваем все данные городов
							scheme.find({timezone: {$exists: false}})
							// Запрашиваем данные регионов
							.exec((err, data) => {
								// Если ошибки нет
								if(!$.isset(err) && $.isArray(data) && data.length){
									/**
									 * getData Рекурсивная функция перехода по массиву
									 * @param  {Number} i индекс текущего значения массива
									 */
									const getData = (i = 0) => {
										// Если не все данные пришли тогда продолжаем загружать
										if(i < data.length){
											// Получаем данные временной зоны
											idObj.getTimezoneByGPS({lat: data[i].lat, lng: data[i].lng}).then(timezone => {
												// Если временная зона пришла
												if(timezone){
													// Сохраняем временную зону
													data[i].timezone = timezone;;
													// Сохраняем временную зону
													updateDB(scheme, data[i], () => getData(i + 1));
												// Просто продолжаем дальше
												} else getData(i + 1);
											// Если происходит ошибка тогда выходим
											}).catch(err => {
												// Выводим ошибку метода
												idObj.log("getTimezoneByGPS in updateTimeZones", err).error();
												// Выходим
												getData(i + 1);
											});
										// Если все загружено тогда сообщаем об этом
										} else {
											// Выводим в консоль сообщение
											idObj.log("все временные зоны установлены!").info();
											// Выводим результат
											resolve(true);
										}
									};
									// Запускаем запрос данных
									getData();
								// Сообщаем что такие данные не найдены
								} else resolve(false);
							});
						}));
					};
					/**
					 * *getData Генератор для получения данных временной зоны
					 */
					const getData = function * (){
						// Выполняем запрос временной зоны для регионов
						const regions = yield getTimezone(idObj.schemes.Regions);
						// Выполняем запрос временной зоны для районов
						const districts = yield getTimezone(idObj.schemes.Districts);
						// Выполняем запрос временной зоны для городов
						const cities = yield getTimezone(idObj.schemes.Cities);
						// Выполняем запрос временной зоны для улиц
						const streets = yield getTimezone(idObj.schemes.Streets);
						// Выполняем запрос временной зоны для домов
						const houses = yield getTimezone(idObj.schemes.Houses);
						// Выводим в консоль что все данные временной зоны обновлены
						idObj.log("все временные зоны обновлены удачно!").info();
						// Сообщаем что все выполнено
						resolve(true);
						// Сообщаем что все удачно
						return true;
					};
					// Запускаем коннект
					exec.call(idObj, getData());
				// Сообщаем что ключи не совпадают
				} else resolve(false);
			}));
		}
		/**
		 * updateCountries Метод обновления данных базы стран
		 * @param  {String}  updateKey ключ для обновления базы данных
		 * @param  {Boolean} flag      флаг для внутреннего обновления
		 * @return {Promise}           промис содержащий результат обновления стран
		 */
		updateCountries({updateKey}, flag = false){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Проверяем совпадают ли ключи
				if(flag || (idObj.generateKey(updateKey) === idObj.updateKey)){
					// Массив букв для названий стран
					const countriesChar = [
						"А", "Б", "В", "Г", "Д", "E", "Ж",
						"З", "И", "К", "Л", "М", "Н", "О",
						"П", "Р", "С", "Т", "У", "Ф", "Х",
						"Ц", "Ч", "Ш", "Щ", "Э", "Ю", "Я"
					];
					// Подключаемся к коллекции стран
					const countries = idObj.clients.mongo.connection.db.collection("countries");
					// Удаляем колекцию стран
					countries.drop();
					// Создаем ключ для кеша
					const key = createSubjectKey({key: "subjects", db: "country"});
					// Удаляем данные из кеша
					Agl.rmRedis.call(idObj, key);
					/**
					 * getCountry Рекурсивная функция загрузки страны
					 * @param  {Number} i текущий индекс массива
					 */
					const getCountry = (i = 0) => {
						// Если данные не все загружены то загружаем дальше
						if(i < countriesChar.length){
							// Формируем параметры запроса
							const query = {
								str:		countriesChar[i],
								limit:		100,
								noCache:	true
							};
							// Выполняем загрузку данных
							idObj.findCountry(query).then(result => {
								// Если это массив
								if($.isArray(result) && result.length){
									// Переходим по всему массиву
									const str = (result.length > 1 ? result.reduce((sum, val) => {
										// Формируем строку отчета
										return ($.isString(sum) ? sum : sum.name + " " + sum.type)
										+ ", " + val.name + " " + val.type;
									}) : result[0].name + " " + result[0].type);
									// Выводим данные в консоль
									idObj.log("страны(ы) загружен(ы) [", countriesChar[i], "]:", str).info();
								}
								// Продолжаем загрузку дальше
								getCountry(i + 1);
							// Если происходит ошибка тогда выходим
							}).catch(err => {
								// Выводим ошибку метода
								idObj.log("findCountry in updateCountries", err).error();
								// Выходим
								getCountry(i + 1);
							});
						// Если все данные загружены тогда создаем индексы
						} else {
							// Создаем индексы стран
							countries.createIndex({name: 1}, {name: "country"});
							countries.createIndex({type: 1}, {name: "type"});
							countries.createIndex({nameShort: 1}, {name: "nameShort"});
							countries.createIndex({nameFull: 1}, {name: "nameFull"});
							countries.createIndex({gps: "2dsphere"}, {name: "gps"});
							// Выводим в консоль сообщение
							idObj.log("все страны установлены!").info();
							// Сообщаем что все удачно выполнено
							resolve(true);
						}
					};
					// Выполняем загрузку стран
					getCountry();
				// Сообщаем что ключи не совпадают
				} else resolve(false);
			}));
		}
		/**
		 * updateRegions Метод обновления данных базы регионов
		 * @param  {String}  updateKey ключ для обновления базы данных
		 * @param  {Boolean} flag      флаг для внутреннего обновления
		 * @return {Promise}           промис содержащий результат обновления регионов
		 */
		updateRegions({updateKey}, flag = false){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Проверяем совпадают ли ключи
				if(flag || (idObj.generateKey(updateKey) === idObj.updateKey)){
					// Массив букв для названий регионов
					const regionsChar = [
						"А", "Б", "В", "Г", "Д", "E", "Ж",
						"З", "И", "К", "Л", "М", "Н", "О",
						"П", "Р", "С", "Т", "У", "Ф", "Х",
						"Ц", "Ч", "Ш", "Щ", "Э", "Ю", "Я"
					];
					// Подключаемся к коллекции регионов
					const regions = idObj.clients.mongo.connection.db.collection("regions");
					// Удаляем колекцию регионов
					regions.drop();
					// Создаем ключ для кеша
					const key = createSubjectKey({key: "subjects", db: "region"});
					// Удаляем данные из кеша
					Agl.rmRedis.call(idObj, key);
					/**
					 * getRegion Рекурсивная функция загрузки региона
					 * @param  {Number} i текущий индекс массива
					 */
					const getRegion = (i = 0) => {
						// Если данные не все загружены то загружаем дальше
						if(i < regionsChar.length){
							// Формируем параметры запроса
							const query = {
								str:		regionsChar[i],
								limit:		100,
								noCache:	true
							};
							// Выполняем загрузку данных
							idObj.findRegion(query).then(result => {
								// Если это массив
								if($.isArray(result) && result.length){
									// Переходим по всему массиву
									const str = (result.length > 1 ? result.reduce((sum, val) => {
										// Формируем строку отчета
										return ($.isString(sum) ? sum : sum.name + " " + sum.type)
										+ ", " + val.name + " " + val.type;
									}) : result[0].name + " " + result[0].type);
									// Выводим данные в консоль
									idObj.log("регион(ы) загружен(ы) [", regionsChar[i], "]:", str).info();
								}
								// Продолжаем загрузку дальше
								getRegion(i + 1);
							// Если происходит ошибка тогда выходим
							}).catch(err => {
								// Выводим ошибку метода
								idObj.log("findRegion in updateRegions", err).error();
								// Выходим
								getRegion(i + 1);
							});
						// Если все данные загружены тогда создаем индексы
						} else {
							// Создаем индексы регионов
							regions.createIndex({name: 1}, {name: "region"});
							regions.createIndex({okato: 1}, {name: "okato"});
							regions.createIndex({type: 1}, {name: "type"});
							regions.createIndex({gps: "2dsphere"}, {name: "gps"});
							// Выводим в консоль сообщение
							idObj.log("все регионы установлены!").info();
							// Сообщаем что все удачно выполнено
							resolve(true);
						}
					};
					// Выполняем загрузку регионов
					getRegion();
				// Сообщаем что ключи не совпадают
				} else resolve(false);
			}));
		}
		/**
		 * updateDistricts Метод обновления данных районов
		 * @param  {String}  updateKey ключ для обновления базы данных
		 * @param  {Boolean} flag      флаг для внутреннего обновления
		 * @return {Promise}           промис содержащий результат обновления районов
		 */
		updateDistricts({updateKey}, flag = false){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Проверяем совпадают ли ключи
				if(flag || (idObj.generateKey(updateKey) === idObj.updateKey)){
					// Массив букв для названий районов
					const districtsChar = [
						"А", "Б", "В", "Г", "Д", "E", "Ж",
						"З", "И", "К", "Л", "М", "Н", "О",
						"П", "Р", "С", "Т", "У", "Ф", "Х",
						"Ц", "Ч", "Ш", "Щ", "Э", "Ю", "Я"
					];
					// Подключаемся к коллекции районов
					const districts = idObj.clients.mongo.connection.db.collection("districts");
					// Удаляем колекцию районов
					districts.drop();
					// Создаем ключ для кеша
					const key = createSubjectKey({key: "subjects", db: "district"});
					// Удаляем данные из кеша
					Agl.rmRedis.call(idObj, key);
					// Запрашиваем все данные регионов
					idObj.schemes.Regions.find({})
					// Запрашиваем данные регионов
					.exec((err, data) => {
						// Если ошибки нет
						if(!$.isset(err) && $.isArray(data)){
							/**
							 * getRegion Рекурсивная функция загрузки региона
							 * @param  {Number} i текущий индекс массива
							 */
							const getRegion = (i = 0) => {
								// Если регионы загружены не все тогда выполняем загрузку
								if(i < data.length){
									/**
									 * getDistrict Рекурсивная функция загрузки районов
									 * @param  {Number} j текущий индекс массива
									 */
									const getDistrict = (j = 0) => {
										// Если данные не все загружены то загружаем дальше
										if(j < districtsChar.length){
											// Параметры запроса
											const query = {
												str:		districtsChar[j],
												limit:		100,
												noCache:	true,
												regionId:	data[i]._id
											};
											// Выполняем поиск района
											idObj.findDistrict(query).then(result => {
												// Если это массив
												if($.isArray(result) && result.length){
													// Переходим по всему массиву
													const str = (result.length > 1 ? result.reduce((sum, val) => {
														// Формируем строку отчета
														return ($.isString(sum) ? sum : sum.name + " " + sum.type)
														+ ", " + val.name + " " + val.type;
													}) : result[0].name + " " + result[0].type);
													// Выводим данные в консоль
													idObj.log(
														"район(ы) загружен(ы) [", districtsChar[j], "]:", str,
														"номер района =", (i + 1),
														"из", data.length
													).info();
												}
												// Продолжаем загрузку дальше
												getDistrict(j + 1);
											// Если происходит ошибка тогда выходим
											}).catch(err => {
												// Выводим ошибку метода
												idObj.log("findDistrict in updateDistricts", err).error();
												// Выходим
												getDistrict(j + 1);
											});
										// Если все данные загружены, переходим к следующему району
										} else getRegion(i + 1);
									};
									// Выполняем запрос данных районов
									getDistrict();
								// Сообщаем что все регионы загружены
								} else {
									// Создаем индексы районов
									districts.createIndex({name: 1}, {name: "district"});
									districts.createIndex({okato: 1}, {name: "okato"});
									districts.createIndex({type: 1}, {name: "type"});
									districts.createIndex({gps: "2dsphere"}, {name: "gps"});
									districts.createIndex({regionId: 1}, {
										name: "region",
										partialFilterExpression: {
											regionId: {$exists: true}
										}
									});
									districts.createIndex({zip: 1}, {
										name: "zip",
										partialFilterExpression: {
											zip: {$exists: true}
										}
									});
									// Выводим в консоль сообщение
									idObj.log("все районы установлены!").info();
									// Сообщаем что все удачно выполнено
									resolve(true);
								}
							};
							// Извлекаем данные регионов
							getRegion();
						// Выводим сообщение в консоль
						} else {
							// Выводим сообщение в консоль
							idObj.log("ошибка загрузки данных регионов", err).error();
							// Сообщаем что такие данные не найдены
							resolve(false);
						}
					});
				// Сообщаем что ключи не совпадают
				} else resolve(false);
			}));
		}
		/**
		 * updateCities Метод обновления данных городов
		 * @param  {String}  updateKey ключ для обновления базы данных
		 * @param  {Boolean} flag      флаг для внутреннего обновления
		 * @return {Promise}           промис содержащий результат обновления городов
		 */
		updateCities({updateKey}, flag = false){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Проверяем совпадают ли ключи
				if(flag || (idObj.generateKey(updateKey) === idObj.updateKey)){
					// Массив букв для названий городов
					const citiesChar = [
						"А", "Б", "В", "Г", "Д", "E", "Ж",
						"З", "И", "К", "Л", "М", "Н", "О",
						"П", "Р", "С", "Т", "У", "Ф", "Х",
						"Ц", "Ч", "Ш", "Щ", "Э", "Ю", "Я"
					];
					// Подключаемся к коллекции городов
					const cities = idObj.clients.mongo.connection.db.collection("cities");
					// Удаляем колекцию городов
					cities.drop();
					// Создаем ключ для кеша
					const key = createSubjectKey({key: "subjects", db: "city"});
					// Удаляем данные из кеша
					Agl.rmRedis.call(idObj, key);
					// Запрашиваем все данные регионов
					// idObj.schemes.Regions.find({})
					idObj.schemes.Regions.findOne({_id: "3600000000000"})
					// Запрашиваем данные регионов
					.exec((err, data) => {
						
						data = [data];

						// Если ошибки нет
						if(!$.isset(err) && $.isArray(data)){
							/**
							 * getRegions Рекурсивная функция загрузки региона
							 * @param  {Number} i текущий индекс массива
							 */
							const getRegions = (i = 0) => {
								// Если районы загружены не все тогда выполняем загрузку
								if(i < data.length){
									/**
									 * getCity Рекурсивная функция загрузки городов
									 * @param  {Number} j текущий индекс массива
									 */
									const getCity = (j = 0) => {
										// Если данные не все загружены то загружаем дальше
										if(j < citiesChar.length){
											// Параметры запроса
											const query = {
												str:		citiesChar[j],
												limit:		100,
												noCache:	true,
												regionId:	data[i]._id,
												districtId:	null
											};
											// Выполняем поиск городов
											idObj.findCity(query).then(result => {
												// Если это массив
												if($.isArray(result) && result.length){
													// Переходим по всему массиву
													const str = (result.length > 1 ? result.reduce((sum, val) => {
														// Формируем строку отчета
														return ($.isString(sum) ? sum : sum.name + " " + sum.type)
														+ ", " + val.name + " " + val.type;
													}) : result[0].name + " " + result[0].type);
													// Выводим данные в консоль
													idObj.log(
														"город(а) загружен(ы) [", citiesChar[j], "]:", str,
														"номер региона =", (i + 1),
														"из", data.length
													).info();
												}
												// Продолжаем загрузку дальше
												getCity(j + 1);
											// Если происходит ошибка тогда выходим
											}).catch(err => {
												// Выводим ошибку метода
												idObj.log("findCity in updateCities", err).error();
												// Выходим
												getCity(j + 1);
											});
										// Если все данные загружены, переходим к следующему региону
										} else getRegions(i + 1);
									};
									// Выполняем запрос данных городов
									getCity();
								// Сообщаем что все города загружены
								} else {
									// Создаем индексы городов
									cities.createIndex({name: 1}, {name: "city"});
									cities.createIndex({okato: 1}, {name: "okato"});
									cities.createIndex({type: 1}, {name: "type"});
									cities.createIndex({gps: "2dsphere"}, {name: "gps"});
									cities.createIndex({districtId: 1}, {
										name: "district",
										partialFilterExpression: {
											districtId: {$exists: true}
										}
									});
									cities.createIndex({regionId: 1}, {
										name: "region",
										partialFilterExpression: {
											regionId: {$exists: true}
										}
									});
									cities.createIndex({zip: 1}, {
										name: "zip",
										partialFilterExpression: {
											zip: {$exists: true}
										}
									});
									// Выводим в консоль сообщение
									idObj.log("все города установлены!").info();
									// Сообщаем что все удачно выполнено
									resolve(true);
								}
							};
							// Извлекаем данные регионов
							getRegions();
						// Выводим сообщение в консоль
						} else {
							// Выводим сообщение в консоль
							idObj.log("ошибка загрузки данных регионов", err).error();
							// Сообщаем что такие данные не найдены
							resolve(false);
						}
					});
				// Сообщаем что ключи не совпадают
				} else resolve(false);
			}));
		}
		/**
		 * updateMetro Метод обновления данных базы метро
		 * @param  {String}  updateKey ключ для обновления базы данных
		 * @param  {Boolean} flag      флаг для внутреннего обновления
		 * @return {Promise}           промис с данными результата обновлений метро
		 */
		updateMetro({updateKey}, flag = false){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Проверяем совпадают ли ключи
				if(flag || (idObj.generateKey(updateKey) === idObj.updateKey)){
					// Подключаем модуль закачки данных
					const fetch = require('node-fetch');
					// Создаем ключ для кеша
					const key = createMetroKey({key: "metro"});
					// Удаляем данные из кеша
					Agl.rmRedis.call(idObj, key);
					/**
					 * getData Функция обработки полученных данных с интернета
					 * @param  {Array} arr объект данными метро
					 */
					const getData = arr => {
						// Подключаемся к коллекции метро
						const metro = idObj.clients.mongo.connection.db.collection("metro");
						// Подключаемся к коллекции метро городов
						const metro_cities = idObj.clients.mongo.connection.db.collection("metro_cities");
						// Подключаемся к коллекции метро линий
						const metro_lines = idObj.clients.mongo.connection.db.collection("metro_lines");
						// Подключаемся к коллекции метро станций
						const metro_stations = idObj.clients.mongo.connection.db.collection("metro_stations");
						// Удаляем все коллекции метро
						metro.drop();
						metro_cities.drop();
						metro_lines.drop();
						metro_stations.drop();
						// Переходим по всему массиву данных
						arr.forEach(obj => {
							// Копируем идентификатор метро
							obj._id = obj.id;
							// Формируем нужного вида для нас массив
							obj.lines.forEach(line => {
								// Переходим по всем станциям метро
								line.stations.forEach(station => {
									// Формируемновый ключ gps;
									station.gps = [station.lat, station.lng];
									// Выводим результат
									return station;
								});
								// Выводим полученный массив
								return line;
							});
							// Сохраняем результат
							(new idObj.schemes.Metro(obj)).save();
						});
						/**
						 * getCities Рекурсивная функция запроса городов
						 * @param  {Number} i текущий индекс массива
						 */
						const getCities = (i = 0) => {
							// Если города не все загружены
							if(i < arr.length){
								// Запрашиваем все данные городов
								idObj.schemes.Cities.findOne({name: arr[i].name, typeShort: "г"})
								// Запрашиваем данные регионов
								.exec((err, data) => {
									// Если ошибки нет
									if(!$.isset(err) && $.isset(data) && $.isObject(data)){
										// Изменяем идентификатор записи
										arr[i]._id		= data._id;
										arr[i].linesIds	= [];
										// Формируем идентификаторы линий
										arr[i].lines.forEach(line => {
											// Формируем линию метро
											line._id			= idObj.generateKey(line.id + arr[i]._id + line.name);
											line.cityId			= arr[i]._id;
											line.color			= line.hex_color;
											line.stationsIds	= [];
											// Формируем массив линий для города
											arr[i].linesIds.push(line._id);
											// Переходим по всем станциям метро
											line.stations.forEach(station => {
												// Формируем станцию метро
												station._id		= idObj.generateKey(station.id + line.id + arr[i]._id + station.name);
												station.cityId	= arr[i]._id;
												station.lineId	= line._id;
												// Формируемновый ключ gps;
												station.gps = [station.lng, station.lat];
												// Преобразуем gps координаты
												station.lat = station.lat.toString();
												station.lng = station.lng.toString();
												// Формируем массив станций для линии
												line.stationsIds.push(station._id);
												// Формируем объект для сохранения в кеше
												const obj = createMetroObject(arr[i], line, station);
												// Ключа кеша метро
												const key = createMetroKey({
													id:		station._id,
													key:	"metro",
													name:	station.name,
													lineId:	line._id,
													cityId:	arr[i]._id
												});
												// Записываем данные в кеш
												Agl.setRedis.call(idObj, "set", key, obj).then();
												// Сохраняем станцию метро
												(new idObj.schemes.Metro_stations(station)).save();
											});
											// Сохраняем линию метро
											(new idObj.schemes.Metro_lines(line)).save();
										});
										// Сохраняем город метро
										(new idObj.schemes.Metro_cities(arr[i])).save();
									// Выводим сообщение в консоль
									} else idObj.log("ошибка загрузки данных городов", err).error();
									// Продолжаем дальше
									getCities(i + 1);
								});
							// Если все города загружены
							} else {
								// Создаем индексы метро
								metro.createIndex({name: 1}, {name: "city"});
								metro.createIndex({"lines.hex_color": 1}, {name: "color"});
								metro.createIndex({"lines.name": 1}, {name: "lines"});
								metro.createIndex({"lines.stations.name": 1}, {name: "stations"});
								metro.createIndex({"lines.stations.order": 1}, {name: "order"});
								metro.createIndex({"lines.stations.gps": "2dsphere"}, {name: "gps"});
								// Создаем индексы для метро городов
								metro_cities.createIndex({name: 1}, {name: "city"});
								metro_cities.createIndex({linesIds: 1}, {name: "lines"});
								// Создаем индексы для метро линий
								metro_lines.createIndex({name: 1}, {name: "line"});
								metro_lines.createIndex({cityId: 1}, {name: "city"});
								metro_lines.createIndex({color: 1}, {name: "color"});
								metro_lines.createIndex({stationsIds: 1}, {name: "stations"});
								// Создаем индексы для метро станций
								metro_stations.createIndex({name: 1}, {name: "station"});
								metro_stations.createIndex({cityId: 1}, {name: "city"});
								metro_stations.createIndex({lineId: 1}, {name: "line"});
								metro_stations.createIndex({order: 1}, {name: "order"});
								metro_stations.createIndex({gps: "2dsphere"}, {name: "gps"});
								// Выводим в консоль сообщение
								idObj.log("все метро установлены!").info();
								// Сообщаем что все удачно выполнено
								resolve(true);
							}
						};
						// Выполняем запрос данных городов
						getCities();
					};
					// Закачиваем данные метро
					fetch('https://api.hh.ru/metro')
					// Преобразуем полученный объект
					.then(
						res => (res.status === 200 ? res.json() : false),
						err => idObj.log("get metro", err).error()
					// Обрабатываем полученные данные
					).then(getData, err => idObj.log("parse metro", err).error())
					// Если происходит ошибка тогда выходим
					.catch(err => {
						// Ошибка метода updateMetro
						idObj.log("updateMetro", err).error();
						// Сообщаем что дальше некуда
						resolve(false);
					});
				// Сообщаем что ключи не совпадают
				} else resolve(false);
			}));
		}
		/**
		 * initEmptyDatabases Метод инициализации чистой базы данных
		 * @param  {String}  updateKey ключ для обновления базы данных
		 * @param  {Boolean} flag      флаг для внутреннего обновления
		 * @return {Promise}           промис с данными результата генерации базы данных
		 */
		initEmptyDatabases({updateKey}, flag = false){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return (new Promise(resolve => {
				// Проверяем совпадают ли ключи
				if(flag || (idObj.generateKey(updateKey) === idObj.updateKey)){
					// Подключаемся к коллекции address
					const address = idObj.clients.mongo.connection.db.collection("address");
					// Подключаемся к коллекции streets
					const streets = idObj.clients.mongo.connection.db.collection("streets");
					// Подключаемся к коллекции streets
					const houses = idObj.clients.mongo.connection.db.collection("houses");
					// Удаляем все колекции
					address.drop();
					streets.drop();
					houses.drop();
					// Удаляем данные из кеша
					Agl.rmRedis.call(idObj, "*");
					/**
					 * *updateDB Генератор для получения обновления данных
					 */
					const updateDB = function * (){
						// Выполняем обновление базы данных стран
						const countries = yield idObj.updateCountries({}, true);
						// Выполняем обновление базы данных регионов
						const regions = (countries ? yield idObj.updateRegions({}, true) : false);
						// Выполняем обновление базы районов
						const districts = (regions ? yield idObj.updateDistricts({}, true) : false);
						// Выполняем обновление базы городов
						const cities = (districts ? yield idObj.updateCities({}, true) : false);
						// Выполняем обновление базы метро
						const metro = (cities ? yield idObj.updateMetro({}, true) : false);
						// Если метро загружено
						if(metro){
							// Создаем индексы для базы адресов
							address.createIndex({gps: "2dsphere"}, {name: "gps"});
							address.createIndex({"address.country": 1}, {
								name: "country",
								partialFilterExpression: {
									"address.country": {$exists: true}
								}
							});
							address.createIndex({"address.region": 1}, {
								name: "region",
								partialFilterExpression: {
									"address.region": {$exists: true}
								}
							});
							address.createIndex({"address.district": 1}, {
								name: "district",
								partialFilterExpression: {
									"address.district": {$exists: true}
								}
							});
							address.createIndex({"address.city": 1}, {
								name: "city",
								partialFilterExpression: {
									"address.city": {$exists: true}
								}
							});
							address.createIndex({"address.street": 1}, {
								name: "street",
								partialFilterExpression: {
									"address.street": {$exists: true}
								}
							});
							address.createIndex({
								"address.country":	1,
								"address.region":	1
							}, {
								name: "regcry",
								partialFilterExpression: {
									"address.country":	{$exists: true},
									"address.region":	{$exists: true}
								}
							});
							address.createIndex({
								"address.country":	1,
								"address.region":	1,
								"address.city":		1
							}, {
								name: "regcrycty",
								partialFilterExpression: {
									"address.country":	{$exists: true},
									"address.region":	{$exists: true},
									"address.city":		{$exists: true}
								}
							});
							address.createIndex({
								"address.country":	1,
								"address.region":	1,
								"address.city":		1,
								"address.street":	1
							}, {
								name:	"address",
								unique:	true,
								partialFilterExpression: {
									"address.country":	{$exists: true},
									"address.region":	{$exists: true},
									"address.city":		{$exists: true},
									"address.street":	{$exists: true}
								}
							});
							address.createIndex({key: 1}, {
								name:		"key",
								unique:		true,
								dropDups:	true,
								partialFilterExpression: {
									key: {$exists: true}
								}
							});
							address.createIndex({zip: 1}, {
								name: "zip",
								partialFilterExpression: {
									zip: {$exists: true}
								}
							});
							// Создаем индексы для улиц
							streets.createIndex({name: 1}, {name: "street"});
							streets.createIndex({regionId: 1}, {name: "region"});
							streets.createIndex({districtId: 1}, {name: "district"});
							streets.createIndex({cityId: 1}, {name: "city"});
							streets.createIndex({okato: 1}, {name: "okato"});
							streets.createIndex({type: 1}, {name: "type"});
							streets.createIndex({gps: "2dsphere"}, {name: "gps"});
							streets.createIndex({metro: 1}, {
								name: "metro",
								partialFilterExpression: {
									metro: {$exists: true}
								}
							});
							streets.createIndex({zip: 1}, {
								name: "zip",
								partialFilterExpression: {
									zip: {$exists: true}
								}
							});
							// Создаем индексы для домов
							houses.createIndex({name: 1}, {name: "house"});
							houses.createIndex({regionId: 1}, {name: "region"});
							houses.createIndex({districtId: 1}, {name: "district"});
							houses.createIndex({streetId: 1}, {name: "street"});
							houses.createIndex({cityId: 1}, {name: "city"});
							houses.createIndex({okato: 1}, {name: "okato"});
							houses.createIndex({type: 1}, {name: "type"});
							houses.createIndex({gps: "2dsphere"}, {name: "gps"});
							houses.createIndex({metro: 1}, {
								name: "metro",
								partialFilterExpression: {
									metro: {$exists: true}
								}
							});
							houses.createIndex({zip: 1}, {
								name: "zip",
								partialFilterExpression: {
									zip: {$exists: true}
								}
							});
							// Выводим в консоль сообщение
							idObj.log("все работы выполнены!").info();
							// Сообщаем что работа завершена
							resolve(true);
						} else {
							// Выводим сообщение в консоль
							idObj.log(
								"база данных создана не полностью:",
								"регионы =", regions,
								"районы =", districts,
								"города =", cities,
								"метро =", metro
							).error();
							// Сообщаем что работа завершена
							resolve(false);
						}
						// Сообщаем что все удачно
						return true;
					};
					// Запускаем коннект
					exec.call(idObj, updateDB());
				// Сообщаем что ключи не совпадают
				} else resolve(false);
			}));
		}
		/**
		 * mongo Метод подключения к MongoDB
		 * @param  {Object} config параметры подключения к MongoDB
		 * @return {Promise}       объект MongoDB
		 */
		mongo(config){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return new Promise((resolve, reject) => {
				// Подключаем модуль Mongoose
				idObj.clients.mongo = require('mongoose');
				/**
				 * connection Функция обработки подключения к базе
				 */
				const connection = () => {
					// Подключаем основные модели
					Agl.createModels.call(idObj);
					// Выводим результат
					resolve(idObj.clients.mongo);
				}
				// Подключаемся к сокету: http://mongoosejs.com/docs/connections.html
				idObj.clients.mongo.connect(
					"mongodb://" +
					config.host +
					":" +
					config.port +
					"/" + config.db,
					config.options
				);
				// Обработчик подключения к базе данных
				idObj.clients.mongo.connection.once('open', connection);
				// Обработчик ошибки
				idObj.clients.mongo.connection.on('error', err => {
					// Выводим в консоль данные
					idObj.log('MongoDB', err).error();
					// Выводим сообщение об ошибке
					if(err.code === "ETIMEDOUT"){
						// Отключаемся от MongoDB
						idObj.clients.mongo.connection.close();
						// Выполняем Reject
						reject(err);
					}
				});
			});
		}
		/**
		 * redis Метод подключения к Redis
		 * @param  {Object} config параметры подключения к Redis
		 * @return {Promise}       объект Redis
		 */
		redis(config){
			// Получаем идентификатор текущего объекта
			const idObj = this;
			// Создаем промис для обработки
			return new Promise((resolve, reject) => {
				// Подключаемся к сокету
				idObj.clients.redis = (
					// Если хост указан
					$.isset(config.host) ?
					// Подключаемся к хосту и порту
					require("redis").createClient(config.port, config.host) :
					// Подключаемся к сокету
					require("redis").createClient(config.socket)
				);
				/**
				 * selectDB Функция выбора базы данных
				 */
				const selectDB = () => idObj.clients.redis
				.select(config.db, () => resolve(idObj.clients.redis));
				// Если у сервера есть авторизация
				if($.isset(config.password)){
					// Выполняем авторизацию
					idObj.clients.redis.auth(config.password, selectDB);
				// Выбираем базу данных
				} else selectDB();
				// Устанавливаем событие на получение ошибки
				idObj.clients.redis.on("error", err => {
					// Выводим в консоль данные
					idObj.log('redis', err).error();
					// Выводим сообщение об ошибке
					if(err.code === "ETIMEDOUT"){
						// Отключаемся от Redis
						idObj.clients.redis.end(true);
						// Выполняем Reject
						reject(err);
					}
				});
			});
		}
		/**
		 * log Метод вывода логов
		 * @param {Variant} messages сообщение
		 */
		log(...message){
			// Выводим результат
			return {
				// Если это информационные сообщения
				info: () => {
					// Если вывод информационных сообщений разрешен
					if(this.debug.message){
						// Выводим экраны
						console.log("\n***************", "START", "***************\n");
						// Выводим информационное сообщение
						console.info(
							'\x1B[32m\x1B[1mInfo\x1B[0m\x1B[32m'
							.anyks_clearColor(this.debug.console),
							(new Date()).toLocaleString(),
							this.name, ':\x1B[0m'
							.anyks_clearColor(this.debug.console),
							message.anyks_toObjString().join(" ")
						);
						// Выводим экраны
						console.log("\n----------------", "END" ,"----------------\n");
					}
				},
				// Если это вывод ошибок
				error: () => {
					// Если вывод ошибок разрешен
					if(this.debug.errors){
						// Выводим экраны
						console.log("\n***************", "START", "***************\n");
						// Выводим сообщение об ошибке
						console.error(
							'\x1B[31m\x1B[1mError\x1B[0m\x1B[31m'
							.anyks_clearColor(this.debug.console),
							(new Date()).toLocaleString(),
							this.name, ':\x1B[0m'
							.anyks_clearColor(this.debug.console),
							message.anyks_toObjString().join(" ")
						);
						// Выводим экраны
						console.log("\n----------------", "END" ,"----------------\n");
					}
				}
			};
		}
	};
	// Создаем модуль для Node.js
	module.exports = Agl;
})(anyks);