var mysql=require('mysql');

function createConnection(){
	var connection = mysql.createConnection("mysql://root:root@localhost:3306/kvapp");
	return connection;
}
exports.createConnection=createConnection;