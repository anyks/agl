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
		// Создаем новую схему
		getData(){
			// Выводим коллекцию
			return new mongo.Schema({
				_id:	String,
				name:	String,
				url:	String,
				lines: [{
					id:			String,
					name:		String,
					hex_color:	String,
					stations: [{
						id:		String,
						name:	String,
						lat:	String,
						lng:	String,
						order:	Number,
						gps:	[Number, Number]
					}]
				}]
			}, {collection: this.collection});
		}
	}
	// Создаем модуль для Node.js
	module.exports = Model;
})();