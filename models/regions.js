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
			// Выводим коллекцию Cian
			return new mongo.Schema({
				id:		String,
				name:	String,
				zip: {
						type:		Number,
						optional:	true
				},
				lat:			String,
				lng:			String,
				gps:			[Number],
				type:			String,
				okato:			String,
				typeShort:		String,
				contentType:	String
			}, {collection: this.collection});
		}
	}
	// Создаем модуль для Node.js
	module.exports = Model;
})();