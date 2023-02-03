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

// Recibimos la informacion desde la app de Java y le damos forma al json para enviar a la Api de Neptune
exports.insertData = async (event) => {
	if (event.names && event.interfaces) {
		await g
			.addV(event.applicationName)
			.property('userApplicationKey', event.userApplicationKey)
			.property('date', new Date())
			.next();
		for (const name of event.names) {
			await g
				.addV(event.applicationName)
				.property('name', name)
				.property('userApplicationKey', event.userApplicationKey)
				.property('type', 'Class')
				.next();
		}
		for (const interfaces of event.interfaces) {
			await g
				.addV(event.applicationName)
				.property('name', interfaces)
				.property('userApplicationKey', event.userApplicationKey)
				.property('type', 'Interface')
				.next();
		}
		for (const value of event.relationsExtends) {
			await g
				.V()
				.hasLabel(event.applicationName)
				.has('name', value.classe)
				.has('userApplicationKey', event.userApplicationKey)
				.has('type', 'Class')
				.addE('extend')
				.to(
					__.V()
						.hasLabel(event.applicationName)
						.has('type', 'Class')
						.has('userApplicationKey', event.userApplicationKey)
						.has('name', value.extend)
				)
				.next();
		}
		for (const value of event.relationsImplements) {
			await g
				.V()
				.hasLabel(event.applicationName)
				.has('name', value.classe)
				.has('userApplicationKey', event.userApplicationKey)
				.has('type', 'Class')
				.addE('implement')
				.to(
					__.V()
						.hasLabel(event.applicationName)
						.has('userApplicationKey', event.userApplicationKey)
						.has('type', 'Interface')
						.has('name', value.interfaz)
				)
				.next();
		}
		for (const value of event.usedClasses) {
			await g
				.V()
				.hasLabel(event.applicationName)
				.has('name', value.classe)
				.has('userApplicationKey', event.userApplicationKey)
				.has('type', 'Class')
				.addE('uses')
				.to(
					__.V()
						.hasLabel(event.applicationName)
						.has('userApplicationKey', event.userApplicationKey)
						.has('type', 'Class')
						.has('name', value.use)
				)
				.next();
		}
		await dc.close();
		return {
			statusCode: 200,
			message: 'Inserted data',
		};
	} else {
		await dc.close();
		return {
			statusCode: 200,
			body: { message: 'Incorrect body' },
		};
	}
};
