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

module.exports.hello = async (event) => {
	if (event.names && event.interfaces) {
		for (const name of event.names) {
			await g.addV('Class').property('name', name).next();
		}
		for (const interfaces of event.interfaces) {
			await g.addV('Interface').property('name', interfaces).next();
		}
		for (const value of event.relationsExtends) {
			await g
				.V()
				.hasLabel('Class')
				.has('name', value.classe)
				.addE('extend')
				.to(__.V().hasLabel('Class').has('name', value.extend))
				.next();
		}
		for (const value of event.relationsImplements) {
			await g
				.V()
				.hasLabel('Class')
				.has('name', value.classe)
				.addE('implement')
				.to(__.V().hasLabel('Interface').has('name', value.interfaz))
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
