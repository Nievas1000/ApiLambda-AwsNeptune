const { getData } = require('./helper/getData');
const { insertData } = require('./helper/insertData');
module.exports.hello = async (event) => {
	if (event.test) {
		return event;
	} else {
		if (event.type === 'get') {
			const response = getData(event);
			return response;
		} else {
			const response = insertData(event);
			return response;
		}
	}
};
