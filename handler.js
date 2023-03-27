const { getData } = require('./helper/getData');
const { insertData } = require('./helper/insertData');
const { deleteApp } = require('./helper/deleteApp');
module.exports.hello = async (event) => {
	if (event.test) {
		return event;
	} else {
		if (event.type === 'get') {
			const response = await getData(event);
			return response;
		} else if (event.type === 'delete') {
			const response = await deleteApp(event);
			return response;
		} else {
			const response = await insertData(event);
			return response;
		}
	}
};
