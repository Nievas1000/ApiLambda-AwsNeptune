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
exports.insertData = async (event, context, callback) => {
	if (event.names && event.interfaces) {
		const existApp = await g
			.V()
			.hasLabel(event.applicationName)
			.has('userApplicationKey', event.userApplicationKey)
			.toList();
		if (existApp.length > 0) {
			await g
				.V()
				.hasLabel(event.applicationName)
				.has('userApplicationKey', event.userApplicationKey)
				.property('state', 'close')
				.next();
		}
		try {
			await g
				.addV(event.applicationName)
				.property('userApplicationKey', event.userApplicationKey)
				.property('date', new Date())
				.property('state', 'loading')
				.next();
			for (const name of event.names) {
				await g
					.addV(event.applicationName)
					.property('name', name)
					.property('userApplicationKey', event.userApplicationKey)
					.property('type', 'Class')
					.property('state', 'loading')
					.next();
			}
			for (const interfaces of event.interfaces) {
				await g
					.addV(event.applicationName)
					.property('name', interfaces)
					.property('userApplicationKey', event.userApplicationKey)
					.property('type', 'Interface')
					.property('state', 'loading')
					.next();
			}
			for (const value of event.relationsExtends) {
				await g
					.V()
					.hasLabel(event.applicationName)
					.has('name', value.classe)
					.has('userApplicationKey', event.userApplicationKey)
					.has('type', 'Class')
					.has('state', 'loading')
					.addE('extend')
					.to(
						__.V()
							.hasLabel(event.applicationName)
							.has('type', 'Class')
							.has('userApplicationKey', event.userApplicationKey)
							.has('state', 'loading')
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
					.has('state', 'loading')
					.addE('implement')
					.to(
						__.V()
							.hasLabel(event.applicationName)
							.has('userApplicationKey', event.userApplicationKey)
							.has('type', 'Interface')
							.has('state', 'loading')
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
					.has('state', 'loading')
					.addE('uses')
					.to(
						__.V()
							.hasLabel(event.applicationName)
							.has('userApplicationKey', event.userApplicationKey)
							.has('state', 'loading')
							.has('name', value.use)
					)
					.next();
			}
			for (const value of event.tables) {
				await g
					.V()
					.hasLabel(event.applicationName)
					.has('name', value.classe)
					.has('userApplicationKey', event.userApplicationKey)
					.has('type', 'Class')
					.has('state', 'loading')
					.addE('table')
					.to(
						__.addV(event.applicationName)
							.property('name', value.table)
							.property('userApplicationKey', event.userApplicationKey)
							.property('state', 'loading')
							.property('type', 'Table')
					)
					.next();
			}
			await g
				.V()
				.hasLabel(event.applicationName)
				.has('userApplicationKey', event.userApplicationKey)
				.has('state', 'loading')
				.property('state', 'open')
				.properties('state')
				.drop()
				.next();
			await dc.close();
			return {
				statusCode: 200,
				message: 'Inserted data!',
			};
		} catch (error) {
			await g
				.V()
				.hasLabel(event.applicationName)
				.has('userApplicationKey', event.userApplicationKey)
				.drop()
				.next();
			await dc.close();
			return {
				statusCode: 400,
				message: error,
			};
		}
	} else {
		await dc.close();
		const myErrorObj = {
			errorType: 'Error',
			httpStatus: 500,
		};
		callback(new Error(JSON.stringify(myErrorObj)));
	}
};
