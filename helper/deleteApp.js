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

// Seteamos un estado de cerrado en la app mediante userKey y nombre de la app
exports.deleteApp = async (event, context, callback) => {
	if (event.userApplicationKey) {
		try {
			await g
				.V()
				.hasLabel(event.app)
				.has('userApplicationKey', event.userApplicationKey)
				.property('state', 'close')
				.properties('state')
				.hasValue('open')
				.drop()
				.iterate();
			await dc.close();
			return {
				statusCode: 200,
				message: 'App deleted!',
			};
		} catch (error) {
			return {
				statusCode: 200,
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
