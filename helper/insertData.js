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
		try {
			// Si hay una aplicacion anterior con este nombre del usuario, le ponemos el state close
			await g
				.V()
				.hasLabel(event.applicationName)
				.has('userApplicationKey', event.userApplicationKey)
				.property('state', 'close')
				.properties('state')
				.hasValue('open')
				.drop()
				.iterate();
			// Guardamos la fecha de carga
			await g
				.addV(event.applicationName)
				.property('userApplicationKey', event.userApplicationKey)
				.property('date', new Date())
				.property('state', 'loading')
				.next();

			// Guardamos las clases como vertices
			await saveVertex(
				event.applicationName,
				event.userApplicationKey,
				event.names,
				'Class'
			);
			// Guardamos las interfaces como vertices
			await saveVertex(
				event.applicationName,
				event.userApplicationKey,
				event.interfaces,
				'Interface'
			);
			// Obtenemos las classes que sean endpoints y le agregamos esa propiedad
			await saveEndpoints(
				event.applicationName,
				event.userApplicationKey,
				event.endpoints
			);
			// Guardamos las relaciones de extends
			await saveRelationExtend(
				event.applicationName,
				event.userApplicationKey,
				event.relationsExtends
			);
			// Guardamos las relaciones de Implements
			await saveRelationImplement(
				event.applicationName,
				event.userApplicationKey,
				event.relationsImplements
			);
			// Guardamos las clases usadas por otras
			await saveUsedClasses(
				event.applicationName,
				event.userApplicationKey,
				event.usedClasses
			);
			// Guardamos las clases usadas por otras
			await saveTables(
				event.applicationName,
				event.userApplicationKey,
				event.tables
			);
			// Una vez que se carguen todas las clases, quitamos el state de loading y ponemos el state de open
			await g
				.V()
				.hasLabel(event.applicationName)
				.has('userApplicationKey', event.userApplicationKey)
				.property('state', 'open')
				.properties('state')
				.hasValue('loading')
				.drop()
				.iterate();
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
				.has('state', 'loading')
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

const saveVertex = async (app, key, data, type) => {
	for (const value of data) {
		await g
			.addV(app)
			.property('name', value)
			.property('userApplicationKey', key)
			.property('type', type)
			.property('state', 'loading')
			.next();
	}
};

const saveRelationExtend = async (app, key, data) => {
	for (const value of data) {
		await g
			.V()
			.hasLabel(app)
			.has('name', value.classe)
			.has('userApplicationKey', key)
			.has('type', 'Class')
			.has('state', 'loading')
			.addE('extend')
			.to(
				__.V()
					.hasLabel(app)
					.has('type', 'Class')
					.has('userApplicationKey', key)
					.has('state', 'loading')
					.has('name', value.extend)
			)
			.next();
	}
};

const saveRelationImplement = async (app, key, data) => {
	for (const value of data) {
		await g
			.V()
			.hasLabel(app)
			.has('name', value.classe)
			.has('userApplicationKey', key)
			.has('type', 'Class')
			.has('state', 'loading')
			.addE('implement')
			.to(
				__.V()
					.hasLabel(app)
					.has('userApplicationKey', key)
					.has('type', 'Interface')
					.has('state', 'loading')
					.has('name', value.interfaz)
			)
			.next();
	}
};

const saveUsedClasses = async (app, key, data) => {
	for (const value of data) {
		await g
			.V()
			.hasLabel(app)
			.has('name', value.classe)
			.has('userApplicationKey', key)
			.has('type', 'Class')
			.has('state', 'loading')
			.addE('uses')
			.to(
				__.V()
					.hasLabel(app)
					.has('userApplicationKey', key)
					.has('state', 'loading')
					.has('name', value.use)
			)
			.next();
	}
};

const saveTables = async (app, key, data) => {
	for (const value of data) {
		await g
			.V()
			.hasLabel(app)
			.has('name', value.classe)
			.has('userApplicationKey', key)
			.has('type', 'Class')
			.has('state', 'loading')
			.addE('table')
			.to(
				__.addV(app)
					.property('name', value.table)
					.property('userApplicationKey', key)
					.property('state', 'loading')
					.property('type', 'Table')
			)
			.next();
	}
};

const saveEndpoints = async (app, key, data) => {
	for (const value of data) {
		await g
			.V()
			.hasLabel(app)
			.has('name', value)
			.has('userApplicationKey', key)
			.has('type', 'Class')
			.has('state', 'loading')
			.property('endpoint', true)
			.next();
	}
};
