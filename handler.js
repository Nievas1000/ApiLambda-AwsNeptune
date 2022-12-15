require('dotenv').config();
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

module.exports.hello = async (event) => {
	if (event.length > 0) {
		for (const classe of event) {
			await g.addV('Class').property('name', classe).next();
		}
		return {
			statusCode: 200,
			message: 'Inserted data!',
		};
	} else {
		return {
			statusCode: 200,
			body: { message: 'Incorrect body' },
		};
	}
};
