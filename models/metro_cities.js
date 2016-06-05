// Устанавливаем строгий режим
"use strict";

// Экранируем код
(function(){
	// Подключаем модуль Mongoose
	const mongo = require('mongoose');
	/**
	 * Класс модели
	 */
	class Model {
		/**
		 * constructor Конструктор класса
		 * @param  {Array} collections массив содержащий колекцию
		 */
		constructor(collection){
			// Основная коллекция
			this.collection = collection;
		}
		// Создаем новую схему для метро
		getData(){
			// Индексы
			// metro.createIndex({name: 1}, {name: "city"});
			// metro.createIndex({"lines.hex_color": 1}, {name: "color"});
			// metro.createIndex({"lines.name": 1}, {name: "lines"});
			// metro.createIndex({"lines.stations.name": 1}, {name: "stations"});
			// metro.createIndex({"lines.stations.order": 1}, {name: "order"});
			// metro.createIndex({"lines.stations.lat": 1, "lines.stations.lng": 1}, {name: "gps"});
			// metro.createIndex({"lines.stations.gps": "2dsphere"}, {name: "locations"});
			// Выводим коллекцию Cian
			return new mongo.Schema({
				"_id":	String,
				"name":	String,
				"url":	String,
				"linesIds": [{
					type:	String,
					ref:	"Metro_lines"
				}]
			}, {collection: this.collection});
		}
	}
	// Создаем модуль для Node.js
	module.exports = Model;
})();