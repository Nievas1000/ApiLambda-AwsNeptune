const gremlin = require('gremlin');
// functions / definitions from gremlin js library
const DriverRemoteConnection = gremlin.driver.DriverRemoteConnection;
const Graph = gremlin.structure.Graph;
function getNeptuneWSURL(neptuneHost, neptunePort) {
	const url = 'wss://' + neptuneHost + ':' + neptunePort + '/gremlin';
	return url;
}
// Create connection to Neptune
const dc = new DriverRemoteConnection(
	getNeptuneWSURL(process.env.DATABASE_INSTANCE, process.env.DATABASE_PORT),
	{}
);
const graph = new Graph();
const g = graph.traversal().withRemote(dc);
const __ = gremlin.process.statics;

// Mediante la userApplication key, creamos un json en el que van a estar almacenadas todas las aplicaciones del usuario con sus relaciones, clases e interfaces
exports.getData = async (event, context, callback) => {
	if (event.userApplicationKey) {
		const data = [];
		const apps = await g
			.V()
			.has('userApplicationKey', event.userApplicationKey)
			.has('state', 'open')
			.not(__.has('state', 'close'))
			.label()
			.dedup()
			.toList();
		for (const app of apps) {
			const date = await g
				.V()
				.hasLabel(app)
				.has('userApplicationKey', event.userApplicationKey)
				.has('state', 'open')
				.not(__.has('state', 'close'))
				.values('date')
				.toList();
			const dataApp = {
				applicationName: app,
				classes: [],
				endpoints: [],
				date: date[0],
				interfaces: [],
				relationsExtends: [],
				relationsImplement: [],
				usedClasses: [],
				tables: [],
			};
			// Names of Classes and Interfaces
			const names = await g
				.V()
				.hasLabel(app)
				.has('userApplicationKey', event.userApplicationKey)
				.has('state', 'open')
				.not(__.has('state', 'close'))
				.has('type', 'Class')
				.values('name')
				.toList();
			const interfaces = await g
				.V()
				.hasLabel(app)
				.has('userApplicationKey', event.userApplicationKey)
				.has('state', 'open')
				.not(__.has('state', 'close'))
				.has('type', 'Interface')
				.values('name')
				.toList();

			const endpoints = await g
				.V()
				.hasLabel(app)
				.has('userApplicationKey', event.userApplicationKey)
				.has('state', 'open')
				.not(__.has('state', 'close'))
				.has('type', 'Class')
				.has('endpoint', true)
				.values('name')
				.toList();
			dataApp.endpoints.push(endpoints);
			dataApp.classes.push(names);
			dataApp.interfaces.push(interfaces);
			// Extend Class
			await getRelations(app, event.userApplicationKey, dataApp, 'extend');
			// Implement Class
			await getRelations(app, event.userApplicationKey, dataApp, 'implement');
			// Used Class
			await getRelations(app, event.userApplicationKey, dataApp, 'uses');
			// Tables of a Class
			await getRelations(app, event.userApplicationKey, dataApp, 'table');
			data.push(dataApp);
		}
		await dc.close();
		return data;
	} else {
		await dc.close();
		const myErrorObj = {
			errorType: 'Error',
			httpStatus: 500,
		};
		callback(new Error(JSON.stringify(myErrorObj)));
	}
};

const getRelations = async (app, key, dataApp, type) => {
	const classesMain = await g
		.V()
		.hasLabel(app)
		.has('userApplicationKey', key)
		.has('state', 'open')
		.not(__.has('state', 'close'))
		.where(__.outE(type))
		.values('name')
		.toList();
	for (const classe of classesMain) {
		const relation = {
			classe: '',
			uses: [],
		};
		const classCalled = await g
			.V()
			.hasLabel(app)
			.has('userApplicationKey', key)
			.has('state', 'open')
			.not(__.has('state', 'close'))
			.has('name', classe)
			.out(type)
			.values('name')
			.toList();
		const arrExtends = [];
		for (const value of classCalled) {
			arrExtends.push({
				name: value,
			});
		}
		relation.classe = classe;
		relation.uses = arrExtends;
		switch (type) {
			case 'extend':
				dataApp.relationsExtends.push(relation);
				break;
			case 'implement':
				dataApp.relationsImplement.push(relation);
				break;
			case 'table':
				dataApp.tables.push(relation);
				break;
			case 'uses':
				dataApp.usedClasses.push(relation);
				break;
		}
	}
};
