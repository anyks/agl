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
			// Выводим коллекцию
			return new mongo.Schema({
				_id:	String,
				name:	String,
				linesIds: [{
					type:	String,
					ref:	'Metro_lines'
				}]
			}, {collection: this.collection});
		}
	}
	// Создаем модуль для Node.js
	module.exports = Model;
})();