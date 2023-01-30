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
exports.getData = async (event) => {
	if (event.userApplicationKey && event.applicationName) {
		const data = [];
		const apps = await g
			.V()
			.has('userApplicationKey', event.userApplicationKey)
			.label()
			.dedup()
			.toList();
		for (const app of apps) {
			const dataApp = {
				applicationName: app,
				classes: [],
				interfaces: [],
				relationsExtends: [],
				relationsImplement: [],
			};
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
					extend: '',
				};
				const classExtend = await g
					.V()
					.hasLabel(app)
					.has('userApplicationKey', event.userApplicationKey)
					.has('name', classe)
					.out('extend')
					.values('name')
					.toList();
				relation.classe = classe;
				relation.extend = classExtend[0];
				dataApp.relationsExtends.push(relation);
			}
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
					implement: '',
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
				relation.implement = classImplement[0];
				dataApp.relationsImplement.push(relation);
			}
			data.push(dataApp);
		}
		return data;
	} else {
		return 'Error';
	}
};
