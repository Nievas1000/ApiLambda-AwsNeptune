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
			.hasNot('state')
			.not(__.has('state', 'close'))
			.not(__.has('state', 'loading'))
			.label()
			.dedup()
			.toList();
		for (const app of apps) {
			const date = await g
				.V()
				.hasLabel(app)
				.has('userApplicationKey', event.userApplicationKey)
				.not(__.has('state', 'close'))
				.not(__.has('state', 'loading'))
				.values('date')
				.toList();
			const dataApp = {
				applicationName: app,
				classes: [],
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
				.has('type', 'Class')
				.values('name')
				.toList();
			const interfaces = await g
				.V()
				.hasLabel(app)
				.has('userApplicationKey', event.userApplicationKey)
				.has('type', 'Interface')
				.values('name')
				.toList();
			dataApp.classes.push(names);
			dataApp.interfaces.push(interfaces);
			// Extend Class
			const classesExtend = await g
				.V()
				.hasLabel(app)
				.has('userApplicationKey', event.userApplicationKey)
				.where(__.outE('extend'))
				.values('name')
				.toList();
			for (const classe of classesExtend) {
				const relation = {
					classe: '',
					extend: [],
				};
				const classExtend = await g
					.V()
					.hasLabel(app)
					.has('userApplicationKey', event.userApplicationKey)
					.has('name', classe)
					.out('extend')
					.values('name')
					.toList();
				const arrExtends = [];
				for (const value of classExtend) {
					arrExtends.push({
						name: value,
					});
				}
				relation.classe = classe;
				relation.extend = arrExtends;
				dataApp.relationsExtends.push(relation);
			}
			// Implement Class
			const classesImplement = await g
				.V()
				.hasLabel(app)
				.has('userApplicationKey', event.userApplicationKey)
				.where(__.outE('implement'))
				.values('name')
				.toList();
			for (const classe of classesImplement) {
				const relation = {
					classe: '',
					implement: null,
				};
				const classImplement = await g
					.V()
					.hasLabel(app)
					.has('userApplicationKey', event.userApplicationKey)
					.has('name', classe)
					.out('implement')
					.values('name')
					.toList();
				relation.classe = classe;
				relation.implement = {
					name: classImplement[0],
				};
				dataApp.relationsImplement.push(relation);
			}
			// Used Class
			const mainClass = await g
				.V()
				.hasLabel(app)
				.has('userApplicationKey', event.userApplicationKey)
				.where(__.outE('uses'))
				.values('name')
				.toList();
			for (const classe of mainClass) {
				const usedClass = await g
					.V()
					.hasLabel(app)
					.has('userApplicationKey', event.userApplicationKey)
					.has('name', classe)
					.out('uses')
					.values('name')
					.toList();
				const arrUsedClasses = [];
				for (const value of usedClass) {
					arrUsedClasses.push({
						name: value,
					});
				}
				const used = {
					classe: '',
					use: [],
				};
				used.classe = classe;
				used.use = arrUsedClasses;
				dataApp.usedClasses.push(used);
			}
			// Tables of a Class
			const classesWithTables = await g
				.V()
				.hasLabel(app)
				.has('userApplicationKey', event.userApplicationKey)
				.where(__.outE('table'))
				.values('name')
				.toList();
			for (const classe of classesWithTables) {
				const relation = {
					classe: '',
					table: [],
				};
				const table = await g
					.V()
					.hasLabel(app)
					.has('userApplicationKey', event.userApplicationKey)
					.has('name', classe)
					.out('table')
					.values('name')
					.toList();
				relation.classe = classe;
				relation.table = table[0];
				dataApp.tables.push(relation);
			}
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
